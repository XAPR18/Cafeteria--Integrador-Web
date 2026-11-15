package com.cafeteria.backend.reserva;

import com.cafeteria.backend.mesa.Mesa;
import com.cafeteria.backend.seguridad.Cuenta;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "reservas")
public class Reserva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cuenta_id", nullable = false)
    private Cuenta cuenta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mesa_id", nullable = false)
    private Mesa mesa;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Column(nullable = false)
    private int personas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoReserva estado;

    @Column(length = 200)
    private String nota;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    protected Reserva() {
    }

    public Reserva(Cuenta cuenta, Mesa mesa, LocalDate fecha, LocalTime horaInicio, LocalTime horaFin,
                   int personas, String nota, LocalDateTime creadoEn) {
        this.cuenta = cuenta;
        this.mesa = mesa;
        this.fecha = fecha;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.personas = personas;
        this.nota = nota;
        this.creadoEn = creadoEn;
        this.estado = EstadoReserva.PENDIENTE;
    }

    public Long getId() { return id; }
    public Cuenta getCuenta() { return cuenta; }
    public Mesa getMesa() { return mesa; }
    public LocalDate getFecha() { return fecha; }
    public LocalTime getHoraInicio() { return horaInicio; }
    public LocalTime getHoraFin() { return horaFin; }
    public int getPersonas() { return personas; }
    public EstadoReserva getEstado() { return estado; }
    public String getNota() { return nota; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setEstado(EstadoReserva estado) { this.estado = estado; }
}
