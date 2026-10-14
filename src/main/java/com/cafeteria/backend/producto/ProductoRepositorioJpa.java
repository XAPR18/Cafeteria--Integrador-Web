package com.cafeteria.backend.producto;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Sort;
@Repository
@Profile("!memoria")
public class ProductoRepositorioJpa implements ProductoRepositorio {
    private final ProductoJpaRepository datos;
    public ProductoRepositorioJpa(ProductoJpaRepository datos) { this.datos = datos; }
    public List<Producto> listar() { return datos.findAll(Sort.by("id")); }
    public Optional<Producto> buscarPorId(Long id) { return datos.findById(id); }
    public Producto guardar(Producto valor) { return datos.saveAndFlush(valor); }
    public void eliminar(Long id) { datos.deleteById(id); datos.flush(); }
    public boolean existePorId(Long id) { return datos.existsById(id); }
    public List<Producto> listarPorSeccion(Long id) { return datos.findBySeccionIdOrderById(id); }
    public boolean existeAlgunoEnSeccion(Long id) { return datos.existsBySeccionId(id); }
}
