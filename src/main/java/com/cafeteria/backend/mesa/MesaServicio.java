package com.cafeteria.backend.mesa;

import com.cafeteria.backend.common.RecursoNoEncontradoException;
import com.cafeteria.backend.common.ReglaNegocioException;
import com.cafeteria.backend.mesa.dto.MesaSolicitud;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@org.springframework.transaction.annotation.Transactional
public class MesaServicio {
    private final MesaRepositorio repositorio;

    public MesaServicio(MesaRepositorio repositorio) {
        this.repositorio = repositorio;
    }

    public List<Mesa> listar() {
        return repositorio.listar();
    }

    public Mesa obtener(Long id) {
        return repositorio.buscarPorId(id)
                .orElseThrow(() -> RecursoNoEncontradoException.de("la mesa", id));
    }

    public Mesa crear(MesaSolicitud solicitud) {
        exigirNumeroLibre(solicitud.numero(), null);
        Mesa mesa = new Mesa(
                null,
                solicitud.numero(),
                solicitud.capacidad(),
                solicitud.tipo(),
                solicitud.zona(),
                solicitud.estado() == null ? EstadoMesa.DISPONIBLE : solicitud.estado());
        return repositorio.guardar(mesa);
    }

    public Mesa actualizar(Long id, MesaSolicitud solicitud) {
        Mesa mesa = obtener(id);
        exigirNumeroLibre(solicitud.numero(), id);
        mesa.setNumero(solicitud.numero());
        mesa.setCapacidad(solicitud.capacidad());
        mesa.setTipo(solicitud.tipo());
        mesa.setZona(solicitud.zona());
        mesa.setEstado(solicitud.estado() == null ? EstadoMesa.DISPONIBLE : solicitud.estado());
        return repositorio.guardar(mesa);
    }

    /** Cambio rapido de estado en sala (ADMIN o EMPLEADO): ocupar, liberar o marcar como reservada. */
    public Mesa cambiarEstado(Long id, EstadoMesa estado) {
        Mesa mesa = obtener(id);
        mesa.setEstado(estado);
        return repositorio.guardar(mesa);
    }

    public void eliminar(Long id) {
        if (!repositorio.existePorId(id)) {
            throw RecursoNoEncontradoException.de("la mesa", id);
        }
        repositorio.eliminar(id);
    }

    private void exigirNumeroLibre(Integer numero, Long idQueSeEdita) {
        repositorio.buscarPorNumero(numero)
                .filter(existente -> !existente.getId().equals(idQueSeEdita))
                .ifPresent(existente -> {
                    throw new ReglaNegocioException("Ya existe una mesa con el numero " + numero);
                });
    }
}
