package com.cafeteria.backend.seguridad;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface CuentaRepositorio extends JpaRepository<Cuenta,Long> {
 Optional<Cuenta> findByEmail(String email);
 boolean existsByEmail(String email);
}
