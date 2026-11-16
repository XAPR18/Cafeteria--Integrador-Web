package com.cafeteria.backend.reserva;

import com.cafeteria.backend.common.RecursoNoEncontradoException;
import com.cafeteria.backend.correo.PlantillasCorreo;
import com.cafeteria.backend.correo.PlantillasCorreo.TipoReserva;
import com.cafeteria.backend.common.ReglaNegocioException;
import com.cafeteria.backend.mesa.Mesa;
import com.cafeteria.backend.mesa.MesaJpaRepository;
import com.cafeteria.backend.mesa.ZonaMesa;
import com.cafeteria.backend.reserva.dto.ReservaDtos.Agenda;
import com.cafeteria.backend.reserva.dto.ReservaDtos.MesaLibre;
import com.cafeteria.backend.reserva.dto.ReservaDtos.ReservaRespuesta;
import com.cafeteria.backend.reserva.dto.ReservaDtos.ReservaSolicitud;
import com.cafeteria.backend.reserva.dto.ReservaDtos.Turno;
import com.cafeteria.backend.seguridad.Cuenta;
import com.cafeteria.backend.seguridad.CuentaRepositorio;
import com.cafeteria.backend.seguridad.Rol;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ReservaServicio {
    /** Un cliente no puede acaparar mesas: maximo de reservas pendientes o confirmadas a futuro. */
    static final int MAX_RESERVAS_ACTIVAS = 3;

    private final ReservaRepositorio reservas;
    private final MesaJpaRepository mesas;
    private final CuentaRepositorio cuentas;
    private final HorarioAtencion horario;
    private final Clock reloj;
    private final PlantillasCorreo plantillas;
    private final org.springframework.context.ApplicationEventPublisher eventos;
    private final java.security.SecureRandom azar = new java.security.SecureRandom();
    /** Sin letras ni números confundibles (0/O, 1/I/L). */
    private static final String ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    public ReservaServicio(ReservaRepositorio reservas, MesaJpaRepository mesas, CuentaRepositorio cuentas,
                           HorarioAtencion horario, Clock reloj, PlantillasCorreo plantillas,
                           org.springframework.context.ApplicationEventPublisher eventos) {
        this.plantillas = plantillas;
        this.eventos = eventos;
        this.reservas = reservas;
        this.mesas = mesas;
        this.cuentas = cuentas;
        this.horario = horario;
        this.reloj = reloj;
    }

    // ---------------------------------------------------------------- consultas publicas

    /** Turnos del dia con mesas libres para el grupo. Dos consultas, sin importar cuantos turnos haya. */
    @Transactional(readOnly = true)
    public Agenda agenda(LocalDate fecha, int personas, ZonaMesa zona) {
        validarFecha(fecha);
        List<Mesa> aptas = mesasAptas(personas, zona);
        List<Reserva> delDia = reservas.delDia(fecha, EstadoReserva.ACTIVAS);
        List<Turno> turnos = horario.turnos(fecha).stream()
                .filter(noHaPasado(fecha))
                .map(hora -> new Turno(hora, (int) aptas.stream()
                        .filter(m -> libre(m, hora, hora.plus(HorarioAtencion.DURACION), delDia)).count()))
                .toList();
        HorarioAtencion.Franja franja = horario.franja(fecha);
        return new Agenda(fecha, franja.apertura(), franja.cierre(),
                (int) HorarioAtencion.DURACION.toMinutes(), turnos);
    }

    @Transactional(readOnly = true)
    public List<MesaLibre> mesasLibres(LocalDate fecha, LocalTime hora, int personas, ZonaMesa zona) {
        validarTurno(fecha, hora);
        LocalTime fin = hora.plus(HorarioAtencion.DURACION);
        List<Reserva> delDia = reservas.delDia(fecha, EstadoReserva.ACTIVAS);
        return mesasAptas(personas, zona).stream()
                .filter(m -> libre(m, hora, fin, delDia))
                .map(m -> new MesaLibre(m.getId(), m.getNumero(), m.getCapacidad(), m.getZona()))
                .toList();
    }

    // ---------------------------------------------------------------- cliente

    public ReservaRespuesta crear(String emailCliente, ReservaSolicitud s) {
        Cuenta cliente = cuentas.findByEmail(emailCliente)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida"));
        if (cliente.getRol() != Rol.CLIENTE) {
            throw new ReglaNegocioException("Las reservas se hacen con una cuenta de cliente");
        }
        if (!cliente.isEmailVerificado()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Verifica tu correo para poder reservar. Revisa tu bandeja de entrada o pide un código nuevo.");
        }
        validarTurno(s.fecha(), s.hora());
        LocalTime fin = s.hora().plus(HorarioAtencion.DURACION);

        long activas = reservas.countByCuentaIdAndEstadoInAndFechaGreaterThanEqual(
                cliente.getId(), EstadoReserva.ACTIVAS, hoy());
        if (activas >= MAX_RESERVAS_ACTIVAS) {
            throw new ReglaNegocioException("Ya tienes " + MAX_RESERVAS_ACTIVAS
                    + " reservas activas. Cancela alguna para hacer una nueva.");
        }
        if (reservas.clienteConCruce(cliente.getId(), s.fecha(), s.hora(), fin, EstadoReserva.ACTIVAS)) {
            throw new ReglaNegocioException("Ya tienes una reserva que se cruza con ese horario");
        }

        Mesa mesa = s.mesaId() != null
                ? reservarMesaElegida(s.mesaId(), s.fecha(), s.hora(), fin, s.personas())
                : reservarMejorMesa(s.fecha(), s.hora(), fin, s.personas(), s.zona());

        String nota = s.nota() == null || s.nota().isBlank() ? null : s.nota().trim();
        ReservaRespuesta creada = ReservaRespuesta.desde(reservas.saveAndFlush(new Reserva(cliente, mesa, s.fecha(), s.hora(), fin,
                s.personas(), nota, LocalDateTime.now(reloj), nuevoCodigo())));
        eventos.publishEvent(plantillas.reserva(creada, TipoReserva.CREADA));
        eventos.publishEvent(new AvisosPersonal.AvisoReserva(AvisosPersonal.Tipo.NUEVA, creada));
        return creada;
    }

    @Transactional(readOnly = true)
    public List<ReservaRespuesta> deCliente(String email) {
        return reservas.deCliente(email).stream().map(ReservaRespuesta::desde).toList();
    }

    public ReservaRespuesta cancelarPropia(Long id, String email) {
        Reserva r = buscar(id);
        if (!r.getCuenta().getEmail().equals(email)) {
            throw RecursoNoEncontradoException.de("la reserva", id); // no revelar reservas ajenas
        }
        if (!EstadoReserva.ACTIVAS.contains(r.getEstado())) {
            throw new ReglaNegocioException("Esta reserva ya no se puede cancelar");
        }
        if (LocalDateTime.of(r.getFecha(), r.getHoraInicio()).isBefore(LocalDateTime.now(reloj))) {
            throw new ReglaNegocioException("La hora de la reserva ya paso; comunicate con el local");
        }
        r.setEstado(EstadoReserva.CANCELADA);
        ReservaRespuesta cancelada = ReservaRespuesta.desde(r);
        eventos.publishEvent(new AvisosPersonal.AvisoReserva(AvisosPersonal.Tipo.CANCELADA_POR_CLIENTE, cancelada));
        return cancelada;
    }

    // ---------------------------------------------------------------- personal

    @Transactional(readOnly = true)
    public List<ReservaRespuesta> entre(LocalDate desde, LocalDate hasta) {
        if (hasta.isBefore(desde)) {
            throw new ReglaNegocioException("El rango de fechas es invalido");
        }
        if (desde.plusDays(92).isBefore(hasta)) {
            throw new ReglaNegocioException("Consulta como maximo 3 meses a la vez");
        }
        return reservas.entre(desde, hasta).stream().map(ReservaRespuesta::desde).toList();
    }

    public ReservaRespuesta cambiarEstado(Long id, EstadoReserva nuevo) {
        Reserva r = buscar(id);
        if (r.getEstado() == nuevo) {
            return ReservaRespuesta.desde(r);
        }
        if (!r.getEstado().puedePasarA(nuevo)) {
            throw new ReglaNegocioException("No se puede pasar de " + r.getEstado() + " a " + nuevo);
        }
        r.setEstado(nuevo);
        ReservaRespuesta actualizada = ReservaRespuesta.desde(r);
        if (nuevo == EstadoReserva.CONFIRMADA) eventos.publishEvent(plantillas.reserva(actualizada, TipoReserva.CONFIRMADA));
        if (nuevo == EstadoReserva.CANCELADA) eventos.publishEvent(plantillas.reserva(actualizada, TipoReserva.CANCELADA));
        return actualizada;
    }

    private String nuevoCodigo() {
        StringBuilder sb = new StringBuilder("CC14-");
        for (int i = 0; i < 6; i++) sb.append(ALFABETO_CODIGO.charAt(azar.nextInt(ALFABETO_CODIGO.length())));
        return sb.toString();
    }

    // ---------------------------------------------------------------- reglas internas

    private Mesa reservarMesaElegida(Long mesaId, LocalDate fecha, LocalTime inicio, LocalTime fin, int personas) {
        Mesa mesa = mesas.bloquear(mesaId)
                .orElseThrow(() -> new ReglaNegocioException("La mesa elegida no existe"));
        if (mesa.getCapacidad() < personas) {
            throw new ReglaNegocioException("La mesa " + mesa.getNumero() + " es para " + mesa.getCapacidad()
                    + " personas como maximo");
        }
        if (reservas.mesaOcupada(mesa.getId(), fecha, inicio, fin, EstadoReserva.ACTIVAS)) {
            throw new ReglaNegocioException("La mesa " + mesa.getNumero() + " ya fue reservada en ese horario. Elige otra.");
        }
        return mesa;
    }

    /** Asigna la mesa libre mas pequena donde entra el grupo, para no desperdiciar mesas grandes. */
    private Mesa reservarMejorMesa(LocalDate fecha, LocalTime inicio, LocalTime fin, int personas, ZonaMesa zona) {
        for (Mesa candidata : mesasAptas(personas, zona)) {
            Mesa mesa = mesas.bloquear(candidata.getId()).orElse(null);
            if (mesa != null && !reservas.mesaOcupada(mesa.getId(), fecha, inicio, fin, EstadoReserva.ACTIVAS)) {
                return mesa;
            }
        }
        throw new ReglaNegocioException("No quedan mesas libres para " + personas + " personas a esa hora. Prueba otro horario.");
    }

    private List<Mesa> mesasAptas(int personas, ZonaMesa zona) {
        if (personas < 1 || personas > 20) {
            throw new ReglaNegocioException("El numero de personas debe estar entre 1 y 20");
        }
        return mesas.findAll(Sort.by("numero")).stream()
                .filter(m -> m.getCapacidad() >= personas)
                .filter(m -> zona == null || m.getZona() == zona)
                .sorted(Comparator.comparing(Mesa::getCapacidad).thenComparing(Mesa::getNumero))
                .toList();
    }

    private static boolean libre(Mesa mesa, LocalTime inicio, LocalTime fin, List<Reserva> delDia) {
        return delDia.stream().noneMatch(r -> r.getMesa().getId().equals(mesa.getId())
                && r.getHoraInicio().isBefore(fin) && r.getHoraFin().isAfter(inicio));
    }

    private void validarFecha(LocalDate fecha) {
        if (fecha.isBefore(hoy())) {
            throw new ReglaNegocioException("La fecha ya paso");
        }
        if (fecha.isAfter(hoy().plusDays(HorarioAtencion.DIAS_ANTICIPACION))) {
            throw new ReglaNegocioException("Solo se reserva con hasta " + HorarioAtencion.DIAS_ANTICIPACION
                    + " dias de anticipacion");
        }
    }

    private void validarTurno(LocalDate fecha, LocalTime hora) {
        validarFecha(fecha);
        if (!horario.esTurnoValido(fecha, hora)) {
            HorarioAtencion.Franja f = horario.franja(fecha);
            throw new ReglaNegocioException("Ese dia atendemos de " + f.apertura() + " a " + f.cierre()
                    + "; elige un turno en punto o y media que termine antes del cierre");
        }
        if (!noHaPasado(fecha).test(hora)) {
            throw new ReglaNegocioException("Esa hora ya paso");
        }
    }

    private java.util.function.Predicate<LocalTime> noHaPasado(LocalDate fecha) {
        LocalDateTime ahora = LocalDateTime.now(reloj);
        return hora -> LocalDateTime.of(fecha, hora).isAfter(ahora);
    }

    private LocalDate hoy() {
        return LocalDate.now(reloj);
    }

    private Reserva buscar(Long id) {
        return reservas.findById(id).orElseThrow(() -> RecursoNoEncontradoException.de("la reserva", id));
    }
}
