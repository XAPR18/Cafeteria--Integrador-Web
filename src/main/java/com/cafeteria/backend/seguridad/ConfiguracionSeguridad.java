package com.cafeteria.backend.seguridad;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration
public class ConfiguracionSeguridad {
    /** Rutas publicas donde se ignora cualquier cookie: una cookie vencida no debe bloquear login ni logout. */
    private static final Set<String> RUTAS_AUTH_PUBLICAS =
            Set.of("/api/auth/login", "/api/auth/registro", "/api/auth/logout", "/api/auth/csrf");

    @Bean
    PasswordEncoder claves() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecretKeySpec llave(@Value("${app.jwt.secret}") String secreto) {
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("Configura JWT_SECRET de al menos 32 bytes");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder codificador(SecretKeySpec llave) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(llave));
    }

    /**
     * Ademas de firma, vencimiento y emisor, comprueba en la base que la cuenta siga activa y
     * conserve el mismo rol: desactivar una cuenta o cambiarle el rol invalida sus tokens al instante.
     */
    @Bean
    JwtDecoder decodificador(SecretKeySpec llave, CuentaRepositorio cuentas) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(llave).macAlgorithm(MacAlgorithm.HS256).build();
        OAuth2TokenValidator<Jwt> cuentaVigente = jwt -> cuentas.findByEmail(jwt.getSubject())
                .filter(Cuenta::isActiva)
                .filter(c -> c.getRol().name().equals(jwt.getClaimAsString("rol")))
                .map(c -> OAuth2TokenValidatorResult.success())
                .orElseGet(() -> OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token")));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(AuthControlador.EMISOR), cuentaVigente));
        return decoder;
    }

    @Bean
    SecurityFilterChain filtros(HttpSecurity http) throws Exception {
        JwtGrantedAuthoritiesConverter roles = new JwtGrantedAuthoritiesConverter();
        roles.setAuthoritiesClaimName("rol");
        roles.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter convertidor = new JwtAuthenticationConverter();
        convertidor.setJwtGrantedAuthoritiesConverter(roles);

        http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // CSRF protege a la cookie; un cliente que envia "Authorization: Bearer" no es vulnerable a CSRF.
        // La estrategia nula evita que Spring "rote" (borre) la cookie XSRF-TOKEN en cada peticion autenticada:
        // con JWT no hay sesion de servidor que fijar y el frontend se quedaria sin token para el siguiente envio.
        http.csrf(c -> c
                .sessionAuthenticationStrategy(
                        new org.springframework.security.web.authentication.session.NullAuthenticatedSessionStrategy())
                .ignoringRequestMatchers(ConfiguracionSeguridad::usaBearer)
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()));

        http.authorizeHttpRequests(a -> a
                .requestMatchers(RUTAS_AUTH_PUBLICAS.toArray(String[]::new)).permitAll()
                .requestMatchers("/api/auth/sesion").permitAll()
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/catalogo/**").permitAll()
                .requestMatchers("/api/cuentas/**").hasRole(Rol.ADMIN.name())
                // Reservas: el cliente gestiona las suyas; el personal ve y cambia el estado de todas.
                .requestMatchers(HttpMethod.POST, "/api/reservas").hasRole(Rol.CLIENTE.name())
                .requestMatchers(HttpMethod.GET, "/api/reservas/mias").hasRole(Rol.CLIENTE.name())
                .requestMatchers(HttpMethod.PATCH, "/api/reservas/*/cancelar").hasRole(Rol.CLIENTE.name())
                .requestMatchers(HttpMethod.GET, "/api/reservas").hasAnyRole(Rol.ADMIN.name(), Rol.EMPLEADO.name())
                .requestMatchers(HttpMethod.PATCH, "/api/reservas/*/estado").hasAnyRole(Rol.ADMIN.name(), Rol.EMPLEADO.name())
                .requestMatchers(HttpMethod.GET, "/api/mesas/**").hasAnyRole(Rol.ADMIN.name(), Rol.EMPLEADO.name())
                .requestMatchers(HttpMethod.PATCH, "/api/mesas/*/estado").hasAnyRole(Rol.ADMIN.name(), Rol.EMPLEADO.name())
                .requestMatchers("/api/**").hasRole(Rol.ADMIN.name())
                .anyRequest().permitAll()); // paginas HTML, CSS, JS, imagenes y Swagger

        http.oauth2ResourceServer(o -> o
                .bearerTokenResolver(ConfiguracionSeguridad::resolverToken)
                .jwt(j -> j.jwtAuthenticationConverter(convertidor)));
        return http.build();
    }

    private static boolean usaBearer(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        return header != null && header.startsWith("Bearer ");
    }

    /** Lee el JWT de "Authorization: Bearer" (Postman) o de la cookie CAFE_TOKEN (navegador). */
    private static String resolverToken(HttpServletRequest req) {
        String ruta = req.getRequestURI().substring(req.getContextPath().length());
        if (!ruta.startsWith("/api/") || ruta.startsWith("/api/catalogo/") || RUTAS_AUTH_PUBLICAS.contains(ruta)) {
            return null;
        }
        if (usaBearer(req)) {
            return req.getHeader("Authorization").substring(7);
        }
        if (req.getCookies() != null) {
            for (var cookie : req.getCookies()) {
                if (AuthControlador.COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
