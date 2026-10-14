package com.cafeteria.backend.mesa;
import org.springframework.data.jpa.repository.JpaRepository;
public interface MesaJpaRepository extends JpaRepository<Mesa, Long> {
    java.util.Optional<Mesa> findByNumero(Integer numero);
}
