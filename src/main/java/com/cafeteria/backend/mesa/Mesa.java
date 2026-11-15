package com.cafeteria.backend.mesa;

import jakarta.persistence.*;

@Entity
@Table(name = "mesas")
public class Mesa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private Integer numero;
    @Column(nullable = false)
    private Integer capacidad;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMesa tipo;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ZonaMesa zona;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoMesa estado;

    public Mesa() {
    }

    public Mesa(Long id, Integer numero, Integer capacidad, TipoMesa tipo, ZonaMesa zona, EstadoMesa estado) {
        this.id = id;
        this.numero = numero;
        this.capacidad = capacidad;
        this.tipo = tipo;
        this.zona = zona;
        this.estado = estado;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    public Integer getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(Integer capacidad) {
        this.capacidad = capacidad;
    }

    public TipoMesa getTipo() {
        return tipo;
    }

    public void setTipo(TipoMesa tipo) {
        this.tipo = tipo;
    }

    public ZonaMesa getZona() {
        return zona;
    }

    public void setZona(ZonaMesa zona) {
        this.zona = zona;
    }

    public EstadoMesa getEstado() {
        return estado;
    }

    public void setEstado(EstadoMesa estado) {
        this.estado = estado;
    }
}
