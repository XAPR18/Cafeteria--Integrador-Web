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

    /**
     * Imagen QR del código de una reserva (la usan el correo y "Mi cuenta").
     * Solo codifica el texto del código que ya conoce quien lo pide: no consulta la base ni revela datos.
     */
    @GetMapping(value = "/reservas/{codigo}/qr.png", produces = org.springframework.http.MediaType.IMAGE_PNG_VALUE)
    @Operation(summary = "QR del codigo de una reserva")
    public org.springframework.http.ResponseEntity<byte[]> qr(@org.springframework.web.bind.annotation.PathVariable String codigo) {
        if (!codigo.matches("CC14-[A-Z0-9]{1,10}")) {
            return org.springframework.http.ResponseEntity.notFound().build();
        }
        return org.springframework.http.ResponseEntity.ok()
                .cacheControl(org.springframework.http.CacheControl.maxAge(java.time.Duration.ofDays(30)).cachePublic())
                .body(CodigoQr.png(codigo, 360));
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
