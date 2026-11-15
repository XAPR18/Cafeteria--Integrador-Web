package com.cafeteria.backend.config;

import java.io.IOException;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Sirve la aplicacion Angular compilada (classpath:/static/). Las rutas del frontend como
 * /reservar o /admin/mesas no son archivos: se responde index.html y Angular Router decide.
 * Las rutas /api/** nunca caen aqui y siguen devolviendo JSON (o 404 en JSON).
 */
@Configuration
public class ConfiguracionWeb implements WebMvcConfigurer {
    private static final Resource INDEX = new ClassPathResource("/static/index.html");

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registro) {
        registro.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(@NonNull String ruta, @NonNull Resource ubicacion) throws IOException {
                        Resource recurso = ubicacion.createRelative(ruta);
                        if (recurso.exists() && recurso.isReadable()) {
                            return recurso;
                        }
                        boolean esRutaDelFrontend = !ruta.startsWith("api/") && !ruta.contains(".");
                        return esRutaDelFrontend && INDEX.exists() ? INDEX : null;
                    }
                });
    }
}
