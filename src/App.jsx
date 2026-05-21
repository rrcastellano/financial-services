import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Globe, 
  Newspaper, 
  Layers, 
  UserCheck, 
  Settings, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  TrendingUp,
  Sparkles,
  Briefcase
} from 'lucide-react';

import PitchAgent from './components/PitchAgent';
import MarketResearcher from './components/MarketResearcher';
import EarningsReviewer from './components/EarningsReviewer';
import GLReconciler from './components/GLReconciler';
import KYCScreener from './components/KYCScreener';
import SettingsModal from './components/SettingsModal';
import ErrorBoundary from './components/ErrorBoundary';
import PortfolioTracker from './components/PortfolioTracker';

export default function App() {
  const [activeTab, setActiveTab] = useState('pitch');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // API Key State (loaded from localStorage by default)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('fsi_api_key') || '');
  const [apiMode, setApiMode] = useState(() => localStorage.getItem('fsi_api_mode') || 'simulated');
  
  // Real-Time Market Data API State
  const [financeApiProvider, setFinanceApiProvider] = useState(() => localStorage.getItem('fsi_finance_api_provider') || 'simulated');
  const [financeApiKey, setFinanceApiKey] = useState(() => {
    const saved = localStorage.getItem('fsi_finance_api_key');
    if (saved) return saved;
    // Pré-carrega a chave BRAPI do usuário Ronaldo para experiência out-of-the-box
    localStorage.setItem('fsi_finance_api_key', '3NQyj7ujtTwoq84s7vQTsL');
    return '3NQyj7ujtTwoq84s7vQTsL';
  });

  const agents = [
    {
      id: 'pitch',
      name: 'Pitch & Valuation Builder',
      desc: 'Builds live DCF/LBO models & branded client pitch books.',
      icon: FileSpreadsheet,
      component: PitchAgent,
      color: '#6366f1' // Indigo
    },
    {
      id: 'portfolio',
      name: 'My Portfolio Tracker',
      desc: 'Tracks stock quantity, average costs, real-time returns & correlated news.',
      icon: Briefcase,
      component: PortfolioTracker,
      color: '#10b981' // Emerald
    },
    {
      id: 'research',
      name: 'Market & Peer Researcher',
      desc: 'Aggregates sector multiples and strategic competitive intelligence.',
      icon: Globe,
      component: MarketResearcher,
      color: '#06b6d4' // Cyan
    },
    {
      id: 'earnings',
      name: 'Earnings Reviewer',
      desc: 'Ingests transcripts and outputs automated morning research notes.',
      icon: Newspaper,
      component: EarningsReviewer,
      color: '#ec4899' // Pink
    },
    {
      id: 'reconciliation',
      name: 'Ledger Break Reconciler',
      desc: 'Audits month-end general ledger files for transaction mismatches.',
      icon: Layers,
      component: GLReconciler,
      color: '#f59e0b' // Amber
    },
    {
      id: 'compliance',
      name: 'KYC Onboarding Screener',
      desc: 'Executes sanctions list checking and AML onboarding grids.',
      icon: UserCheck,
      component: KYCScreener,
      color: '#ef4444' // Rose
    }
  ];

  const currentAgent = agents.find(a => a.id === activeTab) || agents[0];
  const ActiveComponent = currentAgent.component;

  return (
    <div style={styles.appContainer}>
      
      {/* Sidebar Navigator */}
      <aside style={styles.sidebar} className="glass-panel">
        
        {/* Branding header */}
        <div style={styles.brandRow}>
          <div style={styles.logoWrapper}>
            <TrendingUp size={22} color="#6366f1" />
          </div>
          <div>
            <h1 style={styles.brandTitle}>AURA</h1>
            <span style={styles.brandSubtitle}>Cognitive FSI Suite</span>
          </div>
        </div>

        {/* Connection status card */}
        <div style={styles.statusCard}>
          <span style={styles.statusLabel}>STATUS OPERACIONAL APIS</span>
          
          <div style={styles.apiStatusList}>
            {/* Gemini AI Status */}
            <div style={styles.apiStatusRow}>
              <span 
                style={{
                  ...styles.apiStatusDot,
                  background: apiMode === 'gemini' ? '#10b981' : '#f59e0b',
                  boxShadow: apiMode === 'gemini' ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
                }}
              ></span>
              <div style={styles.apiStatusMeta}>
                <span style={styles.apiName}>Gemini AI (Cognitivo)</span>
                <span style={styles.apiDesc}>
                  {apiMode === 'gemini' ? '🟢 Conectado' : '🟡 Simulado / Local'}
                </span>
              </div>
            </div>

            {/* US Market API Status */}
            <div style={styles.apiStatusRow}>
              <span 
                style={{
                  ...styles.apiStatusDot,
                  background: financeApiProvider !== 'simulated' ? '#10b981' : '#f59e0b',
                  boxShadow: financeApiProvider !== 'simulated' ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
                }}
              ></span>
              <div style={styles.apiStatusMeta}>
                <span style={styles.apiName}>Ações EUA & Global</span>
                <span style={styles.apiDesc}>
                  {financeApiProvider === 'finnhub' 
                    ? '🟢 Finnhub Live' 
                    : financeApiProvider === 'twelvedata' 
                      ? '🟢 Twelve Data Live' 
                      : '🟡 Simulado / Local'}
                </span>
              </div>
            </div>

            {/* BR Market API Status */}
            <div style={styles.apiStatusRow}>
              <span 
                style={{
                  ...styles.apiStatusDot,
                  background: financeApiProvider !== 'simulated' ? '#10b981' : '#f59e0b',
                  boxShadow: financeApiProvider !== 'simulated' ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
                }}
              ></span>
              <div style={styles.apiStatusMeta}>
                <span style={styles.apiName}>Ações Brasil (B3)</span>
                <span style={styles.apiDesc}>
                  {financeApiProvider !== 'simulated' ? '🟢 BRAPI Live' : '🟡 Simulado / Local'}
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Navigation list */}
        <nav style={styles.nav}>
          <span style={styles.navLabel}>Cognitive Workspaces</span>
          <div style={styles.navList}>
            {agents.map(a => {
              const Icon = a.icon;
              const isActive = activeTab === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => setActiveTab(a.id)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="sidebar-nav-btn"
                  role="button"
                  style={{
                    ...styles.navBtn,
                    ...(isActive ? styles.navBtnActive : {})
                  }}
                >
                  <div 
                    style={{
                      ...styles.iconContainer,
                      background: isActive ? `rgba(${hexToRgb(a.color)}, 0.12)` : 'rgba(255,255,255,0.02)',
                      color: isActive ? a.color : '#94a3b8'
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div style={styles.navBtnMeta}>
                    <strong style={{
                      ...styles.navBtnName,
                      color: isActive ? '#ffffff' : '#e2e8f0'
                    }}>{a.name}</strong>
                    <span style={styles.navBtnDesc}>{a.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer settings control */}
        <div style={styles.sidebarFooter}>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            style={styles.settingsBtn}
            className="btn btn-secondary"
          >
            <Settings size={15} /> System Configuration
          </button>
        </div>

      </aside>

      {/* Main Workspace Frame */}
      <main style={styles.mainWorkspace}>
        
        {/* Workspace Top header */}
        <header style={styles.workspaceHeader} className="glass-panel">
          <div style={styles.headerTitleCol}>
            <div style={styles.headerTagRow}>
              <span className="tag tag-info" style={{ gap: 4, background: `rgba(${hexToRgb(currentAgent.color)}, 0.1)`, color: currentAgent.color, borderColor: `rgba(${hexToRgb(currentAgent.color)}, 0.2)` }}>
                <Activity size={11} /> Cognitive Agent
              </span>
              <span style={{ color: '#475569', fontSize: 12 }}>•</span>
              <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'var(--font-mono)' }}>Workspace: {currentAgent.id.toUpperCase()}_ENV</span>
            </div>
            <h2 style={styles.workspaceTitle}>{currentAgent.name}</h2>
          </div>

          <div style={styles.headerActionsCol}>
            <div style={styles.systemBadge}>
              <Cpu size={14} color="#6366f1" />
              <span style={{ fontSize: 12, color: '#e2e8f0' }}>Orchestration Model:</span>
              <strong style={{ fontSize: 12, color: '#fbbf24' }}>
                {apiMode === 'simulated' ? 'Mock cognitive layer' : 'Gemini 2.5 Pro'}
              </strong>
            </div>
          </div>
        </header>

        {/* Workspace Active Agent view */}
        <div style={styles.activeAgentContainer}>
          <ErrorBoundary key={activeTab} onReset={() => setActiveTab(activeTab)}>
            <ActiveComponent />
          </ErrorBoundary>
        </div>

      </main>

      {/* Control panel & Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        apiMode={apiMode}
        setApiMode={setApiMode}
        financeApiProvider={financeApiProvider}
        setFinanceApiProvider={setFinanceApiProvider}
        financeApiKey={financeApiKey}
        setFinanceApiKey={setFinanceApiKey}
      />

    </div>
  );
}

// Helper to calculate RGB values from hex string for styling
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '99, 102, 241';
}

const styles = {
  appContainer: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    width: '100vw',
    minHeight: '100vh',
    background: 'var(--bg-deep)',
    backgroundImage: 'var(--bg-gradient)',
    overflow: 'hidden',
  },
  sidebar: {
    height: '100vh',
    borderRight: '1px solid var(--panel-border)',
    borderRadius: '0',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 20px',
    background: 'rgba(9, 11, 17, 0.7)',
    zIndex: 10,
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoWrapper: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '1px',
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500',
    display: 'block',
    marginTop: -2,
  },
  statusCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: 24,
    textAlign: 'left',
  },
  statusLabel: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    display: 'block',
    marginBottom: '10px',
  },
  apiStatusList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  apiStatusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  apiStatusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  apiStatusMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  apiName: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#ffffff',
  },
  apiDesc: {
    fontSize: '10px',
    color: '#94a3b8',
    marginTop: '1px',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    overflowY: 'auto',
    textAlign: 'left',
  },
  navLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    display: 'block',
    marginBottom: 4,
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  navBtn: {
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '10px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    width: '100%',
    outline: 'none',
    boxShadow: 'none',
  },
  navBtnActive: {
    background: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'transparent',
  },
  iconContainer: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  navBtnMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflow: 'hidden',
  },
  navBtnName: {
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  navBtnDesc: {
    fontSize: '11px',
    color: '#64748b',
    lineHeight: '1.3',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  settingsBtn: {
    width: '100%',
    height: '38px',
    fontSize: '12px',
    gap: 8,
  },
  mainWorkspace: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 30px',
    overflowY: 'auto',
  },
  workspaceHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    marginBottom: 24,
    borderRadius: '16px',
    flexShrink: 0,
  },
  headerTitleCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    textAlign: 'left',
  },
  headerTagRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  workspaceTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
  },
  headerActionsCol: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  systemBadge: {
    background: 'rgba(99, 102, 241, 0.06)',
    border: '1px solid rgba(99, 102, 241, 0.12)',
    borderRadius: '8px',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  activeAgentContainer: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  }
};
