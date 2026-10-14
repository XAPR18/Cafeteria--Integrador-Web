# Publicar Café Catorce en Render

La página HTML, los paneles y la API se ejecutan juntos. PostgreSQL continúa en Supabase. No es necesario instalar Docker en Windows para desplegar desde GitHub.

## Configurar el servicio

1. Subir a GitHub la versión actual del proyecto, incluido `Dockerfile`.
2. Entrar en https://dashboard.render.com con la cuenta de GitHub que tiene acceso al repositorio.
3. Elegir **New → Web Service → Git Provider** y conectar `pisfilromero223-hue/Cafeteria--Integrador-Web`.
4. Configurar:

| Campo | Valor |
| --- | --- |
| Name | `cafe-catorce` o un nombre disponible |
| Branch | `main` |
| Root Directory | Vacío si `pom.xml` y `Dockerfile` están en la raíz del repositorio |
| Language | `Docker` |
| Dockerfile Path | `./Dockerfile` |
| Docker Command | Vacío; se usa el comando de la imagen |
| Instance Type | `Free`, si aparece disponible |
| Health Check Path | `/api/catalogo/secciones` |

Si el repositorio remoto contiene una carpeta contenedora, seleccionar como Root Directory la carpeta que contiene `pom.xml` y `Dockerfile`. El repositorio local de este proyecto tiene esos archivos en su raíz.

## Variables de entorno

Introducir estos valores en **Environment** de Render. Las contraseñas no se guardan en archivos del repositorio ni se envían por chat.

| Variable | Valor |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `supabase,render` |
| `DB_URL` | `jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require` |
| `DB_USER` | `postgres.hnavlkmulzvxdesgcmrj` |
| `DB_PASSWORD` | Contraseña de la base de datos de Supabase; no es la del administrador de Café Catorce |
| `JWT_SECRET` | Secreto aleatorio estable de al menos 32 bytes; usar Generate si Render ofrece esa opción |

El perfil `render` toma el puerto de la plataforma y reconoce HTTPS detrás de su proxy. El perfil `supabase` conecta con PostgreSQL. La imagen activa ambos perfiles por defecto. No publicar el perfil `local`.

Las cuentas existentes se conservan: **no se necesita crear de nuevo al administrador**. `ADMIN_EMAIL` y `ADMIN_PASSWORD` solo son necesarias para una base sin cuentas; en ese caso definir una contraseña de al menos 12 caracteres. Cambiar esas variables no modifica una cuenta que ya existe.

Guardar `JWT_SECRET` en Render y conservarlo entre despliegues. No copiar la clave de demostración del perfil local. Usar una clave distinta de la local hará necesario iniciar sesión de nuevo.

## Publicar y comprobar

1. Pulsar **Create Web Service**. Render construirá la imagen con Java 21.
2. Esperar a que el servicio muestre **Live** y copiar la dirección HTTPS asignada.
3. Abrir `/` y comprobar la carta.
4. Abrir `/admin/`, iniciar sesión con una cuenta ADMIN existente y comprobar consultas.
5. Iniciar sesión con EMPLEADO y comprobar que abre `/empleado/` y solo consulta mesas.
6. Comprobar una edición de un registro de prueba y su persistencia en Supabase.
7. Verificar en el navegador que la cookie `CAFE_TOKEN` tiene `HttpOnly`, `Secure` y `SameSite=Strict`.
8. Comprobar `/swagger-ui.html` y que las operaciones administrativas siguen exigiendo permisos.

Compartir la dirección pública de la carta. Cada compañero que necesite acceso interno debe usar su propia cuenta; las modificaciones se guardan en la misma base Supabase.

## Comportamiento del plan gratuito

Render puede suspender el servicio tras 15 minutos sin actividad. La primera visita posterior puede tardar alrededor de un minuto mientras se inicia. La base permanece en Supabase y los datos no dependen del disco temporal del contenedor. Revisar las condiciones vigentes antes de seleccionar un plan de pago.

## Validación local y límites

Ejecutar `./mvnw.cmd clean verify` con Java 21 antes de subir cambios. Las pruebas utilizan H2 en memoria y no modifican Supabase. La construcción Docker debe comprobarse en Render si no se dispone de Docker localmente. No considerar completada la publicación hasta verificar la dirección pública y el login por HTTPS.

Fuentes: https://render.com/docs/docker, https://render.com/docs/web-services, https://render.com/docs/free y https://docs.spring.io/spring-boot/how-to/webserver.html.
