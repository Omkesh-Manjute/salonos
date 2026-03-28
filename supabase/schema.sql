create extension if not exists "pgcrypto";

create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid references auth.users(id) on delete set null,
  owner_name text,
  email text,
  phone text,
  city text,
  address text,
  plan text not null default 'basic' check (plan in ('basic', 'pro', 'enterprise')),
  status text not null default 'trial' check (status in ('trial', 'active', 'inactive', 'suspended', 'pending')),
  trial_ends_at timestamptz,
  subscription_expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.salons(tenant_id) on delete set null,
  salon_id uuid references public.salons(id) on delete set null,
  name text not null,
  phone text,
  email text,
  role text not null check (role in ('customer', 'owner', 'admin')),
  loyalty_points integer not null default 0,
  last_seen_at timestamptz,
  fcm_token text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists users_tenant_role_idx on public.users (tenant_id, role);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.salons(tenant_id) on delete cascade,
  salon_id uuid references public.salons(id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  duration_minutes integer not null default 30,
  price numeric(10,2) not null,
  is_popular boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists services_tenant_idx on public.services (tenant_id, active);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.salons(tenant_id) on delete cascade,
  salon_id uuid references public.salons(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  staff_name text,
  booking_time timestamptz not null,
  check_in_time timestamptz,
  completed_at timestamptz,
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
  booking_type text not null default 'slot' check (booking_type in ('slot', 'queue')),
  payment_method text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  total_amount numeric(10,2) not null default 0,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists bookings_tenant_time_idx on public.bookings (tenant_id, booking_time desc);
create index if not exists bookings_user_idx on public.bookings (user_id, booking_time desc);

create table if not exists public.queue (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.salons(tenant_id) on delete cascade,
  salon_id uuid references public.salons(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  customer_name text not null,
  phone text,
  service_name text not null,
  staff_name text,
  position integer not null,
  estimated_wait_minutes integer not null default 0,
  scheduled_for timestamptz,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'next', 'done', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, position)
);
create index if not exists queue_tenant_position_idx on public.queue (tenant_id, position);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.salons(tenant_id) on delete cascade,
  salon_id uuid references public.salons(id) on delete cascade,
  plan text not null check (plan in ('basic', 'pro', 'enterprise')),
  status text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'cancelled')),
  trial_started_at timestamptz not null default timezone('utc', now()),
  trial_ends_at timestamptz not null default timezone('utc', now()) + interval '14 days',
  current_period_start timestamptz,
  current_period_end timestamptz,
  payment_id text,
  amount numeric(10,2),
  currency text not null default 'INR',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.salons(tenant_id) on delete cascade,
  salon_id uuid references public.salons(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  data jsonb not null default '{}'::jsonb,
  read_status boolean not null default false,
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.assign_queue_position()
returns trigger
language plpgsql
as $$
declare
  next_position integer;
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1 into next_position
    from public.queue
    where tenant_id = new.tenant_id
      and status in ('waiting', 'in_progress', 'next');
    new.position = next_position;
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, phone, role, tenant_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email, new.phone, 'SalonOS User'),
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'role', 'customer'),
    nullif(new.raw_user_meta_data ->> 'tenant_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists users_on_auth_created on auth.users;
create trigger users_on_auth_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

drop trigger if exists touch_salons_updated_at on public.salons;
create trigger touch_salons_updated_at before update on public.salons for each row execute procedure public.touch_updated_at();
drop trigger if exists touch_users_updated_at on public.users;
create trigger touch_users_updated_at before update on public.users for each row execute procedure public.touch_updated_at();
drop trigger if exists touch_services_updated_at on public.services;
create trigger touch_services_updated_at before update on public.services for each row execute procedure public.touch_updated_at();
drop trigger if exists touch_bookings_updated_at on public.bookings;
create trigger touch_bookings_updated_at before update on public.bookings for each row execute procedure public.touch_updated_at();
drop trigger if exists touch_queue_updated_at on public.queue;
create trigger touch_queue_updated_at before update on public.queue for each row execute procedure public.touch_updated_at();
drop trigger if exists touch_subscriptions_updated_at on public.subscriptions;
create trigger touch_subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.touch_updated_at();

drop trigger if exists queue_assign_position on public.queue;
create trigger queue_assign_position before insert on public.queue for each row execute procedure public.assign_queue_position();

alter table public.salons enable row level security;
alter table public.users enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.queue enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select tenant_id from public.users where id = auth.uid()
$$;

drop policy if exists "admins_manage_salons" on public.salons;
create policy "admins_manage_salons" on public.salons
for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
drop policy if exists "owners_view_their_salon" on public.salons;
create policy "owners_view_their_salon" on public.salons
for select using (tenant_id = public.current_tenant_id());
drop policy if exists "owners_update_their_salon" on public.salons;
create policy "owners_update_their_salon" on public.salons
for update using (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner') with check (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner');

drop policy if exists "admins_manage_users" on public.users;
create policy "admins_manage_users" on public.users
for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
drop policy if exists "users_view_same_tenant_users" on public.users;
create policy "users_view_same_tenant_users" on public.users
for select using (tenant_id = public.current_tenant_id() or id = auth.uid());
drop policy if exists "users_update_own_profile" on public.users;
create policy "users_update_own_profile" on public.users
for update using (id = auth.uid() or (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner')) with check (id = auth.uid() or (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner'));

drop policy if exists "admins_manage_services" on public.services;
create policy "admins_manage_services" on public.services
for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
drop policy if exists "tenant_services_visible" on public.services;
create policy "tenant_services_visible" on public.services
for select using (tenant_id = public.current_tenant_id());
drop policy if exists "owners_manage_services" on public.services;
create policy "owners_manage_services" on public.services
for all using (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner') with check (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner');

drop policy if exists "admins_manage_bookings" on public.bookings;
create policy "admins_manage_bookings" on public.bookings
for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
drop policy if exists "tenant_bookings_visible" on public.bookings;
create policy "tenant_bookings_visible" on public.bookings
for select using (tenant_id = public.current_tenant_id() or user_id = auth.uid());
drop policy if exists "customers_create_own_bookings" on public.bookings;
create policy "customers_create_own_bookings" on public.bookings
for insert with check (user_id = auth.uid() and tenant_id = public.current_tenant_id());
drop policy if exists "owners_manage_tenant_bookings" on public.bookings;
create policy "owners_manage_tenant_bookings" on public.bookings
for all using (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner') with check (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner');

drop policy if exists "admins_manage_queue" on public.queue;
create policy "admins_manage_queue" on public.queue
for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
drop policy if exists "tenant_queue_visible" on public.queue;
create policy "tenant_queue_visible" on public.queue
for select using (tenant_id = public.current_tenant_id() or user_id = auth.uid());
drop policy if exists "customers_join_queue" on public.queue;
create policy "customers_join_queue" on public.queue
for insert with check (tenant_id = public.current_tenant_id() and (user_id = auth.uid() or public.current_user_role() = 'owner'));
drop policy if exists "owners_manage_tenant_queue" on public.queue;
create policy "owners_manage_tenant_queue" on public.queue
for all using (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner') with check (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner');

drop policy if exists "admins_manage_subscriptions" on public.subscriptions;
create policy "admins_manage_subscriptions" on public.subscriptions
for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
drop policy if exists "tenant_subscription_visible" on public.subscriptions;
create policy "tenant_subscription_visible" on public.subscriptions
for select using (tenant_id = public.current_tenant_id());
drop policy if exists "owners_manage_subscription" on public.subscriptions;
create policy "owners_manage_subscription" on public.subscriptions
for all using (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner') with check (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner');

drop policy if exists "admins_manage_notifications" on public.notifications;
create policy "admins_manage_notifications" on public.notifications
for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
drop policy if exists "tenant_notifications_visible" on public.notifications;
create policy "tenant_notifications_visible" on public.notifications
for select using (tenant_id = public.current_tenant_id() or user_id = auth.uid());
drop policy if exists "owners_manage_notifications" on public.notifications;
create policy "owners_manage_notifications" on public.notifications
for all using (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner') with check (tenant_id = public.current_tenant_id() and public.current_user_role() = 'owner');
