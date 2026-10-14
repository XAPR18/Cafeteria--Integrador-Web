package com.cafeteria.backend.seguridad;

import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class CuentaServicio {
    private final CuentaRepositorio cuentas;
    private final PasswordEncoder claves;

    public CuentaServicio(CuentaRepositorio cuentas, PasswordEncoder claves) {
        this.cuentas = cuentas;
        this.claves = claves;
    }

    public List<Cuenta> listar() { return cuentas.findAll(); }

    public Cuenta obtenerPorCorreo(String email) {
        return cuentas.findByEmail(email.trim().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas"));
    }

    public Cuenta autenticar(String email, String clave) {
        Cuenta cuenta = obtenerPorCorreo(email);
        if (!cuenta.isActiva() || !claves.matches(clave, cuenta.getClaveHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas");
        }
        return cuenta;
    }

    public Cuenta crear(String nombre, String email, String clave, String rol) {
        String correo = email.trim().toLowerCase(Locale.ROOT);
        if (cuentas.existsByEmail(correo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya esta registrado");
        }
        if (clave.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña supera el limite de 72 bytes");
        }
        return cuentas.saveAndFlush(new Cuenta(nombre.trim(), correo, claves.encode(clave), rol));
    }

    public Cuenta cambiarEstado(Long id, boolean activa, String operador) {
        Cuenta cuenta = cuentas.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuenta no encontrada"));
        if (cuenta.getEmail().equals(operador) && !activa) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes desactivar tu propia cuenta");
        }
        cuenta.setActiva(activa);
        return cuentas.saveAndFlush(cuenta);
    }
}
