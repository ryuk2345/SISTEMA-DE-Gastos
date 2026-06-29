---
name: modelo-datos-finanzas
description: Usar esta skill al diseñar o modificar el esquema de base de datos (tablas, relaciones, migraciones SQL) de la app "Mis Finanzas", o al configurar Supabase/Postgres para el proyecto. Es la referencia central de todas las tablas y sus relaciones — consultar antes de crear cualquier migración nueva para mantener consistencia con el resto del sistema.
---

# Modelo de Datos — Mis Finanzas

Stack de referencia: **Supabase (Postgres)**, proyecto de un solo usuario (David). Esta skill centraliza el esquema completo; las demás skills del proyecto referencian estas tablas sin redefinirlas.

## Tabla: `categorias`

```sql
create table categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  grupo text, -- texto libre, editable, solo agrupación visual
  presupuesto_mensual numeric(10,2) not null default 0,
  es_recurrente boolean not null default false,
  icono text,
  color text,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);
```

## Tabla: `movimientos`

```sql
create table movimientos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  categoria_id uuid not null references categorias(id),
  monto numeric(10,2) not null check (monto > 0),
  descripcion text,
  origen text not null default 'manual' check (origen in ('manual', 'voz', 'recurrente', 'ocr')),
  creado_en timestamptz not null default now()
);

create index idx_movimientos_fecha on movimientos(fecha);
create index idx_movimientos_categoria on movimientos(categoria_id);
```

El "mes" de un movimiento se deriva siempre de `fecha` (ej. `date_trunc('month', fecha)`), nunca se almacena como columna redundante — evita inconsistencias si se edita la fecha de un movimiento después.

## Tabla: `configuracion`

Tabla de una sola fila (configuración global del usuario único):

```sql
create table configuracion (
  id int primary key default 1,
  ingreso_mensual_base numeric(10,2) not null default 1500,
  umbral_amarillo_acumulado numeric(5,2) not null default 90,
  umbral_rojo_acumulado numeric(5,2) not null default 100,
  umbral_amarillo_velocidad numeric(5,2) not null default 100,
  umbral_rojo_velocidad numeric(5,2) not null default 130,
  constraint solo_una_fila check (id = 1)
);
```

## Tabla: `metas`

```sql
create table metas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  monto_objetivo numeric(10,2) not null,
  fecha_objetivo date,
  creado_en timestamptz not null default now()
);
```

`monto_acumulado` de una meta NO se almacena como columna — se calcula dinámicamente sumando los aportes registrados (ej. movimientos de categoría "Ahorro" vinculados a esa meta, o una tabla puente `meta_aportes` si se requiere asociar aportes a metas específicas).

## Tabla: `recurrencias` (soporta gastos automáticos, ver skill `registro-movimientos`)

```sql
create table recurrencias (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias(id),
  monto numeric(10,2) not null,
  dia_del_mes int not null check (dia_del_mes between 1 and 31),
  descripcion text,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);
```

Un proceso programado (ej. Supabase Edge Function con cron, o job externo) recorre `recurrencias` activas y genera el `movimiento` correspondiente cada mes con `origen = 'recurrente'`.

## Reglas de integridad importantes

- **No eliminar categorías en cascada**: si una categoría tiene movimientos asociados, el `DELETE` debe bloquearse a nivel de aplicación (mostrar advertencia) o usarse `activa = false` en su lugar. No usar `ON DELETE CASCADE` en la FK de `movimientos.categoria_id`.
- **Nunca duplicar cálculos derivados como columnas**: `% usado`, `disponible`, `estado del semáforo`, `gasto proyectado` (ver skills `presupuesto-semaforo` y `alertas-velocidad-gasto`) son siempre calculados en tiempo de consulta o en el backend, no almacenados como columnas que puedan desincronizarse del dato real.
- **Row Level Security (RLS)**: aunque es un solo usuario, si se usa Supabase con auth, habilitar RLS en todas las tablas y restringir por `auth.uid()` como buena práctica desde el inicio — facilita escalar a multiusuario en el futuro sin reescribir el esquema, aunque esa NO es una prioridad actual del proyecto.

## Datos de referencia para validar migraciones

Al migrar el histórico de junio 2026 (ver skill `registro-movimientos`), los totales deben cuadrar exactamente con: Ingresos S/ 1,500.00, Gastos S/ 914.67, Balance S/ 585.33, Ahorro S/ 200.00. Usar esto como query de validación post-migración.
