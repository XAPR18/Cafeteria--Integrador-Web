package com.cafeteria.backend.correo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Envía los correos en segundo plano, después de que la operación quedó guardada. */
@Component
public class EnvioCorreos {
    private static final Logger log = LoggerFactory.getLogger(EnvioCorreos.class);
    private final CorreoServicio correo;

    public EnvioCorreos(CorreoServicio correo) {
        this.correo = correo;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void alPublicar(Correo c) {
        try {
            correo.enviar(c);
        } catch (RuntimeException e) {
            // Un fallo del proveedor no debe romper el registro ni la reserva; el cliente puede pedir reenvío.
            log.error("No se pudo enviar el correo '{}' a {}: {}", c.asunto(), c.para(), e.getMessage());
        }
    }

    @Configuration
    @EnableAsync
    static class Configuracion {
        private static final Logger log = LoggerFactory.getLogger(Configuracion.class);

        @Bean
        CorreoServicio correoServicio(@Value("${app.correo.brevo-api-key:}") String apiKey,
                                      @Value("${app.correo.remitente}") String remitente,
                                      @Value("${app.correo.nombre}") String nombre) {
            if (apiKey == null || apiKey.isBlank()) {
                log.warn("BREVO_API_KEY no configurada: los correos se mostrarán en la consola y no llegarán a los clientes.");
                return new ConsolaCorreo();
            }
            log.info("Correos por Brevo desde {}", remitente);
            return new BrevoCorreo(apiKey.trim(), remitente, nombre);
        }
    }
}
