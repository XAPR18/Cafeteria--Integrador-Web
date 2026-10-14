package com.cafeteria.backend.seguridad;
import jakarta.persistence.*;
@Entity @Table(name="cuentas")
public class Cuenta {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,length=80) private String nombre;
 @Column(nullable=false,unique=true,length=160) private String email;
 @Column(nullable=false) private String claveHash;
 @Column(nullable=false,length=30) private String rol;
 private boolean activa=true;
 public Cuenta() {}
 public Cuenta(String nombre,String email,String claveHash,String rol) {this.nombre=nombre;this.email=email;this.claveHash=claveHash;this.rol=rol;}
 public Long getId(){return id;} public String getNombre(){return nombre;}
 public String getEmail(){return email;} public String getClaveHash(){return claveHash;}
 public String getRol(){return rol;} public boolean isActiva(){return activa;}
 public void setActiva(boolean activa){this.activa=activa;}
}
