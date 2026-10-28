/**
 * Integración: migraciones reales del esquema ceo + RLS entre usuarios, en un Postgres local.
 * Se omite si no está METIS_PG_TEST (cadena de conexión a una base de pruebas). Ver supabase/tests/README.md.
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const URL_ = process.env.METIS_PG_TEST ?? "";
const dir = join(__dirname, "../../../supabase");
const run = (db: string, file: string) => execFileSync("psql", [db, "-v", "ON_ERROR_STOP=1", "-q", "-f", file], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const sql = (db: string, q: string) => execFileSync("psql", [db, "-v", "ON_ERROR_STOP=1", "-qtAc", q], { encoding: "utf8" });

describe.skipIf(!URL_)("esquema ceo en Postgres (RLS)", () => {
  it("las migraciones corren dos veces y nadie ve ni toca datos ajenos", () => {
    const name = `ceo_it_${Date.now()}`;
    sql(URL_, `create database ${name}`);
    const db = URL_.replace(/\/[^/?]*(\?|$)/, `/${name}$1`);
    try {
      for (const f of ["tests/shim_supabase.sql", "migrations/0013_ceo.sql", "migrations/0014_ceo_correos.sql", "migrations/0015_ceo_fase0.sql", "migrations/0016_ceo_perfil_catalogo.sql", "migrations/0016_ceo_perfil_catalogo.sql"]) run(db, join(dir, f));
      expect(run(db, join(dir, "tests/rls_ceo_test.sql"))).toContain("RLS OK");
    } finally {
      sql(URL_, `drop database if exists ${name} with (force)`);
    }
  });
});
