package com.cafeteria.backend.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Reloj en la zona horaria del local. Render y Supabase trabajan en UTC: sin esto,
 * "hoy" y "ahora" serian 5 horas distintos a los de Lima al validar reservas.
 */
@Configuration
public class ConfiguracionTiempo {
    @Bean
    Clock reloj(@Value("${app.zona-horaria:America/Lima}") String zona) {
        return Clock.system(ZoneId.of(zona));
    }
}
