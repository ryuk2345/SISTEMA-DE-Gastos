import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { 
  calcularSemafaroAcumulado, 
  calcularVelocidadGasto, 
  calcularMoM 
} from '../utils/financeUtils';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  Wallet,
  Activity,
  Bell,
  X
} from 'lucide-react';

export default function Dashboard({ refreshTrigger }) {
  const [selectedMonth, setSelectedMonth] = useState('2026-06'); // Default to seed month
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [config, setConfig] = useState(null);
  
  // Financial summaries
  const [ingresosTotal, setIngresosTotal] = useState(0);
  const [gastosTotal, setGastosTotal] = useState(0);
  const [ahorroTotal, setAhorroTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const [momData, setMomData] = useState(null);
  const [categorySummaries, setCategorySummaries] = useState([]);
  const [globalAlerts, setGlobalAlerts] = useState([]);
  
  // Global limit variables for liquid wave representation
  const [totalBudgetLimit, setTotalBudgetLimit] = useState(1);
  const [globalPercentage, setGlobalPercentage] = useState(0);
  const [maxDailySpend, setMaxDailySpend] = useState(0);
  const [cycleDaysLeft, setCycleDaysLeft] = useState(30);
  const [userPayday, setUserPayday] = useState(25);

  // Notification Bell states
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [showSummaryAlert, setShowSummaryAlert] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [movs, cats, cfg] = await Promise.all([
          dbService.getMovements(),
          dbService.getCategories(),
          dbService.getConfig()
        ]);
        
        setMovements(movs);
        setCategories(cats);
        setConfig(cfg);
        
        processFinancials(movs, cats, cfg);
      } catch (err) {
        console.error("Error loading dashboard data", err);
      }
    }
    loadDashboardData();
  }, [selectedMonth, refreshTrigger]);

  const processFinancials = (allMovs, allCats, cfg) => {
    if (!cfg) return;

    const currentMonthMovs = allMovs.filter(m => m.fecha.startsWith(selectedMonth));
    
    // Calculate previous month
    const [year, monthStr] = selectedMonth.split('-');
    const dateObj = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
    dateObj.setMonth(dateObj.getMonth() - 1);
    const prevMonthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthMovs = allMovs.filter(m => m.fecha.startsWith(prevMonthStr));

    // Calculate Ingresos
    const ingresos = currentMonthMovs
      .filter(m => {
        const cat = allCats.find(c => c.id === m.categoria_id);
        return cat && cat.tipo === 'ingreso';
      })
      .reduce((sum, m) => sum + Number(m.monto), 0);

    // Calculate Ahorros
    const ahorros = currentMonthMovs
      .filter(m => {
        const cat = allCats.find(c => c.id === m.categoria_id);
        return cat && cat.nombre.toLowerCase().includes('ahorro');
      })
      .reduce((sum, m) => sum + Number(m.monto), 0);

    // Calculate total expenses for MoM
    const totalGastosAct = currentMonthMovs
      .filter(m => {
        const cat = allCats.find(c => c.id === m.categoria_id);
        return cat && cat.tipo === 'gasto';
      })
      .reduce((sum, m) => sum + Number(m.monto), 0);

    const totalGastosPrev = prevMonthMovs
      .filter(m => {
        const cat = allCats.find(c => c.id === m.categoria_id);
        return cat && cat.tipo === 'gasto';
      })
      .reduce((sum, m) => sum + Number(m.monto), 0);

    setIngresosTotal(ingresos);
    setGastosTotal(totalGastosAct);
    setAhorroTotal(ahorros);
    setBalance(ingresos - totalGastosAct);

    // MoM comparison
    const mom = calcularMoM(totalGastosAct, totalGastosPrev);
    setMomData(mom);

    // Reference Date for Projections
    let refDate = selectedMonth + '-01';
    const monthMovsDates = currentMonthMovs.map(m => m.fecha).sort();
    if (monthMovsDates.length > 0) {
      refDate = monthMovsDates[monthMovsDates.length - 1];
    } else {
      const today = new Date();
      const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      if (selectedMonth === currentYearMonth) {
        refDate = today.toISOString().split('T')[0];
      } else {
        const [y, m] = selectedMonth.split('-');
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
        refDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
      }
    }

    // Process per-category budgets and metrics
    const expenseCats = allCats.filter(c => c.tipo === 'gasto' && c.activa);
    const summaries = expenseCats.map(cat => {
      const spent = currentMonthMovs
        .filter(m => m.categoria_id === cat.id)
        .reduce((sum, m) => sum + Number(m.monto), 0);

      const semStats = calcularSemafaroAcumulado(
        spent, 
        cat.presupuesto_mensual, 
        cfg.umbral_amarillo_acumulado, 
        cfg.umbral_rojo_acumulado
      );
      
      const speedStats = calcularVelocidadGasto(
        spent, 
        cat.presupuesto_mensual, 
        refDate,
        cfg.umbral_amarillo_velocidad, 
        cfg.umbral_rojo_velocidad
      );

      return {
        category: cat,
        spent,
        budget: cat.presupuesto_mensual,
        ...semStats,
        speed: speedStats
      };
    });

    setCategorySummaries(summaries);

    // Global limits liquid progress calculations
    const totalBudget = expenseCats.reduce((sum, c) => sum + Number(c.presupuesto_mensual), 0);
    setTotalBudgetLimit(totalBudget || 1);
    const percentage = totalBudget > 0 ? (totalGastosAct / totalBudget) * 100 : 0;
    setGlobalPercentage(Math.round(percentage));

    // Calculate remaining days based on payday configuration
    const payday = cfg.dia_de_pago || 25;
    setUserPayday(payday);
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentDay = today.getDate();

    let endYear = currentYear;
    let endMonth = currentMonth;

    if (currentDay >= payday) {
      // Cycle ends next month
      endMonth = currentMonth + 1;
      if (endMonth > 11) {
        endMonth = 0;
        endYear = currentYear + 1;
      }
    }

    const nextPaydayDate = new Date(endYear, endMonth, payday);
    
    // Calculate remaining days (inclusive of today)
    const diffTime = nextPaydayDate - today;
    const remainingDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
    setCycleDaysLeft(remainingDays);

    const totalRemaining = Math.max(totalBudget - totalGastosAct, 0);
    const maxDaily = remainingDays > 0 ? totalRemaining / remainingDays : 0;
    setMaxDailySpend(maxDaily);

    // Generate proactive speed alerts
    const alerts = [];
    summaries.forEach(s => {
      if (s.speed.nivel === 'elevado') {
        alerts.push({
          type: 'warning',
          category: s.category.nombre,
          message: `Ritmo elevado en ${s.category.nombre}. Cierre proyectado: S/ ${s.speed.gastoProyectadoCierre.toFixed(2)} (presupuesto: S/ ${s.budget.toFixed(2)}).`
        });
      } else if (s.speed.nivel === 'critico') {
        alerts.push({
          type: 'critical',
          category: s.category.nombre,
          message: `⚠️ Alerta Crítica: Ritmo acelerado en ${s.category.nombre}. Cierre proyectado S/ ${s.speed.gastoProyectadoCierre.toFixed(2)} (límite S/ ${s.budget.toFixed(2)}).`
        });
      }
    });

    const globalSpeedStats = calcularVelocidadGasto(
      totalGastosAct,
      totalBudget,
      refDate,
      cfg.umbral_amarillo_velocidad,
      cfg.umbral_rojo_velocidad
    );

    if (globalSpeedStats.nivel === 'critico') {
      alerts.push({
        type: 'critical',
        category: 'TOTAL',
        message: `⚠️ Meta de ahorro en riesgo. El gasto proyectado general (S/ ${globalSpeedStats.gastoProyectadoCierre.toFixed(2)}) excede tu presupuesto total de S/ ${totalBudget.toFixed(2)}.`
      });
    }

    setGlobalAlerts(alerts);
  };

  const adjustMonth = (offset) => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1 + offset, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const getMonthName = (monthStr) => {
    const [y, m] = monthStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  };

  // Calculations for Bento Box 4
  const totalBudget = categorySummaries.reduce((sum, s) => sum + Number(s.budget), 0);
  const remainingBudget = Math.max(totalBudget - gastosTotal, 0);

  return (
    <div className="dashboard-container" style={{ paddingBottom: '20px' }}>
      
      {/* 1. Header Title & Notification Bell */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '10px', color: 'var(--status-ok)', textTransform: 'uppercase', tracking: '0.12em', fontWeight: '800' }}>
            Sistema Premium v2.0
          </span>
          <h1 style={{ fontWeight: '800', marginTop: '2px' }}>Resumen Financiero</h1>
        </div>

        {/* Bell Icon */}
        <button 
          onClick={() => setIsBellOpen(true)}
          style={{ 
            background: 'rgba(255, 255, 255, 0.04)', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer'
          }}
        >
          <Bell size={20} style={{ color: globalAlerts.length > 0 ? 'var(--status-amber-speed)' : 'var(--text-secondary)' }} />
          {globalAlerts.length > 0 && (
            <div style={{ 
              position: 'absolute', 
              top: '-3px', 
              right: '-3px', 
              background: 'var(--status-critical)', 
              color: '#000000', 
              fontSize: '9px', 
              fontWeight: '800', 
              borderRadius: '50%', 
              width: '18px', 
              height: '18px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px solid var(--bg-primary)',
              boxShadow: '0 0 6px var(--status-critical)'
            }}>
              {globalAlerts.length}
            </div>
          )}
        </button>
      </div>

      {/* 2. Month Navigator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={() => adjustMonth(-1)} style={{ padding: '8px 12px', height: '40px', width: '40px', borderRadius: '50%' }}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ textTransform: 'capitalize', fontWeight: '800', fontSize: '18px' }}>{getMonthName(selectedMonth)}</h2>
        <button className="btn btn-secondary" onClick={() => adjustMonth(1)} style={{ padding: '8px 12px', height: '40px', width: '40px', borderRadius: '50%' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Consolidated Summary Banner with Dismiss Button */}
      {globalAlerts.length > 0 && showSummaryAlert && (
        <div 
          className="alert-banner" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px',
            padding: '12px 16px'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, color: 'var(--status-amber-speed)' }} />
            <span style={{ fontSize: '12px' }}>
              Tienes <b>{globalAlerts.length} alertas</b> activas de velocidad.
            </span>
          </div>
          <button 
            onClick={() => setShowSummaryAlert(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 3. Glass Credit Card Balance */}
      <div 
        className="glass-card" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.18)',
          padding: '24px',
          marginBottom: '24px',
          borderRadius: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Balance Neto
            </span>
          </div>
          <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '6px' }}>
            STATUS 26
          </span>
        </div>
        
        <h1 className="tabular-number neon-glow" style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>
          S/ {balance.toFixed(2)}
        </h1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
            DAVID SILVA
          </span>
          {momData && (
            <span 
              className="tabular-number"
              style={{ 
                fontSize: '12px', 
                fontWeight: '700',
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                color: momData.variacion > 0 ? 'var(--status-critical)' : 'var(--status-ok)' 
              }}
            >
              {momData.indicador === '↑' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {momData.texto.split(' ')[0]} vs mes anterior
            </span>
          )}
        </div>
      </div>

      {/* 4. Bento Grid Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
        
        {/* Income Box */}
        <div className="glass-card" style={{ margin: 0, padding: '16px', borderLeft: '3px solid var(--status-ok)', borderRadius: '18px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Ingresos
          </span>
          <span className="tabular-number" style={{ fontSize: '16px', fontWeight: '800', color: 'var(--status-ok)' }}>
            S/ {ingresosTotal.toFixed(2)}
          </span>
        </div>

        {/* Expenses Box */}
        <div className="glass-card" style={{ margin: 0, padding: '16px', borderLeft: '3px solid var(--status-critical)', borderRadius: '18px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Gastos
          </span>
          <span className="tabular-number" style={{ fontSize: '16px', fontWeight: '800', color: 'var(--status-critical)' }}>
            S/ {gastosTotal.toFixed(2)}
          </span>
        </div>

        {/* Savings Box */}
        <div className="glass-card" style={{ margin: 0, padding: '16px', borderLeft: '3px solid #8b5cf6', borderRadius: '18px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Ahorro Oblig.
          </span>
          <span className="tabular-number" style={{ fontSize: '16px', fontWeight: '800', color: '#a78bfa' }}>
            S/ {ahorroTotal.toFixed(2)}
          </span>
        </div>

        {/* Available Budget Box */}
        <div className="glass-card" style={{ margin: 0, padding: '16px', borderLeft: '3px solid var(--status-warn)', borderRadius: '18px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Disponible
          </span>
          <span className="tabular-number" style={{ fontSize: '16px', fontWeight: '800', color: 'var(--status-warn)' }}>
            S/ {remainingBudget.toFixed(2)}
          </span>
        </div>

      </div>

      {/* 5. Stitch Liquid Progress Card */}
      <div className="glass-card liquid-fill" style={{ padding: '24px', borderRadius: '24px', marginBottom: '28px', textAlign: 'center' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '8px' }}>
          Consumo de Presupuesto Global
        </span>
        <div style={{ position: 'relative', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px 0' }}>
          <div>
            <span style={{ fontSize: '38px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
              {globalPercentage}%
            </span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '2px' }}>
              Gastado: S/ {gastosTotal.toFixed(2)} / S/ {totalBudgetLimit.toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Maximum Recommended Daily Spend */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px', borderRadius: '14px', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Gasto Diario Máximo Recomendado:</span>
            <b className="tabular-number" style={{ fontSize: '13px', color: 'var(--status-ok)', textShadow: '0 0 10px rgba(77,224,130,0.3)' }}>
              S/ {maxDailySpend.toFixed(2)}
            </b>
          </div>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
            Calculado para {cycleDaysLeft} {cycleDaysLeft === 1 ? 'día' : 'días'} restantes (hasta el pago del {userPayday})
          </span>
        </div>
      </div>

      {/* 6. Budgets Semáforos Category Listing */}
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={16} style={{ color: 'var(--text-secondary)' }} /> Categorías y Presupuestos
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {categorySummaries.map(s => {
          const solidPercentage = Math.min(s.porcentajeUsado, 100);
          const dottedPercentage = Math.min(s.speed.ratioProyectado, 100);
          
          return (
            <div key={s.category.id} className="glass-card" style={{ margin: 0, padding: '16px', borderRadius: '18px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontWeight: '700', fontSize: '13px' }}>{s.category.nombre}</span>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.category.grupo}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className={`badge ${s.color === 'green' ? 'badge-ok' : s.color === 'yellow' ? 'badge-warn' : 'badge-critical'}`}>
                    {s.label.split(' ')[1]}
                  </span>
                  
                  {s.speed.nivel !== 'sano' && (
                    <span className={`badge ${s.speed.color === 'yellow' ? 'badge-warn' : 'badge-critical'}`} style={{ gap: '2px' }}>
                      Velocidad
                    </span>
                  )}
                </div>
              </div>

              {/* Projections Progress bars */}
              <div className="progress-container" style={{ margin: '8px 0 10px 0' }}>
                <div className="progress-track">
                  {s.speed.gastoProyectadoCierre > s.spent && (
                    <div 
                      className="progress-bar-dotted"
                      style={{ 
                        width: `${dottedPercentage}%`, 
                        color: s.speed.color === 'red' ? 'var(--status-critical)' : 'var(--status-warn)' 
                      }}
                    />
                  )}
                  <div 
                    className="progress-bar-solid"
                    style={{ 
                      width: `${solidPercentage}%`, 
                      background: s.color === 'green' ? 'var(--status-ok)' : s.color === 'yellow' ? 'var(--status-warn)' : 'var(--status-critical)' 
                    }}
                  />
                </div>
              </div>

              {/* Quantities labels with remaining amounts */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>Gastado: <b className="tabular-number">S/ {s.spent.toFixed(2)}</b></span>
                <span style={{ color: s.budget - s.spent < 0 ? 'var(--status-critical)' : 'var(--status-ok)', fontWeight: '700' }}>
                  {s.budget - s.spent < 0 
                    ? `Excedido: S/ ${Math.abs(s.budget - s.spent).toFixed(2)}` 
                    : `Queda: S/ ${(s.budget - s.spent).toFixed(2)}`
                  }
                </span>
                <span>Límite: S/ {s.budget.toFixed(2)}</span>
              </div>

            </div>
          );
        })}
      </div>

      {/* 7. Notification Center Drawer / Popover Modal */}
      {isBellOpen && (
        <div className="modal-overlay" style={{ zIndex: 2500 }}>
          <div className="modal-content" style={{ maxWidth: '380px', borderRadius: '24px', background: '#0e1016', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Bell size={18} style={{ color: 'var(--status-amber-speed)' }} /> Centro de Alertas
              </h3>
              <button 
                onClick={() => setIsBellOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
              {globalAlerts.length > 0 ? (
                globalAlerts.map((alert, i) => (
                  <div key={i} className="alert-banner" style={{ margin: 0, padding: '12px 14px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--status-amber-speed)' }} />
                      <span style={{ fontSize: '12px', lineHeight: '1.4', color: 'var(--status-amber-speed)' }}>{alert.message}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>
                  No tienes alertas activas en este período. 🎉
                </div>
              )}
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={() => setIsBellOpen(false)}
              style={{ width: '100%', height: '46px', borderRadius: '14px', marginTop: '20px', fontSize: '13px' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
