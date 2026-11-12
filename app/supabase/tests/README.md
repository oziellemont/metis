# Pruebas de base de datos (esquema ceo)

Corren las migraciones reales 0013–0018 en un Postgres local con un «shim» mínimo de Supabase
y verifican el aislamiento entre usuarios (RLS). No tocan ningún proyecto de Supabase.

```bash
# requiere un Postgres local; METIS_PG_TEST apunta a una base vacía de prueba
METIS_PG_TEST="postgresql://postgres@localhost:5432/postgres" npx vitest run src/lib/ceo/db-rls.it.test.ts
```

Sin `METIS_PG_TEST` la prueba se omite (así corre en CI sin base).

## Respaldo de MÊTIS 2.0

`src/lib/ceo/metis2/respaldo.it.test.ts` corre `docs/sql/metis2_respaldo.sql` sobre las migraciones 0013–0023 y comprueba que
copia a todos los jugadores, que se puede repetir, que ningún navegador lee la copia, que no cambia partidas y que el bloque
de recuperación devuelve la partida guardada. Se corre igual y también se omite sin `METIS_PG_TEST`:

```bash
METIS_PG_TEST="postgresql://postgres@localhost:5432/postgres" npx vitest run src/lib/ceo/metis2/respaldo.it.test.ts
```
