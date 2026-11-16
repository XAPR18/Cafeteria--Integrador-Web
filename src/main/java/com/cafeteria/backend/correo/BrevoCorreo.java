package com.cafeteria.backend.correo;

import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

/**
 * Envío por la API HTTP de Brevo (https://developers.brevo.com/reference/sendtransacemail).
 * Se usa HTTPS en lugar de SMTP porque muchos hostings gratuitos bloquean los puertos de correo.
 */
public class BrevoCorreo implements CorreoServicio {
    private final RestClient cliente;
    private final String remitente;
    private final String nombreRemitente;

    public BrevoCorreo(String apiKey, String remitente, String nombreRemitente) {
        this.cliente = RestClient.builder()
                .baseUrl("https://api.brevo.com/v3")
                .defaultHeader("api-key", apiKey)
                .defaultHeader("accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.remitente = remitente;
        this.nombreRemitente = nombreRemitente;
    }

    @Override
    public void enviar(Correo correo) {
        Map<String, Object> cuerpo = Map.of(
                "sender", Map.of("name", nombreRemitente, "email", remitente),
                "to", List.of(Map.of("email", correo.para(), "name", correo.nombre())),
                "subject", correo.asunto(),
                "htmlContent", correo.html(),
                "textContent", correo.textoPlano());
        cliente.post().uri("/smtp/email").contentType(MediaType.APPLICATION_JSON).body(cuerpo).retrieve().toBodilessEntity();
    }
}
