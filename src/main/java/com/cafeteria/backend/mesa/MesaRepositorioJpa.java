package com.cafeteria.backend.mesa;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Sort;
@Repository
public class MesaRepositorioJpa implements MesaRepositorio {
    private final MesaJpaRepository datos;
    public MesaRepositorioJpa(MesaJpaRepository datos) { this.datos = datos; }
    public List<Mesa> listar() { return datos.findAll(Sort.by("numero")); }
    public Optional<Mesa> buscarPorId(Long id) { return datos.findById(id); }
    public Mesa guardar(Mesa valor) { return datos.saveAndFlush(valor); }
    public void eliminar(Long id) { datos.deleteById(id); datos.flush(); }
    public boolean existePorId(Long id) { return datos.existsById(id); }
    public Optional<Mesa> buscarPorNumero(Integer numero) { return datos.findByNumero(numero); }
}
