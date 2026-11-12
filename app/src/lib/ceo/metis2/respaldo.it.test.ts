/**
 * Integración: el respaldo de MÊTIS 2.0 (docs/sql/metis2_respaldo.sql) sobre las migraciones reales del esquema ceo,
 * en un Postgres local. Se omite si no está METIS_PG_TEST (igual que db-rls.it.test.ts). Ver supabase/tests/README.md.
 *
 * Comprueba: copia una fila por jugador con todas sus columnas, se puede correr varias veces, ningún navegador
 * (anon / authenticated) puede leer la copia, no cambia las partidas y la recuperación devuelve la partida guardada.
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const URL_ = process.env.METIS_PG_TEST ?? "";
const supa = join(__dirname, "../../../../supabase");
const BACKUP = join(__dirname, "../../../../../docs/sql/metis2_respaldo.sql");
const run = (db: string, file: string) => execFileSync("psql", [db, "-v", "ON_ERROR_STOP=1", "-q", "-f", file], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const sql = (db: string, q: string) => execFileSync("psql", [db, "-v", "ON_ERROR_STOP=1", "-qtAc", q], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const fails = (db: string, q: string) => { try { sql(db, q); return false; } catch { return true; } };

const MIGRATIONS = ["0013_ceo", "0014_ceo_correos", "0015_ceo_fase0", "0016_ceo_perfil_catalogo", "0017_ceo_importaciones", "0018_ceo_diario_sombra", "0019_ceo_episodios", "0020_ceo_carrera_continua", "0021_ceo_world_events", "0022_ceo_avisos_celular", "0023_ceo_secretos_servidor"];
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

describe.skipIf(!URL_)("respaldo de MÊTIS 2.0 en Postgres", () => {
  it("copia a todos los jugadores, es repetible, privado, no cambia partidas y permite recuperar", () => {
    const name = `metis2_it_${Date.now()}`;
    sql(URL_, `create database ${name}`);
    const db = URL_.replace(/\/[^/?]*(\?|$)/, `/${name}$1`);
    try {
      run(db, join(supa, "tests/shim_supabase.sql"));
      for (const m of MIGRATIONS) run(db, join(supa, `migrations/${m}.sql`));
      sql(db, `insert into auth.users (id) values ('${A}'), ('${B}')`);
      sql(db, `insert into ceo.players (user_id, name, email, state, xp) values ('${A}', 'Ana', 'ana@ejemplo.com', '{"company":"cumbre","tier":2}', 340), ('${B}', 'Beto', 'beto@ejemplo.com', '{"company":"forja"}', 15)`);
      const before = sql(db, "select md5(string_agg(user_id::text || state::text || xp::text, '|' order by user_id)) from ceo.players");

      run(db, BACKUP);
      expect(sql(db, "select count(*) from ceo.players_backup_metis2")).toBe("2");
      // La copia trae la fila completa: todas las columnas de ceo.players, no solo la partida.
      const cols = sql(db, "select count(*) from information_schema.columns where table_schema = 'ceo' and table_name = 'players'");
      expect(sql(db, `select count(*) from (select jsonb_object_keys(fila) from ceo.players_backup_metis2 where user_id = '${A}') k`)).toBe(cols);
      expect(sql(db, `select fila -> 'state' ->> 'company' from ceo.players_backup_metis2 where user_id = '${A}'`)).toBe("cumbre");

      // Repetible: una segunda corrida agrega otra copia, no falla ni pisa la anterior.
      run(db, BACKUP);
      expect(sql(db, "select count(*) from ceo.players_backup_metis2")).toBe("4");
      expect(sql(db, "select count(distinct backup_at) from ceo.players_backup_metis2")).toBe("2");

      // Privado: ningún navegador puede leer ni escribir la copia.
      // Control: el mismo tipo de consulta SÍ funciona sobre la tabla de partidas, así que el rechazo de abajo es por permisos.
      expect(fails(db, "set role authenticated; select count(*) from ceo.players")).toBe(false);
      for (const role of ["anon", "authenticated"]) {
        expect(fails(db, `set role ${role}; select count(*) from ceo.players_backup_metis2`), role).toBe(true);
        expect(fails(db, `set role ${role}; delete from ceo.players_backup_metis2`), role).toBe(true);
      }

      // El respaldo no cambió ninguna partida.
      expect(sql(db, "select md5(string_agg(user_id::text || state::text || xp::text, '|' order by user_id)) from ceo.players")).toBe(before);

      // Recuperar: se daña la partida de Ana y el bloque comentado del archivo la devuelve; la de Beto no se toca.
      sql(db, `update ceo.players set state = '{}', xp = 0 where user_id = '${A}'`);
      const file = readFileSync(BACKUP, "utf8");
      const block = file.slice(file.indexOf("-- update ceo.players p"), file.indexOf("-- QUITAR EL RESPALDO")).split("\n")
        .filter((l) => l.startsWith("--  ") || l.startsWith("-- update")).map((l) => l.replace(/^-- ?/, "")).join("\n").replace("correo@ejemplo.com", "ana@ejemplo.com");
      expect(block).toContain("update ceo.players p");
      sql(db, block);
      expect(sql(db, "select md5(string_agg(user_id::text || state::text || xp::text, '|' order by user_id)) from ceo.players")).toBe(before);
    } finally {
      sql(URL_, `drop database if exists ${name} with (force)`);
    }
  });
});
