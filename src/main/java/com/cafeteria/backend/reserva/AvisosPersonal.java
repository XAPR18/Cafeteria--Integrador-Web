package com.cafeteria.backend.reserva;

import com.cafeteria.backend.reserva.dto.ReservaDtos.ReservaRespuesta;
import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Avisos en tiempo real para el panel del personal (Server-Sent Events).
 * Cada pestaña abierta del panel mantiene una conexion; al crearse o cancelarse una reserva
 * se avisa a todas, solo despues de que la transaccion se confirma.
 */
@Component
public class AvisosPersonal {
    private static final Logger log = LoggerFactory.getLogger(AvisosPersonal.class);
    /** Tras este tiempo el navegador reconecta solo y la sesion se vuelve a validar (cuenta activa, rol). */
    static final Duration DURACION_CONEXION = Duration.ofMinutes(20);
    static final int MAX_CONEXIONES = 200;

    public enum Tipo { NUEVA, CANCELADA_POR_CLIENTE }

    /** Evento interno publicado por ReservaServicio. */
    public record AvisoReserva(Tipo tipo, ReservaRespuesta reserva) {
    }

    private final List<SseEmitter> conexiones = new CopyOnWriteArrayList<>();

    public SseEmitter suscribir() {
        if (conexiones.size() >= MAX_CONEXIONES) {
            SseEmitter sobra = conexiones.remove(0);
            sobra.complete();
        }
        SseEmitter emisor = new SseEmitter(DURACION_CONEXION.toMillis());
        conexiones.add(emisor);
        emisor.onCompletion(() -> conexiones.remove(emisor));
        emisor.onTimeout(() -> { conexiones.remove(emisor); emisor.complete(); });
        emisor.onError(e -> conexiones.remove(emisor));
        try {
            emisor.send(SseEmitter.event().name("conectado").data("ok").reconnectTime(5000));
        } catch (IOException e) {
            conexiones.remove(emisor);
        }
        return emisor;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void alCambiar(AvisoReserva aviso) {
        enviar(SseEmitter.event().name("reserva").data(aviso, MediaType.APPLICATION_JSON));
    }

    /** Comentario vacio cada 25 s para que proxies (Render) no corten la conexion por inactividad. */
    @Scheduled(fixedRate = 25_000)
    void latido() {
        if (!conexiones.isEmpty()) {
            enviar(SseEmitter.event().comment("latido"));
        }
    }

    int conectados() {
        return conexiones.size();
    }

    private void enviar(SseEmitter.SseEventBuilder evento) {
        for (SseEmitter emisor : conexiones) {
            try {
                emisor.send(evento);
            } catch (IOException | IllegalStateException e) {
                conexiones.remove(emisor);
                log.debug("Conexion de avisos cerrada: {}", e.getMessage());
            }
        }
    }

    @Configuration
    @EnableScheduling
    static class Programacion {
    }
}
