package com.cafeteria.backend.catalogo;

import com.cafeteria.backend.mesa.ZonaMesa;
import com.cafeteria.backend.producto.dto.ProductoRespuesta;
import com.cafeteria.backend.reserva.ReservaServicio;
import com.cafeteria.backend.reserva.dto.ReservaDtos.Agenda;
import com.cafeteria.backend.reserva.dto.ReservaDtos.MesaLibre;
import com.cafeteria.backend.seccion.dto.SeccionRespuesta;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalogo")
@Tag(name = "Catalogo publico", description = "Carta y disponibilidad visibles sin iniciar sesion")
public class CatalogoControlador {
    private final CatalogoServicio catalogo;
    private final ReservaServicio reservas;

    public CatalogoControlador(CatalogoServicio catalogo, ReservaServicio reservas) {
        this.catalogo = catalogo;
        this.reservas = reservas;
    }

    @GetMapping("/secciones")
    @Operation(summary = "Secciones activas de la carta")
    public List<SeccionRespuesta> secciones() {
        return catalogo.seccionesActivas();
    }

    @GetMapping("/productos")
    @Operation(summary = "Productos de las secciones activas")
    public List<ProductoRespuesta> productos() {
        return catalogo.productosVisibles();
    }

    @GetMapping("/agenda")
    @Operation(summary = "Turnos de reserva de un dia y cuantas mesas libres hay en cada uno")
    public Agenda agenda(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
                         @RequestParam(defaultValue = "2") int personas,
                         @RequestParam(required = false) ZonaMesa zona) {
        return reservas.agenda(fecha, personas, zona);
    }

    @GetMapping("/mesas-libres")
    @Operation(summary = "Mesas libres para un turno concreto")
    public List<MesaLibre> mesasLibres(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
                                       @RequestParam @DateTimeFormat(pattern = "HH:mm") LocalTime hora,
                                       @RequestParam(defaultValue = "2") int personas,
                                       @RequestParam(required = false) ZonaMesa zona) {
        return reservas.mesasLibres(fecha, hora, personas, zona);
    }
}
