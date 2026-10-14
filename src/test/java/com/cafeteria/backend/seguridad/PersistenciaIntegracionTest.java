package com.cafeteria.backend.seguridad;
import com.cafeteria.backend.seccion.*;
import com.cafeteria.backend.producto.*;
import com.cafeteria.backend.producto.dto.ProductoSolicitud;
import com.cafeteria.backend.common.ReglaNegocioException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest @Transactional
class PersistenciaIntegracionTest {
 @Autowired SeccionRepositorio secciones;
 @Autowired ProductoServicio productos;
 @Autowired SeccionServicio servicioSecciones;
 @Test void consultaPorSeccionNoIncluyeOtrosProductos() {
  var primera = secciones.guardar(new Seccion(null,"Primera consulta","primera-consulta",null,true));
  var segunda = secciones.guardar(new Seccion(null,"Segunda consulta","segunda-consulta",null,true));
  var propio = productos.crear(new ProductoSolicitud("Producto propio",null,new BigDecimal("7.00"),primera.getId(),true,null,null));
  productos.crear(new ProductoSolicitud("Producto ajeno",null,new BigDecimal("9.00"),segunda.getId(),true,null,null));
  assertThat(productos.listar(primera.getId())).extracting(p -> p.id()).containsExactly(propio.id());
  assertThat(productos.listar(primera.getId()).getFirst().seccionNombre()).isEqualTo("Primera consulta");
 }
 @Test void productoSeGuardaMedianteJpaConSuSeccion() {
  Seccion s=secciones.guardar(new Seccion(null,"Prueba persistencia","prueba-persistencia",null,true));
  var p=productos.crear(new ProductoSolicitud("Espresso prueba",null,new BigDecimal("6.50"),s.getId(),true,null,null));
  assertThat(productos.obtener(p.id()).seccionNombre()).isEqualTo("Prueba persistencia");
  assertThatThrownBy(() -> servicioSecciones.eliminar(s.getId())).isInstanceOf(ReglaNegocioException.class);
 }

 @Autowired com.cafeteria.backend.mesa.MesaServicio mesas;
 @Test void seccionSeCreaEditaYEliminaSinProductos() {
  var creada = servicioSecciones.crear(new com.cafeteria.backend.seccion.dto.SeccionSolicitud("Seccion integrada", "seccion-integrada", null, true));
  var editada = servicioSecciones.actualizar(creada.getId(), new com.cafeteria.backend.seccion.dto.SeccionSolicitud("Seccion editada", "seccion-editada", "Actualizada", false));
  assertThat(editada.getNombre()).isEqualTo("Seccion editada");
  assertThat(servicioSecciones.obtener(creada.getId()).isActiva()).isFalse();
  servicioSecciones.eliminar(creada.getId());
  assertThat(secciones.buscarPorId(creada.getId())).isEmpty();
 }
 @Test void seccionDuplicadaNoSeGuarda() {
  servicioSecciones.crear(new com.cafeteria.backend.seccion.dto.SeccionSolicitud("Original", "slug-integrado", null, true));
  assertThatThrownBy(() -> servicioSecciones.crear(new com.cafeteria.backend.seccion.dto.SeccionSolicitud("Duplicada", "slug-integrado", null, true)))
    .isInstanceOf(ReglaNegocioException.class);
 }
 @Test void mesaSeCreaEditaYElimina() {
  var creada = mesas.crear(new com.cafeteria.backend.mesa.dto.MesaSolicitud(900, 4, com.cafeteria.backend.mesa.TipoMesa.CUATRO, com.cafeteria.backend.mesa.ZonaMesa.INTERIOR, com.cafeteria.backend.mesa.EstadoMesa.DISPONIBLE));
  mesas.actualizar(creada.getId(), new com.cafeteria.backend.mesa.dto.MesaSolicitud(901, 6, com.cafeteria.backend.mesa.TipoMesa.EXTRA, com.cafeteria.backend.mesa.ZonaMesa.VEREDA, com.cafeteria.backend.mesa.EstadoMesa.OCUPADA));
  assertThat(mesas.obtener(creada.getId()).getNumero()).isEqualTo(901);
  assertThat(mesas.obtener(creada.getId()).getEstado()).isEqualTo(com.cafeteria.backend.mesa.EstadoMesa.OCUPADA);
  mesas.eliminar(creada.getId());
  assertThatThrownBy(() -> mesas.obtener(creada.getId())).isInstanceOf(com.cafeteria.backend.common.RecursoNoEncontradoException.class);
 }
 @Test void mesaDuplicadaNoSeGuarda() {
  var solicitud = new com.cafeteria.backend.mesa.dto.MesaSolicitud(902, 2, com.cafeteria.backend.mesa.TipoMesa.DOS, com.cafeteria.backend.mesa.ZonaMesa.INTERIOR, null);
  mesas.crear(solicitud);
  assertThatThrownBy(() -> mesas.crear(solicitud)).isInstanceOf(ReglaNegocioException.class);
 }
}
