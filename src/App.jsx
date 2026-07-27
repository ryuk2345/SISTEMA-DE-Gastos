import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import QuickForm from './components/QuickForm';
import Tarjetas from './components/Tarjetas';
import Settings from './components/Settings';
import Analytics from './components/Analytics';
import Auth from './components/Auth';
import { dbService, warmup } from './services/dbService';
import { 
  LayoutDashboard, 
  PlusCircle, 
  CreditCard, 
  User, 
  Lock,
  BarChart2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  // Privacy mode — hides all monetary amounts
  const [privacyMode, setPrivacyMode] = useState(false);
  
  // Auth session states (SaaS Multi-tenant)
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Security PIN states
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');
  const CORRECT_PIN = '1234';

  useEffect(() => {
    // Safety timeout — never let loadingAuth block render more than 5 seconds
    const safetyTimeout = setTimeout(() => {
      setLoadingAuth(false);
    }, 5000);

    // Check initial auth session
    async function checkAuth() {
      try {
        const currentUser = await dbService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) warmup();
      } catch (err) {
        console.error('Error checking auth session:', err);
      } finally {
        clearTimeout(safetyTimeout);
        setLoadingAuth(false);
      }
    }

    checkAuth();

    // Subscribe to auth state changes
    const { data: authListener } = dbService.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoadingAuth(false);
      if (session?.user) warmup();
    });

    return () => {
      clearTimeout(safetyTimeout);
      authListener?.subscription?.unsubscribe();
    };
  }, []);


  useEffect(() => {
    if (!isLocked) {
      processRecurrences();
    }
  }, [isLocked]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUpdate = () => setRefreshTrigger(prev => prev + 1);

  const togglePrivacy = () => {
    setPrivacyMode(prev => {
      const next = !prev;
      showToast(next ? '👁️ Modo Privacidad activado' : '👁️ Modo Privacidad desactivado');
      return next;
    });
  };

  const processRecurrences = async () => {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();
      const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      const [recs, movs] = await Promise.all([
        dbService.getRecurrences(),
        dbService.getMovements()
      ]);

      const activeRecs = recs.filter(r => r.activa);
      let createdAny = false;

      for (const rec of activeRecs) {
        if (rec.dia_del_mes <= currentDay) {
          const alreadyCreated = movs.some(m => 
            m.categoria_id === rec.categoria_id && 
            m.origen === 'recurrente' && 
            m.fecha.startsWith(currentMonthStr)
          );
          if (!alreadyCreated) {
            const recFecha = `${currentMonthStr}-${String(rec.dia_del_mes).padStart(2, '0')}`;
            await dbService.createMovement({
              fecha: recFecha,
              categoria_id: rec.categoria_id,
              monto: Number(rec.monto),
              descripcion: rec.descripcion || 'Gasto Recurrente Automático',
              origen: 'recurrente'
            });
            createdAny = true;
          }
        }
      }
      if (createdAny) {
        showToast('Gastos recurrentes procesados automáticamente 🔄');
        handleUpdate();
      }
    } catch (err) {
      console.error('Error processing recurring expenses', err);
    }
  };

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin === CORRECT_PIN) {
        setTimeout(() => {
          setIsLocked(false);
          showToast('¡Desbloqueado con éxito! 🔓');
        }, 300);
      } else if (nextPin.length === 4) {
        setTimeout(() => {
          alert('PIN Incorrecto. Intenta de nuevo.');
          setPin('');
        }, 300);
      }
    }
  };

  const handleBackspace = () => setPin(prev => prev.slice(0, -1));

  // Render Auth screen if not logged in
  if (loadingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--status-ok)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={(u) => { setUser(u); handleUpdate(); }} showToast={showToast} />;
  }

  if (isLocked) {
    return (
      <div className="pin-overlay">
        <Lock size={48} style={{ color: 'var(--status-ok)', marginBottom: '16px', filter: 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.3))' }} />
        <h2 style={{ marginBottom: '8px', fontWeight: '800' }}>Mis Finanzas Locked</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Ingresa tu código PIN de acceso</p>
        <div className="pin-dots">
          {[0, 1, 2, 3].map(idx => (
            <div key={idx} className={`pin-dot ${pin.length > idx ? 'filled' : ''}`} />
          ))}
        </div>
        <div className="pin-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="pin-key" onClick={() => handleKeyPress(num.toString())}>{num}</button>
          ))}
          <button className="pin-key" style={{ fontSize: '14px', color: 'var(--text-muted)' }} onClick={() => setPin('')}>Clear</button>
          <button className="pin-key" onClick={() => handleKeyPress('0')}>0</button>
          <button className="pin-key" style={{ fontSize: '14px', color: 'var(--text-muted)' }} onClick={handleBackspace}>⌫</button>
        </div>
        <div style={{ marginTop: '48px', fontSize: '12px', color: 'var(--text-muted)' }}>
          PIN de prueba: <b>1234</b>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container${privacyMode ? ' privacy-mode' : ''}`}>
      {/* Toast popup */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast"><span>{toastMessage}</span></div>
        </div>
      )}

      {/* Privacy mode toggle — floating button top-right corner */}
      <button
        onClick={togglePrivacy}
        title={privacyMode ? 'Desactivar modo privacidad' : 'Activar modo privacidad'}
        style={{
          position: 'fixed', top: '16px', right: '16px', zIndex: 1200,
          width: '36px', height: '36px', borderRadius: '50%',
          background: privacyMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
          border: privacyMode ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s ease',
          boxShadow: privacyMode ? '0 0 12px rgba(255,255,255,0.15)' : 'none'
        }}
      >
        {privacyMode
          ? <EyeOff size={16} style={{ color: 'rgba(255,255,255,0.8)' }} />
          : <Eye size={16} style={{ color: 'var(--text-muted)' }} />}
      </button>

      {/* Main content */}
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <Dashboard refreshTrigger={refreshTrigger} privacyMode={privacyMode} />
        )}
        {activeTab === 'quick-form' && (
          <QuickForm onSaveSuccess={handleUpdate} showToast={showToast} />
        )}
        {activeTab === 'analytics' && (
          <Analytics privacyMode={privacyMode} />
        )}
        {activeTab === 'tarjetas' && (
          <Tarjetas 
            refreshTrigger={refreshTrigger}
            onUpdate={handleUpdate}
            showToast={showToast}
            privacyMode={privacyMode}
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            user={user}
            refreshTrigger={refreshTrigger}
            onUpdate={handleUpdate}
            showToast={showToast}
            onLock={() => setIsLocked(true)}
            onSignOut={async () => {
              await dbService.signOut();
              setUser(null);
              showToast('Sesión cerrada correctamente 🔒');
            }}
          />
        )}
      </main>

      {/* Bottom Tab bar — 5 tabs */}
      <nav className="nav-bar">
        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </div>
        <div className={`nav-item ${activeTab === 'quick-form' ? 'active' : ''}`} onClick={() => setActiveTab('quick-form')}>
          <PlusCircle size={20} />
          <span>Registrar</span>
        </div>
        <div className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <BarChart2 size={20} />
          <span>Análisis</span>
        </div>
        <div className={`nav-item ${activeTab === 'tarjetas' ? 'active' : ''}`} onClick={() => setActiveTab('tarjetas')}>
          <CreditCard size={20} />
          <span>Tarjetas</span>
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <User size={20} />
          <span>Perfil</span>
        </div>
      </nav>
    </div>
  );
}
