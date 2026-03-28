create extension if not exists pgcrypto;

create table if not exists public.tokens (
    id uuid primary key default gen_random_uuid(),
    token_hash text not null unique,
    token_prefix varchar(10) not null,
    plan text not null check (plan in ('basic', 'pro')),
    label text,
    status text not null default 'valid' check (status in ('valid', 'revoked')),
    issued_at timestamptz not null default timezone('utc', now()),
    last_used_at timestamptz,
    revoked_at timestamptz
);

create index if not exists tokens_status_idx on public.tokens (status);
create index if not exists tokens_issued_at_idx on public.tokens (issued_at desc);

alter table public.tokens enable row level security;
