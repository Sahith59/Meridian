create extension if not exists pgcrypto;

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  body text not null
);

alter table notes enable row level security;

drop policy if exists "notes_select_own_rows" on notes;
create policy "notes_select_own_rows"
on notes
for select
using (auth.uid() = owner_id);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  body text not null
);

alter table documents enable row level security;

drop policy if exists "documents_select_everything_vulnerable" on documents;
create policy "documents_select_everything_vulnerable"
on documents
for select
using (true);
