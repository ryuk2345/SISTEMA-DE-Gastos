import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { 
  calcularSemafaroAcumulado, 
  calcularVelocidadGasto 
} from '../utils/financeUtils';
import { AlertTriangle, Info } from 'lucide-react';

export default function Presupuesto({ refreshTrigger, onUpdate, showToast }) {
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [config, setConfig] = useState(null);
  
  const [gastosTotal, setGastosTotal] = useState(0);
  const [presupuestoTotal, setPresupuestoTotal] = useState(1500);
  const [consumptionRatio, setConsumptionRatio] = useState(68);
  const [disponible, setDisponible] = useState(0);
  const [diarioRecom, setDiarioRecom] = useState(0);
  const [categorySummaries, setCategorySummaries] = useState([]);
  const [sliderVal, setSliderVal] = useState(1500);

  useEffect(() => {
    async function loadData() {
      try {
        const [movs, cats, cfg] = await Promise.all([
          dbService.getMovements(),
          dbService.getCategories(),
          dbService.getConfig()
        ]);
        
        setMovements(movs);
        setCategories(cats);
        setConfig(cfg);
        
        processMetrics(movs, cats, cfg);
      } catch (err) {
        console.error("Error loading budget data", err);
      }
    }
    loadData();
  }, [selectedMonth, refreshTrigger]);

  const processMetrics = (allMovs, allCats, cfg) => {
    if (!cfg) return;

    const currentMonthMovs = allMovs.filter(m => m.fecha.startsWith(selectedMonth));
    
    // Total spent
    const spent = currentMonthMovs
      .filter(m => {
        const cat = allCats.find(c => c.id === m.categoria_id);
        return cat && cat.tipo === 'gasto';
      })
      .reduce((sum, m) => sum + Number(m.monto), 0);

    // Total budget limit
    const activeExpenseCats = allCats.filter(c => c.tipo === 'gasto' && c.activa);
    const limit = activeExpenseCats.reduce((sum, c) => sum + Number(c.presupuesto_mensual), 0);

    setGastosTotal(spent);
    setPresupuestoTotal(limit);
    setSliderVal(limit);

    // Ratio consumed
    const ratio = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    setConsumptionRatio(ratio);

    // Available
    const disp = limit - spent;
    setDisponible(disp);

    // Recommended Daily spend: Available / remaining days
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    let daysRemaining = 1;
    if (selectedMonth === currentMonthStr) {
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      daysRemaining = Math.max(1, lastDay - today.getDate());
    } else {
      // Historical or selected, assume a standard default of 15 days or total month days
      const [y, m] = selectedMonth.split('-');
      const totalDays = new Date(parseInt(y), parseInt(m), 0).getDate();
      daysRemaining = totalDays; // for reference calculation
    }
    const recommended = disp > 0 ? disp / daysRemaining : 0;
    setDiarioRecom(recommended);

    // Reference Date for Projections
    let refDate = selectedMonth + '-01';
    const monthMovsDates = currentMonthMovs.map(m => m.fecha).sort();
    if (monthMovsDates.length > 0) {
      refDate = monthMovsDates[monthMovsDates.length - 1];
    } else {
      refDate = `${selectedMonth}-28`; // default reference
    }

    // Process per-category
    const summaries = activeExpenseCats.map(cat => {
      const catSpent = currentMonthMovs
        .filter(m => m.categoria_id === cat.id)
        .reduce((sum, m) => sum + Number(m.monto), 0);

      const semStats = calcularSemafaroAcumulado(
        catSpent, 
        cat.presupuesto_mensual, 
        cfg.umbral_amarillo_acumulado, 
        cfg.umbral_rojo_acumulado
      );
      
      const speedStats = calcularVelocidadGasto(
        catSpent, 
        cat.presupuesto_mensual, 
        refDate,
        cfg.umbral_amarillo_velocidad, 
        cfg.umbral_rojo_velocidad
      );

      return {
        category: cat,
        spent: catSpent,
        budget: cat.presupuesto_mensual,
        ratioUsed: cat.presupuesto_mensual > 0 ? Math.round((catSpent / cat.presupuesto_mensual) * 100) : 0,
        ...semStats,
        speed: speedStats
      };
    });

    setCategorySummaries(summaries);
  };

  const handleSliderChange = (e) => {
    setSliderVal(Number(e.target.value));
  };

  const saveGlobalLimit = async () => {
    try {
      // Scale category budgets proportionally based on slider ratio
      const currentSum = categories.filter(c => c.tipo === 'gasto' && c.activa).reduce((sum, c) => sum + c.presupuesto_mensual, 0);
      if (currentSum === 0) return;
      const factor = sliderVal / currentSum;

      for (const cat of categories) {
        if (cat.tipo === 'gasto') {
          const newBudget = Math.round(cat.presupuesto_mensual * factor * 100) / 100;
          await dbService.updateCategory(cat.id, { presupuesto_mensual: newBudget });
        }
      }

      showToast("Límites globales recalibrados con éxito 🎯");
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      
      {/* 1. Main Progress Liquid Card */}
      <div 
        className="glass-card liquid-fill" 
        style={{ 
          height: '192px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          padding: '24px',
          marginBottom: '20px',
          border: '1px solid rgba(255,255,255,0.12)'
        }}
      >
        <div style={{ zIndex: 10 }}>
          <p className="font-label-sm" style={{ color: 'var(--text-secondary)', tracking: '0.12em', fontSize: '10px' }}>
            GASTO MENSUAL TOTAL
          </p>
          <h2 style={{ fontSize: '30px', fontWeight: '800', marginTop: '6px' }}>
            S/ {gastosTotal.toFixed(2)}
          </h2>
        </div>

        <div style={{ zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <span className="tabular-number" style={{ fontSize: '13px', fontWeight: '800', color: 'var(--status-ok)' }}>
              {consumptionRatio}% consumido
            </span>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              de un límite de S/ {presupuestoTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Liquid wave background simulation */}
        <div 
          className="liquid-fill" 
          style={{ 
            position: 'absolute', 
            left: 0, 
            right: 0, 
            bottom: 0, 
            height: `${Math.min(consumptionRatio, 100)}%`, 
            background: 'rgba(74, 222, 128, 0.08)', 
            transition: 'height 1s cubic-bezier(0.2, 0.8, 0.2, 1)', 
            zIndex: 1,
            pointerEvents: 'none'
          }} 
        />
      </div>

      {/* 2. Small Bento Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        
        {/* Available Card */}
        <div className="glass-card" style={{ margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '112px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            DISPONIBLE
          </span>
          <div>
            <h3 className="tabular-number" style={{ fontSize: '20px', fontWeight: '800', color: disponible >= 0 ? 'var(--status-ok)' : 'var(--status-critical)' }}>
              S/ {disponible.toFixed(2)}
            </h3>
            <div className="progress-container" style={{ margin: '6px 0 0 0' }}>
              <div className="progress-track">
                <div 
                  className="progress-bar-solid"
                  style={{ 
                    width: `${Math.max(0, Math.min(100, (disponible / presupuestoTotal) * 100))}%`, 
                    background: disponible >= 0 ? 'var(--status-ok)' : 'var(--status-critical)' 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Recom Card */}
        <div className="glass-card" style={{ margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '112px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            DIARIO RECOM.
          </span>
          <div>
            <h3 className="tabular-number" style={{ fontSize: '20px', fontWeight: '800' }}>
              S/ {diarioRecom.toFixed(2)}
            </h3>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Para cumplir el objetivo
            </span>
          </div>
        </div>

      </div>

      {/* 3. Category limit progress list */}
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '800' }}>Desglose de Categorías</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {categorySummaries.map(s => (
          <div 
            key={s.category.id}
            className="glass-card"
            style={{ 
              margin: 0, 
              padding: '16px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: s.speed.nivel === 'critico' ? 'var(--status-critical-glow)' : 'rgba(255,255,255,0.02)',
              border: s.speed.nivel === 'critico' ? '1px solid rgba(248, 113, 113, 0.25)' : '1px solid var(--border-color)',
              borderRadius: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: s.category.color || '#fff'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.category.color || '#fff' }} />
              </div>
              
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700' }}>{s.category.nombre}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <div className="progress-track" style={{ width: '80px', height: '5px', margin: 0 }}>
                    <div 
                      className="progress-bar-solid" 
                      style={{ 
                        width: `${s.ratioUsed}%`, 
                        background: s.color === 'green' ? 'var(--status-ok)' : s.color === 'yellow' ? 'var(--status-warn)' : 'var(--status-critical)' 
                      }} 
                    />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {s.ratioUsed}%
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <p className="tabular-number" style={{ fontSize: '14px', fontWeight: '800', color: s.color === 'red' ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                S/ {s.spent.toFixed(2)}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Límite S/ {s.budget.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Limits Adjuster Range Slider */}
      <div className="glass-card" style={{ margin: 0, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h4 style={{ fontWeight: '700' }}>Ajuste Rápido de Límites</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Escala el presupuesto global proporcionalmente</p>
          </div>
          <span className="tabular-number" style={{ fontSize: '15px', fontWeight: '800', color: 'var(--status-ok)' }}>
            S/ {sliderVal}
          </span>
        </div>
        
        <input 
          type="range" 
          min="500" 
          max="3000" 
          step="50"
          value={sliderVal} 
          onChange={handleSliderChange} 
          style={{ width: '100%', accentColor: 'var(--status-ok)', cursor: 'pointer', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', appearance: 'none', outline: 'none', marginBottom: '20px' }}
        />

        <button className="btn btn-secondary" onClick={saveGlobalLimit} style={{ width: '100%', borderRadius: '16px', height: '46px', fontSize: '14px' }}>
          Calibrar Límites Globales
        </button>
      </div>

    </div>
  );
}
