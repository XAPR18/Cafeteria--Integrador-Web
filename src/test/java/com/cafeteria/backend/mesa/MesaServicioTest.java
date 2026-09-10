package com.cafeteria.backend.mesa;

import com.cafeteria.backend.common.RecursoNoEncontradoException;
import com.cafeteria.backend.common.ReglaNegocioException;
import com.cafeteria.backend.mesa.dto.MesaSolicitud;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("MesaServicio - pruebas unitarias")
class MesaServicioTest {

    private MesaServicio servicio;

    @BeforeEach
    void inicializar() {
        servicio = new MesaServicio(new MesaRepositorioEnMemoria());
    }

    private MesaSolicitud solicitud(int numero, EstadoMesa estado) {
        return new MesaSolicitud(numero, 4, TipoMesa.CUATRO, ZonaMesa.INTERIOR, estado);
    }

    @Test
    @DisplayName("crear() sin estado deja la mesa como DISPONIBLE por defecto")
    void crearEstadoPorDefecto() {
        Mesa creada = servicio.crear(solicitud(1, null));

        assertThat(creada.getId()).isNotNull();
        assertThat(creada.getEstado()).isEqualTo(EstadoMesa.DISPONIBLE);
    }

    @Test
    @DisplayName("crear() con un numero de mesa repetido lanza ReglaNegocioException")
    void crearNumeroRepetido() {
        servicio.crear(solicitud(1, EstadoMesa.DISPONIBLE));

        assertThatThrownBy(() -> servicio.crear(solicitud(1, EstadoMesa.DISPONIBLE)))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("1");
    }

    @Test
    @DisplayName("actualizar() permite liberar una mesa cambiando su estado")
    void actualizarEstado() {
        Long id = servicio.crear(solicitud(5, EstadoMesa.OCUPADA)).getId();

        Mesa actualizada = servicio.actualizar(id, solicitud(5, EstadoMesa.DISPONIBLE));

        assertThat(actualizada.getEstado()).isEqualTo(EstadoMesa.DISPONIBLE);
    }

    @Test
    @DisplayName("actualizar() mantener el mismo numero no cuenta como duplicado")
    void actualizarMismoNumero() {
        Long id = servicio.crear(solicitud(3, EstadoMesa.DISPONIBLE)).getId();

        Mesa actualizada = servicio.actualizar(id, solicitud(3, EstadoMesa.RESERVADA));

        assertThat(actualizada.getEstado()).isEqualTo(EstadoMesa.RESERVADA);
    }

    @Test
    @DisplayName("obtener() con un id inexistente lanza RecursoNoEncontradoException")
    void obtenerInexistente() {
        assertThrows(RecursoNoEncontradoException.class, () -> servicio.obtener(10L));
    }

    @Test
    @DisplayName("eliminar() quita la mesa del mapa")
    void eliminar() {
        Long id = servicio.crear(solicitud(7, EstadoMesa.DISPONIBLE)).getId();

        servicio.eliminar(id);

        assertThat(servicio.listar()).isEmpty();
    }
}
