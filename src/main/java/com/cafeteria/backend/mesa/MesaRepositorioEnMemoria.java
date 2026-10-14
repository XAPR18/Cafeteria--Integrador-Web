package com.cafeteria.backend.mesa;

import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
@org.springframework.context.annotation.Profile("memoria")
public class MesaRepositorioEnMemoria implements MesaRepositorio {
    private final Map<Long, Mesa> datos = new ConcurrentHashMap<>();
    private final AtomicLong secuenciaId = new AtomicLong(0);

    @Override
    public List<Mesa> listar() {
        List<Mesa> copia = new ArrayList<>(datos.values());
        copia.sort(Comparator.comparing(Mesa::getNumero, Comparator.nullsLast(Comparator.naturalOrder())));
        return copia;
    }

    @Override
    public Optional<Mesa> buscarPorId(Long id) {
        return Optional.ofNullable(datos.get(id));
    }

    @Override
    public Optional<Mesa> buscarPorNumero(Integer numero) {
        if (numero == null) {
            return Optional.empty();
        }
        return datos.values().stream()
                .filter(m -> numero.equals(m.getNumero()))
                .findFirst();
    }

    @Override
    public Mesa guardar(Mesa mesa) {
        if (mesa.getId() == null) {
            mesa.setId(secuenciaId.incrementAndGet());
        }
        datos.put(mesa.getId(), mesa);
        return mesa;
    }

    @Override
    public void eliminar(Long id) {
        datos.remove(id);
    }

    @Override
    public boolean existePorId(Long id) {
        return datos.containsKey(id);
    }
}
