package com.cafeteria.backend.mesa.dto;

import com.cafeteria.backend.mesa.EstadoMesa;
import com.cafeteria.backend.mesa.TipoMesa;
import com.cafeteria.backend.mesa.ZonaMesa;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record MesaSolicitud(
        @NotNull(message = "El numero de mesa es obligatorio")
        @Min(value = 1, message = "El numero de mesa debe ser mayor que 0")
        @Max(value = 999, message = "El numero de mesa es demasiado alto")
        Integer numero,

        @NotNull(message = "La capacidad es obligatoria")
        @Min(value = 1, message = "La capacidad debe ser al menos 1")
        @Max(value = 20, message = "La capacidad no puede superar 20")
        Integer capacidad,

        @NotNull(message = "El tipo de mesa es obligatorio")
        TipoMesa tipo,

        @NotNull(message = "La zona es obligatoria")
        ZonaMesa zona,

        EstadoMesa estado
) {
}
