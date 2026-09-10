package com.cafeteria.backend.seccion;

import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class SeccionRepositorioEnMemoria implements SeccionRepositorio {
    private final Map<Long, Seccion> datos = new ConcurrentHashMap<>();
    private final AtomicLong secuenciaId = new AtomicLong(0);

    @Override
    public List<Seccion> listar() {
        List<Seccion> copia = new ArrayList<>(datos.values());
        copia.sort(Comparator.comparing(Seccion::getId));
        return copia;
    }

    @Override
    public Optional<Seccion> buscarPorId(Long id) {
        return Optional.ofNullable(datos.get(id));
    }

    @Override
    public boolean existePorSlug(String slug) {
        if (slug == null) {
            return false;
        }
        return datos.values().stream()
                .anyMatch(s -> slug.equalsIgnoreCase(s.getSlug()));
    }

    @Override
    public Seccion guardar(Seccion seccion) {
        if (seccion.getId() == null) {
            seccion.setId(secuenciaId.incrementAndGet());
        }
        datos.put(seccion.getId(), seccion);
        return seccion;
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
