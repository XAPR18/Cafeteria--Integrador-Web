package com.cafeteria.backend.correo;

import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Sin clave de Brevo, los correos no salen: se escriben en la consola (con el código de verificación)
 * para poder probar el flujo en local. También guarda los últimos para las pruebas automáticas.
 */
public class ConsolaCorreo implements CorreoServicio {
    private static final Logger log = LoggerFactory.getLogger(ConsolaCorreo.class);
    private final Deque<Correo> recientes = new ConcurrentLinkedDeque<>();

    @Override
    public void enviar(Correo correo) {
        recientes.addFirst(correo);
        while (recientes.size() > 50) recientes.removeLast();
        log.info("""

                ===== CORREO (modo consola: configura BREVO_API_KEY para enviarlo de verdad) =====
                Para: {} <{}>
                Asunto: {}
                {}
                ==================================================================================""",
                correo.nombre(), correo.para(), correo.asunto(), correo.textoPlano());
    }

    public List<Correo> recientes() {
        return new ArrayList<>(recientes);
    }
}
