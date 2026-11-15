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
    private final LimitadorIntentosLogin limitador;
    /** Hash señuelo: iguala el tiempo de respuesta cuando el correo no existe (evita enumerar cuentas). */
    private final String hashSenuelo;

    public CuentaServicio(CuentaRepositorio cuentas, PasswordEncoder claves, LimitadorIntentosLogin limitador) {
        this.cuentas = cuentas;
        this.claves = claves;
        this.limitador = limitador;
        this.hashSenuelo = claves.encode("senuelo-" + java.util.UUID.randomUUID());
    }

    @Transactional(readOnly = true)
    public List<Cuenta> listar() { return cuentas.findAll(org.springframework.data.domain.Sort.by("id")); }

    public Cuenta obtenerPorCorreo(String email) {
        return cuentas.findByEmail(email.trim().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas"));
    }

    @Transactional(readOnly = true)
    public Cuenta autenticar(String email, String clave, String origen) {
        String correo = email.trim().toLowerCase(Locale.ROOT);
        String llave = correo + "|" + origen;
        limitador.verificar(llave);
        Cuenta cuenta = cuentas.findByEmail(correo).orElse(null);
        // Se ejecuta BCrypt siempre, exista o no la cuenta, para no revelar correos registrados por tiempo.
        boolean claveCorrecta = claves.matches(clave, cuenta == null ? hashSenuelo : cuenta.getClaveHash());
        if (cuenta == null || !cuenta.isActiva() || !claveCorrecta) {
            limitador.registrarFallo(llave);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas");
        }
        limitador.registrarExito(llave);
        return cuenta;
    }

    public Cuenta crear(String nombre, String email, String clave, Rol rol) {
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
