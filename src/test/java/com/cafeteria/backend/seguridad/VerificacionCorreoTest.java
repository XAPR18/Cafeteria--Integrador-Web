package com.cafeteria.backend.seguridad;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cafeteria.backend.correo.BuzonPruebas;
import com.cafeteria.backend.correo.Correo;
import com.cafeteria.backend.correo.CorreoServicio;
import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class VerificacionCorreoTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired CorreoServicio correo;
    @Autowired Clock reloj;

    private Cookie registrar(String email) throws Exception {
        mvc.perform(post("/api/auth/registro").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("nombre", "Ana Prueba", "email", email,
                        "clave", "Ana.Prueba!2026", "telefono", "987 654 321"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verificado").value(false))
                .andExpect(jsonPath("$.telefono").value("+51987654321"));
        return mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "clave", "Ana.Prueba!2026"))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("CAFE_TOKEN");
    }

    private String reserva(String fecha) throws Exception {
        return json.writeValueAsString(Map.of("fecha", fecha, "hora", "11:00", "personas", 2));
    }

    @Test
    void sinVerificarNoReservaYConElCodigoSi() throws Exception {
        String email = "ana-" + UUID.randomUUID() + "@cafe.test";
        Cookie sesion = registrar(email);
        String fecha = LocalDate.now(reloj).plusDays(6).toString();

        // sin verificar: no puede reservar
        mvc.perform(post("/api/reservas").cookie(sesion).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(reserva(fecha)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("Verifica tu correo")));

        String codigo = BuzonPruebas.codigoVerificacion(correo, email);
        String incorrecto = codigo.equals("000000") ? "111111" : "000000";
        mvc.perform(post("/api/auth/verificacion").cookie(sesion).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigo\":\"" + incorrecto + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("Te quedan 4 intentos")));
        mvc.perform(post("/api/auth/verificacion").cookie(sesion).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigo\":\"" + codigo + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.verificado").value(true));

        // verificado: reserva y recibe el correo con el código y el QR
        String r = mvc.perform(post("/api/reservas").cookie(sesion).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(reserva(fecha)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        JsonNode creada = json.readTree(r);
        String codigoReserva = creada.get("codigo").asText();
        assertThat(codigoReserva).matches("CC14-[A-Z2-9]{6}");
        Correo aviso = BuzonPruebas.esperar(correo, email, "Reserva registrada");
        assertThat(aviso.html()).contains(codigoReserva).contains("/api/catalogo/reservas/" + codigoReserva + "/qr.png")
                .contains("15 minutos");

        // el QR es una imagen PNG pública
        mvc.perform(get("/api/catalogo/reservas/" + codigoReserva + "/qr.png"))
                .andExpect(status().isOk()).andExpect(content().contentType(MediaType.IMAGE_PNG));

        // al confirmar el personal, llega el correo de confirmación
        Cookie admin = mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "admin@cafecatorce.local", "clave", "Cafe14.Local!2026"))))
                .andReturn().getResponse().getCookie("CAFE_TOKEN");
        mvc.perform(patch("/api/reservas/" + creada.get("id").asLong() + "/estado").cookie(admin).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"estado\":\"CONFIRMADA\"}"))
                .andExpect(status().isOk());
        BuzonPruebas.esperar(correo, email, "Reserva confirmada");
    }

    @Test
    void reenvioRespetaLaEsperaYCincoFallosBloqueanElCodigo() throws Exception {
        String email = "beto-" + UUID.randomUUID() + "@cafe.test";
        Cookie sesion = registrar(email);
        BuzonPruebas.codigoVerificacion(correo, email);
        mvc.perform(post("/api/auth/verificacion/reenviar").cookie(sesion).with(csrf()))
                .andExpect(status().isTooManyRequests());
        for (int i = 0; i < 4; i++) {
            mvc.perform(post("/api/auth/verificacion").cookie(sesion).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"codigo\":\"12345" + i + "x\"}")).andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/auth/verificacion").cookie(sesion).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"codigo\":\"999999x\"}")).andExpect(status().isTooManyRequests());
    }

    @Test
    void codigoQrRechazaTextoArbitrarioYVisitanteNoVerifica() throws Exception {
        mvc.perform(get("/api/catalogo/reservas/hola/qr.png")).andExpect(status().isNotFound());
        mvc.perform(post("/api/auth/verificacion").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"codigo\":\"123456\"}"))
                .andExpect(status().isUnauthorized());
    }
}
