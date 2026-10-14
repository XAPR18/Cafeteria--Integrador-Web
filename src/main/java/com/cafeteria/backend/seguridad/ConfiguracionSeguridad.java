package com.cafeteria.backend.seguridad;
import javax.crypto.spec.SecretKeySpec;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.oauth2.core.*;
@Configuration
public class ConfiguracionSeguridad {
 @Bean PasswordEncoder claves(){return new BCryptPasswordEncoder();}
 @Bean SecretKeySpec llave(@Value("${app.jwt.secret}") String secreto){
  if(secreto.getBytes(java.nio.charset.StandardCharsets.UTF_8).length<32) throw new IllegalStateException("Configura JWT_SECRET de al menos 32 bytes");
  return new SecretKeySpec(secreto.getBytes(java.nio.charset.StandardCharsets.UTF_8),"HmacSHA256");
 }
 @Bean JwtEncoder codificador(SecretKeySpec llave){return new NimbusJwtEncoder(new ImmutableSecret<>(llave));}
 @Bean JwtDecoder decodificador(SecretKeySpec llave,CuentaRepositorio cuentas){
  NimbusJwtDecoder decoder=NimbusJwtDecoder.withSecretKey(llave).macAlgorithm(MacAlgorithm.HS256).build();
  decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer("cafe-catorce"), jwt ->
   cuentas.findByEmail(jwt.getSubject()).filter(Cuenta::isActiva).filter(c -> c.getRol().equals(jwt.getClaimAsString("rol")))
    .map(c -> OAuth2TokenValidatorResult.success()).orElseGet(() -> OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token")))));
  return decoder;
 }
 @Bean SecurityFilterChain filtros(HttpSecurity http) throws Exception {
  JwtGrantedAuthoritiesConverter roles=new JwtGrantedAuthoritiesConverter(); roles.setAuthoritiesClaimName("rol"); roles.setAuthorityPrefix("ROLE_");
  JwtAuthenticationConverter converter=new JwtAuthenticationConverter();converter.setJwtGrantedAuthoritiesConverter(roles);
  http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
  http.csrf(c -> c.ignoringRequestMatchers(req -> req.getHeader("Authorization") != null && req.getHeader("Authorization").startsWith("Bearer ")).csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()).csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()));
  http.authorizeHttpRequests(a -> a
    .requestMatchers("/api/auth/csrf","/api/auth/login","/api/auth/registro","/api/auth/logout").permitAll()
    .requestMatchers("/api/auth/me").authenticated()
    .requestMatchers(HttpMethod.GET,"/api/catalogo/**").permitAll()
    .requestMatchers("/api/cuentas/**").hasRole("ADMIN")
    .requestMatchers(HttpMethod.GET,"/api/mesas/**").hasAnyRole("ADMIN","EMPLEADO")
    .requestMatchers("/api/**").hasRole("ADMIN")
    .anyRequest().permitAll());
  http.oauth2ResourceServer(o -> o.bearerTokenResolver(req -> {
    String ruta = req.getRequestURI().substring(req.getContextPath().length());
    if (!ruta.startsWith("/api/") || ruta.startsWith("/api/catalogo/")
        || java.util.Set.of("/api/auth/login", "/api/auth/registro", "/api/auth/logout", "/api/auth/csrf").contains(ruta)) {
      return null;
    }
    String header=req.getHeader("Authorization");
    if(header!=null && header.startsWith("Bearer ")) return header.substring(7);
    if(req.getCookies()!=null) for(var c:req.getCookies()) if(c.getName().equals("CAFE_TOKEN")) return c.getValue();
    return null;
  }).jwt(j -> j.jwtAuthenticationConverter(converter)));
  return http.build();
 }
}
