package com.cafeteria.backend.seccion.dto;

import com.cafeteria.backend.seccion.Seccion;

public record SeccionRespuesta(
        Long id,
        String nombre,
        String slug,
        String descripcion,
        boolean activa
) {
    public static SeccionRespuesta desde(Seccion s) {
        return new SeccionRespuesta(s.getId(), s.getNombre(), s.getSlug(), s.getDescripcion(), s.isActiva());
    }
}
