package com.cafeteria.backend.seccion;

import java.util.List;
import java.util.Optional;

public interface SeccionRepositorio {
    List<Seccion> listar();

    Optional<Seccion> buscarPorId(Long id);

    boolean existePorSlug(String slug);

    Seccion guardar(Seccion seccion);

    void eliminar(Long id);

    boolean existePorId(Long id);
}
