package com.cafeteria.backend.mesa;
import org.springframework.data.jpa.repository.JpaRepository;
public interface MesaJpaRepository extends JpaRepository<Mesa, Long> {
    java.util.Optional<Mesa> findByNumero(Integer numero);

    /** SELECT ... FOR UPDATE: dos clientes que reservan la misma mesa a la vez se atienden en orden. */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select m from Mesa m where m.id = :id")
    java.util.Optional<Mesa> bloquear(@org.springframework.data.repository.query.Param("id") Long id);
}
