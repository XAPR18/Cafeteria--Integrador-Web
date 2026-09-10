package com.cafeteria.backend.producto;

import java.util.List;
import java.util.Optional;

public interface ProductoRepositorio {
    List<Producto> listar();

    List<Producto> listarPorSeccion(Long seccionId);

    Optional<Producto> buscarPorId(Long id);

    Producto guardar(Producto producto);

    void eliminar(Long id);

    boolean existePorId(Long id);

    boolean existeAlgunoEnSeccion(Long seccionId);
}
