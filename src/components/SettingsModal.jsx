import React, { useState } from 'react';
import { X, Key, ShieldCheck, Cpu, Info, Check } from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  apiKey, 
  setApiKey, 
  apiMode, 
  setApiMode,
  financeApiProvider,
  setFinanceApiProvider,
  financeApiKey,
  setFinanceApiKey
}) {
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempMode, setTempMode] = useState(apiMode);
  
  // Real-Time Finance API Local States
  const [tempFinProvider, setTempFinProvider] = useState(financeApiProvider);
  const [tempFinKey, setTempFinKey] = useState(financeApiKey);
  
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  // Dynamic API Key switcher based on active provider selection
  const handleProviderSelect = (provider) => {
    setTempFinProvider(provider);
    if (provider === 'finnhub') {
      setTempFinKey(localStorage.getItem('fsi_finnhub_api_key') || import.meta.env.VITE_FINHUB || '');
    } else if (provider === 'twelvedata') {
      setTempFinKey(localStorage.getItem('fsi_twelvedata_api_key') || import.meta.env.VITE_TWELVEDATA || '');
    } else if (provider === 'brapi') {
      setTempFinKey(localStorage.getItem('fsi_brapi_api_key') || import.meta.env.VITE_BRAPI || '');
    } else {
      setTempFinKey('');
    }
  };

  const handleSave = () => {
    setApiKey(tempKey);
    setApiMode(tempMode);
    localStorage.setItem('fsi_api_key', tempKey);
    localStorage.setItem('fsi_gemini_api_key', tempKey);
    localStorage.setItem('fsi_api_mode', tempMode);
    
    // Save Real-Time Finance API Config
    setFinanceApiProvider(tempFinProvider);
    setFinanceApiKey(tempFinKey);
    localStorage.setItem('fsi_finance_api_provider', tempFinProvider);
    localStorage.setItem('fsi_finance_api_key', tempFinKey);
    
    // Persist provider-specific key to prevent over-writing other providers
    if (tempFinProvider === 'finnhub') {
      localStorage.setItem('fsi_finnhub_api_key', tempFinKey);
    } else if (tempFinProvider === 'twelvedata') {
      localStorage.setItem('fsi_twelvedata_api_key', tempFinKey);
    } else if (tempFinProvider === 'brapi') {
      localStorage.setItem('fsi_brapi_api_key', tempFinKey);
    }
    
    // Dispara evento global para notificar alteração de cache
    window.dispatchEvent(new Event('fsi_prices_updated'));
    
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div style={styles.overlay} className="animate-fade">
      <div style={styles.modal} className="glass-panel glass-panel-glow animate-slide">
        
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <Cpu size={20} color="#6366f1" />
            <h3 style={styles.title}>System Control & API Config</h3>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.body}>
          
          {/* Mode Selector */}
          <div style={styles.section}>
            <label style={styles.label}>Orchestration Mode</label>
            <div style={styles.modeGrid}>
              <div 
                style={{
                  ...styles.modeCard,
                  ...(tempMode === 'simulated' ? styles.modeCardActive : {})
                }}
                onClick={() => setTempMode('simulated')}
              >
                <div style={styles.modeCardHeader}>
                  <span style={styles.modeDot}></span>
                  <strong>High-Fidelity Simulation</strong>
                </div>
                <p style={styles.modeDesc}>
                  Generates instant, zero-cost, expert agent workflows. Works fully offline. Highly recommended for exploring all features.
                </p>
              </div>

              <div 
                style={{
                  ...styles.modeCard,
                  ...(tempMode === 'gemini' ? styles.modeCardActive : {})
                }}
                onClick={() => setTempMode('gemini')}
              >
                <div style={styles.modeCardHeader}>
                  <span style={{...styles.modeDot, background: '#06b6d4'}}></span>
                  <strong>Gemini AI (Free Tier API)</strong>
                </div>
                <p style={styles.modeDesc}>
                  Routes agent prompts and document analysis through your free Google AI Studio key. Free, but rate-limited.
                </p>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          {tempMode === 'gemini' && (
            <div style={styles.section} className="animate-fade">
              <label style={styles.label}>
                <Key size={14} style={{ marginRight: 6 }} /> 
                Google AI Studio API Key (Gemini)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                style={styles.keyInput}
                className="form-input"
              />
              <div style={styles.infoAlert}>
                <Info size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                <p style={styles.infoText}>
                  Don't have a key? You can get a 100% free Gemini API key in 30 seconds from{' '}
                  <a 
                    href="https://aistudio.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    Google AI Studio
                  </a>.
                  The free tier gives you full access to Gemini 1.5 & 2.5 models at no cost.
                </p>
              </div>
            </div>
          )}

          {/* Market Data Provider Selector */}
          <div style={styles.section}>
            <label style={styles.label}>Provedor de Dados Financeiros (Tempo Real)</label>
            <div style={styles.modeGrid}>
              <div 
                style={{
                  ...styles.modeCard,
                  ...(tempFinProvider === 'simulated' ? styles.modeCardActive : {})
                }}
                onClick={() => handleProviderSelect('simulated')}
              >
                <div style={styles.modeCardHeader}>
                  <span style={styles.modeDot}></span>
                  <strong>Sandbox Simulado</strong>
                </div>
                <p style={styles.modeDesc}>
                  Dados estáticos e históricos locais. Zero custo, 100% offline, seguro e resiliente.
                </p>
              </div>

              <div 
                style={{
                  ...styles.modeCard,
                  ...(tempFinProvider === 'finnhub' ? styles.modeCardActive : {})
                }}
                onClick={() => handleProviderSelect('finnhub')}
              >
                <div style={styles.modeCardHeader}>
                  <span style={{...styles.modeDot, background: '#06b6d4'}}></span>
                  <strong>Finnhub (Ações EUA)</strong>
                </div>
                <p style={styles.modeDesc}>
                  Cotações de ações dos EUA e globais em tempo real. Plano grátis com limite de 60 req/min.
                </p>
              </div>

              <div 
                style={{
                  ...styles.modeCard,
                  ...(tempFinProvider === 'twelvedata' ? styles.modeCardActive : {})
                }}
                onClick={() => handleProviderSelect('twelvedata')}
              >
                <div style={styles.modeCardHeader}>
                  <span style={{...styles.modeDot, background: '#a855f7'}}></span>
                  <strong>Twelve Data (Global)</strong>
                </div>
                <p style={styles.modeDesc}>
                  Dados de ações globais em tempo real. Plano gratuito com limite de 8 req/min.
                </p>
              </div>

              <div 
                style={{
                  ...styles.modeCard,
                  ...(tempFinProvider === 'brapi' ? styles.modeCardActive : {})
                }}
                onClick={() => handleProviderSelect('brapi')}
              >
                <div style={styles.modeCardHeader}>
                  <span style={{...styles.modeDot, background: '#818cf8'}}></span>
                  <strong>BRAPI (Mercado BR / BDR)</strong>
                </div>
                <p style={styles.modeDesc}>
                  Focado no mercado brasileiro (B3) e BDRs. Token gratuito pré-configurado.
                </p>
              </div>
            </div>
          </div>

          {/* Market Data Key Input */}
          {tempFinProvider !== 'simulated' && (
            <div style={styles.section} className="animate-fade">
              <label style={styles.label}>
                <Key size={14} style={{ marginRight: 6 }} /> 
                {tempFinProvider === 'brapi' 
                  ? 'BRAPI Token de Acesso' 
                  : tempFinProvider === 'finnhub' 
                    ? 'Finnhub API Token' 
                    : 'Twelve Data API Key'}
              </label>
              <input
                type="password"
                placeholder={
                  tempFinProvider === 'brapi' 
                    ? "Token da Brapi..." 
                    : tempFinProvider === 'finnhub' 
                      ? "Token da Finnhub..." 
                      : "Chave da Twelve Data..."
                }
                value={tempFinKey}
                onChange={(e) => setTempFinKey(e.target.value)}
                style={styles.keyInput}
                className="form-input"
              />
              <div style={styles.infoAlert}>
                <Info size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                <p style={styles.infoText}>
                  {tempFinProvider === 'brapi' && (
                    <>
                      Seu token da Brapi já está pré-configurado pelo sistema! Você pode obter novos tokens gratuitamente em{' '}
                      <a 
                        href="https://brapi.dev/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.link}
                      >
                        brapi.dev
                      </a>.
                    </>
                  )}
                  {tempFinProvider === 'finnhub' && (
                    <>
                      Obtenha um token de acesso 100% gratuito em{' '}
                      <a 
                        href="https://finnhub.io/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.link}
                      >
                        finnhub.io
                      </a>. O plano gratuito suporta até 60 requisições por minuto de forma extremamente rápida.
                    </>
                  )}
                  {tempFinProvider === 'twelvedata' && (
                    <>
                      Obtenha uma chave API gratuita em{' '}
                      <a 
                        href="https://twelvedata.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.link}
                      >
                        twelvedata.com
                      </a>. O plano grátis suporta até 8 requisições por minuto.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Notice on safety */}
          <div style={styles.securityAlert}>
            <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#a7f3d0', fontSize: 13, display: 'block', marginBottom: 2 }}>Secure Local Storage</strong>
              <p style={{ color: '#6ee7b7', fontSize: 12 }}>
                Your API keys are stored only in your own browser's localStorage. They are never uploaded or transmitted to any server other than direct Google Gemini endpoints.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary" style={{ minWidth: 100 }}>
            {saved ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={16} /> Saved!
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    overflowY: 'auto',
  },
  modal: {
    width: '600px',
    maxWidth: '90%',
    maxHeight: '85vh',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 4,
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
  },
  modeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  modeCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  modeCardActive: {
    background: 'rgba(99, 102, 241, 0.06)',
    borderColor: '#6366f1',
    boxShadow: '0 0 12px rgba(99, 102, 241, 0.1)',
  },
  modeCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '14px',
    color: '#ffffff',
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#6366f1',
  },
  modeDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  keyInput: {
    fontFamily: 'monospace',
  },
  infoAlert: {
    background: 'rgba(56, 189, 248, 0.05)',
    border: '1px solid rgba(56, 189, 248, 0.15)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: '12px',
    color: '#93c5fd',
    lineHeight: '1.5',
  },
  link: {
    color: '#38bdf8',
    textDecoration: 'underline',
    fontWeight: '500',
  },
  securityAlert: {
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '16px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    background: 'rgba(0, 0, 0, 0.1)',
  },
};
