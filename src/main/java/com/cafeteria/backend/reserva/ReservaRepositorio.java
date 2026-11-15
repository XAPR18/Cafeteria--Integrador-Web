package com.cafeteria.backend.reserva;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservaRepositorio extends JpaRepository<Reserva, Long> {

    /** Reservas activas de un dia: base para calcular disponibilidad sin una consulta por mesa. */
    @Query("select r from Reserva r join fetch r.mesa where r.fecha = :fecha and r.estado in :estados")
    List<Reserva> delDia(@Param("fecha") LocalDate fecha, @Param("estados") Collection<EstadoReserva> estados);

    @Query("""
            select count(r) > 0 from Reserva r
            where r.mesa.id = :mesaId and r.fecha = :fecha and r.estado in :estados
              and r.horaInicio < :fin and r.horaFin > :inicio""")
    boolean mesaOcupada(@Param("mesaId") Long mesaId, @Param("fecha") LocalDate fecha,
                        @Param("inicio") LocalTime inicio, @Param("fin") LocalTime fin,
                        @Param("estados") Collection<EstadoReserva> estados);

    @Query("""
            select count(r) > 0 from Reserva r
            where r.cuenta.id = :cuentaId and r.fecha = :fecha and r.estado in :estados
              and r.horaInicio < :fin and r.horaFin > :inicio""")
    boolean clienteConCruce(@Param("cuentaId") Long cuentaId, @Param("fecha") LocalDate fecha,
                            @Param("inicio") LocalTime inicio, @Param("fin") LocalTime fin,
                            @Param("estados") Collection<EstadoReserva> estados);

    long countByCuentaIdAndEstadoInAndFechaGreaterThanEqual(Long cuentaId, Collection<EstadoReserva> estados,
                                                            LocalDate desde);

    @Query("""
            select r from Reserva r join fetch r.mesa join fetch r.cuenta
            where r.cuenta.email = :email order by r.fecha desc, r.horaInicio desc""")
    List<Reserva> deCliente(@Param("email") String email);

    @Query("""
            select r from Reserva r join fetch r.mesa join fetch r.cuenta
            where r.fecha between :desde and :hasta order by r.fecha, r.horaInicio, r.mesa.numero""")
    List<Reserva> entre(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query("select count(r) > 0 from Reserva r where r.mesa.id = :mesaId and r.fecha >= :desde and r.estado in :estados")
    boolean mesaTieneReservasFuturas(@Param("mesaId") Long mesaId, @Param("desde") LocalDate desde,
                                     @Param("estados") Collection<EstadoReserva> estados);

    boolean existsByMesaId(Long mesaId);
}
