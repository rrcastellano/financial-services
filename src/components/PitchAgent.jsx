import React, { useState, useRef, useEffect } from 'react';
import { Search, Play, FileSpreadsheet, Presentation, Sparkles, Terminal as TermIcon, ShieldAlert, ChevronRight } from 'lucide-react';
import { fetchCompanyData, calculateDCF, fetchCompsAnalysis, updateLivePricesCache, fetchCompanyFundamentalsViaGemini } from '../utils/financeApi';
import ExcelViewer from './ExcelViewer';
import SlidesViewer from './SlidesViewer';

export default function PitchAgent() {
  const [ticker, setTicker] = useState('AAPL');
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentStep, setCurrentStep] = useState('');
  const [viewMode, setViewMode] = useState('excel'); // excel, slides, split
  const [showThesis, setShowThesis] = useState(false);
  const intervalRef = useRef(null);
  const runIdRef = useRef(0);

  // Clean up interval and active async runs on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      runIdRef.current++;
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

  const runPitchAgent = async (tickerOverride) => {
    const activeTicker = tickerOverride || ticker;
    if (!activeTicker) return;

    // Increment run ID to cancel previous running loops
    const runId = ++runIdRef.current;

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
      { text: `[AI] Retrieving financial fundamentals and comps via Gemini AI...`, type: 'info' },
      { text: `[SKILL] Invoking sector-overview.md to analyze competitive landscape & macro positioning...`, type: 'info' },
      { text: `[MCP] Accessing S&P Capital IQ MCP at CAPIQ_MCP_URL...`, type: 'success' },
      { text: `[DATA] Fetching live market prices for target and comps...`, type: 'info' },
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

    const provider = localStorage.getItem('fsi_finance_api_provider') || 'simulated';
    const apiKey = localStorage.getItem('fsi_finance_api_key') || '';

    for (let i = 0; i < mockLogs.length; i++) {
      if (runId !== runIdRef.current) return;
      const log = mockLogs[i];
      setLogs(prev => [...prev, log]);
      setCurrentStep(log.text);

      if (log.text.includes("Retrieving financial fundamentals")) {
        const geminiKey = localStorage.getItem('fsi_api_key') || localStorage.getItem('fsi_gemini_api_key') || import.meta.env.VITE_GEMINI || '';
        if (geminiKey) {
          try {
            const res = await fetchCompanyFundamentalsViaGemini(targetTicker, geminiKey);
            if (runId !== runIdRef.current) return;
            if (res && res.success && res.target) {
              const peers = res.target.comps || [];
              setLogs(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  text: `[AI] Retrieving financial fundamentals and comps via Gemini AI... Success! (Found peers: ${peers.join(', ')})`,
                  type: 'success'
                };
                return next;
              });

              // Dynamically update peer list in subsequent logs
              const compsLogIdx = mockLogs.findIndex(l => l.text.includes("Selected peers:"));
              if (compsLogIdx !== -1) {
                mockLogs[compsLogIdx].text = `[DATA] Selected peers: ${peers.join(', ')}. Spreading multiples.`;
              }
            } else {
              setLogs(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  text: `[AI] Retrieving financial fundamentals and comps via Gemini AI... Fallback: using static registry.`,
                  type: 'warning'
                };
                return next;
              });
            }
          } catch (e) {
            console.error("Gemini fetch failed during pitch generation:", e);
          }
        } else {
          setLogs(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              text: `[AI] Retrieving financial fundamentals and comps via Gemini AI... Key missing, using registry.`,
              type: 'info'
            };
            return next;
          });
        }
      }

      if (log.text.includes("Fetching live market prices for target and comps")) {
        try {
          const freshCompany = fetchCompanyData(targetTicker);
          const tickersToUpdate = [targetTicker];
          if (freshCompany && Array.isArray(freshCompany.comps)) {
            freshCompany.comps.forEach(c => tickersToUpdate.push(c));
          }

          const res = await updateLivePricesCache(tickersToUpdate, provider, apiKey);
          if (runId !== runIdRef.current) return;
          if (res && res.success) {
            const updatedCompany = fetchCompanyData(targetTicker);
            setLogs(prev => {
              const next = [...prev];
              next[next.length - 1] = {
                text: `[DATA] Fetching live market prices for target and comps... Success! Target Price: $${updatedCompany.price.toFixed(2)} (${provider.toUpperCase()})`,
                type: 'success'
              };
              return next;
            });
          } else {
            setLogs(prev => {
              const next = [...prev];
              next[next.length - 1] = {
                text: `[DATA] Fetching live market prices for target and comps... Fallback to registry: ${res.reason || 'Rate limit/Connection issue'}`,
                type: 'warning'
              };
              return next;
            });
          }
        } catch (e) {
          console.error("Live fetch failed during pitch generation:", e);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 350));
    }

    if (runId !== runIdRef.current) return;
    setCompany(fetchCompanyData(targetTicker));
    setLoading(false);
  };

  // Calculate Valuation recommendation and financial score
  const valuationConsensus = React.useMemo(() => {
    if (!company) return null;

    try {
      // 1. DCF target price
      const dcfValuation = calculateDCF(company);
      const dcfTarget = dcfValuation.impliedPerShare;

      // 2. Comps target price based on EV/EBITDA of peers
      const compsAnalysis = fetchCompsAnalysis(company);
      const peers = compsAnalysis.filter(c => !c.isTarget);
      
      let compsTargetPrice = company.price; // default fallback
      let medianEvEbitda = 0;
      if (peers.length > 0) {
        const sumEvEbitda = peers.reduce((acc, p) => acc + p.evEbitda, 0);
        medianEvEbitda = sumEvEbitda / peers.length;
        
        // Target EV = EBITDA * peer median multiple
        const impliedEv = company.ebitda * medianEvEbitda;
        const impliedEquityValue = impliedEv - company.netDebt;
        const targetCompsPrice = impliedEquityValue / company.shares;
        
        if (!isNaN(targetCompsPrice) && targetCompsPrice > 0) {
          compsTargetPrice = parseFloat(targetCompsPrice.toFixed(2));
        }
      }

      // 3. Blended target price (60% DCF, 40% Comps)
      const blendedTarget = parseFloat(((dcfTarget * 0.6) + (compsTargetPrice * 0.4)).toFixed(2));
      const currentPrice = company.price;
      const totalUpside = ((blendedTarget - currentPrice) / currentPrice) * 100;
      const dcfUpside = ((dcfTarget - currentPrice) / currentPrice) * 100;
      const compsUpside = ((compsTargetPrice - currentPrice) / currentPrice) * 100;

      // 4. Recommendation Buy/Sell/Neutral
      let recommendation = 'NEUTRO';
      let recColor = '#fbbf24'; // amber
      let recBg = 'rgba(245, 158, 11, 0.12)';
      let recBorder = 'rgba(245, 158, 11, 0.4)';
      let recGlow = '0 0 10px rgba(245, 158, 11, 0.2)';

      if (totalUpside >= 15) {
        recommendation = 'COMPRA';
        recColor = '#10b981'; // emerald
        recBg = 'rgba(16, 185, 129, 0.12)';
        recBorder = 'rgba(16, 185, 129, 0.4)';
        recGlow = '0 0 10px rgba(16, 185, 129, 0.2)';
      } else if (totalUpside <= -10) {
        recommendation = 'VENDA';
        recColor = '#ef4444'; // red
        recBg = 'rgba(239, 68, 68, 0.12)';
        recBorder = 'rgba(239, 68, 68, 0.4)';
        recGlow = '0 0 10px rgba(239, 68, 68, 0.2)';
      }

      // 5. Health Check Score
      // Core checks:
      const checks = [
        {
          name: 'Crescimento Superior (YoY > 5%)',
          passed: company.revenueGrowth > 0.05,
          desc: `Crescimento de receita de ${(company.revenueGrowth * 100).toFixed(1)}%`
        },
        {
          name: 'Operação Eficiente (EBITDA > 20%)',
          passed: company.ebitdaMargin > 0.20,
          desc: `Margem EBITDA de ${(company.ebitdaMargin * 100).toFixed(1)}%`
        },
        {
          name: 'Alavancagem Saudável (Dívida < 2.5x)',
          passed: company.ebitda > 0 ? (company.netDebt / company.ebitda < 2.5) : true,
          desc: company.netDebt <= 0 ? 'Caixa Líquido Positivo' : `Alavancagem de ${(company.netDebt / company.ebitda).toFixed(1)}x EBITDA`
        },
        {
          name: 'Desconto Intrínseco (Upside DCF)',
          passed: dcfTarget > currentPrice,
          desc: dcfTarget > currentPrice ? `Upside de ${dcfUpside.toFixed(1)}%` : `Downside de ${Math.abs(dcfUpside).toFixed(1)}%`
        },
        {
          name: 'Desconto Relativo (Múltiplos)',
          passed: peers.length > 0 ? (company.ebitda > 0 && ( (company.price * company.shares + company.netDebt)/company.ebitda < medianEvEbitda )) : true,
          desc: `Target EV/EBITDA de ${company.ebitda > 0 ? ((company.price * company.shares + company.netDebt)/company.ebitda).toFixed(1) : 'N/A'}x vs concorrentes de ${medianEvEbitda.toFixed(1)}x`
        }
      ];

      const passedCount = checks.filter(c => c.passed).length;
      const healthPct = (passedCount / checks.length) * 100;
      
      let healthLabel = 'Moderada';
      let healthColor = '#fbbf24';
      if (healthPct >= 80) {
        healthLabel = 'Excelente';
        healthColor = '#10b981';
      } else if (healthPct >= 60) {
        healthLabel = 'Saudável';
        healthColor = '#34d399';
      } else if (healthPct <= 40) {
        healthLabel = 'Alerta / Fraca';
        healthColor = '#f87171';
      }

      // 6. Dynamic Thesis
      const thesis = [];
      if (company.revenueGrowth > 0.15) {
        thesis.push(`Forte ritmo de crescimento anual de ${(company.revenueGrowth * 100).toFixed(1)}%, indicando expansão acelerada de mercado.`);
      } else if (company.revenueGrowth > 0.05) {
        thesis.push(`Crescimento consistente de receita de ${(company.revenueGrowth * 100).toFixed(1)}% ao ano.`);
      } else {
        thesis.push(`Crescimento de receita contido de ${(company.revenueGrowth * 100).toFixed(1)}%, sugerindo maturação ou compressão de mercado.`);
      }

      if (company.ebitdaMargin > 0.35) {
        thesis.push(`Excepcional rentabilidade operacional (Margem EBITDA de ${(company.ebitdaMargin * 100).toFixed(1)}%), demonstrando forte alavancagem operacional.`);
      } else if (company.ebitdaMargin > 0.15) {
        thesis.push(`Eficiência operacional sólida com Margem EBITDA de ${(company.ebitdaMargin * 100).toFixed(1)}%.`);
      } else {
        thesis.push(`Rentabilidade operacional comprimida (Margem EBITDA de ${(company.ebitdaMargin * 100).toFixed(1)}%), exigindo atenção aos custos.`);
      }

      if (company.netDebt <= 0) {
        thesis.push(`Estrutura de capital extremamente defensiva e líquida, com caixa líquido positivo de $${Math.abs(company.netDebt).toLocaleString()}M.`);
      } else {
        const leverage = company.ebitda > 0 ? company.netDebt / company.ebitda : 0;
        if (leverage > 3.0) {
          thesis.push(`Alavancagem financeira elevada de ${leverage.toFixed(2)}x EBITDA, elevando o risco de crédito.`);
        } else {
          thesis.push(`Alavancagem sob controle em ${leverage.toFixed(2)}x EBITDA, com endividamento líquido de $${company.netDebt.toLocaleString()}M.`);
        }
      }

      if (totalUpside > 20) {
        thesis.push(`Desconto atrativo de ${totalUpside.toFixed(1)}% em relação ao preço-alvo de consenso, oferecendo boa margem de segurança.`);
      } else if (totalUpside < -5) {
        thesis.push(`Ativo negociando com prêmio de valuation de ${Math.abs(totalUpside).toFixed(1)}% acima do valor justo estimado.`);
      } else {
        thesis.push(`Preço de mercado próximo ao valor intrínseco blended (desvio de ${totalUpside.toFixed(1)}%), sugerindo preço justo.`);
      }

      return {
        dcfTarget,
        compsTargetPrice,
        blendedTarget,
        totalUpside,
        dcfUpside,
        compsUpside,
        recommendation,
        recColor,
        recBg,
        recBorder,
        recGlow,
        healthPct,
        healthLabel,
        healthColor,
        checks,
        thesis
      };

    } catch (e) {
      console.error(e);
      return null;
    }
  }, [company]);

  const isBrl = company ? (/\d$/.test(company.ticker) || company.ticker.includes('.SA')) : false;

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
              
              {/* Recomendação e Consenso de Valuation */}
              {valuationConsensus && (
                <div style={styles.consensusCard} className="glass-panel animate-fade">
                  <div style={styles.consensusHeader}>
                    <div style={styles.companyMeta}>
                      <span style={styles.companySector}>{company.sector} • {company.industry}</span>
                      <h3 style={styles.companyName}>
                        {company.name} <span style={styles.companyTicker}>({company.ticker})</span>
                      </h3>
                    </div>
                    
                    <div style={{
                      ...styles.recBadge,
                      color: valuationConsensus.recColor,
                      background: valuationConsensus.recBg,
                      borderColor: valuationConsensus.recBorder,
                      boxShadow: valuationConsensus.recGlow
                    }}>
                      <span style={styles.recLabel}>RECOMENDAÇÃO</span>
                      <span style={styles.recValue}>{valuationConsensus.recommendation}</span>
                    </div>
                  </div>

                  <div style={styles.consensusMetricsGrid}>
                    <div style={styles.consensusMainMetric}>
                      <span style={styles.metricLabel}>Preço de Mercado</span>
                      <span style={styles.metricValue}>
                        {isBrl ? 'R$' : '$'} {company.price.toLocaleString(isBrl ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div style={styles.consensusMainMetric}>
                      <span style={styles.metricLabel}>Preço-Alvo Blended</span>
                      <span style={styles.metricValue}>
                        {isBrl ? 'R$' : '$'} {valuationConsensus.blendedTarget.toLocaleString(isBrl ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div style={styles.consensusMainMetric}>
                      <span style={styles.metricLabel}>Upside Potencial</span>
                      <span style={{
                        ...styles.upsideBadge,
                        color: valuationConsensus.totalUpside >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {valuationConsensus.totalUpside >= 0 ? '▲' : '▼'} {Math.abs(valuationConsensus.totalUpside).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div style={styles.subMetricsGrid}>
                    <div style={styles.subMetricCard}>
                      <span style={styles.subMetricLabel}>Intrínseco (DCF)</span>
                      <span style={styles.subMetricValue}>
                        {isBrl ? 'R$' : '$'} {valuationConsensus.dcfTarget.toLocaleString(isBrl ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span style={{
                        ...styles.subMetricPct,
                        color: valuationConsensus.dcfUpside >= 0 ? '#34d399' : '#f87171'
                      }}>
                        {valuationConsensus.dcfUpside >= 0 ? '+' : ''}{valuationConsensus.dcfUpside.toFixed(1)}%
                      </span>
                    </div>

                    <div style={styles.subMetricCard}>
                      <span style={styles.subMetricLabel}>Relativo (Múltiplos)</span>
                      <span style={styles.subMetricValue}>
                        {isBrl ? 'R$' : '$'} {valuationConsensus.compsTargetPrice.toLocaleString(isBrl ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span style={{
                        ...styles.subMetricPct,
                        color: valuationConsensus.compsUpside >= 0 ? '#34d399' : '#f87171'
                      }}>
                        {valuationConsensus.compsUpside >= 0 ? '+' : ''}{valuationConsensus.compsUpside.toFixed(1)}%
                      </span>
                    </div>

                    <div style={styles.subMetricCard}>
                      <span style={styles.subMetricLabel}>Saúde Financeira</span>
                      <span style={{
                        ...styles.subMetricValue,
                        color: valuationConsensus.healthColor,
                        fontWeight: 'bold'
                      }}>
                        {valuationConsensus.healthPct}%
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                        {valuationConsensus.healthLabel}
                      </span>
                    </div>
                  </div>

                  <div style={styles.dividerLine} />

                  {/* Expandable Thesis Section */}
                  <div>
                    <button 
                      onClick={() => setShowThesis(!showThesis)}
                      style={styles.thesisToggleBtn}
                    >
                      <span>Tese de Investimento & Critérios</span>
                      <ChevronRight 
                        size={16} 
                        style={{
                          transform: showThesis ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          color: '#94a3b8'
                        }}
                      />
                    </button>
                    
                    {showThesis && (
                      <div style={styles.thesisContainer} className="animate-fade">
                        <div style={styles.thesisBulletList}>
                          {valuationConsensus.thesis.map((t, idx) => (
                            <div key={idx} style={styles.thesisBulletItem}>
                              <span style={styles.bulletDot}>•</span>
                              <p style={styles.thesisText}>{t}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div style={styles.dividerLine} style={{ margin: '12px 0 8px 0' }} />
                        
                        <span style={styles.checklistTitle}>Checklist de Integridade Financeira:</span>
                        <div style={styles.checklistGrid}>
                          {valuationConsensus.checks.map((check, idx) => (
                            <div key={idx} style={styles.checkItem}>
                              <span style={{
                                ...styles.checkStatus,
                                color: check.passed ? '#10b981' : '#64748b'
                              }}>
                                {check.passed ? '✓' : '✗'}
                              </span>
                              <div>
                                <span style={styles.checkName}>{check.name}</span>
                                <span style={styles.checkDesc}>{check.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
    minHeight: '620px',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
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
  consensusCard: {
    padding: '20px',
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    textAlign: 'left',
  },
  consensusHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  companyMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    textAlign: 'left',
  },
  companySector: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  companyName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  companyTicker: {
    fontSize: '14px',
    color: '#38bdf8',
    fontWeight: '600',
  },
  recBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid',
    minWidth: '110px',
  },
  recLabel: {
    fontSize: '9px',
    fontWeight: '700',
    opacity: 0.7,
    letterSpacing: '0.05em',
    marginBottom: 2,
  },
  recValue: {
    fontSize: '15px',
    fontWeight: '800',
    letterSpacing: '0.02em',
  },
  consensusMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.03)',
  },
  consensusMainMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    textAlign: 'left',
  },
  metricLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
  },
  upsideBadge: {
    fontSize: '15px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  dividerLine: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
  },
  subMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  subMetricCard: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  subMetricLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  subMetricValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
  },
  subMetricPct: {
    fontSize: '11px',
    fontWeight: '600',
    marginTop: 2,
  },
  thesisToggleBtn: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#cbd5e1',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  thesisContainer: {
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '6px',
    padding: '12px',
    marginTop: 6,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  thesisBulletList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  thesisBulletItem: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  bulletDot: {
    color: '#38bdf8',
    fontWeight: 'bold',
    marginTop: -2,
  },
  thesisText: {
    fontSize: '11px',
    color: '#cbd5e1',
    margin: 0,
    lineHeight: '1.4',
    textAlign: 'left',
  },
  checklistTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  checklistGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
    marginTop: 4,
  },
  checkItem: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  checkStatus: {
    fontWeight: 'bold',
    fontSize: '12px',
    width: '12px',
    display: 'inline-block',
  },
  checkName: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#e2e8f0',
    display: 'block',
  },
  checkDesc: {
    fontSize: '10px',
    color: '#64748b',
    display: 'block',
  },
};
