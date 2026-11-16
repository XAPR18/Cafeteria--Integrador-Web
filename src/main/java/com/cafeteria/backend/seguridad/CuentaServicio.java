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
    private final VerificacionServicio verificacion;
    /** Hash señuelo: iguala el tiempo de respuesta cuando el correo no existe (evita enumerar cuentas). */
    private final String hashSenuelo;

    public CuentaServicio(CuentaRepositorio cuentas, PasswordEncoder claves, LimitadorIntentosLogin limitador,
                          VerificacionServicio verificacion) {
        this.cuentas = cuentas;
        this.claves = claves;
        this.limitador = limitador;
        this.verificacion = verificacion;
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

    /**
     * Registro público: la cuenta nace CLIENTE y sin verificar, y se envía el código al correo.
     * Hasta verificarlo puede iniciar sesión, pero no reservar.
     */
    public Cuenta registrarCliente(String nombre, String email, String clave, String telefono) {
        Cuenta cuenta = crear(nombre, email, clave, Rol.CLIENTE);
        cuenta.requerirVerificacion();
        cuenta.setTelefono(normalizarTelefono(telefono));
        verificacion.enviarCodigo(cuenta);
        return cuenta;
    }

    /** "987 654 321" o "+51987654321" -> "+51987654321". Vacío -> null. */
    static String normalizarTelefono(String telefono) {
        if (telefono == null || telefono.isBlank()) return null;
        String d = telefono.replaceAll("\\D", "");
        if (d.length() == 9 && d.startsWith("9")) return "+51" + d;
        if (d.length() == 11 && d.startsWith("519")) return "+" + d;
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe un celular peruano válido, por ejemplo 987 654 321");
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
