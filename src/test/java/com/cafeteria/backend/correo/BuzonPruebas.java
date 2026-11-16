package com.cafeteria.backend.correo;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Lee los correos que la app "envió" a la consola durante las pruebas (el envío es asíncrono). */
public final class BuzonPruebas {
    private static final Pattern CODIGO = Pattern.compile("es: (\\d{6})");

    private BuzonPruebas() {
    }

    public static Correo esperar(CorreoServicio servicio, String para, String asuntoContiene) {
        ConsolaCorreo consola = (ConsolaCorreo) servicio;
        for (int i = 0; i < 100; i++) {
            Optional<Correo> c = consola.recientes().stream()
                    .filter(x -> x.para().equals(para) && x.asunto().contains(asuntoContiene)).findFirst();
            if (c.isPresent()) return c.get();
            try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }
        throw new AssertionError("No llegó el correo '" + asuntoContiene + "' a " + para);
    }

    public static String codigoVerificacion(CorreoServicio servicio, String para) {
        Matcher m = CODIGO.matcher(esperar(servicio, para, "código de verificación").textoPlano());
        if (!m.find()) throw new AssertionError("El correo no trae código");
        return m.group(1);
    }
}
