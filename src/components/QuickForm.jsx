import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { normalizarMonto } from '../utils/financeUtils';
import { Plus, Search, Tag, Calendar, AlignLeft, Check, AlertTriangle, Mic, MicOff, X } from 'lucide-react';

export default function QuickForm({ onSaveSuccess, showToast }) {
  const [tipo, setTipo] = useState('gasto');
  const [categories, setCategories] = useState([]); // All categories loaded
  const [categorias, setCategorias] = useState([]); // Filtered categories by type
  const [movements, setMovements] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState('2026-06'); // June 2026 seed month
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Helper trigger to reload categories and movements internally
  
  // Voice dictation state
  const [isListening, setIsListening] = useState(false);
  const [voiceOrigin, setVoiceOrigin] = useState('manual'); // Track if registered via voice
  
  // Voice Simulator fallback (for non-secure HTTP dev contexts on mobile)
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simText, setSimText] = useState('');

  // Quick description suggestion tags based on David's frequent historical entries
  const suggestions = {
    gasto: ['Menú almuerzo', 'Combi', 'Starbucks', 'Te marcha', 'Uber', 'Desayuno'],
    ingreso: ['Sueldo del mes', 'Pago Freelance', 'Trabajo extra', 'Venta']
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [catsList, movsList] = await Promise.all([
          dbService.getCategories(),
          dbService.getMovements()
        ]);
        
        setCategories(catsList);
        setMovements(movsList);

        const filtered = catsList.filter(c => c.tipo === tipo && c.activa);
        setCategorias(filtered);
        
        if (filtered.length > 0) {
          // Find first category that has remaining budget by default if it's a expense
          const nonExceeded = filtered.find(c => {
            const spent = movsList
              .filter(m => m.categoria_id === c.id && m.fecha.startsWith(currentMonth))
              .reduce((sum, m) => sum + Number(m.monto), 0);
            return c.presupuesto_mensual - spent > 0;
          });
          setCategoriaId(nonExceeded ? nonExceeded.id : filtered[0].id);
        } else {
          setCategoriaId('');
        }
      } catch (err) {
        console.error("Error loading categories/movements in form", err);
      }
    }
    loadData();
  }, [tipo, refreshTrigger]);

  const getRemainingBudget = (cat) => {
    if (cat.tipo === 'ingreso') return Infinity; // No limit for income
    const spent = movements
      .filter(m => m.categoria_id === cat.id && m.fecha.startsWith(currentMonth))
      .reduce((sum, m) => sum + Number(m.monto), 0);
    return cat.presupuesto_mensual - spent;
  };

  // Spanish voice command parser logic
  const parseVoiceInput = (text, categoriesList) => {
    const lower = text.toLowerCase();
    let detectedMonto = '';
    let detectedTipo = 'gasto';
    let detectedCategory = null;
    let detectedDesc = '';

    // 1. Detect command type
    if (lower.includes('ingreso') || lower.includes('recibí') || lower.includes('gané') || lower.includes('depositaron')) {
      detectedTipo = 'ingreso';
    }

    // 2. Extract numeric amount
    const numberMatch = lower.match(/\b\d+([.,]\d+)?\b/);
    if (numberMatch) {
      detectedMonto = numberMatch[0].replace(',', '.');
    }

    // 3. Score categories by keywords and synonyms
    const cleanText = lower.replace(/\b\d+([.,]\d+)?\b/, '').replace('soles', '').replace('sol', '');
    let bestCategory = null;
    let bestScore = 0;

    categoriesList.forEach(cat => {
      const catName = cat.nombre.toLowerCase();
      let score = 0;

      if (cleanText.includes(catName)) {
        score += 10;
      }

      const words = catName.split(/[\s/]+/);
      words.forEach(word => {
        if (word.length > 3 && cleanText.includes(word)) {
          score += 5;
        }
      });

      const synonyms = {
        'Menú / Alimentación': ['almuerzo', 'comida', 'menú', 'restaurante', 'cena', 'desayuno', 'broaster', 'pan', 'comer', 'almorzar'],
        'Pasajes': ['pasaje', 'taxi', 'combi', 'uber', 'bus', 'pasajes', 'transporte', 'viaje', 'colectivo'],
        'Línea Celular': ['celular', 'teléfono', 'saldo', 'recarga', 'internet', 'línea', 'entel', 'movistar', 'claro', 'telefonía'],
        'Ahorro': ['ahorrar', 'ahorro', 'banco', 'colchón'],
        'Aporte en Casa / Servicios': ['servicios', 'luz', 'agua', 'casa', 'internet', 'gas', 'alquiler', 'servicios básicos'],
        'Aseo Personal': ['aseo', 'jabón', 'shampoo', 'pasta', 'dental', 'baño', 'personal', 'limpiador', 'limpieza'],
        'Salidas / Entretenimiento': ['salidas', 'cine', 'bar', 'fiesta', 'entretenimiento', 'cerveza', 'amigos', 'discoteca', 'teatro', 'entrada'],
        'Antojos / Imprevistos': ['antojo', 'antojos', 'dulce', 'chocolate', 'snack', 'galleta', 'helado', 'postre'],
        'Otros / Colchón': ['otros', 'bicicleta', 'arreglo', 'cargador', 'adaptador', 'herramienta']
      };

      if (synonyms[cat.nombre]) {
        synonyms[cat.nombre].forEach(syn => {
          if (cleanText.includes(syn)) {
            score += 8;
          }
        });
      }

      if (score > bestScore) {
        bestScore = score;
        bestCategory = cat;
      }
    });

    if (bestCategory) {
      detectedCategory = bestCategory;
    }

    // 4. Extract clean description
    let desc = cleanText
      .replace(/\b(gasto|gasté|pagué|ingreso|recibí|gané|ahorré|en|de|un|una|el|la|los|soles|sol|pesos)\b/g, '')
      .trim();
    
    if (desc) {
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    }
    
    detectedDesc = desc;

    return {
      monto: detectedMonto,
      tipo: detectedTipo,
      categoriaId: detectedCategory ? detectedCategory.id : '',
      descripcion: detectedDesc
    };
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSimModalOpen(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      showToast("Escuchando... Hable ahora 🎙️");
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
      showToast("Error de dictado. Intente de nuevo.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Voice Transcript:", transcript);
      
      const parsed = parseVoiceInput(transcript, categories);
      
      if (parsed.tipo) {
        setTipo(parsed.tipo);
      }
      if (parsed.monto) {
        setMonto(parsed.monto);
      }
      if (parsed.categoriaId) {
        setCategoriaId(parsed.categoriaId);
      }
      if (parsed.descripcion) {
        setDescripcion(parsed.descripcion);
      }

      setVoiceOrigin('voz'); // Flag that this transaction was processed via voice
      
      const matchedCatName = categories.find(c => c.id === parsed.categoriaId)?.nombre || 'General';
      showToast(`Autocompletado: S/ ${parsed.monto || '0'} en ${matchedCatName} 🎙️`);
    };

    recognition.start();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!categoriaId) {
      alert("Por favor selecciona una categoría");
      return;
    }

    // Verify limit before saving
    const selectedCat = categories.find(c => c.id === categoriaId);
    if (selectedCat && selectedCat.tipo === 'gasto') {
      const remaining = getRemainingBudget(selectedCat);
      if (remaining <= 0) {
        alert("No se puede registrar este gasto. Presupuesto agotado para esta categoría.");
        return;
      }
    }

    try {
      const montoNormalizado = normalizarMonto(monto);
      
      const newMovement = {
        fecha,
        categoria_id: categoriaId,
        monto: montoNormalizado,
        descripcion: descripcion.trim() || undefined,
        origen: voiceOrigin // Store voice flag
      };

      await dbService.createMovement(newMovement);
      
      showToast("Movimiento registrado con éxito 🎉");

      // Reset fields
      setMonto('');
      setDescripcion('');
      setSearchQuery('');
      setVoiceOrigin('manual'); // Reset back to manual
      setRefreshTrigger(prev => prev + 1);
      
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filteredCats = categorias.filter(c => 
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.grupo && c.grupo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedCat = categories.find(c => c.id === categoriaId);
  const selectedRemaining = selectedCat ? getRemainingBudget(selectedCat) : Infinity;
  const isCategoryExceeded = selectedCat && selectedCat.tipo === 'gasto' && selectedRemaining <= 0;

  // Alternatives: active expense categories with remaining budget > 0
  const suggestedAlternatives = categories
    .filter(c => c.tipo === 'gasto' && c.activa && c.id !== categoriaId)
    .map(c => ({ ...c, remaining: getRemainingBudget(c) }))
    .filter(c => c.remaining > 0)
    .sort((a, b) => {
      // Prioritize same group
      if (selectedCat && a.grupo === selectedCat.grupo && b.grupo !== selectedCat.grupo) return -1;
      if (selectedCat && a.grupo !== selectedCat.grupo && b.grupo === selectedCat.grupo) return 1;
      return b.remaining - a.remaining;
    })
    .slice(0, 2);

  return (
    <div style={{ paddingBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div>
          <h1 style={{ fontWeight: '800' }}>Registrar Movimiento</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Registra ingresos o gastos al sistema al instante.</p>
        </div>

        {/* Voice Dictation Pulse Button */}
        <button
          type="button"
          onClick={startListening}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: isListening ? 'var(--status-critical-glow)' : 'rgba(255,255,255,0.04)',
            border: isListening ? '1px solid var(--status-critical)' : '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isListening ? '0 0 16px var(--status-critical)' : 'none',
            transition: 'all 0.3s ease',
            animation: isListening ? 'pulse 1.5s infinite' : 'none'
          }}
        >
          {isListening ? (
            <MicOff size={18} style={{ color: 'var(--status-critical)' }} />
          ) : (
            <Mic size={18} style={{ color: 'var(--text-secondary)' }} />
          )}
        </button>
      </div>

      {/* Voice Prompt Text Hint */}
      {isListening && (
        <div style={{ 
          fontSize: '11px', 
          color: 'var(--status-critical)', 
          textAlign: 'center', 
          margin: '8px 0 16px 0',
          fontWeight: '700',
          animation: 'fadeIn 0.3s ease'
        }}>
          🎙️ Escuchando... Di algo como: "Gasto 35 soles en taxi pasajes"
        </div>
      )}

      <form onSubmit={handleSave} className="quick-form-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
        
        {/* Segmented Control for Type */}
        <div className="segmented-control" style={{ marginBottom: 0 }}>
          <div 
            className={`segmented-option ${tipo === 'gasto' ? 'active gasto' : ''}`}
            onClick={() => {
              setTipo('gasto');
              setDescripcion('');
            }}
          >
            Gastos
          </div>
          <div 
            className={`segmented-option ${tipo === 'ingreso' ? 'active ingreso' : ''}`}
            onClick={() => {
              setTipo('ingreso');
              setDescripcion('');
            }}
          >
            Ingresos
          </div>
        </div>

        {/* Amount Liquid Glass Panel */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '20px 16px', 
            borderRadius: '24px', 
            textAlign: 'center', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '8px', zIndex: 10 }}>
            Monto
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', zIndex: 10 }}>
            <span className="neon-glow" style={{ fontSize: '24px', fontWeight: '800', marginRight: '6px', color: 'rgba(255,255,255,0.7)' }}>
              S/
            </span>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              placeholder="0.00"
              className="tabular-number neon-glow"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              style={{
                fontSize: '40px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '180px',
                textAlign: 'left'
              }}
            />
          </div>
        </div>

        {/* Category Selection with Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" style={{ margin: 0 }}>Categoría</label>
            {/* Simple Search Input */}
            <div style={{ position: 'relative', width: '150px' }}>
              <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar..."
                className="form-control"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '28px', height: '28px', fontSize: '11px', borderRadius: '8px', paddingRight: '6px' }}
              />
            </div>
          </div>

          {/* 2-Column Grid with remaining budget labels */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '10px', 
            maxHeight: '160px', 
            overflowY: 'auto', 
            padding: '4px',
            borderRadius: '16px'
          }}>
            {filteredCats.length > 0 ? (
              filteredCats.map(cat => {
                const isSelected = cat.id === categoriaId;
                const remaining = getRemainingBudget(cat);
                const isExceeded = cat.tipo === 'gasto' && remaining <= 0;

                return (
                  <div 
                    key={cat.id}
                    onClick={() => setCategoriaId(cat.id)}
                    className="glass-panel"
                    style={{
                      padding: '10px 10px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      minWidth: 0,
                      border: isSelected ? (isExceeded ? '1px solid var(--status-critical)' : `1px solid var(--status-ok)`) : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? (isExceeded ? 'rgba(239, 68, 68, 0.1)' : 'rgba(77, 224, 130, 0.1)') : 'rgba(255, 255, 255, 0.03)',
                      boxShadow: isSelected ? (isExceeded ? '0 0 15px rgba(239, 68, 68, 0.2)' : '0 0 15px rgba(77, 224, 130, 0.2)') : 'none',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      opacity: !isSelected && isExceeded ? 0.5 : 1
                    }}
                  >
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: cat.color || 'var(--text-muted)',
                      boxShadow: isSelected ? `0 0 8px ${cat.color}` : 'none',
                      flexShrink: 0
                    }}/>
                    
                    <div style={{ minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        width: '100%',
                        fontSize: '11px',
                        fontWeight: '700',
                        textAlign: 'left'
                      }}>
                        {cat.nombre}
                      </span>
                      <span className="tabular-number" style={{ 
                        fontSize: '9px', 
                        fontWeight: '700', 
                        color: isExceeded ? 'var(--status-critical)' : 'var(--status-ok)',
                        marginTop: '2px' 
                      }}>
                        {cat.tipo === 'ingreso' ? 'Ilimitado' : isExceeded ? 'Agotado' : `S/ ${remaining.toFixed(0)}`}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: '13px' }}>
                No se encontraron categorías
              </div>
            )}
          </div>
        </div>

        {/* Description & Date Side-by-Side (MacBook Tahoe Panel Look) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
          
          {/* Description Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ marginLeft: '4px', fontSize: '9px' }}>Descripción</label>
            <div className="glass-panel" style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 12px', height: '42px' }}>
              <AlignLeft size={14} style={{ color: 'var(--text-muted)', marginRight: '8px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Ej: Menú almuerzo"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '13px',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Date Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ marginLeft: '4px', fontSize: '9px' }}>Fecha</label>
            <div className="glass-panel" style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 12px', height: '42px' }}>
              <Calendar size={14} style={{ color: 'var(--text-muted)', marginRight: '8px', flexShrink: 0 }} />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-tabular)'
                }}
              />
            </div>
          </div>

        </div>

        {/* Suggestion tags for ultra-fast tapping */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '-4px' }}>
          {suggestions[tipo].slice(0, 6).map((tag, idx) => (
            <div
              key={idx}
              onClick={() => setDescripcion(tag)}
              className="glass-panel"
              style={{
                fontSize: '10px',
                fontWeight: '600',
                padding: '6px 12px',
                background: descripcion === tag ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.02)',
                border: descripcion === tag ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.12s ease'
              }}
            >
              <Tag size={9} />
              {tag}
            </div>
          ))}
        </div>

        {/* Alert Suggestions for Exceeded Categories */}
        {isCategoryExceeded && (
          <div 
            className="alert-banner" 
            style={{ 
              background: 'rgba(255, 180, 171, 0.08) !important', 
              color: 'var(--status-critical) !important', 
              border: '1px solid rgba(255, 180, 171, 0.3) !important', 
              margin: 0,
              padding: '12px 14px',
              borderRadius: '16px'
            }}
          >
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, color: 'var(--status-critical)' }} />
                <span style={{ fontSize: '12px', fontWeight: '700' }}>
                  El presupuesto de "{selectedCat.nombre}" está agotado.
                </span>
              </div>
              
              {suggestedAlternatives.length > 0 ? (
                <>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Sugerencias con saldo disponible:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {suggestedAlternatives.map(alt => (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => setCategoriaId(alt.id)}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: 'var(--status-ok)',
                          cursor: 'pointer',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {alt.nombre} (S/ {alt.remaining.toFixed(0)})
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  No tienes otras categorías con saldo disponible.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isCategoryExceeded}
          style={{ 
            width: '100%', 
            height: '52px', 
            fontSize: '14px', 
            gap: '8px', 
            borderRadius: '16px',
            boxShadow: isCategoryExceeded ? 'none' : '0 0 20px rgba(255, 255, 255, 0.2)',
            marginTop: '6px',
            background: isCategoryExceeded ? 'rgba(255,255,255,0.04)' : '#fff',
            color: isCategoryExceeded ? 'var(--text-muted)' : '#000',
            border: isCategoryExceeded ? '1px solid rgba(255,255,255,0.06)' : 'none',
            cursor: isCategoryExceeded ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isCategoryExceeded ? (
            <span>Bloqueado por Límite Excedido</span>
          ) : (
            <>
              <Check size={16} style={{ strokeWidth: '3px' }} />
              <span>Guardar Movimiento</span>
            </>
          )}
        </button>
      </form>

      {/* 8. Voice Simulator Fallback Drawer Modal */}
      {isSimModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 2500 }}>
          <div className="modal-content" style={{ maxWidth: '380px', borderRadius: '24px', background: '#0e1016', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Mic size={18} style={{ color: 'var(--status-critical)' }} /> Simulador de Dictado
              </h3>
              <button 
                onClick={() => setIsSimModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
              ⚠️ <b>Restricción de Seguridad:</b> El dictado de voz nativo requiere conexión segura <b>HTTPS</b> en dispositivos móviles. 
              <br/><br/>
              Para probar el motor de análisis inteligente por voz en tu celular, escribe tu comando de voz aquí abajo:
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!simText.trim()) return;
              const parsed = parseVoiceInput(simText, categories);
              
              if (parsed.tipo) setTipo(parsed.tipo);
              if (parsed.monto) setMonto(parsed.monto);
              if (parsed.categoriaId) setCategoriaId(parsed.categoriaId);
              if (parsed.descripcion) setDescripcion(parsed.descripcion);
              
              setVoiceOrigin('voz');
              setIsSimModalOpen(false);
              setSimText('');
              
              const matchedCatName = categories.find(c => c.id === parsed.categoriaId)?.nombre || 'General';
              showToast(`Simulado: S/ ${parsed.monto || '0'} en ${matchedCatName} 🎙️`);
            }}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: gasto 16 soles en Starbucks"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  required
                  style={{ height: '42px', padding: '10px', fontSize: '13px', borderRadius: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsSimModalOpen(false)} 
                  style={{ flex: 1, height: '44px', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, height: '44px', fontSize: '12px' }}
                >
                  Procesar Voz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
