package com.cafeteria.backend.seguridad;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.http.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;
@RestController @RequestMapping("/api/auth")
public class AuthControlador {
 private final CuentaServicio cuentas; private final JwtEncoder jwt;
 public AuthControlador(CuentaServicio cuentas,JwtEncoder jwt){this.cuentas=cuentas;this.jwt=jwt;}
 public record Login(@Email @NotBlank String email,@NotBlank String clave){}
 public record Registro(@NotBlank @Size(max=80) String nombre,@Email @NotBlank @Size(max=160) String email,@Size(min=12,max=72) @NotBlank String clave){}
 public record Perfil(Long id,String nombre,String email,String rol,boolean activa){}
 static Perfil perfil(Cuenta c){return new Perfil(c.getId(),c.getNombre(),c.getEmail(),c.getRol(),c.isActiva());}
 @GetMapping("/csrf") public Map<String,String> csrf(CsrfToken token){return Map.of("token",token.getToken());}
 @PostMapping("/login") public ResponseEntity<Perfil> login(@Valid @RequestBody Login solicitud,HttpServletRequest req){
  Cuenta c=cuentas.autenticar(solicitud.email(),solicitud.clave());
  Instant ahora=Instant.now();
  String token=jwt.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),JwtClaimsSet.builder().issuer("cafe-catorce").subject(c.getEmail()).issuedAt(ahora).expiresAt(ahora.plusSeconds(1800)).claim("rol",c.getRol()).build())).getTokenValue();
  return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,ResponseCookie.from("CAFE_TOKEN",token).httpOnly(true).secure(req.isSecure()).sameSite("Strict").path("/").maxAge(Duration.ofMinutes(30)).build().toString()).body(perfil(c));
 }
 @PostMapping("/registro") public ResponseEntity<Perfil> registro(@Valid @RequestBody Registro s){
  Cuenta c=cuentas.crear(s.nombre(),s.email(),s.clave(),"CLIENTE");
  return ResponseEntity.status(HttpStatus.CREATED).body(perfil(c));
 }
 @GetMapping("/me") public Perfil me(Authentication auth){return perfil(cuentas.obtenerPorCorreo(auth.getName()));}
 @PostMapping("/logout") public ResponseEntity<Void> salir(HttpServletRequest req){return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE,ResponseCookie.from("CAFE_TOKEN","").httpOnly(true).secure(req.isSecure()).sameSite("Strict").path("/").maxAge(0).build().toString()).build();}
}
