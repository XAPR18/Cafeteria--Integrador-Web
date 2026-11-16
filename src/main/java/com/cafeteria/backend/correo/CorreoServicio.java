package com.cafeteria.backend.correo;

/** Canal de salida de correos: Brevo en producción, la consola en desarrollo y pruebas. */
public interface CorreoServicio {
    void enviar(Correo correo);
}
