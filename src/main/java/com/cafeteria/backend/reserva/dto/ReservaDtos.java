package com.cafeteria.backend.reserva.dto;

import com.cafeteria.backend.mesa.ZonaMesa;
import com.cafeteria.backend.reserva.EstadoReserva;
import com.cafeteria.backend.reserva.Reserva;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/** Contratos JSON del modulo de reservas. */
public final class ReservaDtos {
    private ReservaDtos() {
    }

    public record ReservaSolicitud(
            @NotNull(message = "La fecha es obligatoria") LocalDate fecha,
            @NotNull(message = "La hora es obligatoria") @JsonFormat(pattern = "HH:mm") LocalTime hora,
            @NotNull(message = "Indica cuantas personas vienen")
            @Min(value = 1, message = "Debe venir al menos 1 persona")
            @Max(value = 20, message = "Para mas de 20 personas escribenos directamente") Integer personas,
            Long mesaId,
            ZonaMesa zona,
            @Size(max = 200, message = "La nota no puede superar 200 caracteres") String nota) {
    }

    public record CambioEstado(@NotNull(message = "El estado es obligatorio") EstadoReserva estado) {
    }

    public record ReservaRespuesta(
            Long id,
            LocalDate fecha,
            @JsonFormat(pattern = "HH:mm") LocalTime horaInicio,
            @JsonFormat(pattern = "HH:mm") LocalTime horaFin,
            int personas,
            EstadoReserva estado,
            String nota,
            Long mesaId,
            Integer mesaNumero,
            ZonaMesa mesaZona,
            Integer mesaCapacidad,
            String clienteNombre,
            String clienteEmail,
            LocalDateTime creadoEn) {
        public static ReservaRespuesta desde(Reserva r) {
            return new ReservaRespuesta(r.getId(), r.getFecha(), r.getHoraInicio(), r.getHoraFin(),
                    r.getPersonas(), r.getEstado(), r.getNota(),
                    r.getMesa().getId(), r.getMesa().getNumero(), r.getMesa().getZona(), r.getMesa().getCapacidad(),
                    r.getCuenta().getNombre(), r.getCuenta().getEmail(), r.getCreadoEn());
        }
    }

    /** Turno del dia con cuantas mesas aptas quedan libres. */
    public record Turno(@JsonFormat(pattern = "HH:mm") LocalTime hora, int mesasLibres) {
    }

    public record Agenda(
            LocalDate fecha,
            @JsonFormat(pattern = "HH:mm") LocalTime apertura,
            @JsonFormat(pattern = "HH:mm") LocalTime cierre,
            int duracionMinutos,
            List<Turno> turnos) {
    }

    public record MesaLibre(Long id, Integer numero, Integer capacidad, ZonaMesa zona) {
    }
}
