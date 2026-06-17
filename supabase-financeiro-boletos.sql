-- PecuarIA - campos para boletos futuros e contas a pagar
-- Rode no Supabase SQL Editor antes de cadastrar boletos no financeiro.

alter table public.financeiro
  add column if not exists vencimento date,
  add column if not exists "statusPagamento" text default 'pago',
  add column if not exists "formaPagamento" text,
  add column if not exists "codigoBoleto" text,
  add column if not exists "parcelaGrupoId" text,
  add column if not exists "parcelaNumero" integer default 1,
  add column if not exists "parcelaTotal" integer default 1;

update public.financeiro
set "statusPagamento" = coalesce("statusPagamento", 'pago')
where "statusPagamento" is null;

update public.financeiro
set
  "parcelaNumero" = coalesce("parcelaNumero", 1),
  "parcelaTotal" = coalesce("parcelaTotal", 1)
where "parcelaNumero" is null or "parcelaTotal" is null;
