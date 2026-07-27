-- ============================================================
-- MIS FINANZAS v2.0 - COMPLETE MULTI-TENANT SAAS SETUP SCRIPT
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Works on BOTH empty databases and existing databases!
-- ============================================================

-- 1. TABLE: CATEGORIAS
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  nombre text not null,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  grupo text,
  presupuesto_mensual numeric(10,2) not null default 0,
  es_recurrente boolean not null default false,
  icono text,
  color text,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Ensure user_id column exists if table was created previously without it
alter table public.categorias add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();


-- 2. TABLE: MOVIMIENTOS
create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  fecha date not null,
  categoria_id uuid not null references public.categorias(id),
  monto numeric(10,2) not null check (monto > 0),
  descripcion text,
  origen text not null default 'manual' check (origen in ('manual', 'voz', 'recurrente', 'ocr')),
  creado_en timestamptz not null default now()
);

alter table public.movimientos add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
create index if not exists idx_movimientos_fecha on public.movimientos(fecha);
create index if not exists idx_movimientos_categoria on public.movimientos(categoria_id);
create index if not exists idx_movimientos_user on public.movimientos(user_id);


-- 3. TABLE: CONFIGURACION
create table if not exists public.configuracion (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  ingreso_mensual_base numeric(10,2) not null default 1500,
  umbral_amarillo_acumulado numeric(5,2) not null default 90,
  umbral_rojo_acumulado numeric(5,2) not null default 100,
  umbral_amarillo_velocidad numeric(5,2) not null default 100,
  umbral_rojo_velocidad numeric(5,2) not null default 130
);

alter table public.configuracion drop constraint if exists solo_una_fila;
alter table public.configuracion add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();


-- 4. TABLE: METAS
create table if not exists public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  nombre text not null,
  monto_objetivo numeric(10,2) not null,
  fecha_objetivo date,
  creado_en timestamptz not null default now()
);

alter table public.metas add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();


-- 5. TABLE: RECURRENCIAS
create table if not exists public.recurrencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  categoria_id uuid not null references public.categorias(id),
  monto numeric(10,2) not null,
  dia_del_mes int not null check (dia_del_mes between 1 and 31),
  descripcion text,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.recurrencias add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();


-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================
alter table public.categorias enable row level security;
alter table public.movimientos enable row level security;
alter table public.configuracion enable row level security;
alter table public.metas enable row level security;
alter table public.recurrencias enable row level security;

drop policy if exists "Categorias: Usuario maneja solo sus datos" on public.categorias;
drop policy if exists "Movimientos: Usuario maneja solo sus datos" on public.movimientos;
drop policy if exists "Configuracion: Usuario maneja solo sus datos" on public.configuracion;
drop policy if exists "Metas: Usuario maneja solo sus datos" on public.metas;
drop policy if exists "Recurrencias: Usuario maneja solo sus datos" on public.recurrencias;

create policy "Categorias: Usuario maneja solo sus datos" 
  on public.categorias for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Movimientos: Usuario maneja solo sus datos" 
  on public.movimientos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Configuracion: Usuario maneja solo sus datos" 
  on public.configuracion for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Metas: Usuario maneja solo sus datos" 
  on public.metas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Recurrencias: Usuario maneja solo sus datos" 
  on public.recurrencias for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ============================================================
-- AUTOMATIC ONBOARDING TRIGGER FOR NEW SIGNUPS
-- ============================================================
create or replace function public.on_auth_user_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 1. Insert default configuracion for new user
  insert into public.configuracion (user_id, ingreso_mensual_base, umbral_amarillo_acumulado, umbral_rojo_acumulado, umbral_amarillo_velocidad, umbral_rojo_velocidad)
  values (new.id, 1500.00, 90.00, 100.00, 100.00, 130.00);

  -- 2. Insert default 11 categories for new user
  insert into public.categorias (user_id, nombre, tipo, grupo, presupuesto_mensual, es_recurrente, icono, color, activa)
  values
    (new.id, 'Menú / Alimentación', 'gasto', 'Fijo Crítico', 400.00, false, 'Utensils', '#ef4444', true),
    (new.id, 'Pasajes', 'gasto', 'Fijo Crítico', 198.00, false, 'Bus', '#3b82f6', true),
    (new.id, 'Línea Celular', 'gasto', 'Fijo Crítico', 47.00, true, 'Phone', '#10b981', true),
    (new.id, 'Ahorro', 'gasto', 'Ahorro Obligatorio', 200.00, false, 'PiggyBank', '#ec4899', true),
    (new.id, 'Aporte en Casa / Servicios', 'gasto', 'Otros Básicos', 150.00, false, 'Home', '#f59e0b', true),
    (new.id, 'Aseo Personal', 'gasto', 'Otros Básicos', 30.00, false, 'Sparkles', '#06b6d4', true),
    (new.id, 'Salidas / Entretenimiento', 'gasto', 'Variable', 250.00, false, 'Beer', '#8b5cf6', true),
    (new.id, 'Antojos / Imprevistos', 'gasto', 'Variable', 100.00, false, 'Coffee', '#f97316', true),
    (new.id, 'Otros / Colchón', 'gasto', 'Libre', 125.00, false, 'CircleEllipsis', '#6b7280', true),
    (new.id, 'Sueldo / Salario', 'ingreso', 'Ingresos', 0.00, false, 'Briefcase', '#10b981', true),
    (new.id, 'Trabajos extra / Freelance', 'ingreso', 'Ingresos', 0.00, false, 'Laptop', '#06b6d4', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_trigger on auth.users;
create trigger on_auth_user_created_trigger
  after insert on auth.users
  for each row execute function public.on_auth_user_created();
