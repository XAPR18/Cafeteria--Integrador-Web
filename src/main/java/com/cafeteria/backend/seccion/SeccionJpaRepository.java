package com.cafeteria.backend.seccion;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SeccionJpaRepository extends JpaRepository<Seccion, Long> {
    boolean existsBySlugIgnoreCase(String slug);
}
