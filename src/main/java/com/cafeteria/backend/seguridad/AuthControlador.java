package com.cafeteria.backend.seguridad;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticacion", description = "Login con JWT en cookie HttpOnly, registro de clientes y perfil")
public class AuthControlador {
    static final String COOKIE = "CAFE_TOKEN";
    static final String EMISOR = "cafe-catorce";
    static final Duration DURACION_SESION = Duration.ofMinutes(30);

    private final CuentaServicio cuentas;
    private final JwtEncoder jwt;

    public AuthControlador(CuentaServicio cuentas, JwtEncoder jwt) {
        this.cuentas = cuentas;
        this.jwt = jwt;
    }

    public record Login(@Email @NotBlank String email, @NotBlank String clave) {}

    public record Registro(
            @NotBlank @Size(max = 80) String nombre,
            @Email @NotBlank @Size(max = 160) String email,
            @NotBlank @Size(min = 12, max = 72) String clave) {}

    public record Perfil(Long id, String nombre, String email, String rol, boolean activa) {}

    static Perfil perfil(Cuenta c) {
        return new Perfil(c.getId(), c.getNombre(), c.getEmail(), c.getRol().name(), c.isActiva());
    }

    @GetMapping("/csrf")
    @Operation(summary = "Obtener el token CSRF para enviarlo como X-XSRF-TOKEN")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesion: devuelve el perfil y deja el JWT en la cookie CAFE_TOKEN")
    public ResponseEntity<Perfil> login(@Valid @RequestBody Login solicitud, HttpServletRequest req) {
        Cuenta cuenta = cuentas.autenticar(solicitud.email(), solicitud.clave(), req.getRemoteAddr());
        Instant ahora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(EMISOR)
                .subject(cuenta.getEmail())
                .issuedAt(ahora)
                .expiresAt(ahora.plus(DURACION_SESION))
                .claim("rol", cuenta.getRol().name())
                .build();
        String token = jwt.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie(token, DURACION_SESION, req).toString())
                .body(perfil(cuenta));
    }

    @PostMapping("/registro")
    @Operation(summary = "Registro publico: siempre crea una cuenta CLIENTE")
    public ResponseEntity<Perfil> registro(@Valid @RequestBody Registro s) {
        Cuenta cuenta = cuentas.crear(s.nombre(), s.email(), s.clave(), Rol.CLIENTE);
        return ResponseEntity.status(HttpStatus.CREATED).body(perfil(cuenta));
    }

    @GetMapping("/me")
    @Operation(summary = "Perfil de la sesion actual")
    public Perfil me(Authentication auth) {
        return perfil(cuentas.obtenerPorCorreo(auth.getName()));
    }

    @GetMapping("/sesion")
    @Operation(summary = "Perfil si hay sesion; 204 sin cuerpo para visitantes (evita errores 401 en la carta publica)")
    public ResponseEntity<Perfil> sesion(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(perfil(cuentas.obtenerPorCorreo(auth.getName())));
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesion: elimina la cookie del navegador")
    public ResponseEntity<Void> salir(HttpServletRequest req) {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO, req).toString())
                .build();
    }

    private static ResponseCookie cookie(String valor, Duration duracion, HttpServletRequest req) {
        return ResponseCookie.from(COOKIE, valor)
                .httpOnly(true)
                .secure(req.isSecure())
                .sameSite("Strict")
                .path("/")
                .maxAge(duracion)
                .build();
    }
}
