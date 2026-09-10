package com.cafeteria.backend.seccion;

import com.cafeteria.backend.seccion.dto.SeccionRespuesta;
import com.cafeteria.backend.seccion.dto.SeccionSolicitud;
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
@RequestMapping("/api/secciones")
@Tag(name = "Secciones", description = "Categorias del menu de la cafeteria")
public class SeccionControlador {
    private final SeccionServicio servicio;

    public SeccionControlador(SeccionServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    @Operation(summary = "Listar todas las secciones")
    public List<SeccionRespuesta> listar() {
        return servicio.listar().stream().map(SeccionRespuesta::desde).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener una seccion por su id")
    public SeccionRespuesta obtener(@PathVariable Long id) {
        return SeccionRespuesta.desde(servicio.obtener(id));
    }

    @PostMapping
    @Operation(summary = "Crear una nueva seccion")
    public ResponseEntity<SeccionRespuesta> crear(@Valid @RequestBody SeccionSolicitud solicitud) {
        SeccionRespuesta creada = SeccionRespuesta.desde(servicio.crear(solicitud));
        return ResponseEntity.created(URI.create("/api/secciones/" + creada.id())).body(creada);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar una seccion existente")
    public SeccionRespuesta actualizar(@PathVariable Long id, @Valid @RequestBody SeccionSolicitud solicitud) {
        return SeccionRespuesta.desde(servicio.actualizar(id, solicitud));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar una seccion")
    public void eliminar(@PathVariable Long id) {
        servicio.eliminar(id);
    }
}
