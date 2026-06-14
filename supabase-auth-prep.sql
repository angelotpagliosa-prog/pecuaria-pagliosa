-- PecuarIA - preparacao do Supabase Auth
-- Rode este arquivo primeiro, antes de preencher usuarios.authUserId.

alter table public.usuarios add column if not exists "authUserId" uuid;
create index if not exists usuarios_auth_user_id_idx on public.usuarios("authUserId");
