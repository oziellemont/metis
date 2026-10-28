# Pruebas de base de datos (esquema ceo)

Corren las migraciones reales 0013–0016 en un Postgres local con un «shim» mínimo de Supabase
y verifican el aislamiento entre usuarios (RLS). No tocan ningún proyecto de Supabase.

```bash
# requiere un Postgres local; METIS_PG_TEST apunta a una base vacía de prueba
METIS_PG_TEST="postgresql://postgres@localhost:5432/postgres" npx vitest run src/lib/ceo/db-rls.it.test.ts
```

Sin `METIS_PG_TEST` la prueba se omite (así corre en CI sin base).
