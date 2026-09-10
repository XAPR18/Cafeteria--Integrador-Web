package com.cafeteria.backend.common;

public class RecursoNoEncontradoException extends RuntimeException {
    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }

    public static RecursoNoEncontradoException de(String recurso, Object id) {
        return new RecursoNoEncontradoException("No se encontro " + recurso + " con id " + id);
    }
}
