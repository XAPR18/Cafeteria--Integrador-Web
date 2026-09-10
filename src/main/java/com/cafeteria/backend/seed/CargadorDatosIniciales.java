package com.cafeteria.backend.seed;

import com.cafeteria.backend.mesa.EstadoMesa;
import com.cafeteria.backend.mesa.Mesa;
import com.cafeteria.backend.mesa.MesaRepositorio;
import com.cafeteria.backend.mesa.TipoMesa;
import com.cafeteria.backend.mesa.ZonaMesa;
import com.cafeteria.backend.producto.Producto;
import com.cafeteria.backend.producto.ProductoRepositorio;
import com.cafeteria.backend.seccion.Seccion;
import com.cafeteria.backend.seccion.SeccionRepositorio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Order(1)
public class CargadorDatosIniciales implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(CargadorDatosIniciales.class);

    private final SeccionRepositorio seccionRepositorio;
    private final ProductoRepositorio productoRepositorio;
    private final MesaRepositorio mesaRepositorio;

    public CargadorDatosIniciales(SeccionRepositorio seccionRepositorio,
                                  ProductoRepositorio productoRepositorio,
                                  MesaRepositorio mesaRepositorio) {
        this.seccionRepositorio = seccionRepositorio;
        this.productoRepositorio = productoRepositorio;
        this.mesaRepositorio = mesaRepositorio;
    }

    @Override
    public void run(String... args) {
        if (!seccionRepositorio.listar().isEmpty()) {
            return;
        }

        Seccion cafes = seccionRepositorio.guardar(new Seccion(
                null, "Cafes de la Casa", "cafes",
                "Nuestros granos de especialidad, preparados al momento.", true));
        Seccion desayunos = seccionRepositorio.guardar(new Seccion(
                null, "Desayunos y Tostones", "desayunos",
                "Para empezar el dia con energia: tostones, bowls y clasicos.", true));
        Seccion sandwiches = seccionRepositorio.guardar(new Seccion(
                null, "Sandwiches de la Esquina", "sandwiches",
                "Panes artesanales con rellenos frescos, prensados al momento.", true));
        Seccion dulces = seccionRepositorio.guardar(new Seccion(
                null, "Dulces Caseros", "dulces",
                "Reposteria de la casa, horneada cada manana.", true));

        // --- Cafes ---
        crearProducto("Cortado de la Casa",
                "Doble shot con leche vaporizada en vaso clasico de vidrio. Sabor redondo y balanceado.",
                "7.50", cafes, "/Image/Producto 1.jpg", "EL CLASICO");
        crearProducto("Americano Intenso",
                "Blend exclusivo de granos con notas a chocolate oscuro y nueces tostadas. Pura energia.",
                "6.50", cafes, "/Image/Producto 2.jpg", "FUERTE");
        crearProducto("Cappuccino Cremoso",
                "Espresso, leche texturizada y una capa generosa de espuma con cacao.",
                "8.00", cafes, "/Image/Producto 1.jpg", null);
        crearProducto("Latte de Vainilla",
                "Espresso suave con leche y un toque de vainilla natural. Ideal para la tarde.",
                "9.00", cafes, "/Image/Producto 2.jpg", "FAVORITO");
        crearProducto("Cold Brew de la Esquina",
                "Cafe de extraccion en frio por 18 horas. Refrescante, dulce y muy poco acido.",
                "10.00", cafes, "/Image/Producto 1.jpg", "FRIO");

        // --- Desayunos ---
        crearProducto("Toston con Palta y Huevo",
                "Pan de masa madre tostado, palta cremosa de estacion, huevo de granja pochado.",
                "13.00", desayunos, "/Image/Producto 3.jpg", "FAVORITO");
        crearProducto("Bowl de Avena y Frutos",
                "Avena cremosa en leche de almendras, coronada con arandanos frescos, platano y miel.",
                "12.00", desayunos, "/Image/Producto 4.jpg", "VEGANO");
        crearProducto("Toston Dulce de Ricotta",
                "Pan brioche, ricotta batida, frutillas y un hilo de miel de abeja.",
                "12.50", desayunos, "/Image/Producto 3.jpg", null);
        crearProducto("Huevos Revueltos con Pan",
                "Huevos cremosos con ciboulette, acompanados de pan tostado con mantequilla.",
                "11.00", desayunos, "/Image/Producto 4.jpg", null);

        // --- Sandwiches ---
        crearProducto("Mixto Prensado de Esquina",
                "Jamon artesanal, queso edam derretido y mantequilla dorada a la plancha.",
                "11.50", sandwiches, "/Image/Producto 5.jpg", "A LA PLANCHA");
        crearProducto("Caprese en Ciabatta",
                "Mozzarella fresca, tomate organico, hojas de albahaca y un toque de pesto casero.",
                "13.50", sandwiches, "/Image/Producto 6.jpg", "FRESCO");
        crearProducto("Pollo y Palta en Focaccia",
                "Pollo grillado, palta, lechuga crocante y mayonesa de la casa en focaccia de romero.",
                "14.50", sandwiches, "/Image/Producto 5.jpg", "MAS PEDIDO");
        crearProducto("Veggie de Portobello",
                "Portobello asado, queso de cabra, rucula y cebolla caramelizada.",
                "13.00", sandwiches, "/Image/Producto 6.jpg", "VEGETARIANO");

        // --- Dulces ---
        crearProducto("Medialuna Horneada",
                "Mantequilla pura, doraditas y esponjosas recien salidas de nuestro horno.",
                "6.00", dulces, "/Image/Producto 7.jpg", "CALENTITA");
        crearProducto("Torta de Chocolate",
                "Bizcocho humedo relleno y cubierto con nuestro fudge artesanal de olla.",
                "8.50", dulces, "/Image/Producto 8.jpg", "MAS PEDIDO");
        crearProducto("Cheesecake de Frutos Rojos",
                "Base de galleta, crema suave de queso y salsa casera de frutos rojos.",
                "9.50", dulces, "/Image/Producto 8.jpg", null);
        crearProducto("Alfajor de Maicena",
                "Dos tapas suaves de maicena unidas con abundante manjar y coco rallado.",
                "5.50", dulces, "/Image/Producto 7.jpg", "DE LA CASA");

        // --- Mesas ---
        crearMesa(1, 2, TipoMesa.DOS, ZonaMesa.VEREDA, EstadoMesa.DISPONIBLE);
        crearMesa(2, 2, TipoMesa.DOS, ZonaMesa.VEREDA, EstadoMesa.OCUPADA);
        crearMesa(3, 2, TipoMesa.DOS, ZonaMesa.INTERIOR, EstadoMesa.DISPONIBLE);
        crearMesa(4, 4, TipoMesa.CUATRO, ZonaMesa.INTERIOR, EstadoMesa.DISPONIBLE);
        crearMesa(5, 4, TipoMesa.CUATRO, ZonaMesa.INTERIOR, EstadoMesa.RESERVADA);
        crearMesa(6, 4, TipoMesa.CUATRO, ZonaMesa.VEREDA, EstadoMesa.DISPONIBLE);
        crearMesa(7, 6, TipoMesa.EXTRA, ZonaMesa.INTERIOR, EstadoMesa.DISPONIBLE);
        crearMesa(8, 8, TipoMesa.EXTRA, ZonaMesa.INTERIOR, EstadoMesa.OCUPADA);
        crearMesa(9, 1, TipoMesa.DOS, ZonaMesa.BARRA, EstadoMesa.DISPONIBLE);
        crearMesa(10, 1, TipoMesa.DOS, ZonaMesa.BARRA, EstadoMesa.DISPONIBLE);

        log.info("Datos iniciales cargados: {} secciones, {} productos, {} mesas",
                seccionRepositorio.listar().size(),
                productoRepositorio.listar().size(),
                mesaRepositorio.listar().size());
    }

    private void crearProducto(String nombre, String descripcion, String precio,
                               Seccion seccion, String imagenUrl, String etiqueta) {
        productoRepositorio.guardar(new Producto(
                null, nombre, descripcion, new BigDecimal(precio),
                seccion.getId(), true, imagenUrl, etiqueta));
    }

    private void crearMesa(int numero, int capacidad, TipoMesa tipo, ZonaMesa zona, EstadoMesa estado) {
        mesaRepositorio.guardar(new Mesa(null, numero, capacidad, tipo, zona, estado));
    }
}
