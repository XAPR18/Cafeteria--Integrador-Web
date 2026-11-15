package com.cafeteria.backend.producto;


import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/** Doble de prueba en memoria para tests unitarios de servicios (sin Spring ni base de datos). */
public class ProductoRepositorioEnMemoria implements ProductoRepositorio {
    private final Map<Long, Producto> datos = new ConcurrentHashMap<>();
    private final AtomicLong secuenciaId = new AtomicLong(0);

    @Override
    public List<Producto> listar() {
        List<Producto> copia = new ArrayList<>(datos.values());
        copia.sort(Comparator.comparing(Producto::getId));
        return copia;
    }

    @Override
    public List<Producto> listarPorSeccion(Long seccionId) {
        return listar().stream()
                .filter(p -> p.getSeccionId() != null && p.getSeccionId().equals(seccionId))
                .toList();
    }

    @Override
    public Optional<Producto> buscarPorId(Long id) {
        return Optional.ofNullable(datos.get(id));
    }

    @Override
    public Producto guardar(Producto producto) {
        if (producto.getId() == null) {
            producto.setId(secuenciaId.incrementAndGet());
        }
        datos.put(producto.getId(), producto);
        return producto;
    }

    @Override
    public void eliminar(Long id) {
        datos.remove(id);
    }

    @Override
    public boolean existePorId(Long id) {
        return datos.containsKey(id);
    }

    @Override
    public boolean existeAlgunoEnSeccion(Long seccionId) {
        return datos.values().stream()
                .anyMatch(p -> p.getSeccionId() != null && p.getSeccionId().equals(seccionId));
    }
}
