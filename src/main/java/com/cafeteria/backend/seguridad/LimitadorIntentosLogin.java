package com.cafeteria.backend.seguridad;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Frena la fuerza bruta contra /api/auth/login: tras MAX_FALLOS intentos fallidos
 * para el mismo correo desde la misma IP, bloquea esa combinacion durante VENTANA.
 * Vive en memoria: es suficiente para una sola instancia en Render; con varias
 * instancias habria que moverlo a la base de datos o a Redis.
 */
@Component
public class LimitadorIntentosLogin {
    static final int MAX_FALLOS = 5;
    static final Duration VENTANA = Duration.ofMinutes(15);
    private static final int LIMITE_ENTRADAS = 10_000;

    private record Registro(int fallos, Instant desde) {}

    private final Map<String, Registro> registros = new ConcurrentHashMap<>();
    private final Clock reloj;

    public LimitadorIntentosLogin() { this(Clock.systemUTC()); }

    LimitadorIntentosLogin(Clock reloj) { this.reloj = reloj; }

    public void verificar(String clave) {
        Registro r = registros.get(clave);
        if (r == null) return;
        if (caducado(r)) { registros.remove(clave, r); return; }
        if (r.fallos() >= MAX_FALLOS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Demasiados intentos fallidos. Espera unos minutos antes de reintentar.");
        }
    }

    public void registrarFallo(String clave) {
        if (registros.size() > LIMITE_ENTRADAS) registros.values().removeIf(this::caducado);
        Instant ahora = reloj.instant();
        registros.merge(clave, new Registro(1, ahora),
            (anterior, nuevo) -> caducado(anterior) ? nuevo : new Registro(anterior.fallos() + 1, anterior.desde()));
    }

    public void registrarExito(String clave) { registros.remove(clave); }

    private boolean caducado(Registro r) { return r.desde().plus(VENTANA).isBefore(reloj.instant()); }
}
