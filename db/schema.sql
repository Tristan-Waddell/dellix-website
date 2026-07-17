-- Dellix CRM schema. Idempotent — safe to re-run.
create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies (id) on delete set null,
  name text not null,
  email text,
  phone text,
  title text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts (id) on delete set null,
  company_id uuid references companies (id) on delete set null,
  name text not null,
  value_cents bigint not null default 0,
  stage text not null default 'lead' check (stage in ('lead', 'contacted', 'proposal', 'won', 'lost')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_company_id_idx on contacts (company_id);
create index if not exists deals_contact_id_idx on deals (contact_id);
create index if not exists deals_company_id_idx on deals (company_id);
create index if not exists deals_stage_idx on deals (stage);
