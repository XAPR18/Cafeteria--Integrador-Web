package com.cafeteria.backend.seguridad;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cuentas")
@Tag(name = "Cuentas", description = "Gestion de accesos internos (solo ADMIN)")
public class CuentaControlador {
    private final CuentaServicio cuentas;

    public CuentaControlador(CuentaServicio cuentas) {
        this.cuentas = cuentas;
    }

    /** Desde el panel solo se crean accesos internos; los clientes se registran por /api/auth/registro. */
    public record Nueva(
            @NotBlank @Size(max = 80) String nombre,
            @Email @NotBlank @Size(max = 160) String email,
            @NotBlank @Size(min = 12, max = 72) String clave,
            @NotBlank @Pattern(regexp = "ADMIN|EMPLEADO", message = "El rol debe ser ADMIN o EMPLEADO") String rol) {}

    public record Estado(@NotNull Boolean activa) {}

    @GetMapping
    @Operation(summary = "Listar cuentas")
    public List<AuthControlador.Perfil> listar() {
        return cuentas.listar().stream().map(AuthControlador::perfil).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear un acceso ADMIN o EMPLEADO")
    public AuthControlador.Perfil crear(@Valid @RequestBody Nueva s) {
        return AuthControlador.perfil(cuentas.crear(s.nombre(), s.email(), s.clave(), Rol.valueOf(s.rol())));
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Activar o desactivar una cuenta")
    public AuthControlador.Perfil estado(@PathVariable Long id, @Valid @RequestBody Estado s, Authentication auth) {
        return AuthControlador.perfil(cuentas.cambiarEstado(id, s.activa(), auth.getName()));
    }
}
