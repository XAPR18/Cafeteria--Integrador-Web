package com.cafeteria.backend.seccion;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Sort;
@Repository
public class SeccionRepositorioJpa implements SeccionRepositorio {
    private final SeccionJpaRepository datos;
    public SeccionRepositorioJpa(SeccionJpaRepository datos) { this.datos = datos; }
    public List<Seccion> listar() { return datos.findAll(Sort.by("id")); }
    public Optional<Seccion> buscarPorId(Long id) { return datos.findById(id); }
    public Seccion guardar(Seccion valor) { return datos.saveAndFlush(valor); }
    public void eliminar(Long id) { datos.deleteById(id); datos.flush(); }
    public boolean existePorId(Long id) { return datos.existsById(id); }
    public boolean existePorSlug(String slug) { return datos.existsBySlugIgnoreCase(slug); }
}
