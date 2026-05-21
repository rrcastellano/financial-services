import React, { useState, useRef, useEffect } from 'react';
import { Search, Play, FileSpreadsheet, Presentation, Sparkles, Terminal as TermIcon, ShieldAlert } from 'lucide-react';
import { fetchCompanyData } from '../utils/financeApi';
import ExcelViewer from './ExcelViewer';
import SlidesViewer from './SlidesViewer';

export default function PitchAgent() {
  const [ticker, setTicker] = useState('AAPL');
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentStep, setCurrentStep] = useState('');
  const [viewMode, setViewMode] = useState('excel'); // excel, slides, split
  const intervalRef = useRef(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const [usTickers, setUsTickers] = useState([]);
  const [brTickers, setBrTickers] = useState([]);
  const [portfolioCategory, setPortfolioCategory] = useState('TOTAL'); // 'TOTAL', 'US', 'BR'

  useEffect(() => {
    const loadTickers = () => {
      const savedUs = localStorage.getItem('fsi_user_portfolio_ledger_us');
      const savedBr = localStorage.getItem('fsi_user_portfolio_ledger_br');
      let us = [];
      let br = [];
      
      if (savedUs) {
        try {
          const parsed = JSON.parse(savedUs);
          us = Object.keys(parsed).map(t => t.toUpperCase());
        } catch (e) {}
      }
      if (savedBr) {
        try {
          const parsed = JSON.parse(savedBr);
          br = Object.keys(parsed).map(t => t.toUpperCase());
        } catch (e) {}
      }
      
      // Fallback collections if ledgers don't have records
      const defaultUs = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'TSLA', 'AVGO', 'PLTR'];
      const defaultBr = ['PETR4', 'VALE3', 'ITUB4', 'WEGE3', 'BBDC4'];
      
      setUsTickers(us.length > 0 ? us : defaultUs);
      setBrTickers(br.length > 0 ? br : defaultBr);
    };

    loadTickers();
    
    // Listen to storage events to update dynamically
    window.addEventListener('storage', loadTickers);
    // Custom event to update when changes happen in the same window/tab
    window.addEventListener('portfolio_updated', loadTickers);
    
    return () => {
      window.removeEventListener('storage', loadTickers);
      window.removeEventListener('portfolio_updated', loadTickers);
    };
  }, []);

  const displayedTickers = portfolioCategory === 'US' 
    ? usTickers 
    : portfolioCategory === 'BR' 
      ? brTickers 
      : Array.from(new Set([...usTickers, ...brTickers]));

  const runPitchAgent = (tickerOverride) => {
    const activeTicker = tickerOverride || ticker;
    if (!activeTicker) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setLoading(true);
    setCompany(null);
    setLogs([]);
    setViewMode('excel');

    const targetTicker = activeTicker.toUpperCase().trim();
    const mockLogs = [
      { text: `[SYSTEM] Pitch Agent initiated for target ticker: ${targetTicker}`, type: 'info' },
      { text: `[SKILL] Invoking sector-overview.md to analyze competitive landscape & macro positioning...`, type: 'info' },
      { text: `[MCP] Accessing S&P Capital IQ MCP at CAPIQ_MCP_URL...`, type: 'success' },
      { text: `[DATA] Retrieved profile, income statement, and filings for ${targetTicker}.`, type: 'success' },
      { text: `[SKILL] Invoking comps-analysis.md to identify peer list...`, type: 'info' },
      { text: `[DATA] Selected peers: MSFT, GOOGL, AMZN, META, NVDA. Spreading multiples.`, type: 'success' },
      { text: `[SKILL] Invoking lbo-model.md to stand up sponsor buyout case.`, type: 'info' },
      { text: `[MODEL] Built debt amortization schedule and IRR sensitivity tables at 4.5x leverage.`, type: 'success' },
      { text: `[SKILL] Invoking dcf-model.md to calculate intrinsic valuation ranges.`, type: 'info' },
      { text: `[MODEL] Excel workbook generated with live formulas. No hardcoded derived cells.`, type: 'success' },
      { text: `[SKILL] Invoking pitch-deck.md to populate bank's PPTX slide templates.`, type: 'info' },
      { text: `[DECK] Branded PowerPoint deck generated. Total 4 slides with charts bound to model.`, type: 'success' },
      { text: `[SKILL] Running ib-check-deck.md QC auditor for footnote ties and margin checks.`, type: 'info' },
      { text: `[AUDIT] Integrity check passed. Ready for Human Review & Sign-Off.`, type: 'success' }
    ];

    let logIdx = 0;
    const intervalId = setInterval(() => {
      if (logIdx < mockLogs.length && mockLogs[logIdx]) {
        const nextLog = mockLogs[logIdx];
        setLogs(prev => [...prev, nextLog]);
        setCurrentStep(nextLog.text);
        logIdx++;
      } else {
        clearInterval(intervalId);
        intervalRef.current = null;
        setCompany(fetchCompanyData(targetTicker));
        setLoading(false);
      }
    }, 450);
    intervalRef.current = intervalId;
  };

  return (
    <div style={styles.container} className="animate-fade">
      
      {/* Top Search Controls Bar */}
      <div style={styles.controlsRow} className="glass-panel">
        <div style={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Enter Stock Ticker (e.g. AAPL, TSLA, MSFT, NVDA)..." 
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runPitchAgent()}
            style={styles.input}
          />
        </div>
        <button onClick={() => runPitchAgent()} className="btn btn-primary" style={{ padding: '10px 20px' }}>
          <Play size={16} /> Run Pitch Agent
        </button>
      </div>

      {/* Quick Select Portfolio Bar */}
      <div style={styles.quickSelectBar} className="glass-panel animate-fade">
        <span style={styles.quickSelectLabel}>💼 Carteira:</span>
        <div style={styles.portfolioCategoryTabs}>
          <button 
            onClick={() => setPortfolioCategory('TOTAL')}
            style={{
              ...styles.categoryTab,
              ...(portfolioCategory === 'TOTAL' ? styles.categoryTabActiveGlobal : {})
            }}
          >
            🌐 Total
          </button>
          <button 
            onClick={() => setPortfolioCategory('US')}
            style={{
              ...styles.categoryTab,
              ...(portfolioCategory === 'US' ? styles.categoryTabActiveUS : {})
            }}
          >
            🇺🇸 EUA
          </button>
          <button 
            onClick={() => setPortfolioCategory('BR')}
            style={{
              ...styles.categoryTab,
              ...(portfolioCategory === 'BR' ? styles.categoryTabActiveBR : {})
            }}
          >
            🇧🇷 Brasil
          </button>
        </div>

        <div style={styles.divider} />

        <span style={styles.quickSelectLabel}>📈 Ativos:</span>
        <div style={styles.quickSelectPills}>
          {displayedTickers.length === 0 ? (
            <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>Nenhum ativo cadastrado</span>
          ) : (
            displayedTickers.map(t => (
              <button 
                key={t}
                onClick={() => {
                  setTicker(t);
                  runPitchAgent(t);
                }}
                style={{
                  ...styles.quickPill,
                  border: ticker.toUpperCase() === t ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
                  background: ticker.toUpperCase() === t ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                  color: ticker.toUpperCase() === t ? '#a5b4fc' : '#cbd5e1',
                }}
              >
                {t}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Workspace split */}
      <div style={styles.workspaceRow}>
        
        {/* Left Control Panel: Terminal logs */}
        <div style={styles.sidebarColumn} className="glass-panel">
          <div style={styles.panelHeader}>
            <TermIcon size={16} color="#10b981" />
            <h4 style={styles.panelTitle}>Pitch Agent Process Console</h4>
          </div>
          
          <div style={styles.terminalWrapper}>
            {logs.length === 0 ? (
              <div style={styles.emptyConsole}>
                <Sparkles size={36} color="#6366f1" style={{ marginBottom: 12, opacity: 0.7 }} />
                <p>Input a stock ticker and press "Run Pitch Agent" to generate advisory books.</p>
                <div style={styles.guidelineAlert}>
                  <ShieldAlert size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: '#fde68a' }}>
                    <strong>Reference Policy:</strong> Nothing generated constitutes direct investment advice. Drafts are subject to human review.
                  </p>
                </div>
              </div>
            ) : (
              <div className="terminal-container">
                {logs.map((l, i) => {
                  if (!l) return null;
                  return (
                    <div key={i} className={`terminal-line ${l.type || 'info'}`}>
                      {l.text || ''}
                    </div>
                  );
                })}
                {loading && (
                  <div style={styles.loadingPulse}>
                    <span style={styles.pulseDot}></span>
                    <span>Orchestrating agent workflow...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right workspace: Renders Excel and PowerPoint outputs */}
        <div style={styles.mainOutputColumn}>
          {company && !loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
              
              {/* Output Tab switcher */}
              <div style={styles.outputTabBar} className="glass-panel">
                <button 
                  className={`btn ${viewMode === 'excel' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setViewMode('excel')}
                  style={styles.outputTabBtn}
                >
                  <FileSpreadsheet size={16} /> Excel Valuation Model
                </button>
                <button 
                  className={`btn ${viewMode === 'slides' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setViewMode('slides')}
                  style={styles.outputTabBtn}
                >
                  <Presentation size={16} /> PowerPoint Pitch Book
                </button>
                <button 
                  className={`btn ${viewMode === 'split' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setViewMode('split')}
                  style={styles.outputTabBtn}
                >
                  Split View (Excel & PPT)
                </button>
              </div>

              <div style={styles.viewerWrapper}>
                {viewMode === 'excel' && <ExcelViewer key={company.ticker} company={company} />}
                {viewMode === 'slides' && <SlidesViewer key={company.ticker} company={company} />}
                {viewMode === 'split' && (
                  <div style={styles.splitGrid}>
                    <ExcelViewer key={`${company.ticker}-excel`} company={company} />
                    <SlidesViewer key={`${company.ticker}-slides`} company={company} />
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div style={styles.emptyOutput} className="glass-panel">
              {!loading ? (
                <>
                  <Presentation size={48} color="#475569" style={{ marginBottom: 16 }} />
                  <h3>Awaiting Advisory Deliverables</h3>
                  <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, maxWidth: 360, textAlign: 'center' }}>
                    Advisory documents (Excel DCF/LBO models and PowerPoint pitch decks) will be populated here once the Pitch Agent finishes running.
                  </p>
                </>
              ) : (
                <div style={styles.progressLoader}>
                  <div style={styles.spinner}></div>
                  <h4 style={{ marginTop: 16 }}>Agent Working...</h4>
                  <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, maxWidth: 280, textAlign: 'center' }}>
                    {currentStep}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    width: '100%',
    height: '100%',
  },
  controlsRow: {
    display: 'flex',
    padding: '14px 20px',
    alignItems: 'center',
    gap: 16,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    padding: '0 14px',
    flex: 1,
    height: '42px',
  },
  input: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    marginLeft: 10,
    outline: 'none',
    width: '100%',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
  },
  workspaceRow: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: 20,
    alignItems: 'start',
  },
  sidebarColumn: {
    display: 'flex',
    flexDirection: 'column',
    height: '620px',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  panelTitle: {
    fontSize: '14px',
    fontWeight: '600',
  },
  terminalWrapper: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    background: '#020617',
  },
  emptyConsole: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#64748b',
    fontSize: '12px',
    textAlign: 'center',
    padding: '0 10px',
  },
  guidelineAlert: {
    background: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 20,
    textAlign: 'left',
  },
  loadingPulse: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#38bdf8',
    fontSize: '13px',
    marginTop: 10,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#38bdf8',
    animation: 'pulse 1.5s infinite',
  },
  mainOutputColumn: {
    height: '620px',
  },
  outputTabBar: {
    display: 'flex',
    padding: '10px 16px',
    gap: 12,
  },
  outputTabBtn: {
    flex: 1,
    height: '38px',
  },
  viewerWrapper: {
    flex: 1,
    overflowY: 'auto',
    borderRadius: '12px',
  },
  splitGrid: {
    display: 'grid',
    gridTemplateRows: 'auto auto',
    gap: 20,
  },
  emptyOutput: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#475569',
  },
  progressLoader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(99, 102, 241, 0.1)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  quickSelectBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    gap: 12,
    background: 'rgba(255, 255, 255, 0.01)',
  },
  quickSelectLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
  },
  portfolioCategoryTabs: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  categoryTab: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#94a3b8',
    padding: '6px 14px',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  categoryTabActiveUS: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#ffffff',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    boxShadow: '0 0 8px rgba(99, 102, 241, 0.15)',
  },
  categoryTabActiveBR: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#ffffff',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    boxShadow: '0 0 8px rgba(16, 185, 129, 0.15)',
  },
  categoryTabActiveGlobal: {
    background: 'rgba(251, 191, 36, 0.15)',
    color: '#ffffff',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    boxShadow: '0 0 8px rgba(251, 191, 36, 0.15)',
  },
  divider: {
    width: '1px',
    height: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    margin: '0 8px',
  },
  quickSelectPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickPill: {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
