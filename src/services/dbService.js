import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseEnabled = SUPABASE_URL && SUPABASE_ANON_KEY;
let supabase = null;

if (isSupabaseEnabled) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("Supabase Client initialized. Running in REMOTE mode.");
} else {
  console.log("Supabase credentials missing. Running in LOCAL storage mode.");
}

// ----------------------------------------
// Local Database Seeds (Embedded)
// ----------------------------------------
const SEED_CATEGORIES = [
  { id: '11111111-1111-1111-1111-111111111111', nombre: 'Menú / Alimentación', tipo: 'gasto', grupo: 'Fijo Crítico', presupuesto_mensual: 400.00, es_recurrente: false, icono: 'Utensils', color: '#ef4444', activa: true },
  { id: '22222222-2222-2222-2222-222222222222', nombre: 'Pasajes', tipo: 'gasto', grupo: 'Fijo Crítico', presupuesto_mensual: 198.00, es_recurrente: false, icono: 'Bus', color: '#3b82f6', activa: true },
  { id: '33333333-3333-3333-3333-333333333333', nombre: 'Línea Celular', tipo: 'gasto', grupo: 'Fijo Crítico', presupuesto_mensual: 47.00, es_recurrente: true, icono: 'Phone', color: '#10b981', activa: true },
  { id: '44444444-4444-4444-4444-444444444444', nombre: 'Ahorro', tipo: 'gasto', grupo: 'Ahorro Obligatorio', presupuesto_mensual: 200.00, es_recurrente: false, icono: 'PiggyBank', color: '#ec4899', activa: true },
  { id: '55555555-5555-5555-5555-555555555555', nombre: 'Aporte en Casa / Servicios', tipo: 'gasto', grupo: 'Otros Básicos', presupuesto_mensual: 150.00, es_recurrente: false, icono: 'Home', color: '#f59e0b', activa: true },
  { id: '66666666-6666-6666-6666-666666666666', nombre: 'Aseo Personal', tipo: 'gasto', grupo: 'Otros Básicos', presupuesto_mensual: 30.00, es_recurrente: false, icono: 'Sparkles', color: '#06b6d4', activa: true },
  { id: '77777777-7777-7777-7777-777777777777', nombre: 'Salidas / Entretenimiento', tipo: 'gasto', grupo: 'Variable', presupuesto_mensual: 250.00, es_recurrente: false, icono: 'Beer', color: '#8b5cf6', activa: true },
  { id: '88888888-8888-8888-8888-888888888888', nombre: 'Antojos / Imprevistos', tipo: 'gasto', grupo: 'Variable', presupuesto_mensual: 100.00, es_recurrente: false, icono: 'Coffee', color: '#f97316', activa: true },
  { id: '99999999-9999-9999-9999-999999999999', nombre: 'Otros / Colchón', tipo: 'gasto', grupo: 'Libre', presupuesto_mensual: 125.00, es_recurrente: false, icono: 'CircleEllipsis', color: '#6b7280', activa: true },
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', nombre: 'Sueldo / Salario', tipo: 'ingreso', grupo: 'Ingresos', presupuesto_mensual: 0.00, es_recurrente: false, icono: 'Briefcase', color: '#10b981', activa: true },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', nombre: 'Trabajos extra / Freelance', tipo: 'ingreso', grupo: 'Ingresos', presupuesto_mensual: 0.00, es_recurrente: false, icono: 'Laptop', color: '#06b6d4', activa: true }
];

const SEED_CONFIG = {
  ingreso_mensual_base: 1500.00,
  umbral_amarillo_acumulado: 90.00,
  umbral_rojo_acumulado: 100.00,
  umbral_amarillo_velocidad: 100.00,
  umbral_rojo_velocidad: 130.00
};

const SEED_MOVEMENTS = [
  { id: 'm1', fecha: '2026-06-25', categoria_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', monto: 1500.00, descripcion: 'Sueldo junio', origen: 'manual', creado_en: '2026-06-25T16:48:47.000Z' },
  { id: 'm2', fecha: '2026-06-25', categoria_id: '44444444-4444-4444-4444-444444444444', monto: 200.00, descripcion: 'Ahorro junio', origen: 'manual', creado_en: '2026-06-25T16:52:40.000Z' },
  { id: 'm3', fecha: '2026-06-25', categoria_id: '33333333-3333-3333-3333-333333333333', monto: 46.17, descripcion: 'Línea celular', origen: 'manual', creado_en: '2026-06-25T16:54:38.000Z' },
  { id: 'm4', fecha: '2026-06-25', categoria_id: '22222222-2222-2222-2222-222222222222', monto: 2.00, descripcion: 'Pasaje', origen: 'manual', creado_en: '2026-06-25T17:49:40.000Z' },
  { id: 'm5', fecha: '2026-06-25', categoria_id: '77777777-7777-7777-7777-777777777777', monto: 16.00, descripcion: 'Te marcha', origen: 'manual', creado_en: '2026-06-25T18:28:36.000Z' },
  { id: 'm6', fecha: '2026-06-25', categoria_id: '88888888-8888-8888-8888-888888888888', monto: 64.00, descripcion: 'Casaca barclif', origen: 'manual', creado_en: '2026-06-25T19:06:32.000Z' },
  { id: 'm7', fecha: '2026-06-25', categoria_id: '88888888-8888-8888-8888-888888888888', monto: 6.00, descripcion: 'Limpiador de pantalla', origen: 'manual', creado_en: '2026-06-25T19:16:51.000Z' },
  { id: 'm8', fecha: '2026-06-25', categoria_id: '66666666-6666-6666-6666-666666666666', monto: 20.00, descripcion: 'Aseo', origen: 'manual', creado_en: '2026-06-25T19:35:23.000Z' },
  { id: 'm9', fecha: '2026-06-25', categoria_id: '88888888-8888-8888-8888-888888888888', monto: 12.00, descripcion: 'Broaster', origen: 'manual', creado_en: '2026-06-25T19:53:22.000Z' },
  { id: 'm10', fecha: '2026-06-26', categoria_id: '55555555-5555-5555-5555-555555555555', monto: 18.50, descripcion: '', origen: 'manual', creado_en: '2026-06-26T07:48:28.000Z' },
  { id: 'm11', fecha: '2026-06-26', categoria_id: '99999999-9999-9999-9999-999999999999', monto: 35.00, descripcion: 'arreglo bicleta', origen: 'manual', creado_en: '2026-06-26T08:37:58.000Z' },
  { id: 'm12', fecha: '2026-06-26', categoria_id: '22222222-2222-2222-2222-222222222222', monto: 2.00, descripcion: '', origen: 'manual', creado_en: '2026-06-26T12:39:15.000Z' },
  { id: 'm13', fecha: '2026-06-26', categoria_id: '99999999-9999-9999-9999-999999999999', monto: 25.00, descripcion: 'Cargador', origen: 'manual', creado_en: '2026-06-26T12:40:51.000Z' },
  { id: 'm14', fecha: '2026-06-26', categoria_id: '99999999-9999-9999-9999-999999999999', monto: 45.00, descripcion: 'Adaptador', origen: 'manual', creado_en: '2026-06-26T12:41:34.000Z' },
  { id: 'm15', fecha: '2026-06-26', categoria_id: '77777777-7777-7777-7777-777777777777', monto: 80.00, descripcion: 'Case', origen: 'manual', creado_en: '2026-06-26T12:42:05.000Z' },
  { id: 'm16', fecha: '2026-06-26', categoria_id: '11111111-1111-1111-1111-111111111111', monto: 20.00, descripcion: 'Leche', origen: 'manual', creado_en: '2026-06-26T12:42:28.000Z' },
  { id: 'm17', fecha: '2026-06-26', categoria_id: '11111111-1111-1111-1111-111111111111', monto: 20.00, descripcion: 'Leche', origen: 'manual', creado_en: '2026-06-26T12:42:53.000Z' },
  { id: 'm18', fecha: '2026-06-26', categoria_id: '55555555-5555-5555-5555-555555555555', monto: 100.00, descripcion: 'Aporte de casa', origen: 'manual', creado_en: '2026-06-27T08:39:22.000Z' },
  { id: 'm19', fecha: '2026-06-26', categoria_id: '99999999-9999-9999-9999-999999999999', monto: 20.00, descripcion: 'Starbuks', origen: 'manual', creado_en: '2026-06-27T08:40:17.000Z' },
  { id: 'm20', fecha: '2026-06-26', categoria_id: '77777777-7777-7777-7777-777777777777', monto: 20.00, descripcion: 'Salida', origen: 'manual', creado_en: '2026-06-27T08:40:44.000Z' },
  { id: 'm21', fecha: '2026-06-26', categoria_id: '77777777-7777-7777-7777-777777777777', monto: 99.00, descripcion: 'Compra que no se debió realizar de app', origen: 'manual', creado_en: '2026-06-27T08:48:39.000Z' },
  { id: 'm22', fecha: '2026-06-27', categoria_id: '88888888-8888-8888-8888-888888888888', monto: 8.00, descripcion: 'agua mineral', origen: 'manual', creado_en: '2026-06-28T13:05:18.000Z' },
  { id: 'm23', fecha: '2026-06-28', categoria_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', monto: 13.20, descripcion: 'kilometrico', origen: 'manual', creado_en: '2026-06-28T13:06:01.000Z' },
  { id: 'm24', fecha: '2026-06-28', categoria_id: '77777777-7777-7777-7777-777777777777', monto: 16.00, descripcion: 'hamburguesa', origen: 'manual', creado_en: '2026-06-28T13:06:53.000Z' },
  { id: 'm25', fecha: '2026-06-28', categoria_id: '55555555-5555-5555-5555-555555555555', monto: 30.00, descripcion: 'salida con Karen', origen: 'manual', creado_en: '2026-06-28T13:07:30.000Z' },
  { id: 'm26', fecha: '2026-06-28', categoria_id: '66666666-6666-6666-6666-666666666666', monto: 10.00, descripcion: 'desayuno', origen: 'manual', creado_en: '2026-06-28T13:07:57.000Z' }
];

const SEED_RECURRENCES = [
  { id: '33333333-3333-3333-3333-333333333333', categoria_id: '33333333-3333-3333-3333-333333333333', monto: 47.00, dia_del_mes: 25, descripcion: 'Línea Celular Recurrente', activa: true }
];

const SEED_METAS = [
  { id: 'meta-cusco', nombre: 'Viaje a Cusco', monto_objetivo: 3000.00, fecha_objetivo: '2026-12-31' }
];

// Helper to write to local storage
const getLocal = (key, defaultValue) => {
  const value = localStorage.getItem(key);
  if (!value) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(value);
};

const setLocal = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initialize Local DB if empty
const initLocalDb = () => {
  getLocal('finanzas_categorias', SEED_CATEGORIES);
  getLocal('finanzas_configuracion', SEED_CONFIG);
  getLocal('finanzas_movimientos', SEED_MOVEMENTS);
  getLocal('finanzas_recurrencias', SEED_RECURRENCES);
  getLocal('finanzas_metas', SEED_METAS);
};

initLocalDb();

// ----------------------------------------
// Unified Database Operations (API Surface)
// ----------------------------------------
export const dbService = {
  // Config Operations
  async getConfig() {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('configuracion').select('*').eq('id', 1).single();
      if (error || !data) {
        console.warn('configuracion table empty or error, using defaults:', error?.message);
        // Auto-insert default config so next load works
        await supabase.from('configuracion').upsert({ id: 1, ...SEED_CONFIG }).select().single();
        return SEED_CONFIG;
      }
      return data;
    } else {
      return getLocal('finanzas_configuracion', SEED_CONFIG);
    }
  },

  async updateConfig(newConfig) {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('configuracion').upsert({ id: 1, ...newConfig }).select().single();
      if (error) throw error;
      return data;
    } else {
      const current = getLocal('finanzas_configuracion', SEED_CONFIG);
      const updated = { ...current, ...newConfig };
      setLocal('finanzas_configuracion', updated);
      return updated;
    }
  },

  // Categories Operations
  async getCategories() {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('categorias').select('*').order('nombre', { ascending: true });
      if (error || !data || data.length === 0) {
        console.warn('categorias table empty or error, using seed defaults:', error?.message);
        return SEED_CATEGORIES;
      }
      return data;
    } else {
      return getLocal('finanzas_categorias', SEED_CATEGORIES);
    }
  },

  async createCategory(category) {
    const newCategory = {
      id: crypto.randomUUID(),
      creado_en: new Date().toISOString(),
      activa: true,
      ...category
    };

    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('categorias').insert(newCategory).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocal('finanzas_categorias', SEED_CATEGORIES);
      list.push(newCategory);
      setLocal('finanzas_categorias', list);
      return newCategory;
    }
  },

  async updateCategory(id, updates) {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('categorias').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocal('finanzas_categorias', SEED_CATEGORIES);
      const idx = list.findIndex(c => c.id === id);
      if (idx === -1) throw new Error("Categoría no encontrada");
      list[idx] = { ...list[idx], ...updates };
      setLocal('finanzas_categorias', list);
      return list[idx];
    }
  },

  // Movements Operations
  async getMovements() {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('movimientos').select('*').order('fecha', { ascending: false }).order('creado_en', { ascending: false });
      if (error) {
        console.warn('movimientos query error, using seed defaults:', error?.message);
        return SEED_MOVEMENTS;
      }
      return data || [];
    } else {
      return getLocal('finanzas_movimientos', SEED_MOVEMENTS);
    }
  },

  async createMovement(movement) {
    const newMovement = {
      id: crypto.randomUUID(),
      creado_en: new Date().toISOString(),
      origen: 'manual',
      ...movement
    };

    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('movimientos').insert(newMovement).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocal('finanzas_movimientos', SEED_MOVEMENTS);
      list.push(newMovement);
      setLocal('finanzas_movimientos', list);
      return newMovement;
    }
  },

  async updateMovement(id, updates) {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('movimientos').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocal('finanzas_movimientos', SEED_MOVEMENTS);
      const idx = list.findIndex(m => m.id === id);
      if (idx === -1) throw new Error("Movimiento no encontrado");
      list[idx] = { ...list[idx], ...updates };
      setLocal('finanzas_movimientos', list);
      return list[idx];
    }
  },

  async deleteMovement(id) {
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('movimientos').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const list = getLocal('finanzas_movimientos', SEED_MOVEMENTS);
      const filtered = list.filter(m => m.id !== id);
      if (list.length === filtered.length) throw new Error("Movimiento no encontrado");
      setLocal('finanzas_movimientos', filtered);
      return true;
    }
  },

  // Recurrencias Operations
  async getRecurrences() {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('recurrencias').select('*').order('dia_del_mes', { ascending: true });
      if (error) throw error;
      return data;
    } else {
      return getLocal('finanzas_recurrencias', SEED_RECURRENCES);
    }
  },

  async createRecurrence(recurrence) {
    const newRec = {
      id: crypto.randomUUID(),
      creado_en: new Date().toISOString(),
      activa: true,
      ...recurrence
    };

    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('recurrencias').insert(newRec).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocal('finanzas_recurrencias', SEED_RECURRENCES);
      list.push(newRec);
      setLocal('finanzas_recurrencias', list);
      return newRec;
    }
  },

  async updateRecurrence(id, updates) {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('recurrencias').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocal('finanzas_recurrencias', SEED_RECURRENCES);
      const idx = list.findIndex(r => r.id === id);
      if (idx === -1) throw new Error("Recurrencia no encontrada");
      list[idx] = { ...list[idx], ...updates };
      setLocal('finanzas_recurrencias', list);
      return list[idx];
    }
  },

  async deleteRecurrence(id) {
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('recurrencias').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const list = getLocal('finanzas_recurrencias', SEED_RECURRENCES);
      const filtered = list.filter(r => r.id !== id);
      if (list.length === filtered.length) throw new Error("Recurrencia no encontrada");
      setLocal('finanzas_recurrencias', filtered);
      return true;
    }
  },

  // Metas Operations
  async getGoals() {
    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('metas').select('*').order('creado_en', { ascending: true });
      if (error) throw error;
      return data;
    } else {
      return getLocal('finanzas_metas', SEED_METAS);
    }
  },

  async createGoal(goal) {
    const newGoal = {
      id: crypto.randomUUID(),
      creado_en: new Date().toISOString(),
      ...goal
    };

    if (isSupabaseEnabled) {
      const { data, error } = await supabase.from('metas').insert(newGoal).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getLocal('finanzas_metas', SEED_METAS);
      list.push(newGoal);
      setLocal('finanzas_metas', list);
      return newGoal;
    }
  },

  async deleteGoal(id) {
    if (isSupabaseEnabled) {
      const { error } = await supabase.from('metas').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const list = getLocal('finanzas_metas', SEED_METAS);
      const filtered = list.filter(g => g.id !== id);
      if (list.length === filtered.length) throw new Error("Meta no encontrada");
      setLocal('finanzas_metas', filtered);
      return true;
    }
  }
};
