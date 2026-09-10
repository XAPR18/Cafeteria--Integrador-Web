package com.cafeteria.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConfiguracionOpenApi {
    @Bean
    public OpenAPI apiCafeteria() {
        return new OpenAPI().info(new Info()
                .title("API - Cafe Catorce")
                .description("Sistema web de gestion integral para una cafeteria. "
                        + "Primer avance: CRUD de Secciones, Productos y Mesas (datos en memoria, sin base de datos).")
                .version("v1 - Primer avance")
                .contact(new Contact().name("Equipo Cafe Catorce")));
    }
}
