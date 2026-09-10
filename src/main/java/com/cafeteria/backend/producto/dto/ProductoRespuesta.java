package com.cafeteria.backend.producto.dto;

import com.cafeteria.backend.producto.Producto;

import java.math.BigDecimal;

public record ProductoRespuesta(
        Long id,
        String nombre,
        String descripcion,
        BigDecimal precio,
        Long seccionId,
        String seccionNombre,
        String seccionSlug,
        boolean disponible,
        String imagenUrl,
        String etiqueta
) {
    public static ProductoRespuesta desde(Producto p, String seccionNombre, String seccionSlug) {
        return new ProductoRespuesta(
                p.getId(), p.getNombre(), p.getDescripcion(), p.getPrecio(),
                p.getSeccionId(), seccionNombre, seccionSlug,
                p.isDisponible(), p.getImagenUrl(), p.getEtiqueta());
    }
}
