import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { normalizarMonto } from '../utils/financeUtils';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ToggleLeft, 
  ToggleRight, 
  Save, 
  X,
  FileSpreadsheet,
  Lock,
  ChevronRight,
  Shield,
  Award,
  Wallet
} from 'lucide-react';

export default function Settings({ refreshTrigger, onUpdate, showToast, onLock }) {
  const [config, setConfig] = useState({
    ingreso_mensual_base: 1500,
    umbral_amarillo_acumulado: 90,
    umbral_rojo_acumulado: 100,
    umbral_amarillo_velocidad: 100,
    umbral_rojo_velocidad: 130
  });

  const [categories, setCategories] = useState([]);
  const [recurrences, setRecurrences] = useState([]);
  const [movements, setMovements] = useState([]);

  // Submenu states
  const [activePanel, setActivePanel] = useState(null); // 'config', 'categories', 'recurrences'
  
  // Category modal states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catNombre, setCatNombre] = useState('');
  const [catTipo, setCatTipo] = useState('gasto');
  const [catGrupo, setCatGrupo] = useState('Variable');
  const [catPresupuesto, setCatPresupuesto] = useState('');
  const [catColor, setCatColor] = useState('#8b5cf6');

  // Recurrence modal states
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [recCategory, setRecCategory] = useState('');
  const [recMonto, setRecMonto] = useState('');
  const [recDia, setRecDia] = useState('1');
  const [recDesc, setRecDesc] = useState('');

  // Toggles
  const [smartAlerts, setSmartAlerts] = useState(true);
  const [balance, setBalance] = useState(585.33);

  useEffect(() => {
    async function loadData() {
      try {
        const [cfg, cats, recs, movs] = await Promise.all([
          dbService.getConfig(),
          dbService.getCategories(),
          dbService.getRecurrences(),
          dbService.getMovements()
        ]);
        if (cfg) setConfig(cfg);
        setCategories(cats);
        setRecurrences(recs);
        setMovements(movs);

        // Balance June 2026
        const juneMovs = movs.filter(m => m.fecha.startsWith('2026-06'));
        const inc = juneMovs
          .filter(m => cats.find(c => c.id === m.categoria_id)?.tipo === 'ingreso')
          .reduce((sum, m) => sum + Number(m.monto), 0);
        const exp = juneMovs
          .filter(m => cats.find(c => c.id === m.categoria_id)?.tipo === 'gasto')
          .reduce((sum, m) => sum + Number(m.monto), 0);
        setBalance(inc - exp);
      } catch (err) {
        console.error("Error loading settings", err);
      }
    }
    loadData();
  }, [refreshTrigger]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const updated = await dbService.updateConfig({
        ingreso_mensual_base: Number(config.ingreso_mensual_base),
        dia_de_pago: Number(config.dia_de_pago || 25),
        umbral_amarillo_acumulado: Number(config.umbral_amarillo_acumulado),
        umbral_rojo_acumulado: Number(config.umbral_rojo_acumulado),
        umbral_amarillo_velocidad: Number(config.umbral_amarillo_velocidad),
        umbral_rojo_velocidad: Number(config.umbral_rojo_velocidad)
      });
      setConfig(updated);
      showToast("Configuración general guardada 👍");
      setActivePanel(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleToggleCategory = async (cat) => {
    try {
      await dbService.updateCategory(cat.id, { activa: !cat.activa });
      showToast(`Categoría ${cat.nombre} ${!cat.activa ? 'activada' : 'desactivada'}`);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const openCreateCategory = () => {
    setEditingCat(null);
    setCatNombre('');
    setCatTipo('gasto');
    setCatGrupo('Variable');
    setCatPresupuesto('0');
    setCatColor('#8b5cf6');
    setIsCatModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCat(cat);
    setCatNombre(cat.nombre);
    setCatTipo(cat.tipo);
    setCatGrupo(cat.grupo || '');
    setCatPresupuesto(cat.presupuesto_mensual.toString());
    setCatColor(cat.color || '#8b5cf6');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const budget = normalizarMonto(catPresupuesto || '0');
      const catData = {
        nombre: catNombre.trim(),
        tipo: catTipo,
        grupo: catGrupo.trim(),
        presupuesto_mensual: budget,
        color: catColor
      };

      if (editingCat) {
        await dbService.updateCategory(editingCat.id, catData);
        showToast("Categoría actualizada");
      } else {
        await dbService.createCategory(catData);
        showToast("Categoría creada");
      }
      setIsCatModalOpen(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleCreateRec = async (e) => {
    e.preventDefault();
    if (!recCategory) {
      alert("Selecciona categoría");
      return;
    }
    try {
      const amount = normalizarMonto(recMonto);
      await dbService.createRecurrence({
        categoria_id: recCategory,
        monto: amount,
        dia_del_mes: Number(recDia),
        descripcion: recDesc.trim() || undefined
      });
      setIsRecModalOpen(false);
      setRecMonto('');
      setRecDesc('');
      showToast("Gasto recurrente programado");
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteRec = async (id) => {
    if (window.confirm("¿Deseas eliminar esta recurrencia programada?")) {
      try {
        await dbService.deleteRecurrence(id);
        showToast("Recurrencia eliminada");
        if (onUpdate) onUpdate();
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  return (
    <div className="settings-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
      
      {/* 1. Large Profile Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px', marginTop: '10px' }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <div style={{ 
            width: '90px', 
            height: '90px', 
            borderRadius: '50%', 
            border: '2px solid rgba(255,255,255,0.18)', 
            padding: '4px',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.7) 0%, rgba(6, 182, 212, 0.7) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '800'
            }}>
              DS
            </div>
          </div>
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            right: 0, 
            background: 'var(--status-ok)', 
            color: '#000', 
            width: '26px', 
            height: '26px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '4px solid var(--bg-primary)',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            ✓
          </div>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '800' }}>David Silva</h2>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '700', marginTop: '2px' }}>
          Miembro Platinum · Desde 2026
        </p>
      </div>

      {/* 2. Bento Grid Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
        
        <div className="glass-card" style={{ gridColumn: 'span 2', margin: 0, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '18px' }}>
          <div>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Patrimonio Neto Estimado</span>
            <h3 className="tabular-number" style={{ fontSize: '20px', fontWeight: '800', marginTop: '2px' }}>
              S/ {balance.toFixed(2)}
            </h3>
          </div>
          <Wallet size={24} style={{ color: 'rgba(255,255,255,0.06)' }} />
        </div>

        <div className="glass-card" style={{ margin: 0, padding: '14px', borderRadius: '18px' }}>
          <Award size={16} style={{ color: 'var(--status-ok)', marginBottom: '6px' }} />
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Puntos Elite</span>
          <p className="tabular-number" style={{ fontSize: '14px', fontWeight: '800', marginTop: '2px' }}>8,420</p>
        </div>

        <div className="glass-card" style={{ margin: 0, padding: '14px', borderRadius: '18px' }}>
          <Shield size={16} style={{ color: 'var(--text-muted)', marginBottom: '6px' }} />
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Seguridad</span>
          <p style={{ fontSize: '13px', fontWeight: '800', color: 'var(--status-ok)', marginTop: '2px' }}>Nivel 4 / 5</p>
        </div>

      </div>

      {/* 3. Collapsible Menus Lists */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div>
          <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', tracking: '0.08em', fontWeight: '700', marginBottom: '8px', marginLeft: '4px' }}>
            Configuración de Finanzas
          </h4>
          <div className="glass-card" style={{ margin: 0, padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
            
            <button 
              onClick={() => setActivePanel(activePanel === 'config' ? null : 'config')}
              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Límites y Alertas Globales</span>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)', transform: activePanel === 'config' ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
            </button>

            {activePanel === 'config' && (
              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '9px' }}>Ingreso Base (S/)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={config.ingreso_mensual_base}
                        onChange={(e) => setConfig({ ...config, ingreso_mensual_base: e.target.value })}
                        required
                        style={{ height: '38px', padding: '10px', fontSize: '13px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '9px' }}>Día de Pago (1-31)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        className="form-control"
                        value={config.dia_de_pago || 25}
                        onChange={(e) => setConfig({ ...config, dia_de_pago: e.target.value })}
                        required
                        style={{ height: '38px', padding: '10px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '8px' }}>Amarillo Acum (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={config.umbral_amarillo_acumulado}
                        onChange={(e) => setConfig({ ...config, umbral_amarillo_acumulado: e.target.value })}
                        required
                        style={{ height: '38px', padding: '10px', fontSize: '13px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '8px' }}>Rojo Acum (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={config.umbral_rojo_acumulado}
                        onChange={(e) => setConfig({ ...config, umbral_rojo_acumulado: e.target.value })}
                        required
                        style={{ height: '38px', padding: '10px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: '40px', borderRadius: '12px', marginTop: '6px', fontSize: '12px' }}>
                    Guardar
                  </button>
                </form>
              </div>
            )}

            <button 
              onClick={() => setActivePanel(activePanel === 'categories' ? null : 'categories')}
              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Administrar Categorías</span>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)', transform: activePanel === 'categories' ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
            </button>

            {activePanel === 'categories' && (
              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Lista de Categorías</span>
                  <button className="btn btn-secondary" onClick={openCreateCategory} style={{ padding: '6px 12px', height: '28px', fontSize: '11px', borderRadius: '8px' }}>
                    + Nueva
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {categories.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{c.nombre}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => openEditCategory(c)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}><Edit3 size={12} /></button>
                        <button onClick={() => handleToggleCategory(c)} style={{ background: 'transparent', border: 'none' }}>
                          {c.activa ? <span style={{ color: 'var(--status-ok)', fontSize: '11px' }}>🟢</span> : <span style={{ color: '#888', fontSize: '11px' }}>🔴</span>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => setActivePanel(activePanel === 'recurrences' ? null : 'recurrences')}
              style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Gastos Recurrentes Automáticos</span>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)', transform: activePanel === 'recurrences' ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
            </button>

            {activePanel === 'recurrences' && (
              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Programados</span>
                  <button className="btn btn-secondary" onClick={() => setIsRecModalOpen(true)} style={{ padding: '6px 12px', height: '28px', fontSize: '11px', borderRadius: '8px' }}>
                    + Agregar
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recurrences.map(r => {
                    const cat = categories.find(c => c.id === r.categoria_id);
                    return (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: '600' }}>{cat ? cat.nombre : 'Eliminada'}</span>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Día {r.dia_del_mes} · S/ {r.monto}</span>
                        </div>
                        <button onClick={() => handleDeleteRec(r.id)} style={{ background: 'transparent', border: 'none', color: 'var(--status-critical)' }}><Trash2 size={13} /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', tracking: '0.08em', fontWeight: '700', marginBottom: '8px', marginLeft: '4px' }}>
            Preferencias de App
          </h4>
          <div className="glass-card" style={{ margin: 0, padding: 0, overflow: 'hidden', borderRadius: '20px' }}>
            
            <button 
              onClick={() => {
                const data = {
                  categorias: localStorage.getItem('finanzas_categorias'),
                  config: localStorage.getItem('finanzas_configuracion'),
                  movimientos: localStorage.getItem('finanzas_movimientos'),
                  recurrencias: localStorage.getItem('finanzas_recurrencias')
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Respaldo_Finanzas_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                showToast("Respaldo descargado con éxito 📂");
              }}
              style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px', display: 'flex', alignItems: 'center', justifyStyle: 'flex-start', gap: '12px', cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)' }}
            >
              <FileSpreadsheet size={16} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '13px', fontWeight: '700' }}>Exportar Respaldo Local (JSON)</span>
            </button>

          </div>
        </div>

        <button 
          onClick={onLock}
          className="btn btn-danger" 
          style={{ width: '100%', height: '48px', gap: '8px', borderRadius: '16px', marginTop: '8px' }}
        >
          <Lock size={15} /> Bloquear Aplicación
        </button>

      </div>

      {/* Category Edit Modal */}
      {isCatModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>{editingCat ? 'Editar Categoría' : 'Crear Categoría'}</h3>
              <button onClick={() => setIsCatModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  value={catNombre}
                  onChange={(e) => setCatNombre(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Grupo</label>
                <input
                  type="text"
                  className="form-control"
                  value={catGrupo}
                  onChange={(e) => setCatGrupo(e.target.value)}
                  placeholder="Ej: Variable"
                />
              </div>
              {catTipo === 'gasto' && (
                <div className="form-group">
                  <label className="form-label">Presupuesto (S/)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={catPresupuesto}
                    onChange={(e) => setCatPresupuesto(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Color (Hex)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    className="form-control"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    style={{ width: '60px', height: '40px', padding: '2px', borderRadius: '8px' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCatModalOpen(false)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recurrence Create Modal */}
      {isRecModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Programar Gasto</h3>
              <button onClick={() => setIsRecModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateRec}>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="form-control"
                  value={recCategory}
                  onChange={(e) => setRecCategory(e.target.value)}
                  required
                >
                  <option value="">Selecciona...</option>
                  {categories.filter(c => c.tipo === 'gasto' && c.activa).map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monto (S/)</label>
                <input
                  type="text"
                  className="form-control"
                  value={recMonto}
                  onChange={(e) => setRecMonto(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Día (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="form-control"
                  value={recDia}
                  onChange={(e) => setRecDia(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  className="form-control"
                  value={recDesc}
                  onChange={(e) => setRecDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsRecModalOpen(false)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Programar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
