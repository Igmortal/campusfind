-- CampusFind database setup. Run this whole file ONCE in Supabase > SQL Editor.
-- Safe for an existing project: it only adds what is missing.

create table if not exists reports (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  item text, type text, location text, date date, description text,
  status text default 'pending'
);
alter table reports add column if not exists contact text;
alter table reports alter column status set default 'pending';

-- Admin list. RLS on with no policies = nobody can read it through the API.
create table if not exists admins (email text primary key);
alter table admins enable row level security;
create or replace function is_admin() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from admins where email = auth.jwt() ->> 'email') $$;

-- Row-level security on reports
alter table reports enable row level security;
drop policy if exists "public read approved" on reports;
drop policy if exists "public submit pending" on reports;
drop policy if exists "admin full access" on reports;
create policy "public read approved" on reports for select to anon, authenticated using (status = 'approved');
create policy "public submit pending" on reports for insert to anon, authenticated
  with check (status = 'pending' and type in ('lost', 'found'));
create policy "admin full access" on reports for all to authenticated
  using (is_admin()) with check (is_admin());

-- Visitors can never read the private contact column.
revoke select on reports from anon;
grant select (id, created_at, item, type, location, date, description, status) on reports to anon;
