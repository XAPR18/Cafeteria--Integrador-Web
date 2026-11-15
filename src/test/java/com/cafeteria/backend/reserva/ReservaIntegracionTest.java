package com.cafeteria.backend.reserva;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ReservaIntegracionTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired Clock reloj;

    private String fecha(int diasDespues) {
        return LocalDate.now(reloj).plusDays(diasDespues).toString();
    }

    private Cookie clienteNuevo() throws Exception {
        String email = "cliente-" + UUID.randomUUID() + "@cafe.test";
        mvc.perform(post("/api/auth/registro").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("nombre", "Cliente reservas", "email", email, "clave", "Cliente.Reserva!2026"))))
                .andExpect(status().isCreated());
        return login(email, "Cliente.Reserva!2026");
    }

    private Cookie login(String email, String clave) throws Exception {
        return mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "clave", clave))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("CAFE_TOKEN");
    }

    private Cookie admin() throws Exception {
        return login("admin@cafecatorce.local", "Cafe14.Local!2026");
    }

    private JsonNode reservar(Cookie cliente, String fecha, String hora, int personas, Long mesaId, int esperado) throws Exception {
        Map<String, Object> cuerpo = new HashMap<>(Map.of("fecha", fecha, "hora", hora, "personas", personas));
        if (mesaId != null) cuerpo.put("mesaId", mesaId);
        String r = mvc.perform(post("/api/reservas").cookie(cliente).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(cuerpo)))
                .andExpect(status().is(esperado)).andReturn().getResponse().getContentAsString();
        return json.readTree(r);
    }

    @Test
    void agendaPublicaYReservaCompletaDelCliente() throws Exception {
        mvc.perform(get("/api/catalogo/agenda").param("fecha", fecha(3)).param("personas", "2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.duracionMinutos").value(90));

        Cookie cliente = clienteNuevo();
        JsonNode creada = reservar(cliente, fecha(3), "10:00", 2, null, 201);
        org.assertj.core.api.Assertions.assertThat(creada.get("estado").asText()).isEqualTo("PENDIENTE");
        org.assertj.core.api.Assertions.assertThat(creada.get("horaFin").asText()).isEqualTo("11:30");
        org.assertj.core.api.Assertions.assertThat(creada.get("mesaCapacidad").asInt()).isGreaterThanOrEqualTo(2);
        long mesaId = creada.get("mesaId").asLong();

        // otro cliente no puede tomar la misma mesa en un horario que se cruza
        reservar(clienteNuevo(), fecha(3), "10:30", 2, mesaId, 400);
        // pero si una hora despues de que termine
        reservar(clienteNuevo(), fecha(3), "11:30", 2, mesaId, 201);

        mvc.perform(get("/api/reservas/mias").cookie(cliente)).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(patch("/api/reservas/" + creada.get("id").asLong() + "/cancelar").cookie(cliente).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("CANCELADA"));
        // cancelada, la mesa vuelve a quedar libre
        reservar(clienteNuevo(), fecha(3), "09:30", 2, mesaId, 201);
    }

    @Test
    void reglasDeHorarioYCapacidad() throws Exception {
        Cookie cliente = clienteNuevo();
        reservar(cliente, fecha(-1), "10:00", 2, null, 400);   // fecha pasada
        reservar(cliente, fecha(40), "10:00", 2, null, 400);   // demasiado lejos
        reservar(cliente, fecha(4), "10:15", 2, null, 400);    // no es un turno
        reservar(cliente, fecha(4), "23:00", 2, null, 400);    // fuera de horario
        reservar(cliente, fecha(4), "10:00", 21, null, 400);   // mas de 20 personas (validacion)
        JsonNode chica = reservar(cliente, fecha(4), "12:00", 1, null, 201);
        reservar(clienteNuevo(), fecha(4), "15:00", 20, chica.get("mesaId").asLong(), 400); // no entra el grupo
    }

    @Test
    void elPersonalGestionaYElClienteNoVeReservasAjenas() throws Exception {
        Cookie cliente = clienteNuevo();
        long id = reservar(cliente, fecha(5), "16:00", 2, null, 201).get("id").asLong();

        mvc.perform(get("/api/reservas").cookie(cliente)).andExpect(status().isForbidden());
        Cookie admin = admin();
        mvc.perform(get("/api/reservas").param("desde", fecha(5)).cookie(admin)).andExpect(status().isOk());

        mvc.perform(patch("/api/reservas/" + id + "/estado").cookie(admin).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"estado\":\"COMPLETADA\"}")).andExpect(status().isBadRequest()); // PENDIENTE no pasa a COMPLETADA
        mvc.perform(patch("/api/reservas/" + id + "/estado").cookie(admin).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"estado\":\"CONFIRMADA\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("CONFIRMADA"));

        // otro cliente no puede cancelar una reserva ajena
        mvc.perform(patch("/api/reservas/" + id + "/cancelar").cookie(clienteNuevo()).with(csrf())).andExpect(status().isNotFound());
        // el personal no reserva como cliente
        mvc.perform(post("/api/reservas").cookie(admin).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("fecha", fecha(5), "hora", "16:00", "personas", 2))))
                .andExpect(status().isForbidden());
    }

    @Test
    void sesionPublicaNoDevuelveErrorParaVisitantes() throws Exception {
        mvc.perform(get("/api/auth/sesion")).andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/sesion").cookie(admin())).andExpect(status().isOk()).andExpect(jsonPath("$.rol").value("ADMIN"));
    }
}
