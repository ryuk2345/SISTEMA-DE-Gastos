-- ============================================================
-- MIS FINANZAS v2.0 - MULTI-TENANT SAAS MIGRATION SCRIPT
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. ADD USER_ID TO CATEGORIAS
alter table if exists categorias 
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- 2. ADD USER_ID TO MOVIMIENTOS
alter table if exists movimientos 
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- 3. REFACTOR CONFIGURACION FOR MULTI-TENANT (USER_ID AS PRIMARY KEY)
-- Drop old single-row constraint if exists
alter table if exists configuracion drop constraint if exists solo_una_fila;

-- Add user_id column
alter table if exists configuracion 
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- 4. ADD USER_ID TO METAS
alter table if exists metas 
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- 5. ADD USER_ID TO RECURRENCIAS
alter table if exists recurrencias 
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();


-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ============================================================
alter table categorias enable row level security;
alter table movimientos enable row level security;
alter table configuracion enable row level security;
alter table metas enable row level security;
alter table recurrencias enable row level security;

-- DROP EXISTING POLICIES TO PREVENT DUPLICATES
drop policy if exists "Categorias: Usuario maneja solo sus datos" on categorias;
drop policy if exists "Movimientos: Usuario maneja solo sus datos" on movimientos;
drop policy if exists "Configuracion: Usuario maneja solo sus datos" on configuracion;
drop policy if exists "Metas: Usuario maneja solo sus datos" on metas;
drop policy if exists "Recurrencias: Usuario maneja solo sus datos" on recurrencias;

-- CREATE RLS POLICIES FOR USER DATA ISOLATION
create policy "Categorias: Usuario maneja solo sus datos" 
  on categorias for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

create policy "Movimientos: Usuario maneja solo sus datos" 
  on movimientos for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

create policy "Configuracion: Usuario maneja solo sus datos" 
  on configuracion for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

create policy "Metas: Usuario maneja solo sus datos" 
  on metas for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

create policy "Recurrencias: Usuario maneja solo sus datos" 
  on recurrencias for all 
  using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);


-- ============================================================
-- AUTOMATIC ONBOARDING TRIGGER (SEEDS DEFAULT CATEGORIES & CONFIG ON SIGNUP)
-- ============================================================
create or replace function public.on_auth_user_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- 1. Insert default configuracion for new user
  insert into public.configuracion (user_id, ingreso_mensual_base, umbral_amarillo_acumulado, umbral_rojo_acumulado, umbral_amarillo_velocidad, umbral_rojo_velocidad)
  values (new.id, 1500.00, 90.00, 100.00, 100.00, 130.00)
  on conflict do nothing;

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
    (new.id, 'Trabajos extra / Freelance', 'ingreso', 'Ingresos', 0.00, false, 'Laptop', '#06b6d4', true)
  on conflict do nothing;

  return new;
end;
$$;

-- ATTACH TRIGGER TO AUTH.USERS TABLE
drop trigger if exists on_auth_user_created_trigger on auth.users;
create trigger on_auth_user_created_trigger
  after insert on auth.users
  for each row execute function public.on_auth_user_created();
