package com.cafeteria.backend.reserva;

import com.cafeteria.backend.reserva.dto.ReservaDtos.CambioEstado;
import com.cafeteria.backend.reserva.dto.ReservaDtos.ReservaRespuesta;
import com.cafeteria.backend.reserva.dto.ReservaDtos.ReservaSolicitud;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/reservas")
@Tag(name = "Reservas", description = "Reservas de mesa: clientes crean y cancelan; el personal las gestiona")
public class ReservaControlador {
    private final ReservaServicio servicio;
    private final Clock reloj;
    private final AvisosPersonal avisos;

    public ReservaControlador(ReservaServicio servicio, Clock reloj, AvisosPersonal avisos) {
        this.servicio = servicio;
        this.reloj = reloj;
        this.avisos = avisos;
    }

    @PostMapping
    @Operation(summary = "CLIENTE: reservar una mesa (si no se elige mesa, se asigna la mas adecuada)")
    public ResponseEntity<ReservaRespuesta> crear(@Valid @RequestBody ReservaSolicitud solicitud, Authentication auth) {
        ReservaRespuesta creada = servicio.crear(auth.getName(), solicitud);
        return ResponseEntity.created(URI.create("/api/reservas/" + creada.id())).body(creada);
    }

    @GetMapping("/mias")
    @Operation(summary = "CLIENTE: mis reservas, de la mas reciente a la mas antigua")
    public List<ReservaRespuesta> mias(Authentication auth) {
        return servicio.deCliente(auth.getName());
    }

    @PatchMapping("/{id}/cancelar")
    @Operation(summary = "CLIENTE: cancelar una reserva propia que aun no empieza")
    public ReservaRespuesta cancelar(@PathVariable Long id, Authentication auth) {
        return servicio.cancelarPropia(id, auth.getName());
    }

    @GetMapping
    @Operation(summary = "ADMIN/EMPLEADO: reservas entre dos fechas (por defecto, hoy)")
    public List<ReservaRespuesta> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        LocalDate inicio = desde != null ? desde : LocalDate.now(reloj);
        return servicio.entre(inicio, hasta != null ? hasta : inicio);
    }

    @GetMapping(path = "/avisos", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "ADMIN/EMPLEADO: avisos en tiempo real (Server-Sent Events) de reservas nuevas o canceladas")
    public SseEmitter avisos(HttpServletResponse respuesta) {
        respuesta.setHeader("Cache-Control", "no-cache, no-transform");
        respuesta.setHeader("X-Accel-Buffering", "no");
        return avisos.suscribir();
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "ADMIN/EMPLEADO: confirmar, completar, marcar no asistio o cancelar")
    public ReservaRespuesta cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambioEstado cambio) {
        return servicio.cambiarEstado(id, cambio.estado());
    }
}
