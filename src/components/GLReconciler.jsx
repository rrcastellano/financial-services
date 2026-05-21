import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Search, RefreshCw, Layers } from 'lucide-react';

const MOCK_BREAKS = [
  {
    id: "BRK-001",
    date: "2026-05-12",
    amount: 125000.00,
    ledgerDesc: "Wire Transfer Inflow - Client Acme Corp",
    bankDesc: "WIRE IN *ACME SERVICES INC* MD78923",
    status: "Mismatch",
    cause: "Different legal names and slight fee subtraction of $35.00 on clearance.",
    action: "Link transactions and route for manager sign-off.",
  },
  {
    id: "BRK-002",
    date: "2026-05-14",
    amount: -45200.00,
    ledgerDesc: "Supplier Payment - Cloud Solutions Ltd",
    bankDesc: "—",
    status: "Missing Bank Record",
    cause: "Payment initiated in ledger but wire was rejected by intermediary bank due to routing code mismatch.",
    action: "Reverse ledger accrual entry and re-issue payout.",
  },
  {
    id: "BRK-003",
    date: "2026-05-15",
    amount: -8900.00,
    ledgerDesc: "Subscription Fee - Bloomberg Enterprise",
    bankDesc: "BLOOMBERG LP DB DEB-99823",
    status: "Double Post",
    cause: "Ledger recorded payment twice on consecutive days due to automated webhook retry failure.",
    action: "Delete duplicate ledger entry #88723.",
  }
];

export default function GLReconciler() {
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [logs, setLogs] = useState([]);
  const [selectedBreak, setSelectedBreak] = useState(null);

  const runReconciler = () => {
    setLoading(true);
    setAnalyzed(false);
    setSelectedBreak(null);
    setLogs([]);

    const mockLogs = [
      "Accessing general ledger CSV inputs...",
      "Reading corporate bank clearing statements...",
      "Invoking gl-reconciler.md to perform balance reconciliation...",
      "Scanning 1,452 transactions for transaction breaks...",
      "Break identified: missing record matching wire transaction ID BRK-002...",
      "Break identified: duplicate ledger post detected for BRK-003...",
      "Mapping breaks root-causes and preparing reconciliation journal entries... Done."
    ];

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < mockLogs.length) {
        setLogs(prev => [...prev, `[RECON] ${mockLogs[logIdx]}`]);
        logIdx++;
      } else {
        clearInterval(interval);
        setAnalyzed(true);
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div style={styles.container} className="animate-fade">
      
      {/* GL Upload Simulation Header */}
      <div style={styles.uploadCard} className="glass-panel">
        <UploadCloud size={36} color="#6366f1" style={{ marginBottom: 10 }} />
        <h3 style={{ fontSize: 16 }}>Accrual General Ledger Reconciliation</h3>
        <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, maxWidth: 380, textAlign: 'center' }}>
          Simulate uploading your Month-End General Ledger CSV files or click below to audit mock transaction sets.
        </p>
        
        <div style={styles.actionsRow}>
          <button onClick={runReconciler} className="btn btn-primary" style={{ height: '38px' }}>
            <Layers size={14} /> Run Month-End Reconciler
          </button>
        </div>
      </div>

      {/* Grid panels splits */}
      {analyzed || loading ? (
        <div style={styles.reconGrid} className="animate-fade">
          
          {/* Left Panel: Logs & Break Cards */}
          <div style={styles.breaksColumn}>
            
            {/* Logs console */}
            <div style={styles.logsCard} className="glass-panel">
              <h4 style={styles.panelTitle}>GL Reconciler Audit Console</h4>
              <div className="terminal-container" style={{ height: '110px', marginTop: 10 }}>
                {logs.map((l, i) => (
                  <div key={i} className="terminal-line info" style={{ fontSize: 11 }}>
                    {l}
                  </div>
                ))}
                {loading && <div style={styles.spinnerPulse}>Executing reconciliation rules...</div>}
              </div>
            </div>

            {/* Break List cards */}
            {analyzed && (
              <div style={styles.breaksListContainer}>
                <h4 style={{...styles.panelTitle, marginBottom: 12}}>⚠️ Identified Ledger Breaks ({MOCK_BREAKS.length})</h4>
                <div style={styles.breakCardsScroll}>
                  {MOCK_BREAKS.map(b => (
                    <div 
                      key={b.id} 
                      style={{
                        ...styles.breakCard,
                        ...(selectedBreak?.id === b.id ? styles.breakCardActive : {})
                      }}
                      onClick={() => setSelectedBreak(b)}
                      className="glass-panel"
                    >
                      <div style={styles.cardHeader}>
                        <span style={styles.breakId}>{b.id}</span>
                        <span className={`tag ${b.status === 'Mismatch' ? 'tag-warning' : 'tag-danger'}`}>
                          {b.status}
                        </span>
                      </div>
                      
                      <div style={styles.cardBody}>
                        <div style={styles.cardDesc}>{b.ledgerDesc}</div>
                        <div style={styles.cardAmount}>
                          Amount: <strong style={{ color: b.amount > 0 ? '#10b981' : '#f87171' }}>
                            {b.amount > 0 ? `+$${b.amount.toLocaleString()}` : `-$${Math.abs(b.amount).toLocaleString()}`}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Panel: Selected Break Deep Dive & Resolution */}
          <div style={styles.investigationPanel} className="glass-panel">
            {selectedBreak ? (
              <div style={styles.deepDiveContainer} className="animate-fade">
                <div style={styles.diveHeader}>
                  <AlertTriangle size={20} color="#fbbf24" />
                  <h3 style={{ fontSize: 18, color: '#ffffff' }}>Break Investigation: {selectedBreak.id}</h3>
                </div>

                <div style={styles.diveSection}>
                  <h4 style={styles.diveSectionTitle}>Comparison details</h4>
                  <div style={styles.comparisonGrid}>
                    <div style={styles.compCell}>
                      <span style={styles.compLabel}>Internal Ledger Record</span>
                      <strong style={styles.compVal}>{selectedBreak.ledgerDesc}</strong>
                      <span style={{...styles.compVal, color: '#94a3b8', fontSize: 11}}>Date: {selectedBreak.date}</span>
                    </div>
                    <div style={styles.compCell}>
                      <span style={styles.compLabel}>External Bank Clearing</span>
                      <strong style={styles.compVal}>{selectedBreak.bankDesc}</strong>
                      <span style={{...styles.compVal, color: '#94a3b8', fontSize: 11}}>Date: {selectedBreak.date}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.diveSection}>
                  <h4 style={styles.diveSectionTitle}>Root Cause Analysis</h4>
                  <p style={styles.diveText}>{selectedBreak.cause}</p>
                </div>

                <div style={styles.diveSection}>
                  <h4 style={{...styles.diveSectionTitle, color: '#10b981'}}>Suggested Resolution Entry</h4>
                  <p style={{...styles.diveText, color: '#a7f3d0', background: 'rgba(16,185,129,0.05)', padding: 12, borderRadius: 6, border: '1px solid rgba(16,185,129,0.1)'}}>
                    {selectedBreak.action}
                  </p>
                </div>

                <button 
                  onClick={() => alert(`Reconciliation entry generated and routed to Month-End General Ledger approval queues.`)}
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: 10 }}
                >
                  Approve Resolution Entry
                </button>
              </div>
            ) : (
              <div style={styles.emptyDive}>
                <Layers size={48} color="#475569" style={{ marginBottom: 12 }} />
                <h4>Select a Break to Investigate</h4>
                <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, maxWidth: 240, textAlign: 'center' }}>
                  Click on one of the ledger breaks in the list to run deep-dive break tracing and generate adjustment journal suggestions.
                </p>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div style={styles.emptyDashboard} className="glass-panel">
          <FileSpreadsheet size={48} color="#475569" style={{ marginBottom: 16 }} />
          <h3>Month-End General Ledger Reconciliation</h3>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, maxWidth: 300, textAlign: 'center' }}>
            Awaiting reconciliation execution. Press the audit button above to run checks across transaction ledgers.
          </p>
        </div>
      )}

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
  uploadCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    display: 'flex',
    gap: 12,
    marginTop: 16,
  },
  reconGrid: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: 20,
  },
  breaksColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    height: '480px',
  },
  logsCard: {
    padding: '12px 16px',
    height: '180px',
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: '600',
  },
  spinnerPulse: {
    color: '#6366f1',
    fontSize: '11px',
    marginTop: 6,
    animation: 'pulse 1.5s infinite',
  },
  breaksListContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  breakCardsScroll: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  breakCard: {
    padding: '12px',
    textAlign: 'left',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    transition: 'all 0.2s',
  },
  breakCardActive: {
    background: 'rgba(99, 102, 241, 0.06)',
    borderColor: '#6366f1',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakId: {
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: '#94a3b8',
  },
  cardBody: {
    marginTop: 8,
  },
  cardDesc: {
    fontSize: '11px',
    color: '#ffffff',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardAmount: {
    fontSize: '10px',
    color: '#cbd5e1',
    marginTop: 4,
  },
  investigationPanel: {
    padding: '24px',
    height: '480px',
    display: 'flex',
    flexDirection: 'column',
  },
  deepDiveContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: '100%',
    overflowY: 'auto',
    textAlign: 'left',
  },
  diveHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '12px',
  },
  diveSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  diveSectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  compCell: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '6px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
  },
  compLabel: {
    fontSize: '9px',
    color: '#64748b',
    fontWeight: '600',
  },
  compVal: {
    fontSize: '11px',
    color: '#cbd5e1',
    marginTop: 4,
  },
  diveText: {
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: '1.5',
  },
  emptyDive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#475569',
  },
  emptyDashboard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '360px',
    color: '#475569',
  },
};
