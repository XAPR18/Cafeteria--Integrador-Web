package com.cafeteria.backend.catalogo;

import com.cafeteria.backend.producto.ProductoRepositorio;
import com.cafeteria.backend.producto.dto.ProductoRespuesta;
import com.cafeteria.backend.seccion.Seccion;
import com.cafeteria.backend.seccion.SeccionRepositorio;
import com.cafeteria.backend.seccion.dto.SeccionRespuesta;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Carta publica: solo secciones activas y los productos que pertenecen a ellas. */
@Service
@Transactional(readOnly = true)
public class CatalogoServicio {
    private final SeccionRepositorio secciones;
    private final ProductoRepositorio productos;

    public CatalogoServicio(SeccionRepositorio secciones, ProductoRepositorio productos) {
        this.secciones = secciones;
        this.productos = productos;
    }

    public List<SeccionRespuesta> seccionesActivas() {
        return secciones.listar().stream().filter(Seccion::isActiva).map(SeccionRespuesta::desde).toList();
    }

    /** Dos consultas en total (secciones y productos), sin importar cuantos productos haya. */
    public List<ProductoRespuesta> productosVisibles() {
        Map<Long, Seccion> activas = secciones.listar().stream()
                .filter(Seccion::isActiva)
                .collect(Collectors.toMap(Seccion::getId, Function.identity()));
        return productos.listar().stream()
                .filter(p -> activas.containsKey(p.getSeccionId()))
                .map(p -> {
                    Seccion s = activas.get(p.getSeccionId());
                    return ProductoRespuesta.desde(p, s.getNombre(), s.getSlug());
                })
                .toList();
    }
}
