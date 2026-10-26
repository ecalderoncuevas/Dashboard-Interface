-- Tabla de destino del pipeline ETL Open-Meteo → Supabase.
-- Aplica este archivo en Supabase (SQL Editor) o con `supabase db push`.

create table if not exists public.mediciones_meteorologicas (
  id bigint generated always as identity primary key,
  ciudad text not null,
  fecha_hora timestamptz not null,
  temperatura_c double precision not null,
  humedad_pct double precision not null,
  precipitacion_mm double precision not null,
  importado_en timestamptz not null default now(),

  -- Clave natural: una medición por ciudad y hora. El upsert usa esta restricción.
  constraint mediciones_meteorologicas_ciudad_fecha_hora_key
    unique (ciudad, fecha_hora),
  constraint mediciones_meteorologicas_ciudad_no_vacia
    check (btrim(ciudad) <> ''),
  constraint mediciones_meteorologicas_humedad_rango
    check (humedad_pct between 0 and 100),
  constraint mediciones_meteorologicas_precipitacion_no_negativa
    check (precipitacion_mm >= 0)
  -- La temperatura no tiene CHECK a propósito: no se descartan extremos con umbrales arbitrarios.
);

comment on table public.mediciones_meteorologicas is
  'Mediciones horarias (UTC) de Open-Meteo cargadas por el pipeline ETL didáctico.';
comment on column public.mediciones_meteorologicas.fecha_hora is 'Hora de la medición en UTC.';
comment on column public.mediciones_meteorologicas.importado_en is
  'Momento de la primera inserción. Un upsert posterior actualiza las mediciones pero no esta columna.';

-- Consultas por intervalo de fechas de todas las ciudades.
create index if not exists mediciones_meteorologicas_fecha_hora_idx
  on public.mediciones_meteorologicas (fecha_hora);

-- Seguridad: RLS activado y sin políticas públicas. Los roles anon y
-- authenticated (clave publicable) no pueden leer ni escribir. Solo el
-- servidor, con la clave secreta (rol service_role), accede a la tabla.
alter table public.mediciones_meteorologicas enable row level security;

revoke all on table public.mediciones_meteorologicas from anon, authenticated;

-- Desde 2026 Supabase no concede permisos automáticamente a las tablas nuevas
-- del esquema public: hay que otorgarlos de forma explícita. service_role
-- ignora RLS, pero no los GRANT. El upsert necesita SELECT, INSERT y UPDATE.
grant select, insert, update on table public.mediciones_meteorologicas to service_role;

do $$
declare
  secuencia text := pg_get_serial_sequence('public.mediciones_meteorologicas', 'id');
begin
  if secuencia is not null then
    execute format('grant usage, select on sequence %s to service_role', secuencia);
  end if;
end $$;
