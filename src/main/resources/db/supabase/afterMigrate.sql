-- Callback de Flyway: se ejecuta despues de CADA migracion, solo con el perfil supabase.
-- Defensa en profundidad: la aplicacion accede como propietaria de las tablas (rol postgres),
-- que no esta sujeta a RLS, asi que nada cambia para Spring Boot. Pero si alguien expone el
-- esquema cafe en la Data API o usa la clave anon/publishable, Postgres negara todo, incluida
-- la tabla cuentas con los hashes de contrasena.
DO $$
DECLARE
    tabla record;
    rol text;
BEGIN
    FOR tabla IN SELECT tablename FROM pg_tables WHERE schemaname = 'cafe' LOOP
        EXECUTE format('ALTER TABLE cafe.%I ENABLE ROW LEVEL SECURITY', tabla.tablename);
    END LOOP;

    EXECUTE 'REVOKE ALL ON SCHEMA cafe FROM PUBLIC';
    FOREACH rol IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rol) THEN
            EXECUTE format('REVOKE ALL ON SCHEMA cafe FROM %I', rol);
            EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA cafe FROM %I', rol);
            EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA cafe FROM %I', rol);
            EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA cafe REVOKE ALL ON TABLES FROM %I', rol);
            EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA cafe REVOKE ALL ON SEQUENCES FROM %I', rol);
        END IF;
    END LOOP;
END
$$;
