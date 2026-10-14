package com.cafeteria.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ConfiguracionWeb implements WebMvcConfigurer {
    @Override
    public void addViewControllers(@NonNull ViewControllerRegistry registro) {
        registro.addRedirectViewController("/admin", "/admin/");
        registro.addViewController("/admin/").setViewName("forward:/admin/index.html");
        registro.addRedirectViewController("/empleado", "/empleado/");
        registro.addViewController("/empleado/").setViewName("forward:/empleado/index.html");
    }
}
