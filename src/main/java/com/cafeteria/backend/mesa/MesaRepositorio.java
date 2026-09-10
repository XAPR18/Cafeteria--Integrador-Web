package com.cafeteria.backend.mesa;

import java.util.List;
import java.util.Optional;

public interface MesaRepositorio {
    List<Mesa> listar();

    Optional<Mesa> buscarPorId(Long id);

    Optional<Mesa> buscarPorNumero(Integer numero);

    Mesa guardar(Mesa mesa);

    void eliminar(Long id);

    boolean existePorId(Long id);
}
