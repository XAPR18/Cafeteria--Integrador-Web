package com.cafeteria.backend.seccion;

import jakarta.persistence.*;

@Entity
@Table(name = "secciones")
public class Seccion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 60)
    private String nombre;
    @Column(nullable = false, unique = true, length = 40)
    private String slug;
    @Column(length = 200)
    private String descripcion;
    @Column(nullable = false)
    private boolean activa;

    public Seccion() {
    }

    public Seccion(Long id, String nombre, String slug, String descripcion, boolean activa) {
        this.id = id;
        this.nombre = nombre;
        this.slug = slug;
        this.descripcion = descripcion;
        this.activa = activa;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public boolean isActiva() {
        return activa;
    }

    public void setActiva(boolean activa) {
        this.activa = activa;
    }
}
