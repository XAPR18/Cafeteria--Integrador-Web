package com.cafeteria.backend.seccion;

import com.cafeteria.backend.common.RecursoNoEncontradoException;
import com.cafeteria.backend.common.ReglaNegocioException;
import com.cafeteria.backend.seccion.dto.SeccionSolicitud;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SeccionServicio {
    private final SeccionRepositorio repositorio;

    public SeccionServicio(SeccionRepositorio repositorio) {
        this.repositorio = repositorio;
    }

    public List<Seccion> listar() {
        return repositorio.listar();
    }

    public Seccion obtener(Long id) {
        return repositorio.buscarPorId(id)
                .orElseThrow(() -> RecursoNoEncontradoException.de("la seccion", id));
    }

    public Seccion crear(SeccionSolicitud solicitud) {
        String slug = normalizarSlug(solicitud.slug());
        if (repositorio.existePorSlug(slug)) {
            throw new ReglaNegocioException("Ya existe una seccion con el slug '" + slug + "'");
        }
        Seccion seccion = new Seccion(
                null,
                solicitud.nombre().trim(),
                slug,
                textoOpcional(solicitud.descripcion()),
                solicitud.activa() == null || solicitud.activa());
        return repositorio.guardar(seccion);
    }

    public Seccion actualizar(Long id, SeccionSolicitud solicitud) {
        Seccion seccion = obtener(id);
        String slug = normalizarSlug(solicitud.slug());
        if (!slug.equalsIgnoreCase(seccion.getSlug()) && repositorio.existePorSlug(slug)) {
            throw new ReglaNegocioException("Ya existe otra seccion con el slug '" + slug + "'");
        }
        seccion.setNombre(solicitud.nombre().trim());
        seccion.setSlug(slug);
        seccion.setDescripcion(textoOpcional(solicitud.descripcion()));
        seccion.setActiva(solicitud.activa() == null || solicitud.activa());
        return repositorio.guardar(seccion);
    }

    public void eliminar(Long id) {
        if (!repositorio.existePorId(id)) {
            throw RecursoNoEncontradoException.de("la seccion", id);
        }
        repositorio.eliminar(id);
    }

    private String normalizarSlug(String slug) {
        return slug == null ? null : slug.trim().toLowerCase();
    }

    private String textoOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
