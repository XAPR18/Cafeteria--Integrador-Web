package com.cafeteria.backend.mesa.dto;

import com.cafeteria.backend.mesa.EstadoMesa;
import com.cafeteria.backend.mesa.Mesa;
import com.cafeteria.backend.mesa.TipoMesa;
import com.cafeteria.backend.mesa.ZonaMesa;

public record MesaRespuesta(
        Long id,
        Integer numero,
        Integer capacidad,
        TipoMesa tipo,
        ZonaMesa zona,
        EstadoMesa estado
) {
    public static MesaRespuesta desde(Mesa m) {
        return new MesaRespuesta(m.getId(), m.getNumero(), m.getCapacidad(), m.getTipo(), m.getZona(), m.getEstado());
    }
}
