package com.cafeteria.backend.common;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

@RestControllerAdvice
public class ManejadorGlobalErrores {
    private static final Logger log = LoggerFactory.getLogger(ManejadorGlobalErrores.class);

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<RespuestaError> noEncontrado(RecursoNoEncontradoException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                RespuestaError.de(404, "Not Found", ex.getMessage(), req.getRequestURI()));
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<RespuestaError> reglaNegocio(ReglaNegocioException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                RespuestaError.de(400, "Bad Request", ex.getMessage(), req.getRequestURI()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<RespuestaError> cuerpoIlegible(HttpMessageNotReadableException ex, HttpServletRequest req) {
        String mensaje = "El cuerpo de la solicitud no se pudo leer o tiene un valor no permitido "
                + "(revisa los tipos y los valores de enum).";
        return ResponseEntity.badRequest().body(
                RespuestaError.de(400, "Bad Request", mensaje, req.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<RespuestaError> tipoParametroInvalido(MethodArgumentTypeMismatchException ex,
                                                                HttpServletRequest req) {
        String tipoEsperado = ex.getRequiredType() == null ? "valido" : ex.getRequiredType().getSimpleName();
        String mensaje = "El parametro '" + ex.getName() + "' con valor '" + ex.getValue()
                + "' no es un " + tipoEsperado + " valido.";
        return ResponseEntity.badRequest().body(
                RespuestaError.de(400, "Bad Request", mensaje, req.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<RespuestaError> validacion(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> detalles = ex.getBindingResult().getFieldErrors().stream()
                .map(this::describirCampo)
                .toList();
        return ResponseEntity.badRequest().body(RespuestaError.de(
                400, "Bad Request", "La solicitud contiene datos invalidos", req.getRequestURI(), detalles));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<RespuestaError> rutaNoEncontrada(NoResourceFoundException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(RespuestaError.de(
                404, "Not Found", "Ruta no encontrada: " + req.getRequestURI(), req.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<RespuestaError> errorInesperado(Exception ex, HttpServletRequest req) {
        log.error("Error inesperado en {}", req.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(RespuestaError.de(
                500, "Internal Server Error",
                "Ocurrio un error inesperado en el servidor. Revisa la consola del backend.",
                req.getRequestURI()));
    }

    private String describirCampo(FieldError error) {
        return error.getField() + ": " + error.getDefaultMessage();
    }
}
