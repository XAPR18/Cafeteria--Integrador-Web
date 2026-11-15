-- La base de datos debe rechazar lo que la API ya rechaza, aunque alguien escriba
-- directamente desde el panel de Supabase o desde otro cliente.

-- Valores permitidos (coinciden con los enum Rol, TipoMesa, ZonaMesa y EstadoMesa).
ALTER TABLE cuentas ADD CONSTRAINT ck_cuentas_rol CHECK (rol IN ('ADMIN', 'EMPLEADO', 'CLIENTE'));
ALTER TABLE cuentas ADD CONSTRAINT ck_cuentas_email_minusculas CHECK (email = LOWER(email));
ALTER TABLE mesas ADD CONSTRAINT ck_mesas_tipo CHECK (tipo IN ('DOS', 'CUATRO', 'EXTRA'));
ALTER TABLE mesas ADD CONSTRAINT ck_mesas_zona CHECK (zona IN ('INTERIOR', 'VEREDA', 'BARRA'));
ALTER TABLE mesas ADD CONSTRAINT ck_mesas_estado CHECK (estado IN ('DISPONIBLE', 'OCUPADA', 'RESERVADA'));
ALTER TABLE mesas ADD CONSTRAINT ck_mesas_numero CHECK (numero BETWEEN 1 AND 999);
ALTER TABLE secciones ADD CONSTRAINT ck_secciones_slug CHECK (slug = LOWER(slug));

-- Longitudes alineadas con las validaciones de los DTO (antes todo era VARCHAR(255)).
ALTER TABLE secciones ALTER COLUMN nombre SET DATA TYPE VARCHAR(60);
ALTER TABLE secciones ALTER COLUMN descripcion SET DATA TYPE VARCHAR(200);
ALTER TABLE productos ALTER COLUMN nombre SET DATA TYPE VARCHAR(80);
ALTER TABLE productos ALTER COLUMN descripcion SET DATA TYPE VARCHAR(250);
ALTER TABLE productos ALTER COLUMN etiqueta SET DATA TYPE VARCHAR(30);
ALTER TABLE mesas ALTER COLUMN tipo SET DATA TYPE VARCHAR(20);
ALTER TABLE mesas ALTER COLUMN zona SET DATA TYPE VARCHAR(20);
ALTER TABLE mesas ALTER COLUMN estado SET DATA TYPE VARCHAR(20);
ALTER TABLE cuentas ALTER COLUMN rol SET DATA TYPE VARCHAR(20);
