package com.cafeteria.backend.common;

import java.time.LocalDateTime;
import java.util.List;

public record RespuestaError(
        LocalDateTime momento,
        int estado,
        String error,
        String mensaje,
        String ruta,
        List<String> detalles
) {
    public static RespuestaError de(int estado, String error, String mensaje, String ruta) {
        return new RespuestaError(LocalDateTime.now(), estado, error, mensaje, ruta, null);
    }

    public static RespuestaError de(int estado, String error, String mensaje, String ruta, List<String> detalles) {
        return new RespuestaError(LocalDateTime.now(), estado, error, mensaje, ruta, detalles);
    }
}
