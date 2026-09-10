package com.cafeteria.backend.seccion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SeccionSolicitud(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 60, message = "El nombre no puede superar 60 caracteres")
        String nombre,

        @NotBlank(message = "El slug es obligatorio")
        @Pattern(regexp = "[a-z0-9-]+", message = "El slug solo admite minusculas, numeros y guiones")
        @Size(max = 40, message = "El slug no puede superar 40 caracteres")
        String slug,

        @Size(max = 200, message = "La descripcion no puede superar 200 caracteres")
        String descripcion,

        Boolean activa
) {
}
