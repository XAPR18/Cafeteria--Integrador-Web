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
        return new OpenAPI()
                .components(new io.swagger.v3.oas.models.Components()
                    .addSecuritySchemes("csrf", new io.swagger.v3.oas.models.security.SecurityScheme()
                        .type(io.swagger.v3.oas.models.security.SecurityScheme.Type.APIKEY)
                        .in(io.swagger.v3.oas.models.security.SecurityScheme.In.HEADER).name("X-XSRF-TOKEN")))
                .addSecurityItem(new io.swagger.v3.oas.models.security.SecurityRequirement().addList("csrf"))
                .info(new Info()
                .title("API - Cafe Catorce")
                .description("Sistema web de gestion integral para una cafeteria. "
                        + "Avance hasta 4.3: CRUD persistente, cuentas, JWT y roles.")
                .version("v2 - Backend y seguridad")
                .contact(new Contact().name("Equipo Cafe Catorce")));
    }
}
