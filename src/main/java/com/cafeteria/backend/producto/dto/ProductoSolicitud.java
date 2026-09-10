package com.cafeteria.backend.producto.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductoSolicitud(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80, message = "El nombre no puede superar 80 caracteres")
        String nombre,

        @Size(max = 250, message = "La descripcion no puede superar 250 caracteres")
        String descripcion,

        @NotNull(message = "El precio es obligatorio")
        @Positive(message = "El precio debe ser mayor que 0")
        @DecimalMax(value = "9999.99", message = "El precio es demasiado alto")
        BigDecimal precio,

        @NotNull(message = "La seccion es obligatoria")
        Long seccionId,

        Boolean disponible,

        @Size(max = 300, message = "La URL de la imagen es demasiado larga")
        String imagenUrl,

        @Size(max = 30, message = "La etiqueta no puede superar 30 caracteres")
        String etiqueta
) {
}
