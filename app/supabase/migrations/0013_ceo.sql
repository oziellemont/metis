-- ============================================================================
-- METIS · 0013 · mêtis CEO (metisalign.app)
-- Apartado SEPARADO dentro de la misma base: esquema "ceo".
-- No toca nada del esquema "metis". Idempotente (se puede correr varias veces).
--
-- Después de correrla: Supabase → Project Settings → API → "Exposed schemas"
-- y agregar  ceo  (junto a public y metis). Guardar.
-- ============================================================================

create schema if not exists ceo;
grant usage on schema ceo to anon, authenticated, service_role;

-- Un jugador = una persona con cuenta. El avance completo vive en "state" (jsonb);
-- las demás columnas son copias para ranking y para el envío de correo/WhatsApp.
create table if not exists ceo.players (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  alias            text not null default 'CEO',
  name             text not null default '',
  state            jsonb not null default '{}'::jsonb,
  xp               int  not null default 0,
  level            text not null default 'Gerente',
  streak           int  not null default 0,
  best_streak      int  not null default 0,
  health           int  not null default 0,
  decisions        int  not null default 0,
  email            text,
  phone            text,
  notify_email     boolean not null default true,
  notify_whatsapp  boolean not null default false,
  tz               text not null default 'America/Monterrey',
  last_notified_at timestamptz,
  last_streak_at   date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists players_xp_idx on ceo.players (xp desc);

alter table ceo.players enable row level security;

-- Cada quien lee y guarda SOLO su propia fila.
drop policy if exists players_self on ceo.players;
create policy players_self on ceo.players for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update on ceo.players to authenticated;
grant all privileges on ceo.players to service_role;

-- Ranking público: solo alias y números (nunca correo, teléfono ni decisiones).
create or replace function ceo.leaderboard(lim int default 30)
returns table (alias text, xp int, level text, streak int, health int)
language sql stable security definer set search_path = ceo, public as $$
  select p.alias, p.xp, p.level, p.streak, p.health
  from ceo.players p
  where p.decisions > 0
  order by p.xp desc, p.updated_at asc
  limit greatest(1, least(lim, 100));
$$;

revoke all on function ceo.leaderboard(int) from public;
grant execute on function ceo.leaderboard(int) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
notify pgrst, 'reload config';
