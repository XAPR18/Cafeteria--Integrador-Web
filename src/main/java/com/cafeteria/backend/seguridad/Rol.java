package com.cafeteria.backend.seguridad;

/** Roles del sistema. El nombre se guarda tal cual en cuentas.rol y viaja en el claim "rol" del JWT. */
public enum Rol {
    ADMIN,
    EMPLEADO,
    CLIENTE
}
