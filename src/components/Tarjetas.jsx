import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { normalizarMonto } from '../utils/financeUtils';
import { 
  CreditCard, 
  ChevronRight, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Calendar,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function Tarjetas({ refreshTrigger, onUpdate, showToast }) {
  // 3D Card Stack State
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [cardLimit, setCardLimit] = useState(5000);

  // Transaction History States (embedded at the bottom of the card list)
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('2026-06');
  const [filterType, setFilterType] = useState('todos');
  const [filterCategory, setFilterCategory] = useState('todas');

  // Editing transaction state
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
        console.error("Error loading data in cards", err);
      }
    }
    loadData();
  }, [refreshTrigger]);

  const cardsData = [
    {
      id: 'platinum',
      name: 'Platinum Card',
      number: '•••• •••• •••• 4892',
      expiry: '09/31',
      balance: 'S/ 585.33',
      color: 'linear-gradient(135deg, #1e1f29 0%, #0d0e12 100%)',
      border: 'rgba(255,255,255,0.15)',
      glow: 'rgba(255,255,255,0.06)'
    },
    {
      id: 'savings',
      name: 'Ahorro Obligatorio',
      number: '•••• •••• •••• 1029',
      expiry: '12/32',
      balance: 'S/ 200.00',
      color: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
      border: 'rgba(77,224,130,0.3)',
      glow: 'rgba(77,224,130,0.1)'
    },
    {
      id: 'virtual',
      name: 'Virtual Freelance',
      number: '•••• •••• •••• 8831',
      expiry: '04/30',
      balance: 'S/ 13.20',
      color: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
      border: 'rgba(245,158,11,0.3)',
      glow: 'rgba(245,158,11,0.1)'
    }
  ];

  const handleCardClick = (idx) => {
    setActiveCardIndex(idx);
  };

  const handleFreezeToggle = () => {
    setIsFrozen(!isFrozen);
    showToast(isFrozen ? "Tarjeta Descongelada 🔓" : "Tarjeta Congelada Temporalmente ❄️");
  };

  // Transaction Actions
  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este movimiento?")) {
      try {
        await dbService.deleteMovement(id);
        showToast("Movimiento eliminado con éxito");
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
      showToast("Movimiento editado con éxito");
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Error al editar: " + err.message);
    }
  };

  // History filtering
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
    <div style={{ paddingBottom: '20px' }}>
      
      {/* Tab Title */}
      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '10px', color: '#a78bfa', textTransform: 'uppercase', tracking: '0.12em', fontWeight: '800' }}>
          Monederos e Historial
        </span>
        <h1 style={{ fontWeight: '800', marginTop: '2px' }}>Mis Tarjetas</h1>
      </div>

      {/* 3D Stack of Cards */}
      <div className="card-stack-container" style={{ position: 'relative', height: '240px', marginTop: '24px' }}>
        {cardsData.map((card, idx) => {
          // Calculate relative positions in the stack
          let cardClass = 'card-item';
          const relativeIdx = (idx - activeCardIndex + cardsData.length) % cardsData.length;

          if (relativeIdx === 0) cardClass += ' card-active';
          else if (relativeIdx === 1) cardClass += ' card-behind-1';
          else cardClass += ' card-behind-2';

          return (
            <div 
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className={cardClass}
              style={{ 
                background: card.color,
                border: `1px solid ${card.border}`,
                boxShadow: `0 16px 36px rgba(0,0,0,0.5), 0 0 20px ${card.glow}`,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: isFrozen && relativeIdx === 0 ? 0.45 : undefined
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', items: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)' }}>
                  {card.name}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800' }}>VISA</span>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Saldo Disponible
                </span>
                <h2 className="tabular-number neon-glow" style={{ fontSize: '28px', fontWeight: '800', color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.25)' }}>
                  {card.balance}
                </h2>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                <span className="tabular-number">{showDetails ? card.number : '•••• •••• •••• ' + card.number.split(' ').pop()}</span>
                <span className="tabular-number">EXP: {card.expiry}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Controls Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
        <button 
          onClick={handleFreezeToggle}
          className="btn btn-secondary" 
          style={{ height: '44px', fontSize: '12px', borderRadius: '14px', border: isFrozen ? '1px solid var(--status-ok)' : '1px solid var(--border-color)' }}
        >
          {isFrozen ? 'Descongelar' : 'Congelar Tarjeta'}
        </button>

        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="btn btn-secondary" 
          style={{ height: '44px', fontSize: '12px', borderRadius: '14px' }}
        >
          {showDetails ? 'Ocultar Cifras' : 'Ver Cifras'}
        </button>
      </div>

      {/* Transaction History Section at the bottom */}
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '800' }}>Actividad Reciente</h3>

      {/* Filter and Search Panel */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', marginBottom: '20px' }}>
        
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar transacciones..."
            className="form-control"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', height: '38px', fontSize: '13px', borderRadius: '12px' }}
          />
        </div>

        {/* Triple Select Filter Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '8px' }}>
          <select 
            className="form-control"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{ height: '34px', padding: '0 8px', fontSize: '11px', borderRadius: '8px' }}
          >
            <option value="">Cualquier Mes</option>
            <option value="2026-06">Junio 2026</option>
            <option value="2026-05">Mayo 2026</option>
          </select>

          <select 
            className="form-control"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ height: '34px', padding: '0 8px', fontSize: '11px', borderRadius: '8px' }}
          >
            <option value="todos">Todos</option>
            <option value="gasto">Gastos</option>
            <option value="ingreso">Ingresos</option>
          </select>

          <select 
            className="form-control"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ height: '34px', padding: '0 8px', fontSize: '11px', borderRadius: '8px' }}
          >
            <option value="todas">Categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Timeline items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredMovements.length > 0 ? (
          filteredMovements.map(mov => {
            const cat = categories.find(c => c.id === mov.categoria_id);
            const isGasto = cat ? cat.tipo === 'gasto' : true;
            
            // Format dates
            const dateParts = mov.fecha.split('-');
            const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : mov.fecha;

            return (
              <div 
                key={mov.id} 
                className="glass-card" 
                style={{ 
                  margin: 0, 
                  padding: '14px 16px', 
                  borderRadius: '16px',
                  borderLeft: `4px solid ${cat ? cat.color : '#fff'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '65%' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>
                    {getOriginIcon(mov.origen)}
                  </span>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {mov.descripcion || (cat ? cat.nombre : 'Sin descripción')}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '600' }}>
                      {formattedDate} · {cat ? cat.nombre : 'General'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span 
                    className="tabular-number" 
                    style={{ 
                      fontSize: '14px', 
                      fontWeight: '800', 
                      color: isGasto ? 'var(--status-critical)' : 'var(--status-ok)' 
                    }}
                  >
                    {isGasto ? '-' : '+'} S/ {Number(mov.monto).toFixed(2)}
                  </span>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => startEdit(mov)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button 
                      onClick={() => handleDelete(mov.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--status-critical)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 0', fontSize: '13px' }}>
            No se encontraron transacciones en este mes.
          </div>
        )}
      </div>

      {/* Edit Popover Modal */}
      {editingMov && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Editar Movimiento</h3>
              <button onClick={() => setEditingMov(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
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
                    <option key={c.id} value={c.id}>{c.nombre}</option>
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
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingMov(null)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
