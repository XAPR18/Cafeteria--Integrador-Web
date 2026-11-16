package com.cafeteria.backend.correo;

/**
 * Un correo listo para enviar. Los servicios lo publican como evento y {@link EnvioCorreos}
 * lo manda después de confirmar la transacción (si la operación falla, no se envía nada).
 */
public record Correo(String para, String nombre, String asunto, String html, String textoPlano) {
}
