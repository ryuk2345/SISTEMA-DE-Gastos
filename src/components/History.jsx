import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { normalizarMonto } from '../utils/financeUtils';
import { 
  Search, 
  Trash2, 
  Edit2, 
  Calendar,
  X,
  Tag
} from 'lucide-react';

export default function History({ refreshTrigger, onUpdate }) {
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Filters state
  const [filterMonth, setFilterMonth] = useState('2026-06'); // default to June 2026
  const [filterType, setFilterType] = useState('todos');
  const [filterCategory, setFilterCategory] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingMov, setEditingMov] = useState(null);
  const [editMonto, setEditMonto] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFecha, setEditFecha] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [movs, cats] = await Promise.all([
          dbService.getMovements(),
          dbService.getCategories()
        ]);
        setMovements(movs);
        setCategories(cats);
      } catch (err) {
        console.error("Error loading history data", err);
      }
    }
    loadData();
  }, [refreshTrigger]);

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este movimiento?")) {
      try {
        await dbService.deleteMovement(id);
        if (onUpdate) onUpdate();
      } catch (err) {
        alert("Error al eliminar: " + err.message);
      }
    }
  };

  const startEdit = (mov) => {
    setEditingMov(mov);
    setEditMonto(mov.monto.toString());
    setEditCategory(mov.categoria_id);
    setEditDesc(mov.descripcion || '');
    setEditFecha(mov.fecha);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const montoNormalizado = normalizarMonto(editMonto);
      await dbService.updateMovement(editingMov.id, {
        fecha: editFecha,
        categoria_id: editCategory,
        monto: montoNormalizado,
        descripcion: editDesc.trim() || null
      });
      setEditingMov(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Error al editar: " + err.message);
    }
  };

  const filteredMovements = movements.filter(m => {
    const cat = categories.find(c => c.id === m.categoria_id);
    if (!cat) return false;

    if (filterMonth && !m.fecha.startsWith(filterMonth)) return false;
    if (filterType !== 'todos' && cat.tipo !== filterType) return false;
    if (filterCategory !== 'todas' && m.categoria_id !== filterCategory) return false;

    if (searchQuery) {
      const desc = m.descripcion ? m.descripcion.toLowerCase() : '';
      const catName = cat.nombre.toLowerCase();
      const q = searchQuery.toLowerCase();
      if (!desc.includes(q) && !catName.includes(q)) return false;
    }

    return true;
  });

  const getOriginIcon = (origin) => {
    switch (origin) {
      case 'recurrente': return '🔄';
      case 'voz': return '🗣️';
      case 'ocr': return '📷';
      default: return '📱';
    }
  };

  return (
    <div className="history-container" style={{ paddingBottom: '20px' }}>
      <h1 style={{ marginBottom: '4px', fontWeight: '800' }}>Historial de Movimientos</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '24px' }}>Consulta, edita o elimina transacciones registradas.</p>

      {/* Filter and Search Panel */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', marginBottom: '20px' }}>
        
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por descripción o categoría..."
            className="form-control"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', height: '36px', fontSize: '13px', borderRadius: '12px' }}
          />
        </div>

        {/* Month & Type selection row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '9px', fontWeight: '700' }}>Mes</label>
            <input
              type="month"
              className="form-control"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{ height: '36px', padding: '8px', fontSize: '12px', borderRadius: '12px' }}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '9px', fontWeight: '700' }}>Tipo</label>
            <select
              className="form-control"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ height: '36px', padding: '8px', fontSize: '12px', borderRadius: '12px' }}
            >
              <option value="todos">Todos</option>
              <option value="gasto">Gastos</option>
              <option value="ingreso">Ingresos</option>
            </select>
          </div>
        </div>

        {/* Category filter selection */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '9px', fontWeight: '700' }}>Categoría</label>
          <select
            className="form-control"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ height: '36px', padding: '8px', fontSize: '12px', borderRadius: '12px' }}
          >
            <option value="todas">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.tipo === 'ingreso' ? '➕ ' : '➖ '}{c.nombre}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Transactions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredMovements.length > 0 ? (
          filteredMovements.map(m => {
            const cat = categories.find(c => c.id === m.categoria_id);
            return (
              <div 
                key={m.id} 
                className="glass-card" 
                style={{ 
                  margin: 0, 
                  padding: '16px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderLeft: `4px solid ${cat ? cat.color : '#888'}`,
                  borderRadius: '16px'
                }}
              >
                
                {/* Info block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '65%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', letterSpacing: '-0.01em' }}>
                      {cat ? cat.nombre : 'Sin categoría'}
                    </span>
                    <span style={{ fontSize: '12px' }} title={m.origen}>
                      {getOriginIcon(m.origen)}
                    </span>
                  </div>
                  {m.descripcion && (
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {m.descripcion}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                    <Calendar size={11} />
                    {m.fecha.split('-').reverse().join('/')}
                  </span>
                </div>

                {/* Actions and Amount */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  <span 
                    className="tabular-number"
                    style={{ 
                      fontWeight: '800', 
                      fontSize: '15px', 
                      color: cat && cat.tipo === 'ingreso' ? 'var(--status-ok)' : 'var(--text-primary)' 
                    }}
                  >
                    {cat && cat.tipo === 'ingreso' ? '+' : '-'} S/ {Number(m.monto).toFixed(2)}
                  </span>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => startEdit(m)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--status-critical)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '13px' }}>
            No se encontraron movimientos registrados
          </div>
        )}
      </div>

      {/* Edit Modal (Stitch Glassmorphic modal) */}
      {editingMov && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Editar Movimiento</h3>
              <button 
                onClick={() => setEditingMov(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={saveEdit}>
              <div className="form-group">
                <label className="form-label">Monto (S/)</label>
                <input
                  type="text"
                  className="form-control"
                  value={editMonto}
                  onChange={(e) => setEditMonto(e.target.value)}
                  required
                  style={{ fontWeight: 'bold' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="form-control"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.tipo === 'ingreso' ? '➕ ' : '➖ '}{c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  className="form-control"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  value={editFecha}
                  onChange={(e) => setEditFecha(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingMov(null)} style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
