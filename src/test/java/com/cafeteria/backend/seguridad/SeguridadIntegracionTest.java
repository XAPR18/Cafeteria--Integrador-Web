package com.cafeteria.backend.seguridad;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import jakarta.servlet.http.Cookie;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.assertj.core.api.Assertions.assertThat;
@SpringBootTest @AutoConfigureMockMvc
class SeguridadIntegracionTest {
 @Autowired MockMvc mvc;
 @Autowired com.fasterxml.jackson.databind.ObjectMapper json;
 @Autowired CuentaRepositorio cuentas;
 @Test void rutaEmpleadoResuelvePagina() throws Exception {
  mvc.perform(get("/empleado/")).andExpect(status().isOk()).andExpect(forwardedUrl("/empleado/index.html"));
  mvc.perform(get("/empleado")).andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/empleado/"));
  mvc.perform(get("/empleado/index.html")).andExpect(status().isOk());
 }
 @Test void catalogoEsPublico() throws Exception {mvc.perform(get("/api/catalogo/productos")).andExpect(status().isOk());}
 @Test void catalogoAdministrativoRequiereLogin() throws Exception {mvc.perform(get("/api/productos")).andExpect(status().isUnauthorized());}
 @Test void loginRechazaClaveIncorrecta() throws Exception {
  mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("email","admin@cafecatorce.local","clave","incorrecta")))).andExpect(status().isUnauthorized());
 }
 @Test void loginEmiteCookieYAutorizaCrud() throws Exception {
  var res=mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("email","admin@cafecatorce.local","clave","Cafe14.Local!2026")))).andExpect(status().isOk()).andReturn().getResponse();
  Cookie cookie=res.getCookie("CAFE_TOKEN");assertThat(cookie).isNotNull();assertThat(cookie.isHttpOnly()).isTrue();
  mvc.perform(get("/api/productos").cookie(cookie)).andExpect(status().isOk());
 }
 @Test void empleadoNoPuedeModificarCatalogo() throws Exception {
  mvc.perform(post("/api/productos").with(user("empleado").roles("EMPLEADO")).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
 }
 @Test void solicitudesSinCsrfSonRechazadas() throws Exception {
  mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
 }
 @Test void claveAdminSeGuardaComoHash() {assertThat(cuentas.findByEmail("admin@cafecatorce.local").orElseThrow().getClaveHash()).startsWith("$2");}
 @Test void cuentaDesactivadaInvalidaJwt() throws Exception {
  Cuenta c=cuentas.saveAndFlush(new Cuenta("Cliente prueba","cliente-desactivado@cafe.test",new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("Prueba.Cliente!2026"),"CLIENTE"));
  var respuesta=mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of("email",c.getEmail(),"clave","Prueba.Cliente!2026")))).andExpect(status().isOk()).andReturn().getResponse();
  c.setActiva(false);cuentas.saveAndFlush(c);
  mvc.perform(get("/api/auth/me").cookie(respuesta.getCookie("CAFE_TOKEN"))).andExpect(status().isUnauthorized());
 }
 @Test void clienteNoPuedeCrearAccesoAdmin() throws Exception {
  mvc.perform(post("/api/cuentas").with(user("cliente").roles("CLIENTE")).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
 }

 @Test void cookieInvalidaNoBloqueaCatalogoNiLogin() throws Exception {
  Cookie invalida = new Cookie("CAFE_TOKEN", "token-invalido");
  mvc.perform(get("/api/catalogo/productos").cookie(invalida)).andExpect(status().isOk());
  mvc.perform(get("/admin/").cookie(invalida)).andExpect(status().isOk());
  mvc.perform(post("/api/auth/login").cookie(invalida).with(csrf()).contentType(MediaType.APPLICATION_JSON)
    .content(json.writeValueAsString(java.util.Map.of("email", "admin@cafecatorce.local", "clave", "Cafe14.Local!2026"))))
    .andExpect(status().isOk());
 }

 @Test void cookieInvalidaPermiteCerrarSesion() throws Exception {
  var res = mvc.perform(post("/api/auth/logout").cookie(new Cookie("CAFE_TOKEN", "token-invalido")).with(csrf()))
    .andExpect(status().isNoContent()).andReturn().getResponse();
  assertThat(res.getCookie("CAFE_TOKEN").getMaxAge()).isZero();
 }

 private Cookie ingresar(String email, String clave) throws Exception {
  return mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
    .content(json.writeValueAsString(java.util.Map.of("email", email, "clave", clave))))
    .andExpect(status().isOk()).andReturn().getResponse().getCookie("CAFE_TOKEN");
 }

 @Test void empleadoRealConsultaMesasSinAccederAlCrudAdministrativo() throws Exception {
  Cookie admin = ingresar("admin@cafecatorce.local", "Cafe14.Local!2026");
  var datos = java.util.Map.of("nombre", "Empleado integrado", "email", "empleado-integrado@cafe.test", "clave", "Empleado.Prueba!2026", "rol", "EMPLEADO");
  mvc.perform(post("/api/cuentas").cookie(admin).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(datos)))
    .andExpect(status().isCreated()).andExpect(jsonPath("$.rol").value("EMPLEADO")).andExpect(jsonPath("$.claveHash").doesNotExist());
  Cookie empleado = ingresar("empleado-integrado@cafe.test", "Empleado.Prueba!2026");
  mvc.perform(get("/api/mesas").cookie(empleado)).andExpect(status().isOk());
  mvc.perform(get("/api/productos").cookie(empleado)).andExpect(status().isForbidden());
  mvc.perform(get("/api/cuentas").cookie(empleado)).andExpect(status().isForbidden());
  mvc.perform(post("/api/mesas").cookie(empleado).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
    .andExpect(status().isForbidden());
 }

 @Test void administradorDesactivaEmpleadoYRevocaSuAcceso() throws Exception {
  Cookie admin = ingresar("admin@cafecatorce.local", "Cafe14.Local!2026");
  var datos = java.util.Map.of("nombre", "Empleado desactivable", "email", "empleado-estado@cafe.test", "clave", "Empleado.Estado!2026", "rol", "EMPLEADO");
  var creada = mvc.perform(post("/api/cuentas").cookie(admin).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(datos)))
    .andExpect(status().isCreated()).andReturn().getResponse();
  long id = json.readTree(creada.getContentAsString()).get("id").asLong();
  Cookie empleado = ingresar("empleado-estado@cafe.test", "Empleado.Estado!2026");
  mvc.perform(patch("/api/cuentas/" + id + "/estado").cookie(admin).with(csrf()).contentType(MediaType.APPLICATION_JSON)
    .content(json.writeValueAsString(java.util.Map.of("activa", false)))).andExpect(status().isOk());
  mvc.perform(get("/api/mesas").cookie(empleado)).andExpect(status().isUnauthorized());
  mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
    .content(json.writeValueAsString(java.util.Map.of("email", "empleado-estado@cafe.test", "clave", "Empleado.Estado!2026"))))
    .andExpect(status().isUnauthorized());
  mvc.perform(patch("/api/cuentas/" + id + "/estado").cookie(admin).with(csrf()).contentType(MediaType.APPLICATION_JSON)
    .content(json.writeValueAsString(java.util.Map.of("activa", true)))).andExpect(status().isOk());
  ingresar("empleado-estado@cafe.test", "Empleado.Estado!2026");
 }

 @Test void adminNoPuedeDesactivarseASiMismo() throws Exception {
  Cookie admin = ingresar("admin@cafecatorce.local", "Cafe14.Local!2026");
  Long id = cuentas.findByEmail("admin@cafecatorce.local").orElseThrow().getId();
  mvc.perform(patch("/api/cuentas/" + id + "/estado").cookie(admin).with(csrf()).contentType(MediaType.APPLICATION_JSON)
    .content(json.writeValueAsString(java.util.Map.of("activa", false)))).andExpect(status().isConflict());
  assertThat(cuentas.findById(id).orElseThrow().isActiva()).isTrue();
 }

 @Test void registroPublicoNoPermiteEscogerRolAdmin() throws Exception {
  mvc.perform(post("/api/auth/registro").with(csrf()).contentType(MediaType.APPLICATION_JSON)
    .content(json.writeValueAsString(java.util.Map.of("nombre", "Cliente publico", "email", "cliente-publico@cafe.test", "clave", "Cliente.Publico!2026", "rol", "ADMIN"))))
    .andExpect(status().isCreated()).andExpect(jsonPath("$.rol").value("CLIENTE"));
 }
}
