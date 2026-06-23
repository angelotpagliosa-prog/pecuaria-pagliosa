-- PecuarIA - estoque com valor, sal mineral e lancamentos em lote/sede
-- Rode este arquivo no Supabase SQL Editor.

alter table public.estoque
add column if not exists "valorUnitario" numeric default 0;

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

alter table public.aplicacoes_estoque
add column if not exists tipo text default 'animal',
add column if not exists "piqueteId" text,
add column if not exists "totalAnimais" integer default 0,
add column if not exists "valorUnitario" numeric default 0,
add column if not exists "custoTotal" numeric default 0;

create index if not exists aplicacoes_estoque_estoque_id_idx on public.aplicacoes_estoque("estoqueId");
create index if not exists aplicacoes_estoque_animal_id_idx on public.aplicacoes_estoque("animalId");
create index if not exists aplicacoes_estoque_sede_id_idx on public.aplicacoes_estoque("sedeId");
create index if not exists aplicacoes_estoque_piquete_id_idx on public.aplicacoes_estoque("piqueteId");

create or replace function public.registrar_saidas_estoque_lote(
  p_estoque_id text,
  p_quantidade_total numeric,
  p_lancamentos jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  origem public.estoque%rowtype;
  qtd_inserida integer := 0;
  pode_ler boolean := true;
  saida_sede jsonb;
  sede_destino text;
  estoque_destino_id text;
  novo_destino_id text;
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
      raise exception 'sem permissao para registrar saida de estoque';
    end if;
  end if;

  if p_quantidade_total is null or p_quantidade_total <= 0 then
    raise exception 'quantidade invalida';
  end if;

  select *
  into origem
  from public.estoque
  where id = p_estoque_id
  for update;

  if not found then
    raise exception 'estoque insuficiente ou item nao encontrado';
  end if;

  if coalesce(origem.quantidade, 0) < p_quantidade_total then
    raise exception 'estoque insuficiente ou item nao encontrado';
  end if;

  update public.estoque
  set quantidade = coalesce(quantidade, 0) - p_quantidade_total
  where id = p_estoque_id;

  insert into public.aplicacoes_estoque (
    id, "estoqueId", "animalId", brinco, data, quantidade,
    unidade, "sedeId", responsavel, obs, tipo, "piqueteId",
    "totalAnimais", "valorUnitario", "custoTotal"
  )
  select
    x->>'id',
    x->>'estoqueId',
    nullif(x->>'animalId',''),
    x->>'brinco',
    nullif(x->>'data','')::date,
    coalesce(nullif(x->>'quantidade','')::numeric, 0),
    x->>'unidade',
    x->>'sedeId',
    x->>'responsavel',
    x->>'obs',
    coalesce(nullif(x->>'tipo',''), 'animal'),
    nullif(x->>'piqueteId',''),
    coalesce(nullif(x->>'totalAnimais','')::integer, 0),
    coalesce(nullif(x->>'valorUnitario','')::numeric, 0),
    coalesce(nullif(x->>'custoTotal','')::numeric, 0)
  from jsonb_array_elements(p_lancamentos) x;

  get diagnostics qtd_inserida = row_count;

  select x
  into saida_sede
  from jsonb_array_elements(p_lancamentos) x
  where coalesce(x->>'tipo','') = 'saida_sede'
  limit 1;

  sede_destino := nullif(saida_sede->>'sedeId','');

  if sede_destino is not null and sede_destino <> origem."sedeId" then
    select id
    into estoque_destino_id
    from public.estoque
    where id <> p_estoque_id
      and "sedeId" = sede_destino
      and lower(trim(nome)) = lower(trim(origem.nome))
      and coalesce(unidade, '') = coalesce(origem.unidade, '')
    limit 1
    for update;

    if estoque_destino_id is not null then
      update public.estoque
      set quantidade = coalesce(quantidade, 0) + p_quantidade_total,
          categoria = origem.categoria,
          unidade = origem.unidade,
          "valorUnitario" = coalesce(origem."valorUnitario", 0)
      where id = estoque_destino_id;
    else
      novo_destino_id := 'est_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20);

      insert into public.estoque (
        id, nome, categoria, quantidade, unidade, minimo, "sedeId", "valorUnitario"
      )
      values (
        novo_destino_id,
        origem.nome,
        origem.categoria,
        p_quantidade_total,
        origem.unidade,
        0,
        sede_destino,
        coalesce(origem."valorUnitario", 0)
      );
    end if;
  end if;

  return qtd_inserida;
end;
$$;

grant execute on function public.registrar_saidas_estoque_lote(text,numeric,jsonb) to anon, authenticated;
