package com.cafeteria.backend.reserva;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cafeteria.backend.correo.BuzonPruebas;
import com.cafeteria.backend.correo.CorreoServicio;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AvisosPersonalTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired CorreoServicio correo;
    @Autowired Clock reloj;

    private Cookie login(String email, String clave) throws Exception {
        return mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "clave", clave))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("CAFE_TOKEN");
    }

    private Cookie clienteVerificado() throws Exception {
        String email = "aviso-" + UUID.randomUUID() + "@cafe.test";
        mvc.perform(post("/api/auth/registro").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("nombre", "Carla Aviso", "email", email, "clave", "Carla.Aviso!2026"))))
                .andExpect(status().isCreated());
        Cookie sesion = login(email, "Carla.Aviso!2026");
        mvc.perform(post("/api/auth/verificacion").cookie(sesion).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigo\":\"" + BuzonPruebas.codigoVerificacion(correo, email) + "\"}"))
                .andExpect(status().isOk());
        return sesion;
    }

    @Test
    void elPersonalRecibeAvisoDeReservaNuevaYCanceladaPeroElClienteNoPuedeEscuchar() throws Exception {
        Cookie cliente = clienteVerificado();
        mvc.perform(get("/api/reservas/avisos").cookie(cliente)).andExpect(status().isForbidden());
        mvc.perform(get("/api/reservas/avisos")).andExpect(status().isUnauthorized());

        Cookie admin = login("admin@cafecatorce.local", "Cafe14.Local!2026");
        MockHttpServletResponse flujo = mvc.perform(get("/api/reservas/avisos").cookie(admin))
                .andExpect(request().asyncStarted()).andReturn().getResponse();
        assertThat(flujo.getContentAsString()).contains("event:conectado");

        String fecha = LocalDate.now(reloj).plusDays(9).toString();
        String r = mvc.perform(post("/api/reservas").cookie(cliente).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("fecha", fecha, "hora", "12:30", "personas", 2))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        String codigo = json.readTree(r).get("codigo").asText();
        long id = json.readTree(r).get("id").asLong();

        assertThat(flujo.getContentAsString()).contains("event:reserva").contains("\"tipo\":\"NUEVA\"")
                .contains(codigo).contains("Carla Aviso");

        mvc.perform(patch("/api/reservas/" + id + "/cancelar").cookie(cliente).with(csrf())).andExpect(status().isOk());
        assertThat(flujo.getContentAsString()).contains("\"tipo\":\"CANCELADA_POR_CLIENTE\"");
    }
}
