import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { calcularMoM } from '../utils/financeUtils';
import { TrendingUp, TrendingDown, Calendar, Award, Shield } from 'lucide-react';

export default function Resumen({ refreshTrigger, showToast }) {
  const [balance, setBalance] = useState(0);
  const [ingresos, setIngresos] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [ahorro, setAhorro] = useState(0);
  const [momData, setMomData] = useState(null);
  const [junPercentage, setJunPercentage] = useState(68);

  useEffect(() => {
    async function loadData() {
      try {
        const movs = await dbService.getMovements();
        const cats = await dbService.getCategories();
        
        // Filter June 2026
        const juneMovs = movs.filter(m => m.fecha.startsWith('2026-06'));
        
        // Calculate totals
        const inc = juneMovs
          .filter(m => cats.find(c => c.id === m.categoria_id)?.tipo === 'ingreso')
          .reduce((sum, m) => sum + Number(m.monto), 0);

        const exp = juneMovs
          .filter(m => cats.find(c => c.id === m.categoria_id)?.tipo === 'gasto')
          .reduce((sum, m) => sum + Number(m.monto), 0);

        const sav = juneMovs
          .filter(m => cats.find(c => c.id === m.categoria_id)?.nombre.toLowerCase().includes('ahorro'))
          .reduce((sum, m) => sum + Number(m.monto), 0);

        setIngresos(inc);
        setGastos(exp);
        setAhorro(sav);
        setBalance(inc - exp);

        // Previous month comparison
        const prevMonthMovs = movs.filter(m => m.fecha.startsWith('2026-05'));
        const prevExp = prevMonthMovs
          .filter(m => cats.find(c => c.id === m.categoria_id)?.tipo === 'gasto')
          .reduce((sum, m) => sum + Number(m.monto), 0);

        const mom = calcularMoM(exp, prevExp);
        setMomData(mom);

        // Dynamic percentage for June
        const totalBudget = cats
          .filter(c => c.tipo === 'gasto' && c.activa)
          .reduce((sum, c) => sum + Number(c.presupuesto_mensual), 0);

        if (totalBudget > 0) {
          setJunPercentage(Math.round((exp / totalBudget) * 100));
        }
      } catch (err) {
        console.error("Error loading summary", err);
      }
    }
    loadData();
  }, [refreshTrigger]);

  const handleAutoAdjust = () => {
    showToast("✨ Presupuestos optimizados: +15% de ahorro sugerido");
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      
      {/* 1. Patrimonio Neto Large Premium Card */}
      <div 
        className="glass-card" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2)',
          padding: '24px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p className="font-label-sm" style={{ color: 'var(--text-secondary)', tracking: '0.12em', fontSize: '10px' }}>
            PATRIMONIO NETO
          </p>
          <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.04em' }}>
            STATUS 26
          </span>
        </div>
        
        <h1 className="tabular-number" style={{ fontSize: '38px', fontWeight: '800', marginBottom: '8px', textShadow: '0 4px 16px rgba(255,255,255,0.12)' }}>
          S/ {balance.toFixed(2)}
        </h1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          {momData ? (
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
              {momData.texto.split(' ')[0]} vs Mayo
            </span>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin datos de Mayo</span>
          )}
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Límite de Gasto</span>
        </div>
      </div>

      {/* 2. Bento Grid Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        
        {/* Metric 1 */}
        <div className="glass-card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-ok)', marginBottom: '8px' }}>
            <Award size={14} />
            <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.05em' }}>PUNTOS AHORRO</span>
          </div>
          <span className="tabular-number" style={{ fontSize: '20px', fontWeight: '800' }}>
            S/ {ahorro.toFixed(2)}
          </span>
        </div>

        {/* Metric 2 */}
        <div className="glass-card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <Shield size={14} />
            <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.05em' }}>SEGURIDAD</span>
          </div>
          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--status-ok)', display: 'block', marginTop: '3px' }}>
            Nivel 4 / 5
          </span>
        </div>

      </div>

      {/* 3. Monthly Trend Chart Section */}
      <div className="glass-card" style={{ margin: 0, padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px', fontWeight: '800' }}>Tendencia Mensual</h3>
        
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', height: '140px', gap: '8px', marginBottom: '16px' }}>
          {[
            { label: 'Ene', height: '40%', active: false },
            { label: 'Feb', height: '65%', active: false },
            { label: 'Mar', height: '55%', active: false },
            { label: 'Abr', height: '80%', active: false },
            { label: 'May', height: '92%', active: false },
            { label: 'Jun', height: `${junPercentage}%`, active: true }
          ].map((bar, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
              <div 
                style={{ 
                  width: '100%', 
                  height: bar.height, 
                  background: bar.active ? 'rgba(74, 222, 128, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  borderTop: bar.active ? '1px solid var(--status-ok)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px 6px 0 0',
                  boxShadow: bar.active ? '0 0 10px rgba(74, 222, 128, 0.15)' : 'none',
                  transition: 'height 0.8s ease'
                }} 
              />
              <span style={{ 
                fontSize: '10px', 
                fontWeight: bar.active ? '700' : '500', 
                color: bar.active ? 'var(--status-ok)' : 'var(--text-secondary)',
                textTransform: 'uppercase'
              }}>
                {bar.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-ok)' }} />
            <span>Mes actual (Junio)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <span>Meses anteriores</span>
          </div>
        </div>
      </div>

      {/* 4. Auto-adjust limits card */}
      <div className="glass-card" style={{ margin: 0, padding: '20px' }}>
        <h4 style={{ fontWeight: '700', marginBottom: '4px' }}>Ajuste de Límites Inteligente</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Recalcula límites variables para optimizar tu balance mensual de forma automatizada.
        </p>
        <button className="btn btn-primary" onClick={handleAutoAdjust} style={{ width: '100%', borderRadius: '16px', height: '46px', fontSize: '14px' }}>
          Auto-ajustar Presupuesto
        </button>
      </div>

    </div>
  );
}
