import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { normalizarMonto } from '../utils/financeUtils';
import { Plus, Search, Tag, Calendar, AlignLeft, Check, AlertTriangle, Mic, MicOff, X, RefreshCw, ChevronRight } from 'lucide-react';

export default function QuickForm({ onSaveSuccess, showToast }) {
  const [tipo, setTipo] = useState('gasto');
  const [categories, setCategories] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [movements, setMovements] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState('2026-06');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Voice states
  const [isListening, setIsListening] = useState(false);

  // Voice confirmation modal
  const [voiceConfirmData, setVoiceConfirmData] = useState(null); // { monto, tipo, categoriaId, descripcion, rawText, confidence }
  const [isVoiceConfirmOpen, setIsVoiceConfirmOpen] = useState(false);
  const [voiceChangingCat, setVoiceChangingCat] = useState(false);

  // Voice Simulator fallback
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simText, setSimText] = useState('');

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
        console.error('Error loading data in form', err);
      }
    }
    loadData();
  }, [tipo, refreshTrigger]);

  const getRemainingBudget = (cat) => {
    if (cat.tipo === 'ingreso') return Infinity;
    const spent = movements
      .filter(m => m.categoria_id === cat.id && m.fecha.startsWith(currentMonth))
      .reduce((sum, m) => sum + Number(m.monto), 0);
    return cat.presupuesto_mensual - spent;
  };

  // -------------------------------------------------------
  // Smart Spanish NLP voice parser
  // -------------------------------------------------------
  const parseVoiceInput = (text, categoriesList) => {
    const lower = text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove accents for matching

    let detectedMonto = '';
    let detectedTipo = 'gasto';
    let detectedDesc = text; // default to full transcript
    let confidence = 0;

    // 1. Detect income keywords
    const incomeWords = ['ingreso', 'recibi', 'gane', 'depositaron', 'cobré', 'cobrar', 'sueldo', 'salario', 'pago recibido'];
    if (incomeWords.some(w => lower.includes(w))) {
      detectedTipo = 'ingreso';
    }

    // 2. Extract amount: handles "35 soles", "s/ 35", "treinta y cinco"
    const amountRegex = /\b(\d+(?:[.,]\d+)?)\b/;
    const amountMatch = lower.match(amountRegex);
    if (amountMatch) {
      detectedMonto = amountMatch[1].replace(',', '.');
    }

    // 3. Extended synonyms per category
    const synonymMap = {
      'Menú / Alimentación': [
        'almuerzo', 'comida', 'menu', 'restaurante', 'cena', 'desayuno', 'broaster', 'pan',
        'comer', 'almorzar', 'pizza', 'pollo', 'sandwich', 'hamburguesa', 'burger', 'arroz',
        'sopa', 'ensalada', 'fruta', 'verdura', 'mercado', 'supermercado', 'bodega',
        'leche', 'huevo', 'yogurt', 'queso', 'jugo', 'refresco', 'bebida', 'agua mineral',
        'cafe', 'cappuccino', 'te', 'infusion', 'comestibles', 'víveres', 'viveres',
        'brunch', 'snack', 'galleta', 'helado', 'postre', 'dulce', 'chocolate', 'caramelo'
      ],
      'Pasajes': [
        'pasaje', 'taxi', 'combi', 'uber', 'bus', 'transporte', 'viaje', 'colectivo',
        'metro', 'tren', 'moto', 'mototaxi', 'bicicleta', 'bici', 'indriver', 'beat',
        'cabify', 'pasajes', 'movilidad', 'micro', 'minibus'
      ],
      'Línea Celular': [
        'celular', 'telefono', 'saldo', 'recarga', 'internet', 'linea', 'entel',
        'movistar', 'claro', 'bitel', 'telefonia', 'datos', 'plan', 'chip'
      ],
      'Ahorro': [
        'ahorrar', 'ahorro', 'banco', 'colchon', 'inversion', 'invertir', 'deposito',
        'piggy', 'guardar', 'reserva', 'fondo'
      ],
      'Aporte en Casa / Servicios': [
        'servicios', 'luz', 'agua', 'casa', 'gas', 'alquiler', 'electricidad',
        'wifi', 'cable', 'telefono fijo', 'renta', 'recibo', 'pensión', 'pension',
        'servicios basicos', 'aporte'
      ],
      'Aseo Personal': [
        'aseo', 'jabon', 'shampoo', 'pasta dental', 'cepillo', 'baño', 'limpiador',
        'limpieza', 'desodorante', 'crema', 'perfume', 'gel', 'champu', 'acondicionador',
        'hilo dental', 'toalla', 'papel higienico', 'papel', 'higienico', 'pañuelo',
        'panuelo', 'servilleta', 'detergente', 'lejia', 'suavizante', 'esponja',
        'maquillaje', 'labial', 'base', 'corrector', 'sombra', 'mascara', 'bronceador',
        'farmacia', 'medicina', 'pastilla', 'vitamina', 'medicamento'
      ],
      'Salidas / Entretenimiento': [
        'salida', 'cine', 'bar', 'fiesta', 'entretenimiento', 'cerveza', 'amigos',
        'discoteca', 'teatro', 'entrada', 'spotify', 'netflix', 'streaming', 'juego',
        'videojuego', 'concierto', 'evento', 'boliche', 'karaoke', 'tragos', 'trago',
        'copa', 'pisco', 'ron', 'disco', 'parque', 'zoo', 'museo'
      ],
      'Antojos / Imprevistos': [
        'antojo', 'improvisto', 'imprevisto', 'capricho', 'sorpresa', 'accidente',
        'emergencia', 'urgencia', 'inesperado', 'extra', 'casaca', 'ropa', 'zapato',
        'accesorio', 'chompa', 'polo', 'jean', 'camisa', 'camiseta'
      ],
      'Otros / Colchón': [
        'otros', 'arreglo', 'cargador', 'adaptador', 'herramienta', 'reparacion',
        'mantenimiento', 'utiles', 'lapiz', 'cuaderno', 'libro', 'utilería',
        'gasolina', 'combustible', 'aceite', 'llanta', 'repuesto', 'pieza'
      ],
      'Sueldo / Salario': ['sueldo', 'salario', 'nomina', 'quincena', 'haberes', 'planilla'],
      'Trabajos extra / Freelance': ['freelance', 'proyecto', 'trabajo extra', 'servicio', 'honorario', 'comision']
    };

    // Score each category
    const cleanText = lower
      .replace(amountRegex, '')
      .replace(/\b(soles?|pesos?|dolares?|s\/|gaste|compre|compré|gasté|compré|pagué|pague|ingreso|recibi|gane|en|de|un|una|el|la|los|las|por|para|del)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    let bestCategory = null;
    let bestScore = 0;

    const targetType = detectedTipo;
    categoriesList
      .filter(c => c.tipo === targetType && c.activa)
      .forEach(cat => {
        const catName = cat.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let score = 0;

        // Full name match
        if (cleanText.includes(catName)) score += 15;

        // Word-level match
        catName.split(/[\s/]+/).forEach(word => {
          if (word.length > 3 && cleanText.includes(word)) score += 6;
        });

        // Synonym match (weighted)
        (synonymMap[cat.nombre] || []).forEach(syn => {
          const synNorm = syn.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (cleanText.includes(synNorm)) {
            score += synNorm.length > 5 ? 12 : 8; // longer synonyms = higher confidence
          }
        });

        if (score > bestScore) {
          bestScore = score;
          bestCategory = cat;
        }
      });

    // Confidence: 0-100
    confidence = Math.min(100, bestScore * 6);

    // Clean description
    let desc = text
      .replace(/\d+([.,]\d+)?/g, '')
      .replace(/\b(soles?|pesos?|dolares?|s\/|gaste|gasté|compre|compré|pagué|pague|ingreso|recibí|gane|gané|ahorré|en|de|un|una|el|la|los|soles|sol|pesos)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (desc) desc = desc.charAt(0).toUpperCase() + desc.slice(1);

    return {
      monto: detectedMonto,
      tipo: detectedTipo,
      categoriaId: bestCategory ? bestCategory.id : (categoriesList.filter(c => c.tipo === targetType && c.activa)[0]?.id || ''),
      descripcion: desc || text,
      rawText: text,
      confidence
    };
  };

  // -------------------------------------------------------
  // Voice listeners
  // -------------------------------------------------------
  const processVoiceResult = (transcript) => {
    const parsed = parseVoiceInput(transcript, categories);
    setVoiceConfirmData(parsed);
    setVoiceChangingCat(false);
    setIsVoiceConfirmOpen(true);
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
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      showToast('🎙️ Escuchando… habla ahora');
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
      if (e.error === 'no-speech') {
        showToast('No se detectó voz. Intenta de nuevo.');
      } else {
        showToast('Error de dictado. Verifica micrófono.');
      }
    };

    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      // Try all alternatives, pick best parsed
      let bestTranscript = event.results[0][0].transcript;
      let bestConf = 0;
      for (let i = 0; i < event.results[0].length; i++) {
        const t = event.results[0][i].transcript;
        const p = parseVoiceInput(t, categories);
        if (p.confidence > bestConf) {
          bestConf = p.confidence;
          bestTranscript = t;
        }
      }
      processVoiceResult(bestTranscript);
    };

    recognition.start();
  };

  // -------------------------------------------------------
  // Voice confirm: save directly from modal
  // -------------------------------------------------------
  const handleVoiceConfirmSave = async () => {
    if (!voiceConfirmData) return;
    try {
      const montoNorm = normalizarMonto(voiceConfirmData.monto);
      await dbService.createMovement({
        fecha,
        categoria_id: voiceConfirmData.categoriaId,
        monto: montoNorm,
        descripcion: voiceConfirmData.descripcion || undefined,
        origen: 'voz'
      });
      showToast('✅ Registrado por voz correctamente');
      setIsVoiceConfirmOpen(false);
      setVoiceConfirmData(null);
      setVoiceChangingCat(false);
      setRefreshTrigger(prev => prev + 1);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  };

  // -------------------------------------------------------
  // Manual form save
  // -------------------------------------------------------
  const handleSave = async (e) => {
    e.preventDefault();
    if (!categoriaId) { alert('Por favor selecciona una categoría'); return; }
    const selectedCat = categories.find(c => c.id === categoriaId);
    if (selectedCat && selectedCat.tipo === 'gasto' && getRemainingBudget(selectedCat) <= 0) {
      alert('No se puede registrar. Presupuesto agotado para esta categoría.');
      return;
    }
    try {
      await dbService.createMovement({
        fecha,
        categoria_id: categoriaId,
        monto: normalizarMonto(monto),
        descripcion: descripcion.trim() || undefined,
        origen: 'manual'
      });
      showToast('Movimiento registrado 🎉');
      setMonto(''); setDescripcion(''); setSearchQuery('');
      setRefreshTrigger(prev => prev + 1);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const filteredCats = categorias.filter(c =>
    c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.grupo && c.grupo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedCat = categories.find(c => c.id === categoriaId);
  const selectedRemaining = selectedCat ? getRemainingBudget(selectedCat) : Infinity;
  const isCategoryExceeded = selectedCat && selectedCat.tipo === 'gasto' && selectedRemaining <= 0;

  const suggestedAlternatives = categories
    .filter(c => c.tipo === 'gasto' && c.activa && c.id !== categoriaId)
    .map(c => ({ ...c, remaining: getRemainingBudget(c) }))
    .filter(c => c.remaining > 0)
    .sort((a, b) => {
      if (selectedCat && a.grupo === selectedCat.grupo && b.grupo !== selectedCat.grupo) return -1;
      if (selectedCat && a.grupo !== selectedCat.grupo && b.grupo === selectedCat.grupo) return 1;
      return b.remaining - a.remaining;
    })
    .slice(0, 2);

  // For voice confirm modal category picker
  const voiceConfirmCat = voiceConfirmData ? categories.find(c => c.id === voiceConfirmData.categoriaId) : null;
  const allActiveCats = categories.filter(c => c.activa && c.tipo === (voiceConfirmData?.tipo || 'gasto'));

  const confidenceColor = (conf) => {
    if (conf >= 70) return 'var(--status-ok)';
    if (conf >= 35) return 'var(--status-warning)';
    return 'var(--status-critical)';
  };

  const confidenceLabel = (conf) => {
    if (conf >= 70) return 'Alta confianza';
    if (conf >= 35) return 'Confianza media';
    return 'Baja confianza — verifica';
  };

  return (
    <div style={{ paddingBottom: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div>
          <h1 style={{ fontWeight: '800' }}>Registrar Movimiento</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Registra ingresos o gastos al instante.</p>
        </div>

        {/* Voice Dictation Button */}
        <button
          type="button"
          onClick={startListening}
          style={{
            width: '46px', height: '46px', borderRadius: '50%',
            background: isListening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
            border: isListening ? '1.5px solid var(--status-critical)' : '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isListening ? '0 0 20px rgba(239,68,68,0.4)' : 'none',
            transition: 'all 0.3s ease',
            animation: isListening ? 'pulse 1.4s ease-in-out infinite' : 'none'
          }}
        >
          {isListening
            ? <MicOff size={20} style={{ color: 'var(--status-critical)' }} />
            : <Mic size={20} style={{ color: 'var(--text-secondary)' }} />}
        </button>
      </div>

      {isListening && (
        <div style={{
          fontSize: '11px', color: 'var(--status-critical)', textAlign: 'center',
          margin: '8px 0 16px 0', fontWeight: '700', animation: 'fadeIn 0.3s ease'
        }}>
          🎙️ Escuchando… Di: "Compré papel higiénico por 15 soles"
        </div>
      )}

      {/* Manual form */}
      <form onSubmit={handleSave} className="quick-form-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>

        {/* Type toggle */}
        <div className="segmented-control" style={{ marginBottom: 0 }}>
          <div className={`segmented-option ${tipo === 'gasto' ? 'active gasto' : ''}`}
            onClick={() => { setTipo('gasto'); setDescripcion(''); }}>
            Gastos
          </div>
          <div className={`segmented-option ${tipo === 'ingreso' ? 'active ingreso' : ''}`}
            onClick={() => { setTipo('ingreso'); setDescripcion(''); }}>
            Ingresos
          </div>
        </div>

        {/* Amount */}
        <div className="glass-panel" style={{ padding: '20px 16px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: '8px', zIndex: 10 }}>
            Monto
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', zIndex: 10 }}>
            <span className="neon-glow" style={{ fontSize: '24px', fontWeight: '800', marginRight: '6px', color: 'rgba(255,255,255,0.7)' }}>S/</span>
            <input
              type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*"
              placeholder="0.00" className="tabular-number neon-glow"
              value={monto} onChange={(e) => setMonto(e.target.value)} required
              style={{ fontSize: '40px', fontWeight: '800', color: 'var(--text-primary)', background: 'transparent', border: 'none', outline: 'none', width: '180px', textAlign: 'left' }}
            />
          </div>
        </div>

        {/* Category grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" style={{ margin: 0 }}>Categoría</label>
            <div style={{ position: 'relative', width: '150px' }}>
              <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Buscar..." className="form-control"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '28px', height: '28px', fontSize: '11px', borderRadius: '8px', paddingRight: '6px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '160px', overflowY: 'auto', padding: '4px', borderRadius: '16px' }}>
            {filteredCats.length > 0 ? filteredCats.map(cat => {
              const isSelected = cat.id === categoriaId;
              const remaining = getRemainingBudget(cat);
              const isExceeded = cat.tipo === 'gasto' && remaining <= 0;
              return (
                <div key={cat.id} onClick={() => setCategoriaId(cat.id)} className="glass-panel"
                  style={{
                    padding: '10px', borderRadius: '16px', cursor: 'pointer', minWidth: 0,
                    border: isSelected ? (isExceeded ? '1px solid var(--status-critical)' : '1px solid var(--status-ok)') : '1px solid rgba(255,255,255,0.08)',
                    background: isSelected ? (isExceeded ? 'rgba(239,68,68,0.1)' : 'rgba(77,224,130,0.1)') : 'rgba(255,255,255,0.03)',
                    boxShadow: isSelected ? (isExceeded ? '0 0 15px rgba(239,68,68,0.2)' : '0 0 15px rgba(77,224,130,0.2)') : 'none',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s ease', opacity: !isSelected && isExceeded ? 0.5 : 1
                  }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color || 'var(--text-muted)', boxShadow: isSelected ? `0 0 8px ${cat.color}` : 'none', flexShrink: 0 }} />
                  <div style={{ minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', fontSize: '11px', fontWeight: '700' }}>{cat.nombre}</span>
                    <span className="tabular-number" style={{ fontSize: '9px', fontWeight: '700', color: isExceeded ? 'var(--status-critical)' : 'var(--status-ok)', marginTop: '2px' }}>
                      {cat.tipo === 'ingreso' ? 'Ilimitado' : isExceeded ? 'Agotado' : `S/ ${remaining.toFixed(0)}`}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: '13px' }}>No se encontraron categorías</div>
            )}
          </div>
        </div>

        {/* Description & Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ marginLeft: '4px', fontSize: '9px' }}>Descripción</label>
            <div className="glass-panel" style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 12px', height: '42px' }}>
              <AlignLeft size={14} style={{ color: 'var(--text-muted)', marginRight: '8px', flexShrink: 0 }} />
              <input type="text" placeholder="Ej: Menú almuerzo" value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '13px', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ marginLeft: '4px', fontSize: '9px' }}>Fecha</label>
            <div className="glass-panel" style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 12px', height: '42px' }}>
              <Calendar size={14} style={{ color: 'var(--text-muted)', marginRight: '8px', flexShrink: 0 }} />
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required
                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-tabular)' }} />
            </div>
          </div>
        </div>

        {/* Suggestion tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '-4px' }}>
          {suggestions[tipo].slice(0, 6).map((tag, idx) => (
            <div key={idx} onClick={() => setDescripcion(tag)} className="glass-panel"
              style={{ fontSize: '10px', fontWeight: '600', padding: '6px 12px', background: descripcion === tag ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.02)', border: descripcion === tag ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.12s ease' }}>
              <Tag size={9} />{tag}
            </div>
          ))}
        </div>

        {/* Budget exceeded alert */}
        {isCategoryExceeded && (
          <div className="alert-banner" style={{ background: 'rgba(255,180,171,0.08)', color: 'var(--status-critical)', border: '1px solid rgba(255,180,171,0.3)', margin: 0, padding: '12px 14px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: '700' }}>Presupuesto de "{selectedCat.nombre}" agotado.</span>
              </div>
              {suggestedAlternatives.length > 0 && (
                <>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sugerencias con saldo:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {suggestedAlternatives.map(alt => (
                      <button key={alt.id} type="button" onClick={() => setCategoriaId(alt.id)}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: 'var(--status-ok)', cursor: 'pointer', fontWeight: '700' }}>
                        {alt.nombre} (S/ {alt.remaining.toFixed(0)})
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Save button */}
        <button type="submit" className="btn btn-primary" disabled={isCategoryExceeded}
          style={{ width: '100%', height: '52px', fontSize: '14px', gap: '8px', borderRadius: '16px', boxShadow: isCategoryExceeded ? 'none' : '0 0 20px rgba(255,255,255,0.2)', marginTop: '6px', background: isCategoryExceeded ? 'rgba(255,255,255,0.04)' : '#fff', color: isCategoryExceeded ? 'var(--text-muted)' : '#000', border: isCategoryExceeded ? '1px solid rgba(255,255,255,0.06)' : 'none', cursor: isCategoryExceeded ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease' }}>
          {isCategoryExceeded
            ? <span>Bloqueado por Límite Excedido</span>
            : <><Check size={16} style={{ strokeWidth: '3px' }} /><span>Guardar Movimiento</span></>}
        </button>
      </form>

      {/* ============================================================
          VOICE CONFIRMATION MODAL
          ============================================================ */}
      {isVoiceConfirmOpen && voiceConfirmData && (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => { setIsVoiceConfirmOpen(false); setVoiceChangingCat(false); }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(10,12,18,0.97)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '28px',
              width: '100%',
              maxWidth: '360px',
              margin: 'auto',
              padding: '0',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
              animation: 'fadeIn 0.25s ease'
            }}
          >
            {/* Header stripe */}
            <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '18px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic size={16} style={{ color: 'var(--status-critical)' }} />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Dictado detectado</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, marginTop: '1px' }}>"{voiceConfirmData.rawText}"</p>
                </div>
              </div>
              <button onClick={() => { setIsVoiceConfirmOpen(false); setVoiceChangingCat(false); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px' }}>

              {/* Confidence indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <div style={{ flex: 1, height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${voiceConfirmData.confidence}%`, height: '100%', background: confidenceColor(voiceConfirmData.confidence), borderRadius: '99px', transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: '10px', fontWeight: '700', color: confidenceColor(voiceConfirmData.confidence), whiteSpace: 'nowrap' }}>
                  {confidenceLabel(voiceConfirmData.confidence)}
                </span>
              </div>

              {/* Detected amount */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>
                  {voiceConfirmData.tipo === 'gasto' ? 'GASTO' : 'INGRESO'} DETECTADO
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: 'rgba(255,255,255,0.5)' }}>S/</span>
                  <span style={{ fontSize: '52px', fontWeight: '800', color: voiceConfirmData.tipo === 'gasto' ? 'var(--status-critical)' : 'var(--status-ok)', lineHeight: 1 }}>
                    {voiceConfirmData.monto || '0'}
                  </span>
                </div>
                {voiceConfirmData.descripcion && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                    "{voiceConfirmData.descripcion}"
                  </p>
                )}
              </div>

              {/* Detected category — or category picker */}
              {!voiceChangingCat ? (
                <div
                  onClick={() => setVoiceChangingCat(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', cursor: 'pointer', transition: 'background 0.15s ease', marginBottom: '18px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: voiceConfirmCat?.color || '#888', boxShadow: `0 0 10px ${voiceConfirmCat?.color || '#888'}`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{voiceConfirmCat?.nombre || 'Sin categoría'}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{voiceConfirmCat?.grupo || ''} · Toca para cambiar</p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              ) : (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Elige la categoría correcta</p>
                    <button onClick={() => setVoiceChangingCat(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <X size={12} /> Cancelar
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {allActiveCats.map(cat => {
                      const isSelected = cat.id === voiceConfirmData.categoriaId;
                      return (
                        <div key={cat.id}
                          onClick={() => { setVoiceConfirmData(prev => ({ ...prev, categoriaId: cat.id })); setVoiceChangingCat(false); }}
                          style={{ padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: isSelected ? 'rgba(77,224,130,0.1)' : 'rgba(255,255,255,0.03)', border: isSelected ? '1px solid var(--status-ok)' : '1px solid rgba(255,255,255,0.07)', transition: 'all 0.15s ease' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color || '#888', flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.nombre}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { setIsVoiceConfirmOpen(false); setVoiceChangingCat(false); }}
                  style={{ flex: 1, height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <X size={14} /> Cancelar
                </button>
                <button
                  onClick={handleVoiceConfirmSave}
                  disabled={!voiceConfirmData.monto || !voiceConfirmData.categoriaId}
                  style={{ flex: 2, height: '48px', borderRadius: '14px', background: !voiceConfirmData.monto ? 'rgba(255,255,255,0.04)' : '#fff', border: 'none', color: !voiceConfirmData.monto ? 'var(--text-muted)' : '#000', cursor: !voiceConfirmData.monto ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: !voiceConfirmData.monto ? 'none' : '0 0 24px rgba(255,255,255,0.25)', transition: 'all 0.2s ease' }}>
                  <Check size={16} style={{ strokeWidth: '3px' }} /> Confirmar y Guardar
                </button>
              </div>

              {/* Retry */}
              <button onClick={() => { setIsVoiceConfirmOpen(false); setVoiceChangingCat(false); setTimeout(startListening, 300); }}
                style={{ width: '100%', marginTop: '10px', height: '36px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <RefreshCw size={12} /> Volver a dictar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VOICE SIMULATOR FALLBACK
          ============================================================ */}
      {isSimModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 2500 }}>
          <div className="modal-content" style={{ maxWidth: '380px', borderRadius: '24px', background: '#0e1016', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Mic size={18} style={{ color: 'var(--status-critical)' }} /> Simulador de Voz
              </h3>
              <button onClick={() => setIsSimModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.6' }}>
              ⚠️ El dictado de voz requiere <b>HTTPS</b> en móviles. Escribe tu comando aquí para simular y verás la pantalla de confirmación.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!simText.trim()) return;
              processVoiceResult(simText);
              setIsSimModalOpen(false);
              setSimText('');
            }}>
              <div style={{ marginBottom: '16px' }}>
                <input type="text" className="form-control"
                  placeholder='Ej: "Compré papel higiénico por 15 soles"'
                  value={simText} onChange={(e) => setSimText(e.target.value)} required
                  style={{ height: '44px', padding: '10px 14px', fontSize: '13px', borderRadius: '12px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsSimModalOpen(false)} style={{ flex: 1, height: '44px', fontSize: '12px' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '44px', fontSize: '12px' }}>Analizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
