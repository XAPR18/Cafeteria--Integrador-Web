package com.cafeteria.backend.producto;

import java.math.BigDecimal;

public class Producto {
    private Long id;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private Long seccionId;
    private boolean disponible;
    private String imagenUrl;
    private String etiqueta;

    public Producto() {
    }

    public Producto(Long id, String nombre, String descripcion, BigDecimal precio, Long seccionId,
                    boolean disponible, String imagenUrl, String etiqueta) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.seccionId = seccionId;
        this.disponible = disponible;
        this.imagenUrl = imagenUrl;
        this.etiqueta = etiqueta;
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

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public Long getSeccionId() {
        return seccionId;
    }

    public void setSeccionId(Long seccionId) {
        this.seccionId = seccionId;
    }

    public boolean isDisponible() {
        return disponible;
    }

    public void setDisponible(boolean disponible) {
        this.disponible = disponible;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public void setEtiqueta(String etiqueta) {
        this.etiqueta = etiqueta;
    }
}
