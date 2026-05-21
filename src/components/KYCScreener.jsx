import React, { useState } from 'react';
import { UserCheck, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, FileText, Send, Sparkles } from 'lucide-react';

const MOCK_ENTITIES = {
  acme: {
    name: "Acme Holdings LLC (USA)",
    riskRating: "Low Risk",
    rules: [
      { id: "REG-01", name: "Corporate Registry Check", status: "Pass", desc: "Entity registered active in State of Delaware. File date 2024-03-12." },
      { id: "UBO-02", name: "Ultimate Beneficial Owner ID", status: "Pass", desc: "Validated 100% of owners > 25% share. UBO IDs verified." },
      { id: "OFAC-03", name: "Sanctions & OFAC Check", status: "Pass", desc: "Zero matches found across PEP, OFAC, and global sanctions databases." },
      { id: "AML-04", name: "Anti-Money Laundering Risk Profile", status: "Pass", desc: "No high-risk transactions or offshore banking indicators." },
      { id: "TAX-05", name: "Tax Identity Verification", status: "Pass", desc: "EIN verified matches IRS registries." }
    ]
  },
  vertex: {
    name: "Vertex Capital Partners (Cayman Islands)",
    riskRating: "Medium Risk",
    rules: [
      { id: "REG-01", name: "Corporate Registry Check", status: "Pass", desc: "Registered Cayman Islands active. Registered office verified." },
      { id: "UBO-02", name: "Ultimate Beneficial Owner ID", status: "Flagged", desc: "Missing passport verification for UBO George Dupont (owns 35%)." },
      { id: "OFAC-03", name: "Sanctions & OFAC Check", status: "Pass", desc: "Zero matches found across global PEP and sanctions lists." },
      { id: "AML-04", name: "Anti-Money Laundering Risk Profile", status: "Flagged", desc: "Registered in an offshore financial center. Risk rating adjusted to Medium." },
      { id: "TAX-05", name: "Tax Identity Verification", status: "Pass", desc: "Tax residency documents verified matches FATCA compliance declarations." }
    ]
  }
};

export default function KYCScreener() {
  const [selectedKey, setSelectedKey] = useState('acme');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);

  const runScreener = () => {
    setLoading(true);
    setData(null);
    setLogs([]);

    const mockLogs = [
      "Accessing entity onboarding document vault...",
      "Extracting corporate formation and UBO registers...",
      "Invoking kyc-screener.md to run regulatory rules-grid checks...",
      "Checking PEP and OFAC sanctions list registries...",
      "Checking local corporate registration files...",
      "Evaluating Ultimate Beneficial Owner (UBO) passports...",
      "Running AML risk thresholds calculation...",
      "Onboarding screening check finalized."
    ];

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < mockLogs.length) {
        setLogs(prev => [...prev, `[KYC] ${mockLogs[logIdx]}`]);
        logIdx++;
      } else {
        clearInterval(interval);
        setData(MOCK_ENTITIES[selectedKey]);
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div style={styles.container} className="animate-fade">
      
      {/* Entity Selection panel */}
      <div style={styles.headerPanel} className="glass-panel">
        <div style={styles.presets}>
          <span style={styles.presetsLabel}>Select Entity:</span>
          <button 
            onClick={() => setSelectedKey('acme')} 
            className="btn btn-secondary" 
            style={{
              ...styles.presetBtn,
              ...(selectedKey === 'acme' ? styles.presetBtnActive : {})
            }}
          >
            Acme Holdings LLC
          </button>
          <button 
            onClick={() => setSelectedKey('vertex')} 
            className="btn btn-secondary" 
            style={{
              ...styles.presetBtn,
              ...(selectedKey === 'vertex' ? styles.presetBtnActive : {})
            }}
          >
            Vertex Capital Partners
          </button>
        </div>

        <button onClick={runScreener} className="btn btn-primary" style={{ padding: '10px 20px' }}>
          <Sparkles size={14} /> Screen Entity
        </button>
      </div>

      {/* Grid workspace */}
      <div style={styles.workspaceGrid}>
        
        {/* Left Side: Logs Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={styles.logPanel} className="glass-panel">
            <h4 style={styles.panelTitle}>KYC Screener Process Logs</h4>
            <div className="terminal-container" style={{ height: '220px', marginTop: 12 }}>
              {logs.length === 0 ? (
                <div style={styles.emptyLogsText}>
                  Awaiting entity screening...
                </div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="terminal-line warn" style={{ fontSize: 11 }}>
                    {l}
                  </div>
                ))
              )}
              {loading && <div style={styles.spinnerPulse}>Executing regulatory checks...</div>}
            </div>
          </div>

          {data && (
            <div style={styles.riskCard} className="glass-panel animate-fade">
              <h4 style={styles.panelTitle}>Compliance Risk Rating</h4>
              <div 
                style={{
                  ...styles.ratingBox,
                  background: data.riskRating === 'Low Risk' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                  borderColor: data.riskRating === 'Low Risk' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                  color: data.riskRating === 'Low Risk' ? '#a7f3d0' : '#fde68a'
                }}
              >
                <ShieldCheck size={20} />
                <span style={{ fontSize: 16, fontWeight: 'bold' }}>{data.riskRating}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Compliance check grid */}
        <div style={styles.mainPanel} className="glass-panel">
          {data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade">
              <div>
                <h3 style={{ fontSize: 18, color: '#ffffff' }}>KYC Onboarding Grid: {data.name}</h3>
                <p style={styles.subtext}>Parsed from onboarding vault documentation</p>
              </div>

              {/* Rules check list */}
              <div style={styles.rulesList}>
                {data.rules.map(r => (
                  <div key={r.id} style={styles.ruleItem} className="glass-panel">
                    <div style={styles.ruleHeader}>
                      <div style={styles.ruleTitleRow}>
                        <span style={styles.ruleId}>{r.id}</span>
                        <strong style={styles.ruleName}>{r.name}</strong>
                      </div>
                      
                      <div style={styles.statusBadge}>
                        {r.status === 'Pass' && (
                          <span className="tag tag-success" style={{ gap: 4 }}>
                            <CheckCircle2 size={12} /> {r.status}
                          </span>
                        )}
                        {r.status === 'Flagged' && (
                          <span className="tag tag-warning" style={{ gap: 4 }}>
                            <AlertTriangle size={12} /> {r.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={styles.ruleDesc}>{r.desc}</p>
                    
                    {r.status === 'Flagged' && (
                      <div style={styles.flagResolutionAlert} className="animate-fade">
                        <strong>Required Action:</strong> Initiate document follow-up request to partner firm. Hold wire transfers pending file completion.
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sign off area */}
              <div style={styles.signOffArea}>
                <button 
                  onClick={() => alert(`KYC Onboarding approved for ${data.name}. Entity status updated to Active.`)}
                  className="btn btn-primary" 
                  disabled={data.riskRating === 'Medium Risk'}
                  style={{ flex: 1, height: '40px' }}
                >
                  Approve Entity Onboarding
                </button>
                {data.riskRating === 'Medium Risk' && (
                  <button 
                    onClick={() => alert(`Escalation ticket generated and routed to Compliance Committee.`)}
                    className="btn btn-accent" 
                    style={{ flex: 1, height: '40px' }}
                  >
                    Escalate to Compliance Committee
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div style={styles.emptyOutput}>
              {!loading ? (
                <>
                  <UserCheck size={48} color="#475569" style={{ marginBottom: 16 }} />
                  <h3>Rules Compliance Engine</h3>
                  <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, maxWidth: 300, textAlign: 'center' }}>
                    Select an onboarding client entity and click "Screen Entity" to execute anti-money laundering and corporate checks.
                  </p>
                </>
              ) : (
                <div style={styles.progressLoader}>
                  <div style={styles.spinner}></div>
                  <h4 style={{ marginTop: 16 }}>Running Onboarding Audit...</h4>
                  <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                    Parsing registry databases and checking sanctions lists...
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
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  presets: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  presetsLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500',
    fontFamily: 'var(--font-display)',
  },
  presetBtn: {
    padding: '6px 14px',
    fontSize: '12px',
  },
  presetBtnActive: {
    background: 'rgba(99, 102, 241, 0.08)',
    borderColor: '#6366f1',
    color: '#ffffff',
  },
  workspaceGrid: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: 20,
  },
  logPanel: {
    padding: '16px',
    height: '300px',
    display: 'flex',
    flexDirection: 'column',
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: '600',
  },
  emptyLogsText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#475569',
    fontSize: '12px',
  },
  spinnerPulse: {
    color: '#fbbf24',
    fontSize: '11px',
    marginTop: 6,
    animation: 'pulse 1.5s infinite',
  },
  riskCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  ratingBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    border: '1px solid transparent',
    borderRadius: '8px',
    padding: '14px',
  },
  mainPanel: {
    padding: '24px',
    minHeight: '480px',
  },
  subtext: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: 2,
  },
  rulesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  ruleItem: {
    padding: '14px 18px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '8px',
    textAlign: 'left',
  },
  ruleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  ruleId: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600',
  },
  ruleName: {
    fontSize: '13px',
    color: '#ffffff',
  },
  ruleDesc: {
    fontSize: '12px',
    color: '#cbd5e1',
    marginTop: 8,
    lineHeight: '1.4',
  },
  flagResolutionAlert: {
    marginTop: 10,
    background: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '11px',
    color: '#fde68a',
    lineHeight: '1.4',
  },
  signOffArea: {
    display: 'flex',
    gap: 16,
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '16px',
    marginTop: '10px',
  },
  emptyOutput: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '400px',
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
