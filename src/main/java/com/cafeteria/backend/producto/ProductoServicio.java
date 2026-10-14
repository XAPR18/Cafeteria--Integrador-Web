package com.cafeteria.backend.producto;

import com.cafeteria.backend.common.RecursoNoEncontradoException;
import com.cafeteria.backend.common.ReglaNegocioException;
import com.cafeteria.backend.producto.dto.ProductoRespuesta;
import com.cafeteria.backend.producto.dto.ProductoSolicitud;
import com.cafeteria.backend.seccion.Seccion;
import com.cafeteria.backend.seccion.SeccionRepositorio;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@org.springframework.transaction.annotation.Transactional
public class ProductoServicio {
    private final ProductoRepositorio productoRepositorio;
    private final SeccionRepositorio seccionRepositorio;

    public ProductoServicio(ProductoRepositorio productoRepositorio, SeccionRepositorio seccionRepositorio) {
        this.productoRepositorio = productoRepositorio;
        this.seccionRepositorio = seccionRepositorio;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ProductoRespuesta> listar(Long seccionId) {
        List<Producto> productos = (seccionId == null)
                ? productoRepositorio.listar()
                : productoRepositorio.listarPorSeccion(seccionId);
        var secciones = seccionRepositorio.listar().stream().collect(java.util.stream.Collectors.toMap(Seccion::getId, java.util.function.Function.identity()));
        return productos.stream().map(p -> {
            Seccion s = secciones.get(p.getSeccionId());
            return ProductoRespuesta.desde(p, s == null ? null : s.getNombre(), s == null ? null : s.getSlug());
        }).toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ProductoRespuesta obtener(Long id) {
        return aRespuesta(buscar(id));
    }

    public ProductoRespuesta crear(ProductoSolicitud solicitud) {
        Seccion seccion = exigirSeccion(solicitud.seccionId());
        Producto producto = new Producto(
                null,
                solicitud.nombre().trim(),
                textoOpcional(solicitud.descripcion()),
                solicitud.precio(),
                seccion.getId(),
                solicitud.disponible() == null || solicitud.disponible(),
                textoOpcional(solicitud.imagenUrl()),
                textoOpcional(solicitud.etiqueta()));
        return aRespuesta(productoRepositorio.guardar(producto));
    }

    public ProductoRespuesta actualizar(Long id, ProductoSolicitud solicitud) {
        Producto producto = buscar(id);
        Seccion seccion = exigirSeccion(solicitud.seccionId());
        producto.setNombre(solicitud.nombre().trim());
        producto.setDescripcion(textoOpcional(solicitud.descripcion()));
        producto.setPrecio(solicitud.precio());
        producto.setSeccionId(seccion.getId());
        producto.setDisponible(solicitud.disponible() == null || solicitud.disponible());
        producto.setImagenUrl(textoOpcional(solicitud.imagenUrl()));
        producto.setEtiqueta(textoOpcional(solicitud.etiqueta()));
        return aRespuesta(productoRepositorio.guardar(producto));
    }

    public void eliminar(Long id) {
        if (!productoRepositorio.existePorId(id)) {
            throw RecursoNoEncontradoException.de("el producto", id);
        }
        productoRepositorio.eliminar(id);
    }

    private Producto buscar(Long id) {
        return productoRepositorio.buscarPorId(id)
                .orElseThrow(() -> RecursoNoEncontradoException.de("el producto", id));
    }

    private Seccion exigirSeccion(Long seccionId) {
        return seccionRepositorio.buscarPorId(seccionId)
                .orElseThrow(() -> new ReglaNegocioException("La seccion con id " + seccionId + " no existe"));
    }

    private ProductoRespuesta aRespuesta(Producto producto) {
        return seccionRepositorio.buscarPorId(producto.getSeccionId())
                .map(s -> ProductoRespuesta.desde(producto, s.getNombre(), s.getSlug()))
                .orElseGet(() -> ProductoRespuesta.desde(producto, null, null));
    }

    private String textoOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
