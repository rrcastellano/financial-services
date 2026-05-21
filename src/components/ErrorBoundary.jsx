import React from 'react';
import { ShieldAlert, RefreshCw, Terminal, Copy, Check } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  copyError = () => {
    const errorText = `${this.state.error?.toString()}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container} className="glass-panel animate-fade">
          <div style={styles.header}>
            <ShieldAlert size={36} color="#ef4444" />
            <h3 style={styles.title}>Workspace Execution Halted</h3>
            <p style={styles.subtitle}>
              A runtime rendering error occurred in the active component. Aura protected the suite from crashing.
            </p>
          </div>

          <div style={styles.errorBox}>
            <div style={styles.errorHeader}>
              <div style={styles.termTitle}>
                <Terminal size={14} color="#f43f5e" />
                <span>Diagnostic Logs & Stack Trace</span>
              </div>
              <button onClick={this.copyError} style={styles.copyBtn}>
                {this.state.copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{this.state.copied ? 'Copied!' : 'Copy Trace'}</span>
              </button>
            </div>
            <pre style={styles.stackTrace}>
              {this.state.error?.stack || this.state.error?.toString()}
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>

          <div style={styles.actions}>
            <button onClick={this.handleReset} className="btn btn-primary" style={styles.resetBtn}>
              <RefreshCw size={15} /> Reload Workspace Environment
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    borderRadius: '16px',
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    maxWidth: '800px',
    margin: '40px auto',
    textAlign: 'center',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    maxWidth: '500px',
    lineHeight: '1.6',
  },
  errorBox: {
    width: '100%',
    background: '#020617',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: 24,
    textAlign: 'left',
  },
  errorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.02)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  termTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '12px',
    fontWeight: '600',
    color: '#f43f5e',
  },
  copyBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '11px',
    transition: 'color 0.2s',
    '&:hover': {
      color: '#e2e8f0',
    }
  },
  stackTrace: {
    padding: '16px',
    margin: 0,
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: '#f87171',
    lineHeight: '1.6',
    overflowX: 'auto',
    maxHeight: '260px',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
  },
  resetBtn: {
    padding: '10px 24px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }
};
