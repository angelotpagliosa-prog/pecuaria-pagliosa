-- PecuarIA - farmacia central e lancamentos de aplicacao/vacinacao
-- Rode no Supabase SQL Editor para habilitar o historico de aplicacoes do estoque.

create table if not exists public.aplicacoes_estoque (
  id text primary key,
  "estoqueId" text not null,
  "animalId" text,
  brinco text,
  data date,
  quantidade numeric default 0,
  unidade text,
  "sedeId" text,
  responsavel text,
  obs text,
  created_at timestamptz default now()
);

create index if not exists aplicacoes_estoque_estoque_id_idx on public.aplicacoes_estoque("estoqueId");
create index if not exists aplicacoes_estoque_animal_id_idx on public.aplicacoes_estoque("animalId");
create index if not exists aplicacoes_estoque_sede_id_idx on public.aplicacoes_estoque("sedeId");

-- O estoque central "Farmacia" usa sedeId = 'farmacia'.
-- Nao precisa criar uma sede chamada Farmacia; o sistema reconhece esse local automaticamente.

create or replace function public.registrar_aplicacao_estoque(
  p_id text,
  p_estoque_id text,
  p_animal_id text,
  p_brinco text,
  p_data date,
  p_quantidade numeric,
  p_unidade text,
  p_sede_id text,
  p_responsavel text,
  p_obs text
)
returns public.aplicacoes_estoque
language plpgsql
security definer
set search_path = public
as $$
declare
  novo public.aplicacoes_estoque;
  pode_ler boolean := true;
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'app_can_read'
  ) then
    execute 'select public.app_can_read()' into pode_ler;
    if not coalesce(pode_ler, false) then
      raise exception 'sem permissao para registrar aplicacao';
    end if;
  end if;

  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'quantidade invalida';
  end if;

  update public.estoque
  set quantidade = coalesce(quantidade, 0) - p_quantidade
  where id = p_estoque_id
    and coalesce(quantidade, 0) >= p_quantidade;

  if not found then
    raise exception 'estoque insuficiente ou item nao encontrado';
  end if;

  insert into public.aplicacoes_estoque (
    id, "estoqueId", "animalId", brinco, data, quantidade,
    unidade, "sedeId", responsavel, obs
  )
  values (
    p_id, p_estoque_id, p_animal_id, p_brinco, p_data, p_quantidade,
    p_unidade, p_sede_id, p_responsavel, p_obs
  )
  returning * into novo;

  return novo;
end;
$$;

grant execute on function public.registrar_aplicacao_estoque(
  text, text, text, text, date, numeric, text, text, text, text
) to anon, authenticated;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'app_can_read'
  ) then
    alter table public.aplicacoes_estoque enable row level security;

    drop policy if exists "aplicacoes_estoque_select_secure" on public.aplicacoes_estoque;
    drop policy if exists "aplicacoes_estoque_insert_secure" on public.aplicacoes_estoque;
    drop policy if exists "aplicacoes_estoque_update_secure" on public.aplicacoes_estoque;
    drop policy if exists "aplicacoes_estoque_delete_secure" on public.aplicacoes_estoque;

    create policy "aplicacoes_estoque_select_secure"
    on public.aplicacoes_estoque for select
    to authenticated
    using (public.app_can_read());

    create policy "aplicacoes_estoque_insert_secure"
    on public.aplicacoes_estoque for insert
    to authenticated
    with check (public.app_can_read());

    create policy "aplicacoes_estoque_update_secure"
    on public.aplicacoes_estoque for update
    to authenticated
    using (public.app_can_write())
    with check (public.app_can_write());

    create policy "aplicacoes_estoque_delete_secure"
    on public.aplicacoes_estoque for delete
    to authenticated
    using (public.app_can_write());
  end if;
end $$;
