import React, { useState } from 'react';
import { dbService } from '../services/dbService';
import { Shield, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Auth({ onAuthSuccess, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await dbService.signIn(email, password);
        if (error) throw error;
        showToast('¡Bienvenido de nuevo! 🔓');
        if (onAuthSuccess) onAuthSuccess(data?.user);
      } else {
        const { data, error } = await dbService.signUp(email, password);
        if (error) throw error;
        showToast('¡Cuenta creada con éxito! 🎉');
        if (data?.session) {
          if (onAuthSuccess) onAuthSuccess(data?.user);
        } else {
          // If confirmation email is required
          showToast('Revisa tu correo para confirmar tu registro 📩');
          setMode('login');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      let friendlyMessage = err.message || 'Error de autenticación';
      if (err.message?.includes('Invalid login credentials')) {
        friendlyMessage = 'Correo o contraseña incorrectos.';
      } else if (err.message?.includes('User already registered')) {
        friendlyMessage = 'Este correo ya está registrado. Inicia sesión.';
      }
      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(circle at top center, rgba(30, 41, 59, 0.5) 0%, rgba(6, 7, 10, 1) 70%)'
    }}>
      {/* Brand Logo & Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(77, 224, 130, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          border: '1px solid rgba(77, 224, 130, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 0 30px rgba(77, 224, 130, 0.25)'
        }}>
          <Shield size={32} style={{ color: 'var(--status-ok)' }} />
        </div>

        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--status-ok)',
          background: 'rgba(77, 224, 130, 0.1)',
          padding: '4px 12px',
          borderRadius: '99px',
          border: '1px solid rgba(77, 224, 130, 0.2)'
        }}>
          Mis Finanzas SaaS v2.0
        </span>

        <h1 style={{ fontSize: '28px', fontWeight: '900', marginTop: '12px', color: '#fff' }}>
          {mode === 'login' ? 'Iniciar Sesión' : 'Crear Tu Cuenta'}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '300px' }}>
          {mode === 'login'
            ? 'Accede a tu panel personal de control financiero'
            : 'Comienza a tomar el control de tus finanzas en segundos'}
        </p>
      </div>

      {/* Auth Card Container */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '400px',
        borderRadius: '28px',
        padding: '28px 24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>

        {/* Mode Selector Tabs */}
        <div className="segmented-control" style={{ marginBottom: '24px' }}>
          <div
            className={`segmented-option ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErrorMsg(''); }}
          >
            Ingresar
          </div>
          <div
            className={`segmented-option ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setErrorMsg(''); }}
          >
            Registrarse
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: '#f87171'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Email Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ fontSize: '11px', marginLeft: '4px' }}>
              Correo Electrónico
            </label>
            <div className="glass-panel" style={{
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              height: '48px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <Mail size={18} style={{ color: 'var(--text-muted)', marginRight: '10px', flexShrink: 0 }} />
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '14px',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ fontSize: '11px', marginLeft: '4px' }}>
              Contraseña
            </label>
            <div className="glass-panel" style={{
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              height: '48px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <Lock size={18} style={{ color: 'var(--text-muted)', marginRight: '10px', flexShrink: 0 }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '14px',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '52px',
              fontSize: '14px',
              fontWeight: '800',
              borderRadius: '16px',
              marginTop: '10px',
              background: '#fff',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 0 25px rgba(255, 255, 255, 0.25)',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? (
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '2px solid #000',
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite'
              }} />
            ) : (
              <>
                <span>{mode === 'login' ? 'Entrar a Mi Panel' : 'Crear Mi Cuenta Gratis'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Features Bullet List */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={14} style={{ color: 'var(--status-ok)' }} />
            <span>Datos 100% aislados y protegidos por encripción</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <Sparkles size={14} style={{ color: '#3b82f6' }} />
            <span>Dictado de voz IA y Escáner de recibos OCR</span>
          </div>
        </div>

      </div>
    </div>
  );
}
