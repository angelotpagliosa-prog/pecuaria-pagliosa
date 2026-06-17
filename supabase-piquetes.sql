-- PecuarIA - piquetes/subdivisoes dentro de cada sede
-- Rode no Supabase SQL Editor antes de usar a aba Sedes > Piquetes.

create table if not exists public.piquetes (
  id text primary key,
  nome text not null,
  "sedeId" text not null,
  "areaHa" numeric default 0,
  capacidade integer default 0,
  obs text,
  created_at timestamptz default now()
);

alter table public.animais
  add column if not exists "piqueteId" text;

create index if not exists piquetes_sede_id_idx on public.piquetes("sedeId");
create index if not exists animais_piquete_id_idx on public.animais("piqueteId");

-- Se voce ja rodou supabase-security.sql, este bloco tambem protege piquetes por perfil.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'app_can_read'
  ) then
    alter table public.piquetes enable row level security;

    drop policy if exists "piquetes_select_secure" on public.piquetes;
    drop policy if exists "piquetes_insert_secure" on public.piquetes;
    drop policy if exists "piquetes_update_secure" on public.piquetes;
    drop policy if exists "piquetes_delete_secure" on public.piquetes;

    create policy "piquetes_select_secure"
    on public.piquetes for select
    to authenticated
    using (public.app_can_read());

    create policy "piquetes_insert_secure"
    on public.piquetes for insert
    to authenticated
    with check (public.app_can_write());

    create policy "piquetes_update_secure"
    on public.piquetes for update
    to authenticated
    using (public.app_can_write())
    with check (public.app_can_write());

    create policy "piquetes_delete_secure"
    on public.piquetes for delete
    to authenticated
    using (public.app_can_write());
  end if;
end $$;
