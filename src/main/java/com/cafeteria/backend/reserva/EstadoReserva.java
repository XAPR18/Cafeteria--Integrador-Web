package com.cafeteria.backend.reserva;

import java.util.EnumSet;
import java.util.Set;

public enum EstadoReserva {
    PENDIENTE,
    CONFIRMADA,
    COMPLETADA,
    CANCELADA,
    NO_ASISTIO;

    /** Estados que ocupan la mesa en su horario. */
    public static final Set<EstadoReserva> ACTIVAS = EnumSet.of(PENDIENTE, CONFIRMADA);

    /** Cambios que puede hacer el personal (ADMIN o EMPLEADO). */
    public boolean puedePasarA(EstadoReserva destino) {
        return switch (this) {
            case PENDIENTE -> destino == CONFIRMADA || destino == CANCELADA;
            case CONFIRMADA -> destino == COMPLETADA || destino == NO_ASISTIO || destino == CANCELADA;
            case COMPLETADA, CANCELADA, NO_ASISTIO -> false;
        };
    }
}
