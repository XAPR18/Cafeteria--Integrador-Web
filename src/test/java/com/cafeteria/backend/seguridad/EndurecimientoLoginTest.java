package com.cafeteria.backend.seguridad;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@AutoConfigureMockMvc
class EndurecimientoLoginTest {
    @Autowired MockMvc mvc;
    @Autowired com.fasterxml.jackson.databind.ObjectMapper json;

    @Test
    void bloqueaTrasCincoFallosYNoAfectaAOtroCorreo() throws Exception {
        String cuerpo = json.writeValueAsString(Map.of("email", "fuerza-bruta@cafe.test", "clave", "incorrecta"));
        for (int i = 0; i < LimitadorIntentosLogin.MAX_FALLOS; i++) {
            mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(cuerpo))
            .andExpect(status().isTooManyRequests());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", "admin@cafecatorce.local", "clave", "Cafe14.Local!2026"))))
            .andExpect(status().isOk());
    }

    @Test
    void bloqueoCaducaTrasLaVentana() {
        Instant[] ahora = {Instant.parse("2026-11-14T10:00:00Z")};
        Clock reloj = new Clock() {
            public ZoneOffset getZone() { return ZoneOffset.UTC; }
            public Clock withZone(java.time.ZoneId z) { return this; }
            public Instant instant() { return ahora[0]; }
        };
        LimitadorIntentosLogin limitador = new LimitadorIntentosLogin(reloj);
        for (int i = 0; i < LimitadorIntentosLogin.MAX_FALLOS; i++) limitador.registrarFallo("a|ip");
        assertThatThrownBy(() -> limitador.verificar("a|ip")).isInstanceOf(ResponseStatusException.class);
        ahora[0] = ahora[0].plus(LimitadorIntentosLogin.VENTANA).plusSeconds(1);
        assertThatCode(() -> limitador.verificar("a|ip")).doesNotThrowAnyException();
    }

    @Test
    void tipoDeContenidoIncorrectoDevuelve415YNo500() throws Exception {
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.TEXT_PLAIN).content("x"))
            .andExpect(status().isUnsupportedMediaType());
    }
}
