package com.cafeteria.backend.seguridad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "cuentas")
public class Cuenta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(nullable = false)
    private String claveHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Rol rol;

    @Column(nullable = false)
    private boolean activa = true;

    /** Los clientes que se registran solos deben confirmar su correo antes de reservar. */
    @Column(name = "email_verificado", nullable = false)
    private boolean emailVerificado = true;

    @Column(length = 20)
    private String telefono;

    /** SHA-256 del código enviado por correo; nunca se guarda el código en claro. */
    @Column(name = "verificacion_hash", length = 64)
    private String verificacionHash;

    @Column(name = "verificacion_expira")
    private LocalDateTime verificacionExpira;

    @Column(name = "verificacion_enviada")
    private LocalDateTime verificacionEnviada;

    @Column(name = "verificacion_intentos", nullable = false)
    private int verificacionIntentos;

    protected Cuenta() {
    }

    public Cuenta(String nombre, String email, String claveHash, Rol rol) {
        this.nombre = nombre;
        this.email = email;
        this.claveHash = claveHash;
        this.rol = rol;
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public String getEmail() { return email; }
    public String getClaveHash() { return claveHash; }
    public Rol getRol() { return rol; }
    public boolean isActiva() { return activa; }
    public void setActiva(boolean activa) { this.activa = activa; }
    public boolean isEmailVerificado() { return emailVerificado; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getVerificacionHash() { return verificacionHash; }
    public LocalDateTime getVerificacionExpira() { return verificacionExpira; }
    public LocalDateTime getVerificacionEnviada() { return verificacionEnviada; }
    public int getVerificacionIntentos() { return verificacionIntentos; }

    /** Deja la cuenta pendiente de verificar (registro público de clientes). */
    public void requerirVerificacion() { this.emailVerificado = false; }

    public void nuevoCodigo(String hash, LocalDateTime expira, LocalDateTime enviada) {
        this.verificacionHash = hash;
        this.verificacionExpira = expira;
        this.verificacionEnviada = enviada;
        this.verificacionIntentos = 0;
    }

    public void intentoFallido() { this.verificacionIntentos++; }

    public void marcarVerificada() {
        this.emailVerificado = true;
        this.verificacionHash = null;
        this.verificacionExpira = null;
        this.verificacionIntentos = 0;
    }
}
