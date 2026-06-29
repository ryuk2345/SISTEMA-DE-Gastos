-- Schema for Mis Finanzas v2.0 (Supabase / PostgreSQL)

-- 1. Table: categorias
create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  grupo text, -- text label, editable, only for visual grouping
  presupuesto_mensual numeric(10,2) not null default 0,
  es_recurrente boolean not null default false,
  icono text,
  color text,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

-- 2. Table: movimientos
create table if not exists movimientos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  categoria_id uuid not null references categorias(id), -- Blocking deletion in code, no ON DELETE CASCADE
  monto numeric(10,2) not null check (monto > 0),
  descripcion text,
  origen text not null default 'manual' check (origen in ('manual', 'voz', 'recurrente', 'ocr')),
  creado_en timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_movimientos_fecha on movimientos(fecha);
create index if not exists idx_movimientos_categoria on movimientos(categoria_id);

-- 3. Table: configuracion (Single row configuration)
create table if not exists configuracion (
  id int primary key default 1,
  ingreso_mensual_base numeric(10,2) not null default 1500,
  umbral_amarillo_acumulado numeric(5,2) not null default 90,
  umbral_rojo_acumulado numeric(5,2) not null default 100,
  umbral_amarillo_velocidad numeric(5,2) not null default 100,
  umbral_rojo_velocidad numeric(5,2) not null default 130,
  constraint solo_una_fila check (id = 1)
);

-- 4. Table: metas
create table if not exists metas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  monto_objetivo numeric(10,2) not null,
  fecha_objetivo date,
  creado_en timestamptz not null default now()
);

-- 5. Table: recurrencias
create table if not exists recurrencias (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias(id),
  monto numeric(10,2) not null,
  dia_del_mes int not null check (dia_del_mes between 1 and 31),
  descripcion text,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Enable RLS (Row Level Security) if using Supabase Auth (Good practice for scaling)
-- By default, for single user, we enable it if the user sets it up.
-- alter table categorias enable row level security;
-- alter table movimientos enable row level security;
-- alter table configuracion enable row level security;
-- alter table metas enable row level security;
-- alter table recurrencias enable row level security;
