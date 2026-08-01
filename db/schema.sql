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
  is_active_client boolean not null default false,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table contacts add column if not exists is_active_client boolean not null default false;
alter table contacts add column if not exists stripe_customer_id text;

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

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  completed boolean not null default false,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists contacts_company_id_idx on contacts (company_id);
create index if not exists contacts_active_clients_idx on contacts (is_active_client) where is_active_client = true;
create unique index if not exists contacts_stripe_customer_id_idx on contacts (stripe_customer_id) where stripe_customer_id is not null;
create index if not exists deals_contact_id_idx on deals (contact_id);
create index if not exists deals_company_id_idx on deals (company_id);
create index if not exists deals_stage_idx on deals (stage);
create index if not exists tasks_completed_due_date_idx on tasks (completed, due_date);
create index if not exists api_keys_active_idx on api_keys (expires_at) where revoked_at is null;
