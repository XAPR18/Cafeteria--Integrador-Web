package com.cafeteria.backend.seguridad;

import com.cafeteria.backend.correo.PlantillasCorreo;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HexFormat;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Verificación del correo de los clientes con un código de 6 dígitos.
 * - Solo se guarda el hash SHA-256 del código (con el correo como sal).
 * - Vence a los 15 minutos y admite 5 intentos; después hay que pedir otro.
 * - Entre envíos hay que esperar 60 segundos (evita usar el formulario para hacer spam).
 */
@Service
@Transactional
public class VerificacionServicio {
    static final Duration VIGENCIA = Duration.ofMinutes(15);
    static final Duration ESPERA_REENVIO = Duration.ofSeconds(60);
    static final int MAX_INTENTOS = 5;

    public enum Resultado { VERIFICADA, YA_VERIFICADA, INCORRECTO, VENCIDO, SIN_CODIGO, DEMASIADOS_INTENTOS }

    private final CuentaRepositorio cuentas;
    private final PlantillasCorreo plantillas;
    private final ApplicationEventPublisher eventos;
    private final Clock reloj;
    private final SecureRandom azar = new SecureRandom();

    public VerificacionServicio(CuentaRepositorio cuentas, PlantillasCorreo plantillas,
                                ApplicationEventPublisher eventos, Clock reloj) {
        this.cuentas = cuentas;
        this.plantillas = plantillas;
        this.eventos = eventos;
        this.reloj = reloj;
    }

    /** Genera un código nuevo y lo envía por correo. */
    public void enviarCodigo(Cuenta cuenta) {
        if (cuenta.isEmailVerificado()) return;
        LocalDateTime ahora = LocalDateTime.now(reloj);
        LocalDateTime ultimo = cuenta.getVerificacionEnviada();
        if (ultimo != null && ultimo.plus(ESPERA_REENVIO).isAfter(ahora)) {
            long faltan = Duration.between(ahora, ultimo.plus(ESPERA_REENVIO)).toSeconds() + 1;
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Espera " + faltan + " segundos antes de pedir otro código.");
        }
        String codigo = String.format("%06d", azar.nextInt(1_000_000));
        cuenta.nuevoCodigo(hash(cuenta.getEmail(), codigo), ahora.plus(VIGENCIA), ahora);
        eventos.publishEvent(plantillas.verificacion(cuenta.getEmail(), cuenta.getNombre(), codigo, (int) VIGENCIA.toMinutes()));
    }

    public void reenviar(String email) {
        enviarCodigo(buscar(email));
    }

    /** Devuelve un resultado en lugar de lanzar excepción para que el intento fallido quede guardado. */
    public Resultado verificar(String email, String codigo) {
        Cuenta c = buscar(email);
        if (c.isEmailVerificado()) return Resultado.YA_VERIFICADA;
        if (c.getVerificacionHash() == null) return Resultado.SIN_CODIGO;
        if (c.getVerificacionIntentos() >= MAX_INTENTOS) return Resultado.DEMASIADOS_INTENTOS;
        if (c.getVerificacionExpira().isBefore(LocalDateTime.now(reloj))) return Resultado.VENCIDO;
        String limpio = codigo == null ? "" : codigo.replaceAll("\\D", "");
        boolean correcto = MessageDigest.isEqual(
                hash(c.getEmail(), limpio).getBytes(StandardCharsets.UTF_8),
                c.getVerificacionHash().getBytes(StandardCharsets.UTF_8));
        if (!correcto) {
            c.intentoFallido();
            return c.getVerificacionIntentos() >= MAX_INTENTOS ? Resultado.DEMASIADOS_INTENTOS : Resultado.INCORRECTO;
        }
        c.marcarVerificada();
        return Resultado.VERIFICADA;
    }

    public int intentosRestantes(String email) {
        return Math.max(0, MAX_INTENTOS - buscar(email).getVerificacionIntentos());
    }

    private Cuenta buscar(String email) {
        return cuentas.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida"));
    }

    private static String hash(String email, String codigo) {
        try {
            byte[] h = MessageDigest.getInstance("SHA-256").digest((email + ":" + codigo).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(h);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
