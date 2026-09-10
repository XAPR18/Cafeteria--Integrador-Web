package com.cafeteria.backend.producto;

import com.cafeteria.backend.producto.dto.ProductoRespuesta;
import com.cafeteria.backend.producto.dto.ProductoSolicitud;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/productos")
@Tag(name = "Productos", description = "Items del menu de la cafeteria")
public class ProductoControlador {
    private final ProductoServicio servicio;

    public ProductoControlador(ProductoServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    @Operation(summary = "Listar productos, opcionalmente filtrados por seccion")
    public List<ProductoRespuesta> listar(
            @Parameter(description = "Id de la seccion para filtrar (opcional)")
            @RequestParam(name = "seccionId", required = false) Long seccionId) {
        return servicio.listar(seccionId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener un producto por su id")
    public ProductoRespuesta obtener(@PathVariable Long id) {
        return servicio.obtener(id);
    }

    @PostMapping
    @Operation(summary = "Crear un nuevo producto")
    public ResponseEntity<ProductoRespuesta> crear(@Valid @RequestBody ProductoSolicitud solicitud) {
        ProductoRespuesta creado = servicio.crear(solicitud);
        return ResponseEntity.created(URI.create("/api/productos/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un producto existente")
    public ProductoRespuesta actualizar(@PathVariable Long id, @Valid @RequestBody ProductoSolicitud solicitud) {
        return servicio.actualizar(id, solicitud);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar un producto")
    public void eliminar(@PathVariable Long id) {
        servicio.eliminar(id);
    }
}
