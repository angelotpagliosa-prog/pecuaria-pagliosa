-- PecuarIA - seguranca inicial para uso com dados reais
-- Rode este arquivo no Supabase SQL Editor somente depois de:
-- 1. Rodar supabase-auth-prep.sql, se a coluna authUserId ainda nao existir
-- 2. Criar os usuarios em Authentication > Users
-- 3. Copiar o User ID de cada usuario
-- 4. Preencher usuarios.authUserId com o User ID correto

alter table public.usuarios add column if not exists "authUserId" uuid;
create index if not exists usuarios_auth_user_id_idx on public.usuarios("authUserId");

create or replace function public.app_perfil()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.perfil
  from public.usuarios u
  where u."authUserId" = auth.uid()
  limit 1
$$;

create or replace function public.app_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_perfil() = 'admin', false)
$$;

create or replace function public.app_can_read()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_perfil() in ('admin','gestor','funcionario'), false)
$$;

create or replace function public.app_can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_perfil() in ('admin','gestor'), false)
$$;

grant execute on function public.app_perfil() to authenticated;
grant execute on function public.app_is_admin() to authenticated;
grant execute on function public.app_can_read() to authenticated;
grant execute on function public.app_can_write() to authenticated;

alter table public.sedes enable row level security;
alter table public.usuarios enable row level security;
alter table public.animais enable row level security;
alter table public.reproducao enable row level security;
alter table public.financeiro enable row level security;
alter table public.clientes enable row level security;
alter table public.estoque enable row level security;
alter table public.manejos enable row level security;
alter table public.movimentacoes enable row level security;
alter table public.agenda enable row level security;
alter table public.vendas enable row level security;
alter table public.semen_botijoes enable row level security;
alter table public.semen_palhetas enable row level security;
alter table public.semen_saidas enable row level security;
alter table if exists public.piquetes enable row level security;

drop policy if exists "usuarios_select_secure" on public.usuarios;
drop policy if exists "usuarios_insert_admin" on public.usuarios;
drop policy if exists "usuarios_update_admin" on public.usuarios;
drop policy if exists "usuarios_delete_admin" on public.usuarios;

create policy "usuarios_select_secure"
on public.usuarios for select
to authenticated
using (public.app_is_admin() or "authUserId" = auth.uid());

create policy "usuarios_insert_admin"
on public.usuarios for insert
to authenticated
with check (public.app_is_admin());

create policy "usuarios_update_admin"
on public.usuarios for update
to authenticated
using (public.app_is_admin())
with check (public.app_is_admin());

create policy "usuarios_delete_admin"
on public.usuarios for delete
to authenticated
using (public.app_is_admin());

drop policy if exists "sedes_select_secure" on public.sedes;
drop policy if exists "sedes_insert_admin" on public.sedes;
drop policy if exists "sedes_update_admin" on public.sedes;
drop policy if exists "sedes_delete_admin" on public.sedes;

create policy "sedes_select_secure"
on public.sedes for select
to authenticated
using (public.app_can_read());

create policy "sedes_insert_admin"
on public.sedes for insert
to authenticated
with check (public.app_is_admin());

create policy "sedes_update_admin"
on public.sedes for update
to authenticated
using (public.app_is_admin())
with check (public.app_is_admin());

create policy "sedes_delete_admin"
on public.sedes for delete
to authenticated
using (public.app_is_admin());

do $$
declare
  t text;
begin
  foreach t in array array[
    'animais','reproducao','financeiro','clientes','estoque','manejos',
    'movimentacoes','agenda','vendas','semen_botijoes','semen_palhetas','semen_saidas','piquetes'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists "%s_select_secure" on public.%I', t, t);
      execute format('drop policy if exists "%s_insert_secure" on public.%I', t, t);
      execute format('drop policy if exists "%s_update_secure" on public.%I', t, t);
      execute format('drop policy if exists "%s_delete_secure" on public.%I', t, t);

      execute format('create policy "%s_select_secure" on public.%I for select to authenticated using (public.app_can_read())', t, t);
      execute format('create policy "%s_insert_secure" on public.%I for insert to authenticated with check (public.app_can_write())', t, t);
      execute format('create policy "%s_update_secure" on public.%I for update to authenticated using (public.app_can_write()) with check (public.app_can_write())', t, t);
      execute format('create policy "%s_delete_secure" on public.%I for delete to authenticated using (public.app_can_write())', t, t);
    end if;
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('notas-fiscais', 'notas-fiscais', false)
on conflict (id) do update set public = false;

drop policy if exists "notas_fiscais_select_secure" on storage.objects;
drop policy if exists "notas_fiscais_insert_secure" on storage.objects;
drop policy if exists "notas_fiscais_update_secure" on storage.objects;
drop policy if exists "notas_fiscais_delete_secure" on storage.objects;

create policy "notas_fiscais_select_secure"
on storage.objects for select
to authenticated
using (bucket_id = 'notas-fiscais' and public.app_can_read());

create policy "notas_fiscais_insert_secure"
on storage.objects for insert
to authenticated
with check (bucket_id = 'notas-fiscais' and public.app_can_write());

create policy "notas_fiscais_update_secure"
on storage.objects for update
to authenticated
using (bucket_id = 'notas-fiscais' and public.app_can_write())
with check (bucket_id = 'notas-fiscais' and public.app_can_write());

create policy "notas_fiscais_delete_secure"
on storage.objects for delete
to authenticated
using (bucket_id = 'notas-fiscais' and public.app_can_write());
