package com.cafeteria.backend.seguridad;

import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Crea el primer administrador solo cuando la tabla de cuentas esta vacia. */
@Component
@Order(0)
public class AdminInicial implements CommandLineRunner {
    private final CuentaRepositorio cuentas;
    private final PasswordEncoder claves;
    private final String email;
    private final String clave;

    public AdminInicial(CuentaRepositorio cuentas, PasswordEncoder claves,
                        @Value("${app.admin.email}") String email,
                        @Value("${app.admin.password}") String clave) {
        this.cuentas = cuentas;
        this.claves = claves;
        this.email = email;
        this.clave = clave;
    }

    @Override
    public void run(String... args) {
        if (cuentas.count() > 0) {
            return;
        }
        if (email.isBlank() || clave.length() < 12) {
            throw new IllegalStateException("Configura ADMIN_EMAIL y ADMIN_PASSWORD de al menos 12 caracteres");
        }
        String correo = email.trim().toLowerCase(Locale.ROOT);
        cuentas.saveAndFlush(new Cuenta("Administrador", correo, claves.encode(clave), Rol.ADMIN));
    }
}
