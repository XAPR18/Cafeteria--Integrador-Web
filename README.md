# Café Catorce

Sistema web de una cafetería de barrio: carta en línea, reservas de mesa, panel de administración y panel del equipo.

| Capa | Tecnología |
| --- | --- |
| Frontend | Angular 22 (componentes standalone, signals, routing con lazy loading, formularios reactivos) en `frontend/` |
| Backend | Spring Boot 3.5 · Java 21 · Spring Security con JWT en cookie HttpOnly · Swagger |
| Persistencia | JPA/Hibernate · Flyway · PostgreSQL en Supabase (H2 para desarrollo y pruebas) |
| Despliegue | Docker en Render (una sola imagen sirve Angular y la API) |

Publicación: [guía de Render y Supabase](docs/PUBLICAR-RENDER.md).

## Funcionalidades

**Sitio público** (`/`, `/carta`, `/reservar`, `/login`, `/registro`, `/mi-cuenta`)
- Carta en vivo con filtros por sección, búsqueda sin tildes y "solo disponibles".
- Reservas en 3 pasos: día y personas, turno con mesas libres en tiempo real, y mesa (o asignación automática). Si el visitante no tiene sesión, se guarda lo elegido y se recupera después del registro.
- Mi cuenta: próximas reservas, historial y cancelación.

**Panel ADMIN** (`/admin`): resumen con indicadores y gráfico semanal, reservas (confirmar, llegó, no vino, cancelar), mesas por zona con cambio de estado en un clic, productos (con galería de imágenes y disponibilidad rápida), secciones (slug automático) y cuentas del equipo.

**Panel EMPLEADO** (`/empleado`): reservas del día y sala. Sin acceso a carta, precios ni cuentas.

### Reglas de reservas
- Horario: lunes a viernes 07:00–20:30; sábados y domingos 08:00–21:00. Turnos cada 30 minutos, de 90 minutos cada uno, terminando antes del cierre.
- Hasta 30 días de anticipación, de 1 a 20 personas, y la capacidad de la mesa debe alcanzar.
- Una mesa no admite reservas que se crucen. Se bloquea la fila con `SELECT … FOR UPDATE` para que dos clientes no tomen la misma mesa a la vez.
- Máximo 3 reservas activas por cliente y ninguna que se cruce con otra suya.
- Estados: PENDIENTE → CONFIRMADA → COMPLETADA o NO_ASISTIO. Se puede cancelar mientras está pendiente o confirmada.
- Todas las fechas se calculan en la hora de Lima (`app.zona-horaria`), aunque el servidor esté en UTC.

## Ejecutar en Windows

Requiere Java 21 y Node.js 24.15 o superior.

**Con Supabase:** compila Angular y arranca la API. Pide la contraseña de la base sin guardarla.

```powershell
powershell -ExecutionPolicy Bypass -File .\iniciar-supabase.ps1
```

**Demo local con H2**, sin internet:

```powershell
cd frontend; npm ci; npx ng build; cd ..
.\mvnw.cmd spring-boot:run
```

Abre http://localhost:8080. El administrador local de demostración está definido en `application-local.properties`. El perfil `local` solo escucha en `127.0.0.1` porque su clave JWT y su administrador son públicos.

**Desarrollo del frontend con recarga automática:** con la API corriendo en 8080, ejecuta:

```powershell
cd frontend; npm start
```

Se abre en http://localhost:4200 y `/api` se reenvía a 8080 mediante `proxy.conf.json`.

## Estructura

```
frontend/src/app/
  core/          modelos (contratos de la API), ApiService, AuthService, interceptores CSRF y de sesión, guards por rol
  compartido/    modal, confirmación, avisos, mensajes de validación, validadores, tarjeta de producto
  sitio/         inicio, carta, reservar, mi-cuenta, login, registro
  panel/         layout con menú lateral; resumen, reservas, mesas, productos, secciones, cuentas
src/main/java/com/cafeteria/backend/
  catalogo/      carta pública y disponibilidad de reservas
  reserva/       entidad, reglas de horario, servicio con bloqueo de mesa, controlador
  seccion/ producto/ mesa/   CRUD con servicios, DTO y repositorios JPA
  seguridad/     cuentas, roles, JWT, CSRF y limitador de intentos de login
src/main/resources/db/migration/   V1 tablas · V2 restricciones · V3 reservas
src/main/resources/db/supabase/    afterMigrate.sql: RLS y bloqueo de la Data API (solo Supabase)
```

`src/main/resources/static/` lo genera `ng build` y no se versiona.

## Seguridad

- **JWT** firmado (HS256, 30 minutos) en la cookie `CAFE_TOKEN` (HttpOnly, SameSite=Strict, Secure en HTTPS). En cada petición se revalida en la base que la cuenta siga activa y conserve su rol.
- **CSRF** con la cookie `XSRF-TOKEN` y la cabecera `X-XSRF-TOKEN`. La envía el interceptor de Angular.
- **BCrypt** para las contraseñas, con un límite de 5 intentos fallidos por correo e IP cada 15 minutos.
- **Supabase:** el esquema `cafe` no está expuesto en la Data API, todas las tablas tienen RLS y los roles `anon` y `authenticated` no tienen permisos.

| Ruta | Acceso |
| --- | --- |
| `GET /api/catalogo/**` (carta, agenda, mesas libres) | Público |
| `POST /api/reservas`, `GET /api/reservas/mias`, `PATCH /api/reservas/{id}/cancelar` | CLIENTE |
| `GET /api/reservas`, `PATCH /api/reservas/{id}/estado`, `GET /api/mesas`, `PATCH /api/mesas/{id}/estado` | ADMIN, EMPLEADO |
| Resto de `/api/**` (CRUD, cuentas) | ADMIN |

## Pruebas

```powershell
.\mvnw.cmd test
```

55 pruebas: servicios, capa web, persistencia JPA, JWT y permisos, CSRF, límite de intentos y reglas de reservas. Usan H2 en memoria y nunca tocan Supabase. La prueba de rutas de Angular se omite si el frontend no está compilado.
