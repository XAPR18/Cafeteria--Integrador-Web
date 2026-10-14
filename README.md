# Café Catorce

Publicación del sistema completo: [guía de Render y Supabase](docs/PUBLICAR-RENDER.md).

Avance de Desarrollo Web Integrado hasta el apartado 4.3. Un proyecto Spring Boot sirve la página pública, el panel y la API. Angular corresponde al apartado 4.4 y todavía no se incorpora.

## Ejecutar en Windows PowerShell

Requiere Java 21. Desde esta carpeta:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21.0.12'
.\mvnw.cmd spring-boot:run
```

- Cliente: http://localhost:8080/
- Administración: http://localhost:8080/admin/
- Swagger: http://localhost:8080/swagger-ui.html

## Demo local

El perfil predeterminado `local` utiliza H2 en un archivo dentro de `data/`; los cambios sobreviven al reinicio. H2 sirve para desarrollo y demostración, no confirma compatibilidad operativa con PostgreSQL.

Administrador inicial local: `admin@cafecatorce.local`, contraseña `Cafe14.Local!2026`. Son datos de demostración. Se crea solo cuando no existen cuentas. Cambiar las variables después no cambia una cuenta que ya está guardada.

Las migraciones Flyway crean las tablas y Hibernate valida el esquema. La clave de firma local es solo para demostración. No publicar este perfil en internet.

## Supabase PostgreSQL

Crear un proyecto en Supabase y obtener los datos desde Connect. Para un backend persistente en una red IPv4, utilizar Session pooler. No introducir claves de Supabase en el frontend. Configurar variables en la terminal, sin guardarlas en Git:

- SPRING_PROFILES_ACTIVE: `supabase`
- DB_URL: URL JDBC `jdbc:postgresql://HOST:5432/postgres?sslmode=require`
- DB_USER: usuario copiado de Connect
- DB_PASSWORD: contraseña de base de datos
- JWT_SECRET: secreto aleatorio de al menos 32 bytes
- ADMIN_EMAIL y ADMIN_PASSWORD: administrador inicial (contraseña de al menos 12 caracteres)

La aplicación usa el esquema `cafe`. Mantenerlo fuera de los esquemas expuestos por la Data API de Supabase. Flyway requiere permisos para crear tablas en ese esquema. La conexión remota no está verificada hasta disponer de un proyecto y credenciales.

## Seguridad

Spring Security valida JWT firmados y con vencimiento de 30 minutos. El navegador recibe una cookie HttpOnly y SameSite Strict; las operaciones de escritura requieren CSRF. La cookie es Secure cuando la petición usa HTTPS. No se guardan contraseñas sin cifrar: BCrypt.

- Catálogo público: GET /api/catalogo/secciones y /api/catalogo/productos.
- ADMIN: CRUD de secciones, productos, mesas; crear cuentas y activar/desactivar accesos.
- EMPLEADO: consultar mesas; su panel operativo corresponde a un avance posterior.
- CLIENTE: registro, login y perfil; reservas y compras todavía no están implementadas.

GET /api/auth/csrf obtiene el token CSRF; enviarlo como X-XSRF-TOKEN en POST/PUT/PATCH/DELETE. POST /api/auth/login establece la cookie; GET /api/auth/me consulta perfil; POST /api/auth/logout elimina la cookie. Cerrar sesión elimina la cookie del navegador; un JWT copiado permanece válido hasta vencer o desactivar la cuenta. No hay refresh tokens en este avance.

## Pruebas

```powershell
.\mvnw.cmd test
```

Pruebas originales de servicios y capa web más integración de JWT, permisos, BCrypt y CSRF. Las pruebas usan H2 aislada en memoria; no modifican la base de datos local ni Supabase. Los tests de controlador originales desactivan filtros para probar solo esa capa; SeguridadIntegracionTest mantiene los filtros reales.

## Alcance

Incluye catálogo, mesas, cuentas, persistencia y seguridad. Reservas, pedidos, pagos, promociones y estadísticas comerciales siguen pendientes. El catálogo no es un inventario de insumos. La sección de destacados es editorial, no un ranking de ventas.

Estructura: seccion/, producto/, mesa/ conservan modelos, servicios, DTOs e interfaces de repositorio. Los adaptadores JPA usan Spring Data. seguridad/ agrupa cuentas y autenticación. resources/static/ conserva el frontend HTML/CSS/JS.
