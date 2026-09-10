package com.cafeteria.backend.seccion;

import com.cafeteria.backend.common.RecursoNoEncontradoException;
import com.cafeteria.backend.common.ReglaNegocioException;
import com.cafeteria.backend.seccion.dto.SeccionSolicitud;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("SeccionServicio - pruebas unitarias")
class SeccionServicioTest {

    private SeccionServicio servicio;

    @BeforeEach
    void inicializar() {
        servicio = new SeccionServicio(new SeccionRepositorioEnMemoria());
    }

    private SeccionSolicitud solicitud(String nombre, String slug) {
        return new SeccionSolicitud(nombre, slug, "descripcion de prueba", true);
    }

    @Test
    @DisplayName("crear() guarda la seccion y le asigna un id")
    void crearAsignaId() {
        Seccion creada = servicio.crear(solicitud("Cafes de la Casa", "cafes"));

        assertThat(creada.getId()).isNotNull();
        assertThat(creada.getNombre()).isEqualTo("Cafes de la Casa");
        assertThat(creada.getSlug()).isEqualTo("cafes");
        assertThat(servicio.listar()).hasSize(1);
    }

    @Test
    @DisplayName("crear() normaliza el slug a minusculas")
    void crearNormalizaSlug() {
        Seccion creada = servicio.crear(new SeccionSolicitud("Dulces", "DULCES", null, null));

        assertThat(creada.getSlug()).isEqualTo("dulces");
        assertThat(creada.isActiva()).isTrue();
    }

    @Test
    @DisplayName("crear() con un slug repetido lanza ReglaNegocioException")
    void crearSlugRepetido() {
        servicio.crear(solicitud("Cafes", "cafes"));

        assertThatThrownBy(() -> servicio.crear(solicitud("Otra", "cafes")))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("cafes");
    }

    @Test
    @DisplayName("obtener() con un id inexistente lanza RecursoNoEncontradoException")
    void obtenerInexistente() {
        assertThrows(RecursoNoEncontradoException.class, () -> servicio.obtener(99L));
    }

    @Test
    @DisplayName("actualizar() modifica los datos de la seccion")
    void actualizar() {
        Long id = servicio.crear(solicitud("Cafes", "cafes")).getId();

        Seccion actualizada = servicio.actualizar(id,
                new SeccionSolicitud("Cafes de Especialidad", "cafes", "nueva descripcion", false));

        assertThat(actualizada.getNombre()).isEqualTo("Cafes de Especialidad");
        assertThat(actualizada.isActiva()).isFalse();
    }

    @Test
    @DisplayName("eliminar() quita la seccion de la lista")
    void eliminar() {
        Long id = servicio.crear(solicitud("Cafes", "cafes")).getId();

        servicio.eliminar(id);

        assertThat(servicio.listar()).isEmpty();
    }

    @Test
    @DisplayName("eliminar() con un id inexistente lanza RecursoNoEncontradoException")
    void eliminarInexistente() {
        assertThrows(RecursoNoEncontradoException.class, () -> servicio.eliminar(1L));
    }
}
