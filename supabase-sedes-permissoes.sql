-- PecuarIA - permissoes para criar e editar sedes
-- Rode no Supabase SQL Editor se a opcao aparecer no sistema, mas o Supabase bloquear por RLS.

create or replace function public.app_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_perfil() in ('admin','administrador'), false)
$$;

create or replace function public.app_can_read()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_perfil() in ('admin','administrador','gestor','funcionario'), false)
$$;

create or replace function public.app_can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_perfil() in ('admin','administrador','gestor'), false)
$$;

grant execute on function public.app_is_admin() to authenticated;
grant execute on function public.app_can_read() to authenticated;
grant execute on function public.app_can_write() to authenticated;

alter table public.sedes enable row level security;

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
with check (public.app_can_write());

create policy "sedes_update_admin"
on public.sedes for update
to authenticated
using (public.app_can_write())
with check (public.app_can_write());

create policy "sedes_delete_admin"
on public.sedes for delete
to authenticated
using (public.app_is_admin());
