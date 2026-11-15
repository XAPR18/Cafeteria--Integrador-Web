package com.cafeteria.backend.reserva;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Horario publicado en la web: lunes a viernes 07:00-20:30, sabados y domingos 08:00-21:00.
 * Cada reserva dura DURACION y los turnos empiezan cada INTERVALO minutos.
 */
@Component
public class HorarioAtencion {
    public static final Duration DURACION = Duration.ofMinutes(90);
    public static final Duration INTERVALO = Duration.ofMinutes(30);
    public static final int DIAS_ANTICIPACION = 30;

    public record Franja(LocalTime apertura, LocalTime cierre) {}

    public Franja franja(LocalDate fecha) {
        DayOfWeek dia = fecha.getDayOfWeek();
        boolean finDeSemana = dia == DayOfWeek.SATURDAY || dia == DayOfWeek.SUNDAY;
        return finDeSemana
                ? new Franja(LocalTime.of(8, 0), LocalTime.of(21, 0))
                : new Franja(LocalTime.of(7, 0), LocalTime.of(20, 30));
    }

    /** Horas de inicio posibles: la reserva completa debe terminar antes del cierre. */
    public List<LocalTime> turnos(LocalDate fecha) {
        Franja f = franja(fecha);
        LocalTime ultimo = f.cierre().minus(DURACION);
        List<LocalTime> turnos = new ArrayList<>();
        for (LocalTime t = f.apertura(); !t.isAfter(ultimo); t = t.plus(INTERVALO)) {
            turnos.add(t);
        }
        return turnos;
    }

    public boolean esTurnoValido(LocalDate fecha, LocalTime hora) {
        return turnos(fecha).contains(hora);
    }
}
