-- Verificación de correo de los clientes y código único de cada reserva (para el QR).

-- Las cuentas que ya existen quedan verificadas: así nadie pierde acceso con este cambio.
-- Las nuevas cuentas de cliente se crean sin verificar desde el código Java.
ALTER TABLE cuentas ADD COLUMN email_verificado BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE cuentas ADD COLUMN telefono VARCHAR(20);
-- Código de verificación: solo se guarda su hash SHA-256, nunca el código en claro.
ALTER TABLE cuentas ADD COLUMN verificacion_hash VARCHAR(64);
ALTER TABLE cuentas ADD COLUMN verificacion_expira TIMESTAMP;
ALTER TABLE cuentas ADD COLUMN verificacion_enviada TIMESTAMP;
ALTER TABLE cuentas ADD COLUMN verificacion_intentos INTEGER DEFAULT 0 NOT NULL;

-- Código que el cliente muestra en el local (texto y QR), p. ej. CC14-7KQ2MX.
ALTER TABLE reservas ADD COLUMN codigo VARCHAR(20);
UPDATE reservas SET codigo = 'CC14-' || CAST(id AS VARCHAR(10)) WHERE codigo IS NULL;
ALTER TABLE reservas ALTER COLUMN codigo SET NOT NULL;
ALTER TABLE reservas ADD CONSTRAINT uk_reservas_codigo UNIQUE (codigo);
