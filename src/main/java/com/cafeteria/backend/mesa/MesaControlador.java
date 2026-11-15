package com.cafeteria.backend.mesa;

import com.cafeteria.backend.mesa.dto.MesaRespuesta;
import com.cafeteria.backend.mesa.dto.MesaSolicitud;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/mesas")
@Tag(name = "Mesas", description = "Mapa de mesas de la cafeteria")
public class MesaControlador {
    private final MesaServicio servicio;

    public MesaControlador(MesaServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    @Operation(summary = "Listar todas las mesas")
    public List<MesaRespuesta> listar() {
        return servicio.listar().stream().map(MesaRespuesta::desde).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener una mesa por su id")
    public MesaRespuesta obtener(@PathVariable Long id) {
        return MesaRespuesta.desde(servicio.obtener(id));
    }

    @PostMapping
    @Operation(summary = "Crear una nueva mesa")
    public ResponseEntity<MesaRespuesta> crear(@Valid @RequestBody MesaSolicitud solicitud) {
        MesaRespuesta creada = MesaRespuesta.desde(servicio.crear(solicitud));
        return ResponseEntity.created(URI.create("/api/mesas/" + creada.id())).body(creada);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar una mesa existente")
    public MesaRespuesta actualizar(@PathVariable Long id, @Valid @RequestBody MesaSolicitud solicitud) {
        return MesaRespuesta.desde(servicio.actualizar(id, solicitud));
    }

    public record CambioEstado(@jakarta.validation.constraints.NotNull(message = "El estado es obligatorio") EstadoMesa estado) {}

    @org.springframework.web.bind.annotation.PatchMapping("/{id}/estado")
    @Operation(summary = "ADMIN/EMPLEADO: cambiar el estado de una mesa en sala")
    public MesaRespuesta cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambioEstado cambio) {
        return MesaRespuesta.desde(servicio.cambiarEstado(id, cambio.estado()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar una mesa")
    public void eliminar(@PathVariable Long id) {
        servicio.eliminar(id);
    }
}
