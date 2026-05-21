import React, { useState } from 'react';
import { Newspaper, FileText, Send, Calendar, RefreshCw, Cpu } from 'lucide-react';
import { fetchCompanyData } from '../utils/financeApi';

const MOCK_TRANSCRIPTS = {
  AAPL: "Apple Inc. Q4 2025 Earnings Call Transcript. Tim Cook (CEO): 'We are incredibly pleased to report a new revenue record, driven by stronger than expected iPhone demand and accelerated uptake in our AI Services division. While hardware margins faced mild headwind due to supply constraints, our higher margin Services segment grew 12% YoY, offsetting operational drag. Moving forward, we expect computational intelligence integrations to become the primary catalyst for our hardware replacement cycles.'",
  MSFT: "Microsoft Corp. Q3 2026 Earnings Call Transcript. Satya Nadella (CEO): 'Our Cloud business delivered exceptional growth this quarter, with Azure revenue expanding 31% YoY. Copilot and AI services adoption are now contributing a full 8 percentage points to cloud acceleration. Capital expenditures will expand by 15% next quarter to fulfill structural GPU demand, which remains capacity constrained. We continue to see massive enterprise demand for multi-agent workflows.'",
  TSLA: "Tesla, Inc. Q1 2026 Earnings Call Transcript. Elon Musk (CEO): 'Production of our new low-cost vehicle is on track to begin in late 2026, which will unlock our next major growth wave. Energy storage deployments grew 150% YoY, representing a major EBITDA margin contributor. Autopilot FSD version 12.5 continues to see exponential miles driven, preparing the ground for autonomous taxi networks.'",
};

export default function EarningsReviewer() {
  const [ticker, setTicker] = useState('AAPL');
  const [customText, setCustomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [logs, setLogs] = useState([]);

  const runReviewer = () => {
    setLoading(true);
    setReport(null);
    setLogs([]);

    const textToReview = customText || MOCK_TRANSCRIPTS[ticker.toUpperCase()] || `Transcript for ${ticker} was loaded. Executive highlights denote positive operational trends with revenue growing steadily.`;

    const mockLogs = [
      `[EARNINGS] Ingesting corporate filings and transcripts...`,
      `[SKILL] Invoking earnings-analysis.md to parse earnings call transcript...`,
      `[SKILL] Firing morning-note.md to draft investment thesis updates...`,
      `[SKILL] Invoking catalyst-calendar.md to identify upcoming transaction timelines...`,
      `[MODEL] Updating Excel financial model assumptions with LTM actuals...`,
      `[EARNINGS] Note draft completed. Ready for publish review.`
    ];

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < mockLogs.length) {
        setLogs(prev => [...prev, mockLogs[logIdx]]);
        logIdx++;
      } else {
        clearInterval(interval);
        
        const comp = fetchCompanyData(ticker);
        
        setReport({
          ticker: comp.ticker,
          companyName: comp.name,
          title: `Institutional Research Note: ${comp.name} (${comp.ticker})`,
          date: "May 19, 2026",
          rating: comp.revenueGrowth > 0.1 ? "OVERWEIGHT (Buy)" : "NEUTRAL (Hold)",
          targetPrice: (comp.price * 1.18).toFixed(2),
          summary: `Following our review of ${comp.name}'s latest executive disclosures, we remain confident in their operational execution. Accelerated enterprise demand and high gross margins of ${(comp.grossMargin*100).toFixed(1)}% demonstrate strong pricing power despite minor macroeconomic headwinds.`,
          positives: [
            `EBITDA margin of ${(comp.ebitdaMargin*100).toFixed(1)}% indicates superior cost controls.`,
            `Free Cash Flow generated LTM of $${(comp.freeCashFlowLTM/1000).toFixed(1)}B will support planned share buybacks.`,
            `Key CEO commentary confirms structural tailwinds in AI services.`
          ],
          negatives: [
            `Capital Expenditures (CapEx) expected to scale higher, creating near-term FCF pressure.`,
            `Persistent supply chains constraint for primary high-end electronics components.`
          ],
          catalysts: [
            "Next Quarterly Earnings Release (August 2026)",
            "System integrations rollout of agentic copilots (September 2026)"
          ]
        });
        setLoading(false);
      }
    }, 400);
  };

  const loadPreset = (presetTicker) => {
    setTicker(presetTicker);
    setCustomText(MOCK_TRANSCRIPTS[presetTicker]);
  };

  return (
    <div style={styles.container} className="animate-fade">
      
      {/* Search Bar & Preset select */}
      <div style={styles.headerPanel} className="glass-panel">
        <div style={styles.presets}>
          <span style={styles.presetsLabel}>Select Preset:</span>
          <button onClick={() => loadPreset('AAPL')} className="btn btn-secondary" style={styles.presetBtn}>AAPL</button>
          <button onClick={() => loadPreset('MSFT')} className="btn btn-secondary" style={styles.presetBtn}>MSFT</button>
          <button onClick={() => loadPreset('TSLA')} className="btn btn-secondary" style={styles.presetBtn}>TSLA</button>
        </div>
        
        <div style={styles.searchBox}>
          <Newspaper size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Or enter other ticker..." 
            value={ticker} 
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            style={styles.tickerInput}
          />
        </div>

        <button onClick={runReviewer} className="btn btn-primary" style={{ padding: '10px 20px' }}>
          <Cpu size={16} /> Review Transcript
        </button>
      </div>

      {/* Editor & Report workspace */}
      <div style={styles.workspaceGrid}>
        
        {/* Left Side: Transcript Input Editor */}
        <div style={styles.editorPanel} className="glass-panel">
          <div style={styles.panelHeader}>
            <FileText size={16} color="#6366f1" />
            <h4 style={styles.panelTitle}>Earnings Transcript Input</h4>
          </div>
          <textarea
            placeholder="Paste raw earnings call transcript or corporate press release text here..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            style={styles.textarea}
            className="form-input"
          />
          
          {/* Logs Terminal console */}
          <div style={styles.miniConsole}>
            <div className="terminal-container" style={{ height: '110px' }}>
              {logs.length === 0 ? (
                <div style={{ color: '#475569', fontSize: 11, textAlign: 'center', paddingTop: 20 }}>
                  Awaiting review process logs...
                </div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="terminal-line success" style={{ fontSize: 11 }}>
                    {l}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Generated analyst report */}
        <div style={styles.reportPanel} className="glass-panel">
          {report ? (
            <div style={styles.reportScroll} className="animate-fade">
              
              {/* Report Header */}
              <div style={styles.reportHeader}>
                <span className="tag tag-info" style={{ marginBottom: 8 }}>RESEARCH PUBLICATION</span>
                <h3 style={{ fontSize: 20, color: '#ffffff' }}>{report.title}</h3>
                <div style={styles.metaRow}>
                  <span>Date: {report.date}</span>
                  <span>| Analyst Recommendation: <strong style={{ color: '#10b981' }}>{report.rating}</strong></span>
                  <span>| Target Price: <strong style={{ color: '#fbbf24' }}>${report.targetPrice}</strong></span>
                </div>
              </div>

              {/* Summary */}
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>I. Investment Thesis & Key Takeaways</h4>
                <p style={styles.paragraph}>{report.summary}</p>
              </div>

              {/* Pros & Cons */}
              <div style={styles.splitsGrid}>
                <div style={styles.bulletsCard}>
                  <h4 style={{...styles.sectionTitle, color: '#10b981'}}>✔ Key Positives</h4>
                  <ul style={styles.bulletList}>
                    {report.positives.map((p, i) => <li key={i} style={styles.bulletItem}>{p}</li>)}
                  </ul>
                </div>
                
                <div style={styles.bulletsCard}>
                  <h4 style={{...styles.sectionTitle, color: '#f87171'}}>⚠ Downside Risks</h4>
                  <ul style={styles.bulletList}>
                    {report.negatives.map((n, i) => <li key={i} style={styles.bulletItem}>{n}</li>)}
                  </ul>
                </div>
              </div>

              {/* Upcoming Catalysts */}
              <div style={{ ...styles.section, marginTop: 16 }}>
                <h4 style={{...styles.sectionTitle, display: 'flex', alignItems: 'center', gap: 6}}>
                  <Calendar size={14} color="#fbbf24" /> Upcoming Catalyst Calendar
                </h4>
                <div style={styles.catalystsContainer}>
                  {report.catalysts.map((cat, i) => (
                    <div key={i} style={styles.catalystBox}>
                      <span style={styles.dot}></span>
                      <span>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div style={styles.emptyOutput}>
              {!loading ? (
                <>
                  <Newspaper size={48} color="#475569" style={{ marginBottom: 16 }} />
                  <h3>Earnings Analysis Center</h3>
                  <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, maxWidth: 300, textAlign: 'center' }}>
                    Select a preset company, modify the transcript, and press "Review Transcript" to compile research updates.
                  </p>
                </>
              ) : (
                <div style={styles.progressLoader}>
                  <div style={styles.spinner}></div>
                  <h4 style={{ marginTop: 16 }}>Reviewing Disclosures...</h4>
                  <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                    Compiling morning research notes and updating model sheets...
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
  },
  headerPanel: {
    display: 'flex',
    padding: '14px 20px',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  presets: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  presetsLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500',
    fontFamily: 'var(--font-display)',
  },
  presetBtn: {
    padding: '4px 10px',
    fontSize: '12px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    padding: '0 12px',
    width: '180px',
    height: '36px',
  },
  tickerInput: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    marginLeft: 8,
    outline: 'none',
    width: '100%',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
  },
  workspaceGrid: {
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: 20,
  },
  editorPanel: {
    padding: '16px',
    height: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: '600',
  },
  textarea: {
    flex: 1,
    resize: 'none',
    background: 'rgba(0,0,0,0.3)',
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#e2e8f0',
  },
  miniConsole: {
    height: '110px',
  },
  reportPanel: {
    padding: '24px',
    height: '500px',
    overflow: 'hidden',
  },
  reportScroll: {
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingRight: 10,
    textAlign: 'left',
  },
  reportHeader: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '12px',
  },
  metaRow: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: 6,
    display: 'flex',
    gap: 12,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  paragraph: {
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.6',
  },
  splitsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  bulletsCard: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  bulletList: {
    listStyleType: 'square',
    paddingLeft: '18px',
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  bulletItem: {
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: '1.4',
  },
  catalystsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 6,
  },
  catalystBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid rgba(255,255,255,0.03)',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#cbd5e1',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#fbbf24',
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
};
