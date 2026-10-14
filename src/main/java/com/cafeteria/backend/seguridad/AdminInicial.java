package com.cafeteria.backend.seguridad;
import org.springframework.stereotype.Component;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
@Component
public class AdminInicial implements CommandLineRunner {
 private final CuentaRepositorio cuentas;private final PasswordEncoder claves;private final String email,clave;
 public AdminInicial(CuentaRepositorio cuentas,PasswordEncoder claves,@Value("${app.admin.email}") String email,@Value("${app.admin.password}") String clave){this.cuentas=cuentas;this.claves=claves;this.email=email;this.clave=clave;}
 public void run(String... args){
  if(cuentas.count()>0) return;
  if(email.isBlank() || clave.length()<12) throw new IllegalStateException("Configura ADMIN_EMAIL y ADMIN_PASSWORD de al menos 12 caracteres");
  cuentas.saveAndFlush(new Cuenta("Administrador",email.trim().toLowerCase(java.util.Locale.ROOT),claves.encode(clave),"ADMIN"));
 }
}
