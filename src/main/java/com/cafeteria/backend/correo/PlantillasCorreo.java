package com.cafeteria.backend.correo;

import com.cafeteria.backend.reserva.dto.ReservaDtos.ReservaRespuesta;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

/**
 * Plantillas HTML de los correos. Usan tablas y estilos en línea porque Gmail y Outlook
 * ignoran las hojas de estilo externas. Todo dato del usuario se escapa (HtmlUtils).
 */
@Component
public class PlantillasCorreo {
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'de' yyyy", new Locale("es", "PE"));
    private static final String ORO = "#b98b45";
    private static final String CAFE = "#1e1712";

    private final String url;

    public PlantillasCorreo(@Value("${app.url-publica}") String url) {
        this.url = url.replaceAll("/+$", "");
    }

    public enum TipoReserva { CREADA, CONFIRMADA, CANCELADA }

    public Correo verificacion(String para, String nombre, String codigo, int minutos) {
        String n = esc(primerNombre(nombre));
        String digitos = String.join("", codigo.chars().mapToObj(c ->
                "<td style=\"width:46px;height:58px;background:#fbf7ef;border:1px solid #e6dccb;border-radius:10px;"
                + "font:700 28px Georgia,serif;color:" + CAFE + ";text-align:center\">" + (char) c + "</td><td style=\"width:6px\"></td>").toList());
        String cuerpo = """
                <p style="margin:0 0 6px;font:600 12px Arial,sans-serif;letter-spacing:2px;color:%s">VERIFICA TU CORREO</p>
                <h1 style="margin:0 0 14px;font:600 26px Georgia,serif;color:%s">¡Hola, %s! Ya casi eres parte de la vecindad.</h1>
                <p style="margin:0 0 22px;font:15px/1.6 Arial,sans-serif;color:#5d5249">Escribe este código en la página para activar tu cuenta.
                  Con tu cuenta activa podrás reservar mesa en segundos.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px"><tr>%s</tr></table>
                <p style="margin:0 0 6px;font:13px/1.6 Arial,sans-serif;color:#8a7f75;text-align:center">El código vence en %d minutos.</p>
                <p style="margin:18px 0 0;padding:12px 14px;background:#fbefd9;border-radius:10px;font:13px/1.5 Arial,sans-serif;color:#7a5520">
                  🔒 Nadie de Café Catorce te pedirá este código. Si no creaste una cuenta, ignora este correo.</p>
                """.formatted(ORO, CAFE, n, digitos, minutos);
        String texto = "Hola " + primerNombre(nombre) + ", tu código de verificación de Café Catorce es: " + codigo
                + "\nVence en " + minutos + " minutos. Si no creaste una cuenta, ignora este correo.";
        return new Correo(para, nombre, "Tu código de verificación: " + codigo, marco(cuerpo), texto);
    }

    public Correo reserva(ReservaRespuesta r, TipoReserva tipo) {
        String n = esc(primerNombre(r.clienteNombre()));
        String fecha = capitalizar(r.fecha().format(FECHA));
        String zona = switch (r.mesaZona()) { case INTERIOR -> "Salón interior"; case VEREDA -> "Vereda"; case BARRA -> "Barra"; };
        String qr = url + "/api/catalogo/reservas/" + r.codigo() + "/qr.png";
        String[] t = switch (tipo) {
            case CREADA -> new String[] {"RESERVA REGISTRADA", "¡Listo, " + n + "! Tu mesa está apartada.",
                    "Recibimos tu reserva. El equipo la confirmará en breve y te avisaremos por este medio.", "#fbefd9", "#7a5520", "Pendiente de confirmación"};
            case CONFIRMADA -> new String[] {"RESERVA CONFIRMADA", n + ", te esperamos ☕",
                    "Tu reserva está confirmada. Guarda este correo: lo necesitarás al llegar.", "#e5f3ea", "#2f7d4f", "Confirmada"};
            case CANCELADA -> new String[] {"RESERVA CANCELADA", n + ", tu reserva fue cancelada",
                    "La mesa quedó libre. Si fue un error o quieres otro horario, puedes reservar de nuevo en la web.", "#fbe7e4", "#b3392f", "Cancelada"};
        };
        boolean activa = tipo != TipoReserva.CANCELADA;
        String bloqueQr = !activa ? "" : """
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px"><tr><td align="center">
                  <div style="display:inline-block;padding:14px;background:#fff;border:1px solid #e6dccb;border-radius:16px">
                    <img src="%s" width="168" height="168" alt="Código QR de la reserva %s" style="display:block">
                  </div>
                  <p style="margin:10px 0 0;font:700 20px 'Courier New',monospace;letter-spacing:3px;color:%s">%s</p>
                  <p style="margin:2px 0 0;font:12px Arial,sans-serif;color:#8a7f75">Código de tu reserva</p>
                </td></tr></table>
                """.formatted(qr, r.codigo(), CAFE, r.codigo());
        String indicaciones = !activa ? "" : """
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="margin-top:6px;background:%s;border-radius:14px">
                  <tr><td style="padding:18px 20px;font:14px/1.7 Arial,sans-serif;color:#f7f1e7">
                    <strong style="font:600 16px Georgia,serif;color:#d4ad70">Antes de venir</strong><br>
                    📱 Muestra este <b>código QR</b> (o el código %s) al llegar.<br>
                    ⏰ Llega a tu hora: guardamos la mesa hasta <b>15 minutos</b> después de las %s.<br>
                    👥 La mesa es para %d %s; si cambia el grupo, reserva de nuevo.<br>
                    ✖️ ¿No puedes venir? Cancela desde <a href="%s/mi-cuenta" style="color:#d4ad70">Mi cuenta</a> para liberar la mesa.
                  </td></tr>
                </table>
                """.formatted(CAFE, r.codigo(), r.horaInicio(), r.personas(), r.personas() == 1 ? "persona" : "personas", url);
        String nota = r.nota() == null ? "" : fila("Nota", esc(r.nota()));
        String cuerpo = """
                <p style="margin:0 0 6px;font:600 12px Arial,sans-serif;letter-spacing:2px;color:%s">%s</p>
                <h1 style="margin:0 0 12px;font:600 26px Georgia,serif;color:%s">%s</h1>
                <p style="margin:0 0 16px;font:15px/1.6 Arial,sans-serif;color:#5d5249">%s</p>
                <p style="margin:0 0 18px"><span style="display:inline-block;padding:6px 12px;border-radius:999px;background:%s;color:%s;font:700 12px Arial,sans-serif">● %s</span></p>
                %s
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;border:1px solid #eee5d8;border-radius:14px;overflow:hidden">
                  %s%s%s%s%s
                </table>
                %s
                <p style="margin:22px 0 0;text-align:center"><a href="%s/mi-cuenta" style="display:inline-block;padding:13px 26px;border-radius:999px;background:#d4ad70;color:#1a1206;font:700 14px Arial,sans-serif;text-decoration:none">Ver mi reserva</a></p>
                """.formatted(ORO, t[0], CAFE, t[1], t[2], t[3], t[4], t[5], bloqueQr,
                fila("Día", fecha), fila("Hora", r.horaInicio() + " – " + r.horaFin()),
                fila("Personas", String.valueOf(r.personas())), fila("Mesa", "N.º " + r.mesaNumero() + " · " + zona), nota,
                indicaciones, url);
        String texto = t[0] + " — " + fecha + " de " + r.horaInicio() + " a " + r.horaFin() + ", mesa " + r.mesaNumero()
                + " (" + zona + "), " + r.personas() + " personas. Código: " + r.codigo()
                + (activa ? "\nMuestra el código al llegar. Tolerancia: 15 minutos." : "") + "\n" + url + "/mi-cuenta";
        String asunto = switch (tipo) {
            case CREADA -> "Reserva registrada · " + fecha + " a las " + r.horaInicio();
            case CONFIRMADA -> "✔ Reserva confirmada · " + fecha + " a las " + r.horaInicio();
            case CANCELADA -> "Reserva cancelada · " + fecha;
        };
        return new Correo(r.clienteEmail(), r.clienteNombre(), asunto, marco(cuerpo), texto);
    }

    private static String fila(String etiqueta, String valor) {
        return "<tr><td style=\"padding:11px 16px;border-bottom:1px solid #f1eadf;font:600 11px Arial,sans-serif;letter-spacing:1px;"
                + "text-transform:uppercase;color:#9a8f85;width:110px\">" + etiqueta + "</td><td style=\"padding:11px 16px;"
                + "border-bottom:1px solid #f1eadf;font:600 15px Arial,sans-serif;color:" + CAFE + "\">" + valor + "</td></tr>";
    }

    /** Estructura común: cabecera oscura con la marca, tarjeta blanca y pie con horarios. */
    private String marco(String cuerpo) {
        return """
                <!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                <body style="margin:0;padding:0;background:#f4efe7">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f4efe7;padding:28px 12px"><tr><td align="center">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px">
                    <tr><td style="padding:26px 30px;border-radius:20px 20px 0 0;background:%s;background-image:linear-gradient(135deg,#2a211a,#140f0b)">
                      <span style="font:600 22px Georgia,serif;color:#f7f1e7">Café <i style="color:#d4ad70">Catorce</i></span>
                      <span style="float:right;font:12px Arial,sans-serif;color:#d4ad70;padding-top:6px">☕ Tu cafetería de esquina</span>
                    </td></tr>
                    <tr><td style="padding:32px 30px;background:#ffffff;border-radius:0 0 20px 20px;box-shadow:0 10px 30px rgba(20,15,11,.08)">%s</td></tr>
                    <tr><td style="padding:22px 10px;text-align:center;font:12px/1.7 Arial,sans-serif;color:#9a8f85">
                      Av. Principal esq. Los Sauces · Lun–Vie 07:00–20:30 · Sáb–Dom 08:00–21:00<br>
                      <a href="%s" style="color:%s">%s</a> · Este es un correo automático, no lo respondas.
                    </td></tr>
                  </table>
                </td></tr></table></body></html>
                """.formatted(CAFE, cuerpo, url, ORO, url.replaceFirst("^https?://", ""));
    }

    private static String esc(String s) { return HtmlUtils.htmlEscape(s); }
    private static String primerNombre(String n) { return n.trim().split("\\s+")[0]; }
    private static String capitalizar(String s) { return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1); }
}
