-- Run once in your Supabase project's SQL Editor.
-- Create your own Auth user and disable public sign-ups in Authentication settings.
create table if not exists public.masar_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint masar_data_object check (jsonb_typeof(data) = 'object'),
  constraint masar_data_size check (octet_length(data::text) <= 2097152)
);
alter table public.masar_workspaces enable row level security;
revoke all on public.masar_workspaces from anon;
grant select, insert, update on public.masar_workspaces to authenticated;
drop policy if exists "Own workspace only" on public.masar_workspaces;
create policy "Own workspace only" on public.masar_workspaces
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.masar_sync_commit(expected_revision bigint, workspace_data jsonb)
returns setof public.masar_workspaces
language plpgsql security invoker set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  insert into public.masar_workspaces(user_id) values (auth.uid()) on conflict do nothing;
  return query update public.masar_workspaces
    set data = workspace_data, revision = revision + 1, updated_at = now()
    where user_id = auth.uid() and revision = expected_revision returning *;
  if not found then
    raise exception 'Workspace changed on another device' using errcode = '40001';
  end if;
end;
$$;
revoke all on function public.masar_sync_commit(bigint, jsonb) from public, anon;
grant execute on function public.masar_sync_commit(bigint, jsonb) to authenticated;
