package com.cafeteria.backend.seguridad;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
@RestController @RequestMapping("/api/cuentas")
public class CuentaControlador {
 private final CuentaServicio cuentas;
 public CuentaControlador(CuentaServicio cuentas){this.cuentas=cuentas;}
 public record Nueva(@NotBlank @Size(max=80) String nombre,@Email @NotBlank @Size(max=160) String email,@NotBlank @Size(min=12,max=72) String clave,@Pattern(regexp="ADMIN|EMPLEADO") @NotBlank String rol){}
 public record Estado(@NotNull Boolean activa){}
 @GetMapping public List<AuthControlador.Perfil> listar(){return cuentas.listar().stream().map(AuthControlador::perfil).toList();}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public AuthControlador.Perfil crear(@Valid @RequestBody Nueva s){
  return AuthControlador.perfil(cuentas.crear(s.nombre(),s.email(),s.clave(),s.rol()));
 }
 @PatchMapping("/{id}/estado") public AuthControlador.Perfil estado(@PathVariable Long id,@Valid @RequestBody Estado s,Authentication auth){
  return AuthControlador.perfil(cuentas.cambiarEstado(id,s.activa(),auth.getName()));
 }
}
