# Café Catorce — Primer Avance

**Sistema web de gestión integral para una cafetería.** Curso *Desarrollo Web Integrado*.
Backend con **Spring Boot**.

Todo vive en **un solo proyecto**: Spring Boot expone la API REST **y** sirve el frontend
(vista del cliente + panel de administrador) desde el mismo servidor y el mismo puerto.

## Cómo ejecutar (un solo comando)

Requiere **JDK 21**. Si tu `java` por defecto es otra versión, define `JAVA_HOME` al JDK 21:

```bash
# Windows (CMD/PowerShell)
set JAVA_HOME=C:\Program Files\Java\jdk-21.0.12
mvnw.cmd spring-boot:run

# Git Bash / Linux
export JAVA_HOME="/c/Program Files/Java/jdk-21.0.12"
./mvnw spring-boot:run
```

Luego abre en el navegador:

| URL | Qué es |
|---|---|
| `http://localhost:8080/` | **Vista del cliente** (página de la cafetería) |
| `http://localhost:8080/admin` | **Panel de administrador** (usuario `admin`, cualquier contraseña — es maqueta) |
| `http://localhost:8080/swagger-ui.html` | Documentación interactiva de la API |
| `http://localhost:8080/api/...` | API REST |

Al arrancar se cargan datos de ejemplo: **4 secciones, 17 productos, 10 mesas**.
No hay base de datos: los datos se reinician en cada arranque.

## API REST — CRUD en memoria

| Recurso | Endpoints |
|---|---|
| **Secciones** `/api/secciones` | `GET` · `GET /{id}` · `POST` · `PUT /{id}` · `DELETE /{id}` |
| **Productos** `/api/productos` | + `GET /api/productos?seccionId={id}` |
| **Mesas** `/api/mesas` | `tipo`: DOS/CUATRO/EXTRA · `zona`: INTERIOR/VEREDA/BARRA · `estado`: DISPONIBLE/OCUPADA/RESERVADA |

Respuestas de error uniformes (`momento`, `estado`, `mensaje`, `ruta`, `detalles[]`).
Se manejan: 404 (no encontrado), 400 (validación, regla de negocio, tipo de parámetro
inválido, JSON ilegible) y 500 (error inesperado, registrado en consola).

Colección Postman lista para importar: [`postman/Cafe14-PrimerAvance.postman_collection.json`](postman/Cafe14-PrimerAvance.postman_collection.json)

## Estructura

```
cafeteria-backend/
├── pom.xml                     Spring Boot 3.5.16 · Java 21 · Web · Validation · springdoc (Swagger)
├── postman/
└── src/main/
    ├── java/com/cafeteria/backend/
    │   ├── config/     ConfiguracionWeb (rutas /admin), ConfiguracionOpenApi (Swagger)
    │   ├── common/     Excepciones + ManejadorGlobalErrores + RespuestaError
    │   ├── seccion/    Seccion · Repositorio (interfaz) + EnMemoria · Servicio · Controlador · dto/
    │   ├── producto/   Producto · Repositorio (interfaz) + EnMemoria · Servicio · Controlador · dto/
    │   ├── mesa/       Mesa + enums · Repositorio (interfaz) + EnMemoria · Servicio · Controlador · dto/
    │   └── seed/       CargadorDatosIniciales (datos de ejemplo al arrancar)
    └── resources/
        ├── application.properties
        └── static/                 ← FRONTEND servido por Spring Boot
            ├── index.html          vista del cliente (menú dinámico desde la API)
            ├── login.html · registro.html
            ├── css/ · js/ · Image/ · comun/config.js
            └── admin/              panel de administración (tema oscuro)
```

**Arquitectura en capas:** `Controlador → Servicio → Repositorio (interfaz) → *EnMemoria`.
La persistencia está detrás de una interfaz, así que pasar a JPA/MySQL más adelante no toca
controladores ni servicios.

## Pendiente (siguientes avances)

- Pruebas unitarias (JUnit) de servicios y controladores.
- Documento/informe hasta el punto 2.4 + presentación de 8 min.
- Persistencia real (JPA/Hibernate + MySQL/PostgreSQL).
- Seguridad con Spring Security + JWT y roles (ADMIN, EMPLEADO, CLIENTE).
- Módulos de Reservas, Pedidos, Pagos (simulados) y Dashboard.
- Migración del frontend a **Angular** (proyecto aparte).
