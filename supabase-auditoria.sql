-- PecuarIA - auditoria de usuarios e historico de alteracoes
-- Rode no Supabase SQL Editor depois de vincular os usuarios ao Supabase Auth.

create table if not exists public.auditoria (
  id text primary key,
  "usuarioId" uuid,
  "usuarioNome" text,
  "usuarioEmail" text,
  "usuarioPerfil" text,
  acao text not null,
  tabela text not null,
  "registroId" text,
  descricao text,
  "dadosAntes" jsonb,
  "dadosDepois" jsonb,
  created_at timestamptz default now()
);

alter table public.usuarios add column if not exists "authUserId" uuid;
create index if not exists usuarios_auth_user_id_idx on public.usuarios("authUserId");

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'app_is_admin'
  ) then
    execute $fn$
      create function public.app_is_admin()
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $body$
        select exists (
          select 1
          from public.usuarios u
          where u."authUserId" = auth.uid()
            and u.perfil in ('admin','administrador')
        )
      $body$;
    $fn$;
  end if;
end $$;

create index if not exists auditoria_created_at_idx on public.auditoria(created_at desc);
create index if not exists auditoria_usuario_id_idx on public.auditoria("usuarioId");
create index if not exists auditoria_tabela_idx on public.auditoria(tabela);
create index if not exists auditoria_acao_idx on public.auditoria(acao);

create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario public.usuarios%rowtype;
  dados_antes jsonb;
  dados_depois jsonb;
  dados_ref jsonb;
  acao_txt text;
  registro_id text;
  registro_nome text;
begin
  if TG_OP = 'UPDATE' then
    if to_jsonb(old) = to_jsonb(new) then
      return new;
    end if;
  end if;

  select *
  into usuario
  from public.usuarios
  where "authUserId" = auth.uid()
  limit 1;

  if TG_OP = 'INSERT' then
    acao_txt := 'criou';
    dados_antes := null;
    dados_depois := to_jsonb(new);
    dados_ref := dados_depois;
  elsif TG_OP = 'UPDATE' then
    acao_txt := 'editou';
    dados_antes := to_jsonb(old);
    dados_depois := to_jsonb(new);
    dados_ref := dados_depois;
  elsif TG_OP = 'DELETE' then
    acao_txt := 'excluiu';
    dados_antes := to_jsonb(old);
    dados_depois := null;
    dados_ref := dados_antes;
  end if;

  registro_id := coalesce(dados_ref->>'id', dados_ref->>'brinco', dados_ref->>'email');
  registro_nome := coalesce(
    dados_ref->>'descricao',
    dados_ref->>'nome',
    dados_ref->>'titulo',
    dados_ref->>'brinco',
    dados_ref->>'email',
    dados_ref->>'compradorNome',
    registro_id
  );

  insert into public.auditoria (
    id, "usuarioId", "usuarioNome", "usuarioEmail", "usuarioPerfil",
    acao, tabela, "registroId", descricao, "dadosAntes", "dadosDepois"
  )
  values (
    'aud_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24),
    auth.uid(),
    usuario.nome,
    coalesce(usuario.email, auth.jwt()->>'email'),
    usuario.perfil,
    acao_txt,
    TG_TABLE_NAME,
    registro_id,
    acao_txt || ' em ' || TG_TABLE_NAME || coalesce(': ' || registro_nome, ''),
    dados_antes,
    dados_depois
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.registrar_login_auditoria()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario public.usuarios%rowtype;
begin
  select *
  into usuario
  from public.usuarios
  where "authUserId" = auth.uid()
  limit 1;

  if auth.uid() is null then
    return;
  end if;

  insert into public.auditoria (
    id, "usuarioId", "usuarioNome", "usuarioEmail", "usuarioPerfil",
    acao, tabela, "registroId", descricao, "dadosAntes", "dadosDepois"
  )
  values (
    'aud_' || substr(md5(random()::text || clock_timestamp()::text), 1, 24),
    auth.uid(),
    usuario.nome,
    coalesce(usuario.email, auth.jwt()->>'email'),
    usuario.perfil,
    'login',
    'sistema',
    auth.uid()::text,
    'login no sistema',
    null,
    jsonb_build_object('email', coalesce(usuario.email, auth.jwt()->>'email'), 'nome', usuario.nome)
  );
end;
$$;

grant execute on function public.registrar_login_auditoria() to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'sedes','usuarios','animais','reproducao','financeiro','clientes',
    'estoque','manejos','movimentacoes','agenda','vendas',
    'semen_botijoes','semen_palhetas','semen_saidas','piquetes','aplicacoes_estoque'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists %I on public.%I', 'audit_' || t, t);
      execute format(
        'create trigger %I after insert or update or delete on public.%I for each row execute function public.registrar_auditoria()',
        'audit_' || t,
        t
      );
    end if;
  end loop;
end $$;

alter table public.auditoria enable row level security;

drop policy if exists "auditoria_select_admin" on public.auditoria;
drop policy if exists "auditoria_delete_admin" on public.auditoria;

create policy "auditoria_select_admin"
on public.auditoria for select
to authenticated
using (public.app_is_admin());

create policy "auditoria_delete_admin"
on public.auditoria for delete
to authenticated
using (public.app_is_admin());
