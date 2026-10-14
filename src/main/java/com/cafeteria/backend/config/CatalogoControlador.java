package com.cafeteria.backend.config;
import com.cafeteria.backend.seccion.*;
import com.cafeteria.backend.seccion.dto.SeccionRespuesta;
import com.cafeteria.backend.producto.*;
import com.cafeteria.backend.producto.dto.ProductoRespuesta;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/catalogo")
public class CatalogoControlador {
 private final SeccionServicio secciones;private final ProductoServicio productos;
 public CatalogoControlador(SeccionServicio secciones,ProductoServicio productos){this.secciones=secciones;this.productos=productos;}
 @GetMapping("/secciones") public List<SeccionRespuesta> secciones(){return secciones.listar().stream().filter(Seccion::isActiva).map(SeccionRespuesta::desde).toList();}
 @GetMapping("/productos") public List<ProductoRespuesta> productos(){
  Set<Long> activas=new HashSet<>();secciones.listar().stream().filter(Seccion::isActiva).forEach(s -> activas.add(s.getId()));
  return productos.listar(null).stream().filter(p -> activas.contains(p.seccionId())).toList();
 }
}
