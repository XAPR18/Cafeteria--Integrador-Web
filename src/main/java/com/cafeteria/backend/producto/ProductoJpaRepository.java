package com.cafeteria.backend.producto;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProductoJpaRepository extends JpaRepository<Producto, Long> {
    @org.springframework.data.jpa.repository.Query("select p from Producto p where p.seccionId = :seccionId order by p.id")
    java.util.List<Producto> findBySeccionIdOrderById(@org.springframework.data.repository.query.Param("seccionId") Long id);
    boolean existsBySeccionId(Long id);
}
