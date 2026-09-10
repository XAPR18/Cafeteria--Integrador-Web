package com.cafeteria.backend.producto;

import com.cafeteria.backend.common.RecursoNoEncontradoException;
import com.cafeteria.backend.common.ReglaNegocioException;
import com.cafeteria.backend.producto.dto.ProductoRespuesta;
import com.cafeteria.backend.producto.dto.ProductoSolicitud;
import com.cafeteria.backend.seccion.Seccion;
import com.cafeteria.backend.seccion.SeccionRepositorio;
import com.cafeteria.backend.seccion.SeccionRepositorioEnMemoria;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("ProductoServicio - pruebas unitarias")
class ProductoServicioTest {

    private ProductoServicio servicio;
    private SeccionRepositorio seccionRepositorio;
    private Long seccionCafesId;

    @BeforeEach
    void inicializar() {
        seccionRepositorio = new SeccionRepositorioEnMemoria();
        servicio = new ProductoServicio(new ProductoRepositorioEnMemoria(), seccionRepositorio);
        seccionCafesId = seccionRepositorio
                .guardar(new Seccion(null, "Cafes de la Casa", "cafes", null, true))
                .getId();
    }

    private ProductoSolicitud solicitud(String nombre, String precio, Long seccionId) {
        return new ProductoSolicitud(nombre, "descripcion", new BigDecimal(precio), seccionId, true, null, null);
    }

    @Test
    @DisplayName("crear() guarda el producto y devuelve el nombre de su seccion")
    void crearOk() {
        ProductoRespuesta creado = servicio.crear(solicitud("Cortado", "7.50", seccionCafesId));

        assertThat(creado.id()).isNotNull();
        assertThat(creado.precio()).isEqualByComparingTo("7.50");
        assertThat(creado.seccionNombre()).isEqualTo("Cafes de la Casa");
        assertThat(creado.seccionSlug()).isEqualTo("cafes");
    }

    @Test
    @DisplayName("crear() en una seccion inexistente lanza ReglaNegocioException")
    void crearSeccionInexistente() {
        assertThatThrownBy(() -> servicio.crear(solicitud("X", "5.00", 999L)))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("listar(seccionId) devuelve solo los productos de esa seccion")
    void listarPorSeccion() {
        Long dulcesId = seccionRepositorio
                .guardar(new Seccion(null, "Dulces", "dulces", null, true)).getId();
        servicio.crear(solicitud("Cortado", "7.50", seccionCafesId));
        servicio.crear(solicitud("Americano", "6.50", seccionCafesId));
        servicio.crear(solicitud("Alfajor", "5.50", dulcesId));

        assertThat(servicio.listar(seccionCafesId)).hasSize(2);
        assertThat(servicio.listar(dulcesId)).hasSize(1);
        assertThat(servicio.listar(null)).hasSize(3);
    }

    @Test
    @DisplayName("actualizar() cambia el precio del producto")
    void actualizarPrecio() {
        Long id = servicio.crear(solicitud("Cortado", "7.50", seccionCafesId)).id();

        ProductoRespuesta actualizado = servicio.actualizar(id, solicitud("Cortado", "8.00", seccionCafesId));

        assertThat(actualizado.precio()).isEqualByComparingTo("8.00");
    }

    @Test
    @DisplayName("obtener() y eliminar() con id inexistente lanzan RecursoNoEncontradoException")
    void inexistente() {
        assertThrows(RecursoNoEncontradoException.class, () -> servicio.obtener(50L));
        assertThrows(RecursoNoEncontradoException.class, () -> servicio.eliminar(50L));
    }

    @Test
    @DisplayName("eliminar() quita el producto")
    void eliminar() {
        Long id = servicio.crear(solicitud("Cortado", "7.50", seccionCafesId)).id();

        servicio.eliminar(id);

        assertThat(servicio.listar(null)).isEmpty();
    }
}
