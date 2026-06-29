import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { calcularHealthScore, formatAmount } from '../utils/financeUtils';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, Award, Target, Calendar } from 'lucide-react';

const MONTH_LABELS = { '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic' };

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, privacyMode }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(10,12,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 14px', fontSize: '12px' }}>
        {label && <p style={{ color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || 'var(--text-primary)', margin: '2px 0', fontWeight: '700' }}>
            {p.name}: S/ {formatAmount(p.value, privacyMode, 0)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics({ privacyMode = false }) {
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [config, setConfig] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [movs, cats, cfg] = await Promise.all([
          dbService.getMovements(),
          dbService.getCategories(),
          dbService.getConfig()
        ]);
        setMovements(movs);
        setCategories(cats);
        setConfig(cfg);
      } catch (err) {
        console.error('Analytics load error', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const monthMovs = movements.filter(m => m.fecha && m.fecha.startsWith(selectedMonth));

  // ─── Health Score ───────────────────────────────────────────
  const health = calcularHealthScore(movements, categories, config, selectedMonth);

  // ─── Pie Chart: Gastos por categoría ───────────────────────
  const gastoCategories = categories.filter(c => c.tipo === 'gasto' && c.activa);
  const pieData = gastoCategories
    .map(cat => {
      const total = monthMovs
        .filter(m => m.categoria_id === cat.id)
        .reduce((s, m) => s + Number(m.monto), 0);
      return { name: cat.nombre.split('/')[0].trim(), value: total, color: cat.color || '#6b7280' };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // ─── Bar Chart: Gastos por semana ───────────────────────────
  const [year, monthStr] = selectedMonth.split('-');
  const daysInMonth = new Date(parseInt(year), parseInt(monthStr), 0).getDate();
  const weeks = [
    { name: 'Sem 1', days: [1, 7] },
    { name: 'Sem 2', days: [8, 14] },
    { name: 'Sem 3', days: [15, 21] },
    { name: 'Sem 4', days: [22, daysInMonth] }
  ];
  const weekData = weeks.map(w => {
    const total = monthMovs
      .filter(m => {
        const day = parseInt(m.fecha.split('-')[2]);
        const cat = categories.find(c => c.id === m.categoria_id);
        return day >= w.days[0] && day <= w.days[1] && cat && cat.tipo === 'gasto';
      })
      .reduce((s, m) => s + Number(m.monto), 0);
    return { name: w.name, Gastos: Math.round(total * 100) / 100 };
  });

  // ─── Line Chart: Últimos 4 meses ────────────────────────────
  const getMonthsBefore = (monthStr, n) => {
    const [y, m] = monthStr.split('-').map(Number);
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(y, m - 1 - i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }).reverse();
  };
  const last4Months = getMonthsBefore(selectedMonth, 4);
  const trendData = last4Months.map(mo => {
    const movs = movements.filter(m => m.fecha && m.fecha.startsWith(mo));
    const gastos = movs
      .filter(m => { const cat = categories.find(c => c.id === m.categoria_id); return cat && cat.tipo === 'gasto'; })
      .reduce((s, m) => s + Number(m.monto), 0);
    const ingresos = movs
      .filter(m => { const cat = categories.find(c => c.id === m.categoria_id); return cat && cat.tipo === 'ingreso'; })
      .reduce((s, m) => s + Number(m.monto), 0);
    const [, mStr] = mo.split('-');
    return { name: MONTH_LABELS[mStr] || mStr, Gastos: Math.round(gastos), Ingresos: Math.round(ingresos) };
  });

  // ─── Health Score ring ──────────────────────────────────────
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (health.score / 100) * circumference;

  const scoreBreakdown = [
    { label: 'Categorías OK', pts: health.breakdown.catScore, max: 35 },
    { label: 'Tasa de ahorro', pts: health.breakdown.ahorroScore, max: 25 },
    { label: 'Presupuesto global', pts: health.breakdown.globalScore, max: 25 },
    { label: 'Consistencia', pts: health.breakdown.consistenciaScore, max: 15 },
  ];

  // Available months for selector
  const availableMonths = getMonthsBefore(selectedMonth, 6);

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontWeight: '800' }}>Análisis Financiero</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Tendencias, distribución y salud de tus finanzas.</p>
      </div>

      {/* Month Selector */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '20px' }}>
        {availableMonths.map(mo => {
          const [y, mStr] = mo.split('-');
          const label = `${MONTH_LABELS[mStr]} ${y}`;
          const isActive = mo === selectedMonth;
          return (
            <button key={mo} onClick={() => setSelectedMonth(mo)}
              style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', background: isActive ? '#fff' : 'rgba(255,255,255,0.06)', color: isActive ? '#000' : 'var(--text-secondary)', border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Health Score Card ─────────────────────────── */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Award size={16} style={{ color: health.color }} />
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Score de Salud Financiera</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="128" height="128" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle cx="64" cy="64" r={radius} fill="none" stroke={health.color} strokeWidth="12"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round" transform="rotate(-90 64 64)"
                style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 8px ${health.color})` }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: '900', color: health.color, lineHeight: 1 }}>
                {privacyMode ? '••' : health.score}
              </span>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '2px' }}>/100</span>
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: health.color }}>{health.nivel}</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Basado en {selectedMonth}</p>
            </div>
            {scoreBreakdown.map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600' }}>{item.label}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>{item.pts}/{item.max}</span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${(item.pts / item.max) * 100}%`, height: '100%', background: health.color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pie Chart: Gastos por categoría ──────────── */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Target size={16} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Distribución de Gastos</span>
        </div>

        {pieData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip privacyMode={privacyMode} />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {pieData.slice(0, 6).map((item, i) => {
                const total = pieData.reduce((s, d) => s + d.value, 0);
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>{pct}%</span>
                    <span className="tabular-number" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', minWidth: '60px', textAlign: 'right' }}>
                      S/ {formatAmount(item.value, privacyMode, 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '13px' }}>Sin gastos en {selectedMonth}</p>
        )}
      </div>

      {/* ── Bar Chart: Por semana ─────────────────────── */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Gastos por Semana</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => privacyMode ? '••' : `${v}`} />
            <Tooltip content={<CustomTooltip privacyMode={privacyMode} />} />
            <Bar dataKey="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Line Chart: Tendencia mensual ─────────────── */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <TrendingUp size={16} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Tendencia Últimos 4 Meses</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => privacyMode ? '••' : `${v}`} />
            <Tooltip content={<CustomTooltip privacyMode={privacyMode} />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-muted)', paddingTop: '8px' }} />
            <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Ingresos" stroke="#4de082" strokeWidth={2.5} dot={{ r: 4, fill: '#4de082', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
