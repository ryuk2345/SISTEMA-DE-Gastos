-- Seed Data for Mis Finanzas v2.0 (Supabase / PostgreSQL)

-- 1. Seed Config (Single row)
insert into configuracion (id, ingreso_mensual_base, umbral_amarillo_acumulado, umbral_rojo_acumulado, umbral_amarillo_velocidad, umbral_rojo_velocidad)
values (1, 1500.00, 90.00, 100.00, 100.00, 130.00)
on conflict (id) do update set
  ingreso_mensual_base = excluded.ingreso_mensual_base,
  umbral_amarillo_acumulado = excluded.umbral_amarillo_acumulado,
  umbral_rojo_acumulado = excluded.umbral_rojo_acumulado,
  umbral_amarillo_velocidad = excluded.umbral_amarillo_velocidad,
  umbral_rojo_velocidad = excluded.umbral_rojo_velocidad;

-- 2. Seed Categories with Static UUIDs for consistency
insert into categorias (id, nombre, tipo, grupo, presupuesto_mensual, es_recurrente, icono, color, activa)
values 
  ('11111111-1111-1111-1111-111111111111', 'Menú / Alimentación', 'gasto', 'Fijo Crítico', 400.00, false, 'Utensils', '#ef4444', true),
  ('22222222-2222-2222-2222-222222222222', 'Pasajes', 'gasto', 'Fijo Crítico', 198.00, false, 'Bus', '#3b82f6', true),
  ('33333333-3333-3333-3333-333333333333', 'Línea Celular', 'gasto', 'Fijo Crítico', 47.00, true, 'Phone', '#10b981', true),
  ('44444444-4444-4444-4444-444444444444', 'Ahorro', 'gasto', 'Ahorro Obligatorio', 200.00, false, 'PiggyBank', '#ec4899', true),
  ('55555555-5555-5555-5555-555555555555', 'Aporte en Casa / Servicios', 'gasto', 'Otros Básicos', 150.00, false, 'Home', '#f59e0b', true),
  ('66666666-6666-6666-6666-666666666666', 'Aseo Personal', 'gasto', 'Otros Básicos', 30.00, false, 'Sparkles', '#06b6d4', true),
  ('77777777-7777-7777-7777-777777777777', 'Salidas / Entretenimiento', 'gasto', 'Variable', 250.00, false, 'Beer', '#8b5cf6', true),
  ('88888888-8888-8888-8888-888888888888', 'Antojos / Imprevistos', 'gasto', 'Variable', 100.00, false, 'Coffee', '#f97316', true),
  ('99999999-9999-9999-9999-999999999999', 'Otros / Colchón', 'gasto', 'Libre', 125.00, false, 'CircleEllipsis', '#6b7280', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sueldo / Salario', 'ingreso', 'Ingresos', 0.00, false, 'Briefcase', '#10b981', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Trabajos extra / Freelance', 'ingreso', 'Ingresos', 0.00, false, 'Laptop', '#06b6d4', true)
on conflict (id) do nothing;

-- 3. Seed 26 Movements of June 2026 (Historic Migration)
insert into movimientos (fecha, categoria_id, monto, descripcion, origen, creado_en)
values
  ('2026-06-25', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1500.00, 'Sueldo junio', 'manual', '2026-06-25 16:48:47+00'),
  ('2026-06-25', '44444444-4444-4444-4444-444444444444', 200.00, 'Ahorro junio', 'manual', '2026-06-25 16:52:40+00'),
  ('2026-06-25', '33333333-3333-3333-3333-333333333333', 46.17, 'Línea celular', 'manual', '2026-06-25 16:54:38+00'),
  ('2026-06-25', '22222222-2222-2222-2222-222222222222', 2.00, 'Pasaje', 'manual', '2026-06-25 17:49:40+00'),
  ('2026-06-25', '77777777-7777-7777-7777-777777777777', 16.00, 'Te marcha', 'manual', '2026-06-25 18:28:36+00'),
  ('2026-06-25', '88888888-8888-8888-8888-888888888888', 64.00, 'Casaca barclif', 'manual', '2026-06-25 19:06:32+00'),
  ('2026-06-25', '88888888-8888-8888-8888-888888888888', 6.00, 'Limpiador de pantalla', 'manual', '2026-06-25 19:16:51+00'),
  ('2026-06-25', '66666666-6666-6666-6666-666666666666', 20.00, 'Aseo', 'manual', '2026-06-25 19:35:23+00'),
  ('2026-06-25', '88888888-8888-8888-8888-888888888888', 12.00, 'Broaster', 'manual', '2026-06-25 19:53:22+00'),
  ('2026-06-26', '55555555-5555-5555-5555-555555555555', 18.50, '', 'manual', '2026-06-26 07:48:28+00'),
  ('2026-06-26', '99999999-9999-9999-9999-999999999999', 35.00, 'arreglo bicleta', 'manual', '2026-06-26 08:37:58+00'),
  ('2026-06-26', '22222222-2222-2222-2222-222222222222', 2.00, '', 'manual', '2026-06-26 12:39:15+00'),
  ('2026-06-26', '99999999-9999-9999-9999-999999999999', 25.00, 'Cargador', 'manual', '2026-06-26 12:40:51+00'),
  ('2026-06-26', '99999999-9999-9999-9999-999999999999', 45.00, 'Adaptador', 'manual', '2026-06-26 12:41:34+00'),
  ('2026-06-26', '77777777-7777-7777-7777-777777777777', 80.00, 'Case', 'manual', '2026-06-26 12:42:05+00'),
  ('2026-06-26', '11111111-1111-1111-1111-111111111111', 20.00, 'Leche', 'manual', '2026-06-26 12:42:28+00'),
  ('2026-06-26', '11111111-1111-1111-1111-111111111111', 20.00, 'Leche', 'manual', '2026-06-26 12:42:53+00'),
  ('2026-06-26', '55555555-5555-5555-5555-555555555555', 100.00, 'Aporte de casa', 'manual', '2026-06-27 08:39:22+00'),
  ('2026-06-26', '99999999-9999-9999-9999-999999999999', 20.00, 'Starbuks', 'manual', '2026-06-27 08:40:17+00'),
  ('2026-06-26', '77777777-7777-7777-7777-777777777777', 20.00, 'Salida', 'manual', '2026-06-27 08:40:44+00'),
  ('2026-06-26', '77777777-7777-7777-7777-777777777777', 99.00, 'Compra que no se debió realizar de app', 'manual', '2026-06-27 08:48:39+00'),
  ('2026-06-27', '88888888-8888-8888-8888-888888888888', 8.00, 'agua mineral', 'manual', '2026-06-28 13:05:18+00'),
  ('2026-06-28', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 13.20, 'kilometrico', 'manual', '2026-06-28 13:06:01+00'),
  ('2026-06-28', '77777777-7777-7777-7777-777777777777', 16.00, 'hamburguesa', 'manual', '2026-06-28 13:06:53+00'),
  ('2026-06-28', '55555555-5555-5555-5555-555555555555', 30.00, 'salida con Karen', 'manual', '2026-06-28 13:07:30+00'),
  ('2026-06-28', '66666666-6666-6666-6666-666666666666', 10.00, 'desayuno', 'manual', '2026-06-28 13:07:57+00');

-- 4. Seed Recurring Template (P0) for Línea Celular S/ 47 on day 25 (registered automatically monthly)
insert into recurrencias (id, categoria_id, monto, dia_del_mes, descripcion, activa)
values ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 47.00, 25, 'Línea Celular Recurrente', true)
on conflict (id) do nothing;
