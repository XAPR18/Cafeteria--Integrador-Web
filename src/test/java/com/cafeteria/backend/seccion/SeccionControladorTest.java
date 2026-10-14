package com.cafeteria.backend.seccion;

import com.cafeteria.backend.common.RecursoNoEncontradoException;
import com.cafeteria.backend.seccion.dto.SeccionSolicitud;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SeccionControlador.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
@DisplayName("SeccionControlador - pruebas de la capa web (MockMvc)")
class SeccionControladorTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SeccionServicio servicio;

    @Test
    @DisplayName("GET /api/secciones devuelve 200 y la lista en JSON")
    void listar() throws Exception {
        when(servicio.listar()).thenReturn(java.util.List.of(
                new Seccion(1L, "Cafes de la Casa", "cafes", "desc", true)));

        mockMvc.perform(get("/api/secciones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].slug").value("cafes"));
    }

    @Test
    @DisplayName("GET /api/secciones/{id} inexistente devuelve 404 con mensaje")
    void obtenerInexistente() throws Exception {
        when(servicio.obtener(eq(99L)))
                .thenThrow(RecursoNoEncontradoException.de("la seccion", 99L));

        mockMvc.perform(get("/api/secciones/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.estado").value(404))
                .andExpect(jsonPath("$.mensaje").value("No se encontro la seccion con id 99"));
    }

    @Test
    @DisplayName("POST /api/secciones con datos validos devuelve 201")
    void crear() throws Exception {
        when(servicio.crear(any())).thenReturn(
                new Seccion(1L, "Bebidas Frias", "bebidas-frias", null, true));

        String body = objectMapper.writeValueAsString(
                new SeccionSolicitud("Bebidas Frias", "bebidas-frias", null, true));

        mockMvc.perform(post("/api/secciones").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.slug").value("bebidas-frias"));
    }

    @Test
    @DisplayName("POST /api/secciones con nombre vacio devuelve 400 (validacion)")
    void crearInvalido() throws Exception {
        String body = objectMapper.writeValueAsString(
                new SeccionSolicitud("", "", null, null));

        mockMvc.perform(post("/api/secciones").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.estado").value(400))
                .andExpect(jsonPath("$.detalles").isArray());
    }

    @Test
    @DisplayName("DELETE /api/secciones/{id} devuelve 204")
    void eliminar() throws Exception {
        mockMvc.perform(delete("/api/secciones/1"))
                .andExpect(status().isNoContent());
    }
}
