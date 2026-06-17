-- PecuarIA - campos para boletos futuros e contas a pagar
-- Rode no Supabase SQL Editor antes de cadastrar boletos no financeiro.

alter table public.financeiro
  add column if not exists vencimento date,
  add column if not exists "statusPagamento" text default 'pago',
  add column if not exists "formaPagamento" text,
  add column if not exists "codigoBoleto" text;

update public.financeiro
set "statusPagamento" = coalesce("statusPagamento", 'pago')
where "statusPagamento" is null;
