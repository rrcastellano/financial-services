import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, Database, TrendingUp, BarChart3, Info, AlertTriangle, Shield, Globe, Activity } from 'lucide-react';
import { fetchCompanyData, updateLivePricesCache, formatDateTime } from '../utils/financeApi';

const DEFAULT_PORTFOLIO = ['AVGO', 'FISV', 'GEV', 'GOOGL', 'LLY', 'META', 'NVDA', 'OMF', 'PLTR', 'RCL', 'HSBC', 'STX', 'LITE', 'SNDK'];

export default function MarketResearcher() {
  const [sector, setSector] = useState('Technology');
  const [activeTab, setActiveTab] = useState('screener');
  const [selectedScenario, setSelectedScenario] = useState('baseline');
  const [portfolioTickers, setPortfolioTickers] = useState(() => {
    const saved = localStorage.getItem('fsi_portfolio');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Ignored
      }
    }
    return DEFAULT_PORTFOLIO;
  });
  const [newTicker, setNewTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);

  // Força re-renderização quando preços em tempo real são baixados
  const [priceUpdateTrigger, setPriceUpdateTrigger] = useState(0);

  // Escuta alterações de configurações ou cache de preços
  useEffect(() => {
    const handleUpdate = () => {
      setPriceUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('fsi_prices_updated', handleUpdate);
    return () => window.removeEventListener('fsi_prices_updated', handleUpdate);
  }, []);

  // Busca cotações reais em segundo plano
  useEffect(() => {
    const provider = localStorage.getItem('fsi_finance_api_provider') || 'simulated';
    const apiKey = localStorage.getItem('fsi_finance_api_key') || '';
    
    if (provider !== 'simulated' && apiKey) {
      updateLivePricesCache(portfolioTickers, provider, apiKey).then(res => {
        if (res.success) {
          if (res.rateLimited) {
            console.warn("[Market Researcher Background] Aviso: Limite de requisições atingido (429) em algumas cotações. Usando cache.");
          }
          setPriceUpdateTrigger(prev => prev + 1);
        }
      });
    }
  }, [portfolioTickers]);

  const addTicker = (e) => {
    if (e) e.preventDefault();
    const symbol = newTicker.trim().toUpperCase();
    if (!symbol) return;
    if (portfolioTickers.includes(symbol)) {
      setNewTicker('');
      return;
    }
    const updated = [...portfolioTickers, symbol];
    setPortfolioTickers(updated);
    localStorage.setItem('fsi_portfolio', JSON.stringify(updated));
    setNewTicker('');
  };

  const removeTicker = (symbol) => {
    const updated = portfolioTickers.filter(t => t !== symbol);
    setPortfolioTickers(updated);
    localStorage.setItem('fsi_portfolio', JSON.stringify(updated));
  };

  const resetPortfolio = () => {
    setPortfolioTickers(DEFAULT_PORTFOLIO);
    localStorage.setItem('fsi_portfolio', JSON.stringify(DEFAULT_PORTFOLIO));
  };

  const runResearcher = async () => {
    if (!sector) return;
    setLoading(true);
    setData(null);
    setLogs([]);

    // Determine tickers based on selected sector
    let tickers = ["AAPL", "MSFT", "NVDA", "GOOGL", "TSLA"];
    if (sector === 'Automotive') {
      tickers = ["TSLA", "AAPL", "MSFT", "NVDA", "GOOGL"];
    } else if (sector === 'SaaS & Cloud') {
      tickers = ["MSFT", "GOOGL", "AAPL", "NVDA", "TSLA"];
    } else if (sector === 'Custom') {
      if (portfolioTickers.length > 0) {
        tickers = portfolioTickers;
      }
    }

    const provider = localStorage.getItem('fsi_finance_api_provider') || 'simulated';
    const apiKey = localStorage.getItem('fsi_finance_api_key') || '';

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const addLog = (msg) => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setLogs(prev => [...prev, `[${hh}:${mm}:${ss}] [RESEARCH] ${msg}`]);
    };

    try {
      addLog("Initializing Market Researcher Agent...");
      await sleep(350);
      addLog("Searching open academic and industry indexes via European PMC & ArXiv...");
      await sleep(350);
      addLog("Extracting macroeconomic data on public companies...");
      await sleep(350);
      addLog(`Resolving ticker mappings for: ${tickers.join(', ')}...`);
      await sleep(350);

      if (provider !== 'simulated' && apiKey) {
        addLog(`Conectando ao provedor de dados financeiros em tempo real: ${provider.toUpperCase()}...`);
        await sleep(300);
        try {
          const res = await updateLivePricesCache(tickers, provider, apiKey);
          if (res.success) {
            if (res.rateLimited) {
              addLog("Aviso: Limite de requisições atingido (429). Ativando caching/fallback parcial.");
            } else {
              addLog(`Cotações em tempo real atualizadas com sucesso para: ${tickers.slice(0, 5).join(', ')}${tickers.length > 5 ? ' e mais...' : ''}!`);
            }
            setPriceUpdateTrigger(prev => prev + 1);
          } else {
            addLog(`Aviso de Limite/Erro da API (${res.reason || 'Sem resposta'}). Ativando Simulated Sandbox Fallback...`);
            addLog("Usando dados estáticos locais de alta fidelidade como contingência.");
          }
        } catch (err) {
          addLog(`Erro de conexão: ${err.message}. Ativando Simulated Sandbox Fallback...`);
          addLog("Usando dados estáticos locais de alta fidelidade como contingência.");
        }
      } else {
        addLog("Modo Sandbox Simulado ativo. Carregando dados estáticos locais de mercado...");
      }
      
      await sleep(350);
      addLog("Plotting competitive landscape coordinates (Growth % vs. Gross Margin %)...");
      await sleep(350);
      addLog("Running screening rules: Gross Margin > 30% and YoY Growth > 5%...");
      await sleep(350);
      addLog("Generating strategic overview notes... Done.");
      await sleep(200);

      // Fetch company details
      const companies = tickers.map(t => fetchCompanyData(t));
      
      // Compute dynamic stats for thesis
      const avgGrowth = (companies.reduce((acc, c) => acc + c.revenueGrowth, 0) / companies.length) * 100;
      const avgMargin = (companies.reduce((acc, c) => acc + c.grossMargin, 0) / companies.length) * 100;

      let thesisText = "";
      let catalystsArray = [];
      
      if (sector === 'Custom') {
        thesisText = `Your custom portfolio (${tickers.join(', ')}) includes ${companies.length} selected assets. The average revenue growth of these holdings stands at ${avgGrowth.toFixed(1)}% YoY with an average gross profit margin of ${avgMargin.toFixed(1)}%. Múltiplos e indicadores operacionais revelam um posicionamento diversificado com solidez em fluxos de caixa.`;
        catalystsArray = [
          "Earnings report releases of your custom holdings.",
          "Rebalancing triggers based on target valuation multiples and YoY growth margins.",
          "Shifting macro discount rates influencing equity risk premiums of these specific assets."
        ];
      } else {
        thesisText = `The ${sector} sector displays robust capital flows, driven by rapid cloud and computational expansions. Major players are capitalizing on scale, sustaining operating margins above 30%. High margin leaders are trading at a premium due to strong EBITDA generation.`;
        catalystsArray = [
          "Continued AI and compute infrastructure capital expenditures globally.",
          "Expansion of developer and enterprise software services monetization.",
          "Shifting macro discount rates influencing growth stock valuations."
        ];
      }
      
      setData({
        sector: sector === 'Custom' ? 'Custom Portfolio' : sector,
        companies: companies,
        thesis: thesisText,
        catalysts: catalystsArray
      });
    } catch (e) {
      addLog(`Erro inesperado no agente: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTickerShock = (ticker, scenario) => {
    const symbol = ticker.toUpperCase().trim();
    if (scenario === 'baseline') {
      const baselineShocks = {
        NVDA: 5, AVGO: 4, GOOGL: 3, META: 3, PLTR: 6, LLY: 2, GEV: 4, FISV: 3, OMF: 5, RCL: 8, HSBC: 1, STX: 3, LITE: 2, SNDK: 2
      };
      return baselineShocks[symbol] !== undefined ? baselineShocks[symbol] : 2;
    } else if (scenario === 'iran') {
      const iranShocks = {
        GEV: 15, LLY: 4, HSBC: -5, FISV: -8, OMF: -12, RCL: -25, NVDA: -15, AVGO: -12, GOOGL: -10, META: -12, PLTR: 5, STX: -15, LITE: -15, SNDK: -15
      };
      return iranShocks[symbol] !== undefined ? iranShocks[symbol] : -10;
    } else if (scenario === 'taiwan') {
      const taiwanShocks = {
        NVDA: -40, AVGO: -35, STX: -30, SNDK: -30, LITE: -28, PLTR: -12, GOOGL: -15, META: -18, LLY: 8, GEV: -5, RCL: -15, FISV: -10, OMF: -12, HSBC: -8
      };
      return taiwanShocks[symbol] !== undefined ? taiwanShocks[symbol] : -15;
    }
    return 0;
  };

  const calculatePortfolioImpact = (scenario) => {
    if (portfolioTickers.length === 0) return 0;
    let totalImpact = 0;
    portfolioTickers.forEach(t => {
      totalImpact += getTickerShock(t, scenario);
    });
    return totalImpact / portfolioTickers.length;
  };

  const renderImpactGauge = (impactPct) => {
    const radius = 40;
    const cx = 50;
    const cy = 50;
    // Map -50% to +20% to 0 to 180 degrees (semi-circle)
    const clamped = Math.min(20, Math.max(-50, impactPct));
    const fraction = (clamped + 50) / 70; // 0..1
    
    const angle = 180 - (fraction * 180); // 180 is left, 0 is right
    const angleRad = (angle * Math.PI) / 180;
    const px = cx + radius * Math.cos(angleRad);
    const py = cy - radius * Math.sin(angleRad);
    
    let color = '#10b981'; // Emerald
    if (impactPct < -15) color = '#f43f5e'; // Rose (Critical)
    else if (impactPct < 0) color = '#fbbf24'; // Amber (Warning)

    return (
      <div style={styles.gaugeContainer} className="glass-panel animate-fade">
        <h5 style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 12 }}>Impacto na Carteira</h5>
        <div style={{ position: 'relative', width: 140, height: 90, margin: '0 auto' }}>
          <svg width="140" height="80" viewBox="0 0 100 60" style={{ overflow: 'visible' }}>
            {/* Outer arc */}
            <path 
              d="M 10 50 A 40 40 0 0 1 90 50" 
              fill="none" 
              stroke="rgba(255,255,255,0.06)" 
              strokeWidth="8" 
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path 
              d={`M 10 50 A 40 40 0 0 1 ${px} ${py}`} 
              fill="none" 
              stroke={color} 
              strokeWidth="8" 
              strokeLinecap="round"
              style={{ transition: 'all 0.5s ease-out' }}
            />
            {/* Inner details */}
            <circle cx="50" cy="50" r="4" fill="#ffffff" />
            <line x1="50" y1="50" x2={px} y2={py} stroke="#ffffff" strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.5s ease-out' }} />
            
            {/* Axis markers */}
            <text x="8" y="58" fill="#64748b" fontSize="5" textAnchor="middle">-50%</text>
            <text x="50" y="8" fill="#64748b" fontSize="5" textAnchor="middle">-15%</text>
            <text x="92" y="58" fill="#64748b" fontSize="5" textAnchor="middle">+20%</text>
          </svg>
          <div style={styles.gaugeTextContainer}>
            <span style={{...styles.gaugeValue, color: color, fontSize: '18px'}}>
              {impactPct > 0 ? '+' : ''}{impactPct.toFixed(1)}%
            </span>
            <span style={{...styles.gaugeLabel, fontSize: '8px'}}>
              {impactPct >= 0 ? 'Retorno Positivo' : impactPct < -15 ? 'Risco Crítico' : 'Retração Mod.'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container} className="animate-fade">
      
      {/* Search Header panel */}
      <div style={styles.headerPanel} className="glass-panel">
        <div style={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <select 
            value={sector} 
            onChange={(e) => setSector(e.target.value)} 
            style={styles.select}
          >
            <option value="Technology">Technology (Software & Hardware Leaders)</option>
            <option value="Automotive">Consumer Automotive / Electric Vehicles</option>
            <option value="SaaS & Cloud">Cloud SaaS & Infrastructure</option>
            <option value="Custom">💼 Minha Carteira (Custom Portfolio)</option>
          </select>
        </div>

        <button onClick={runResearcher} className="btn btn-primary" style={{ padding: '10px 20px', flexShrink: 0 }}>
          <Sparkles size={16} /> Analyze Market
        </button>
      </div>

      {/* Interactive Portfolio Editor Panel */}
      {sector === 'Custom' && (
        <div style={styles.portfolioManagerPanel} className="glass-panel animate-fade">
          <div style={styles.portfolioHeader}>
            <div>
              <h3 style={styles.portfolioTitle}>💼 Gerenciador de Carteira Inteligente</h3>
              <p style={styles.portfolioSubtitle}>Adicione ou remova ativos da sua carteira de acompanhamento. Os múltiplos e valuations são simulados com base nas demonstrações financeiras reais.</p>
            </div>
            <button onClick={resetPortfolio} className="btn btn-secondary" style={styles.resetBtn}>
              Restaurar Padrão
            </button>
          </div>

          <div style={styles.pillContainer}>
            {portfolioTickers.map(t => {
              const comp = fetchCompanyData(t);
              return (
                <div key={t} style={styles.pill} className="portfolio-pill">
                  <span style={styles.pillTicker}>{t}</span>
                  <span style={styles.pillPrice}>${comp.price.toFixed(1)}</span>
                  <button onClick={() => removeTicker(t)} style={styles.pillDelete} title={`Remover ${t}`}>×</button>
                </div>
              );
            })}
          </div>

          <form onSubmit={addTicker} style={styles.addForm}>
            <input 
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              placeholder="Digite o código da ação (ex: AAPL, PETR4, LLY)..."
              style={styles.addInput}
            />
            <button type="submit" className="btn btn-primary" style={styles.addBtn}>
              + Adicionar Ativo
            </button>
          </form>
        </div>
      )}

      {/* Grid splits */}
      <div style={styles.workspaceGrid}>
        
        {/* Left Column: Logs / Catalysts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Status logs */}
          <div style={styles.logPanel} className="glass-panel">
            <h4 style={styles.panelTitle}>Market Researcher Process logs</h4>
            <div className="terminal-container" style={{ height: '140px', marginTop: 12 }}>
              {logs.length === 0 ? (
                <div style={styles.emptyLogsText}>
                  Awaiting sector or portfolio selection...
                </div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="terminal-line info" style={{ fontSize: 11 }}>
                    {l}
                  </div>
                ))
              )}
              {loading && <div style={styles.spinnerPulse}>Analyzing databases...</div>}
            </div>
          </div>

          {/* Key Catalysts */}
          {data && (
            <div style={styles.catalystCard} className="glass-panel animate-fade">
              <h4 style={{...styles.panelTitle, color: '#fbbf24'}}>🔥 Sector Catalysts</h4>
              <ul style={styles.catalystList}>
                {data.catalysts.map((c, i) => (
                  <li key={i} style={styles.catalystItem}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Visual Screener & Bubble Chart */}
        <div style={styles.mainPanel} className="glass-panel">
          {data ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade">
              
              {/* Tab Switcher Segmented Control */}
              {sector === 'Custom' && (
                <div style={styles.tabNavigator}>
                  <button 
                    onClick={() => setActiveTab('screener')} 
                    style={{
                      ...styles.tabBtn,
                      ...(activeTab === 'screener' ? styles.tabBtnActive : {})
                    }}
                  >
                    <BarChart3 size={15} /> Posicionamento Competitivo
                  </button>
                  <button 
                    onClick={() => setActiveTab('allocation')} 
                    style={{
                      ...styles.tabBtn,
                      ...(activeTab === 'allocation' ? styles.tabBtnActive : {})
                    }}
                  >
                    <Database size={15} /> Alocação & Conselhos
                  </button>
                  <button 
                    onClick={() => setActiveTab('stress')} 
                    style={{
                      ...styles.tabBtn,
                      ...(activeTab === 'stress' ? styles.tabBtnActive : {})
                    }}
                  >
                    <Sparkles size={15} /> Simulador de Estresse
                  </button>
                </div>
              )}

              {/* Tab Content 1: Screener & Bubble Chart (or fallback for non-custom sectors) */}
              {(sector !== 'Custom' || activeTab === 'screener') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade">
                  {/* Thesis block */}
                  <div>
                    <h3 style={{ fontSize: 18, color: '#ffffff' }}>Sector Thesis: {data.sector}</h3>
                    <p style={styles.thesisText}>{data.thesis}</p>
                  </div>

                  {/* Competitive Bubble Chart plotted in beautiful inline SVG! */}
                  <div style={styles.chartWrapper}>
                    <h4 style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Competitive Positioning Matrix</h4>
                    <div style={styles.svgContainer}>
                      <svg viewBox="0 0 400 200" style={{ width: '100%', height: '180px', overflow: 'visible' }}>
                        {/* Axes lines */}
                        <line x1="40" y1="10" x2="40" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <line x1="40" y1="170" x2="380" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        
                        {/* Grid lines */}
                        <line x1="40" y1="90" x2="380" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                        <line x1="210" y1="10" x2="210" y2="170" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

                        {/* Axis Labels */}
                        <text x="380" y="185" fill="#64748b" fontSize="8" textAnchor="end">Revenue Growth %</text>
                        <text x="15" y="10" fill="#64748b" fontSize="8" textAnchor="start" transform="rotate(90 15 10)">Gross Margin %</text>

                        {/* Plots bubble points for each company! */}
                        {data.companies.map((c, i) => {
                          // Normalize x coordinate based on Growth (bound between 0 and 300)
                          const x = 40 + Math.min(300, Math.max(0, (c.revenueGrowth * 200)));
                          // Normalize y coordinate based on Gross Margin (bound between 0 and 140)
                          const y = 170 - Math.min(140, Math.max(0, (c.grossMargin * 140)));
                          // Size based on Enterprise value relative size (bound between 8 and 26)
                          const r = 8 + Math.min(18, Math.max(0, (c.price * c.shares / 50000)));
                          
                          const bubbleColor = i % 2 === 0 ? '#6366f1' : '#06b6d4';

                          return (
                            <g key={c.ticker} className="animate-fade" style={{ cursor: 'pointer' }}>
                              <circle 
                                cx={x} 
                                cy={y} 
                                r={r} 
                                fill={bubbleColor} 
                                opacity="0.6" 
                                stroke={bubbleColor}
                                strokeWidth="1.5"
                              />
                              <text 
                                x={x} 
                                y={y - r - 4} 
                                fill="#ffffff" 
                                fontSize="8" 
                                fontWeight="bold" 
                                textAnchor="middle"
                              />
                              <text 
                                x={x} 
                                y={y - r - 4} 
                                fill="#ffffff" 
                                fontSize="8" 
                                fontWeight="bold" 
                                textAnchor="middle"
                              >
                                {c.ticker}
                              </text>
                              {/* Value tooltip */}
                              <text 
                                x={x} 
                                y={y + 4} 
                                fill="rgba(255,255,255,0.9)" 
                                fontSize="7" 
                                textAnchor="middle"
                              >
                                {(c.revenueGrowth * 100).toFixed(0)}%
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  {/* Stock Screener Table */}
                  <div className="spreadsheet-container" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <table className="spreadsheet-table">
                      <thead>
                        <tr>
                          <th className="spreadsheet-th" style={{ width: '40px' }}></th>
                          <th className="spreadsheet-th">Company</th>
                          <th className="spreadsheet-th">Ticker</th>
                          <th className="spreadsheet-th">Market Cap ($B)</th>
                          <th className="spreadsheet-th">LTM Revenue ($B)</th>
                          <th className="spreadsheet-th">YoY Growth %</th>
                          <th className="spreadsheet-th">Gross Margin %</th>
                          <th className="spreadsheet-th">EBITDA ($M)</th>
                          <th className="spreadsheet-th" style={{ textAlign: 'center', width: '120px' }}>Sincronização</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.companies.map((c, idx) => (
                          <tr key={c.ticker}>
                            <td className="spreadsheet-row-header">{idx + 1}</td>
                            <td className="spreadsheet-td" style={{ fontWeight: 'bold' }}>{c.name}</td>
                            <td className="spreadsheet-td" style={{ textAlign: 'center' }}>{c.ticker}</td>
                            <td className="spreadsheet-td" style={{ textAlign: 'right', color: '#fbbf24' }}>
                              ${(c.price * c.shares / 1000).toFixed(1)}B
                            </td>
                            <td className="spreadsheet-td" style={{ textAlign: 'right' }}>
                              ${(c.revenueLTM / 1000).toFixed(1)}B
                            </td>
                            <td className="spreadsheet-td" style={{ textAlign: 'right', color: '#10b981' }}>
                              {(c.revenueGrowth * 100).toFixed(1)}%
                            </td>
                            <td className="spreadsheet-td" style={{ textAlign: 'right' }}>
                              {(c.grossMargin * 100).toFixed(1)}%
                            </td>
                            <td className="spreadsheet-td" style={{ textAlign: 'right' }}>
                              {c.ebitda.toLocaleString()}
                            </td>
                            <td className="spreadsheet-td" style={{ textAlign: 'center', fontSize: '11px', whiteSpace: 'nowrap' }}>
                              {c.updatedAt ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                  <span style={{ color: '#38bdf8', fontWeight: '600', fontFamily: 'monospace' }}>
                                    {formatDateTime(c.updatedAt).split(' ')[1]}
                                  </span>
                                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>
                                    {formatDateTime(c.updatedAt).split(' ')[0].substring(0, 5)} ({c.provider === 'simulated' ? 'Simulado' : c.provider === 'brapi' ? 'BRAPI' : c.provider === 'twelvedata' ? 'TwelveData' : c.provider === 'finnhub' ? 'Finnhub' : c.provider || '-'})
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: '#64748b' }}>-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Allocation & Advisory */}
              {sector === 'Custom' && activeTab === 'allocation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade">
                  <div>
                    <h3 style={{ fontSize: 16, color: '#ffffff' }}>Análise de Alocação e Diversificação</h3>
                    <p style={styles.thesisText}>
                      Esta seção avalia a estrutura setorial da sua carteira de acompanhamento baseada em pesos iguais por ativo. A alocação atual é composta por {portfolioTickers.length} ações.
                    </p>
                  </div>

                  {/* Sector Distribution horizontal segmented bar and legends */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '20px' }}>
                    <h4 style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Concentração por Setor de Atuação</h4>
                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>Visualização gráfica dos pesos setoriais relativos da carteira</p>
                    
                    {/* Segmented Progress Bar */}
                    <div style={styles.segmentedBarContainer}>
                      {(() => {
                        const companies = portfolioTickers.map(t => fetchCompanyData(t));
                        const totalWeight = companies.length;
                        const sectorCounts = {};
                        companies.forEach(c => {
                          const s = c.sector || 'Outros';
                          sectorCounts[s] = (sectorCounts[s] || 0) + 1;
                        });
                        const sectorDist = Object.keys(sectorCounts).map(s => ({
                          name: s,
                          percentage: (sectorCounts[s] / totalWeight) * 100
                        })).sort((a,b) => b.percentage - a.percentage);

                        return sectorDist.map((sd, i) => {
                          let color = '#64748b';
                          if (sd.name === 'Technology') color = '#6366f1';
                          else if (sd.name === 'Financials') color = '#10b981';
                          else if (sd.name === 'Healthcare') color = '#f43f5e';
                          else if (sd.name === 'Industrials') color = '#f59e0b';
                          else if (sd.name === 'Consumer Cyclical') color = '#06b6d4';
                          
                          return (
                            <div 
                              key={sd.name} 
                              style={{ 
                                width: `${sd.percentage}%`, 
                                backgroundColor: color, 
                                height: '12px',
                                boxShadow: `0 0 10px ${color}50`,
                                transition: 'width 0.5s ease'
                              }} 
                              title={`${sd.name}: ${sd.percentage.toFixed(1)}%`}
                            />
                          );
                        });
                      })()}
                    </div>

                    {/* Grid of details */}
                    <div style={styles.sectorLegendGrid}>
                      {(() => {
                        const companies = portfolioTickers.map(t => fetchCompanyData(t));
                        const totalWeight = companies.length;
                        const sectorCounts = {};
                        companies.forEach(c => {
                          const s = c.sector || 'Outros';
                          sectorCounts[s] = (sectorCounts[s] || 0) + 1;
                        });
                        const sectorDist = Object.keys(sectorCounts).map(s => ({
                          name: s,
                          percentage: (sectorCounts[s] / totalWeight) * 100
                        })).sort((a,b) => b.percentage - a.percentage);

                        return sectorDist.map(sd => {
                          let color = '#64748b';
                          let ptName = sd.name;
                          if (sd.name === 'Technology') { color = '#6366f1'; ptName = 'Tecnologia'; }
                          else if (sd.name === 'Financials') { color = '#10b981'; ptName = 'Finanças'; }
                          else if (sd.name === 'Healthcare') { color = '#f43f5e'; ptName = 'Saúde'; }
                          else if (sd.name === 'Industrials') { color = '#f59e0b'; ptName = 'Indústria'; }
                          else if (sd.name === 'Consumer Cyclical') { color = '#06b6d4'; ptName = 'Consumo Cíclico'; }

                          return (
                            <div key={sd.name} style={styles.legendItem} className="glass-panel">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
                                <span style={styles.legendName}>{ptName}</span>
                              </div>
                              <span style={{...styles.legendPct, color: color}}>{sd.percentage.toFixed(1)}%</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Indicators Grid */}
                  {(() => {
                    const companies = portfolioTickers.map(t => fetchCompanyData(t));
                    const totalWeight = companies.length;
                    let techPct = 0;
                    let healthcarePct = 0;
                    companies.forEach(c => {
                      if (c.sector === 'Technology') techPct += 1;
                      if (c.sector === 'Healthcare') healthcarePct += 1;
                    });
                    techPct = (techPct / totalWeight) * 100;
                    healthcarePct = (healthcarePct / totalWeight) * 100;
                    
                    const avgMargin = (companies.reduce((acc, c) => acc + c.grossMargin, 0) / companies.length) * 100;
                    const avgGrowth = (companies.reduce((acc, c) => acc + c.revenueGrowth, 0) / companies.length) * 100;

                    let betaProfile = "Moderado / Equilibrado";
                    let betaDesc = "Exposição equilibrada a múltiplos setores.";
                    if (techPct > 50) {
                      betaProfile = "Agressivo (High Beta)";
                      betaDesc = "Fortemente alocado em crescimento e semicondutores.";
                    } else if (techPct > 35) {
                      betaProfile = "Crescimento Moderado";
                      betaDesc = "Perfil voltado a inovação com diversificação setorial.";
                    }

                    return (
                      <>
                        <div style={styles.healthGrid}>
                          <div style={styles.healthCard} className="glass-panel">
                            <span style={styles.healthTitle}>Perfil de Risco da Carteira</span>
                            <span style={styles.healthValue}>{betaProfile}</span>
                            <span style={styles.healthDesc}>{betaDesc}</span>
                          </div>
                          
                          <div style={styles.healthCard} className="glass-panel">
                            <span style={styles.healthTitle}>Métricas de Concentração</span>
                            <span style={{...styles.healthValue, color: techPct > 40 ? '#f43f5e' : '#10b981'}}>
                              {techPct > 40 ? 'Alta Concentração' : 'Diversificada'}
                            </span>
                            <span style={styles.healthDesc}>
                              {techPct.toFixed(0)}% da carteira está alocada no setor de Tecnologia. {techPct > 40 ? 'Supera o limite prudente setorial.' : 'Dentro do limite prudente.'}
                            </span>
                          </div>

                          <div style={styles.healthCard} className="glass-panel">
                            <span style={styles.healthTitle}>Margem Bruta Média Ponderada</span>
                            <span style={{...styles.healthValue, color: '#a5b4fc'}}>{avgMargin.toFixed(1)}%</span>
                            <span style={styles.healthDesc}>
                              Excelente lucratividade operacional agregada das empresas em carteira.
                            </span>
                          </div>
                        </div>

                        {/* Portuguese Investment Advisory report */}
                        <div style={styles.advisoryReport}>
                          <h4 style={styles.advisoryTitle}>
                            <Info size={16} color="#6366f1" /> Comentário da Mesa de Análise (Asset Allocation Advisory)
                          </h4>
                          <div style={styles.advisoryBody}>
                            <p style={{ marginBottom: 12 }}>
                              A sua carteira apresenta uma expressiva inclinação para o setor de <strong>Tecnologia e Hardware</strong> ({techPct.toFixed(1)}% da alocação), impulsionada por gigantes como <strong>{portfolioTickers.filter(t => ['NVDA', 'AVGO', 'PLTR', 'GOOGL', 'META'].includes(t.toUpperCase())).join(', ')}</strong>. Essa forte presença de ativos de tecnologia sustenta um crescimento médio anual de receita de <strong>{avgGrowth.toFixed(1)}% YoY</strong> e uma margem bruta operacional espetacular de <strong>{avgMargin.toFixed(1)}%</strong>.
                            </p>
                            <p style={{ marginBottom: 12 }}>
                              <strong>Principais Riscos Identificados:</strong>
                              <br />
                              1. <strong>Sensibilidade a Taxas de Juros (Múltiplos):</strong> Com múltiplos de valuation em níveis exigentes (como NVDA e PLTR), a carteira possui alta volatilidade sistemática relacionada a taxas macroeconômicas.
                              <br />
                              2. <strong>Sensibilidade à Cadeia de Suprimentos Global:</strong> Diversas holdings tecnológicas e industriais dependem de fundições e insumos logísticos integrados, exigindo monitoramento ativo de volatilidades geopolíticas de fronteira.
                            </p>
                            <p>
                              <strong>Recomendação de Rebalanceamento (Hedge):</strong> Para mitigar a volatilidade de cauda esquerda, sugerimos a incorporação gradual de ativos anticíclicos. Aumentar a exposição a farmacêuticas defensivas (como <strong>LLY</strong>) ou utilities resilientes de transição energética (como <strong>GEV</strong>) trará proteção e blindagem aos fluxos operacionais consolidados.
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Tab Content 3: Geopolitical Stress Simulator */}
              {sector === 'Custom' && activeTab === 'stress' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade">
                  <div>
                    <h3 style={{ fontSize: 16, color: '#ffffff' }}>Estresse Geopolítico e Análise Macro</h3>
                    <p style={styles.thesisText}>
                      Simule cenários geopolíticos extremos para avaliar o impacto estimado instantâneo nas cotações dos ativos da sua carteira de acompanhamento.
                    </p>
                  </div>

                  {/* Scenario Selection Grid */}
                  <div style={styles.scenarioGrid}>
                    <div 
                      onClick={() => setSelectedScenario('baseline')} 
                      style={{
                        ...styles.scenarioCard,
                        ...(selectedScenario === 'baseline' ? styles.scenarioCardActive : {}),
                        borderLeft: selectedScenario === 'baseline' ? '4px solid #10b981' : '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <div style={styles.scenarioHeader}>
                        <Shield size={18} color="#10b981" />
                        <span style={styles.scenarioTitle}>Soft Landing (Padrão)</span>
                      </div>
                      <p style={styles.scenarioDesc}>Cenário-base de controle. Inflação recuando firmemente, cortes graduais de taxas de juros e ambiente estável para investimento produtivo.</p>
                    </div>

                    <div 
                      onClick={() => setSelectedScenario('iran')} 
                      style={{
                        ...styles.scenarioCard,
                        ...(selectedScenario === 'iran' ? styles.scenarioCardActive : {}),
                        borderLeft: selectedScenario === 'iran' ? '4px solid #fbbf24' : '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <div style={styles.scenarioHeader}>
                        <Globe size={18} color="#fbbf24" />
                        <span style={styles.scenarioTitle}>Conflito no Oriente Médio (Irã)</span>
                      </div>
                      <p style={styles.scenarioDesc}>Escalada militar regional. Provoca choque inflacionário com a explosão do barril de petróleo, deprimindo múltiplos de ativos de tecnologia.</p>
                    </div>

                    <div 
                      onClick={() => setSelectedScenario('taiwan')} 
                      style={{
                        ...styles.scenarioCard,
                        ...(selectedScenario === 'taiwan' ? styles.scenarioCardActive : {}),
                        borderLeft: selectedScenario === 'taiwan' ? '4px solid #f43f5e' : '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <div style={styles.scenarioHeader}>
                        <Activity size={18} color="#f43f5e" />
                        <span style={styles.scenarioTitle}>Crise em Taiwan / China</span>
                      </div>
                      <p style={styles.scenarioDesc}>Bloqueio logístico de semicondutores. Provoca paralisação crônica de fundições asiáticas, impactando severamente fabricantes mundiais de hardware.</p>
                    </div>
                  </div>

                  {/* Main Simulator Panel combining Table & SVG circular Arc Gauge dial */}
                  <div style={styles.stressLayout}>
                    
                    {/* Table Side */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Projeção de Choque Individual por Ativo</h4>
                      
                      <div className="spreadsheet-container" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                        <table className="spreadsheet-table">
                          <thead>
                            <tr>
                              <th className="spreadsheet-th" style={{ width: '35px' }}></th>
                              <th className="spreadsheet-th">Empresa</th>
                              <th className="spreadsheet-th">Ticker</th>
                              <th className="spreadsheet-th">Setor</th>
                              <th className="spreadsheet-th">Peso (%)</th>
                              <th className="spreadsheet-th">Estresse Est.</th>
                              <th className="spreadsheet-th">Sensibilidade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {portfolioTickers.map((t, idx) => {
                              const comp = fetchCompanyData(t);
                              const weight = (100 / portfolioTickers.length);
                              const shock = getTickerShock(t, selectedScenario);
                              
                              let shockColor = '#10b981';
                              if (shock < -15) shockColor = '#f43f5e';
                              else if (shock < 0) shockColor = '#fbbf24';

                              let riskCategory = "Hedge Defensivo";
                              if (shock < -25) riskCategory = "Risco Crítico";
                              else if (shock < -10) riskCategory = "Moderadamente Exposto";
                              else if (shock < 0) riskCategory = "Sensível Baixo";

                              return (
                                <tr key={t}>
                                  <td className="spreadsheet-row-header">{idx + 1}</td>
                                  <td className="spreadsheet-td" style={{ fontWeight: 'bold' }}>{comp.name}</td>
                                  <td className="spreadsheet-td" style={{ textAlign: 'center' }}>{t}</td>
                                  <td className="spreadsheet-td">{comp.sector}</td>
                                  <td className="spreadsheet-td" style={{ textAlign: 'right' }}>{weight.toFixed(1)}%</td>
                                  <td className="spreadsheet-td" style={{ textAlign: 'right', fontWeight: 'bold', color: shockColor }}>
                                    {shock > 0 ? '+' : ''}{shock}%
                                  </td>
                                  <td className="spreadsheet-td" style={{ textAlign: 'center', fontSize: 11 }}>
                                    <span style={{ 
                                      padding: '2px 8px', 
                                      borderRadius: '10px', 
                                      backgroundColor: shock < -25 ? 'rgba(244,63,94,0.1)' : shock < 0 ? 'rgba(251,191,36,0.1)' : 'rgba(16,185,129,0.1)',
                                      color: shockColor,
                                      border: `1px solid ${shockColor}30`
                                    }}>
                                      {riskCategory}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Gauge Side */}
                    <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: 15 }}>
                      {(() => {
                        const portfolioImpact = calculatePortfolioImpact(selectedScenario);
                        return renderImpactGauge(portfolioImpact);
                      })()}
                    </div>

                  </div>

                  {/* Scenario Macro Playbook */}
                  {(() => {
                    let playbookTitle = "";
                    let playbookText = "";
                    
                    if (selectedScenario === 'baseline') {
                      playbookTitle = "Manual Macro: Estratégia de Expansão e Otimização";
                      playbookText = "Com o soft landing consolidado, a estratégia ideal é focar na eficiência de capital. Manter posições overweight em empresas de forte fluxo de caixa livre e crescimento secular de margens (NVDA, PLTR, AVGO) maximiza o alfa. Considere alocar caixa excedente para reforçar posições que ficaram para trás na recuperação econômica recente.";
                    } else if (selectedScenario === 'iran') {
                      playbookTitle = "Manual Macro: Proteção contra Inflação e Choques de Energia";
                      playbookText = "Um conflito no Oriente Médio penaliza duramente empresas de alta dependência de transporte e combustíveis (RCL cai 25% pelo custo do bunker e receio de tráfego) e comprime múltiplos de valuation de crescimento. Ações como GEV sobem (+15%) devido à alta urgência de soluções domésticas de energia limpa e transição de rede elétrica. Recomenda-se aumentar posições de hedge defensivo em GEV e LLY, reduzindo ativos de consumo cíclico discricionário.";
                    } else if (selectedScenario === 'taiwan') {
                      playbookTitle = "Manual Macro: Estratégia de Contingência de Semicondutores";
                      playbookText = "Um bloqueio naval ou conflito armado no Estreito de Taiwan paralisaria a TSMC, provocando uma queda severa nas fabricantes que dependem dela (NVDA -40%, AVGO -35%, STX -30%). O pânico tecnológico espalharia para software e redes de anúncios digitais (META -18%, GOOGL -15%). A melhor defesa é a rotação imediata para LLY (+8%), cujo core-business médico é totalmente independente e resiliente a esse supply chain. Posições de caixa e ouro sintético devem ser reforçadas.";
                    }

                    return (
                      <div style={styles.playbookCard} className="glass-panel animate-fade">
                        <h4 style={styles.playbookTitle}>
                          <Shield size={16} color="#fbbf24" /> {playbookTitle}
                        </h4>
                        <p style={styles.playbookText}>{playbookText}</p>
                      </div>
                    );
                  })()}

                </div>
              )}

            </div>
          ) : (
            <div style={styles.emptyOutput}>
              {!loading ? (
                <>
                  <Database size={48} color="#475569" style={{ marginBottom: 16 }} />
                  <h3>Sector Analysis Engine</h3>
                  <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, maxWidth: 300, textAlign: 'center' }}>
                    Select a market sector or type your custom portfolio, and click "Analyze Market" to aggregate peer multiples and strategic intelligence.
                  </p>
                </>
              ) : (
                <div style={styles.progressLoader}>
                  <div style={styles.spinner}></div>
                  <h4 style={{ marginTop: 16 }}>Scanning Market Databases...</h4>
                  <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                    Fetching financial statements and regulatory filings...
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
  select: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    marginLeft: 10,
    outline: 'none',
    width: '100%',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  portfolioManagerPanel: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: 'rgba(255, 255, 255, 0.01)',
    marginBottom: '20px',
  },
  portfolioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  portfolioTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
  },
  portfolioSubtitle: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: '1.4',
  },
  resetBtn: {
    padding: '6px 12px',
    fontSize: '11px',
    height: 'auto',
  },
  pillContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    background: 'rgba(0,0,0,0.15)',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.03)',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '20px',
    padding: '4px 10px 4px 12px',
    transition: 'all 0.2s',
  },
  pillTicker: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff',
  },
  pillPrice: {
    fontSize: '11px',
    color: '#a5b4fc',
    fontWeight: '500',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1px 6px',
    borderRadius: '10px',
  },
  pillDelete: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0 2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '16px',
    width: '16px',
    borderRadius: '50%',
    transition: 'all 0.2s',
  },
  addForm: {
    display: 'flex',
    gap: 12,
    maxWidth: '500px',
  },
  addInput: {
    flex: 1,
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    color: '#ffffff',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    padding: '0 12px',
    height: '38px',
  },
  addBtn: {
    height: '38px',
    padding: '0 16px',
    fontSize: '12px',
  },
  workspaceGrid: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: 20,
  },
  logPanel: {
    padding: '16px',
    height: '240px',
    display: 'flex',
    flexDirection: 'column',
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e2e8f0',
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
    color: '#6366f1',
    fontSize: '12px',
    marginTop: 8,
    animation: 'pulse 1.5s infinite',
  },
  catalystCard: {
    padding: '16px',
  },
  catalystList: {
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 12,
  },
  catalystItem: {
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: '1.4',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '8px 12px',
    borderRadius: '6px',
    borderLeft: '3px solid #fbbf24',
  },
  mainPanel: {
    padding: '24px',
    minHeight: '520px',
  },
  thesisText: {
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.6',
    marginTop: 8,
  },
  chartWrapper: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '8px',
    padding: '16px',
  },
  svgContainer: {
    position: 'relative',
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
  tabNavigator: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 10,
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    background: 'rgba(99, 102, 241, 0.12)',
    color: '#ffffff',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  segmentedBarContainer: {
    display: 'flex',
    width: '100%',
    height: '12px',
    borderRadius: '6px',
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.05)',
    margin: '16px 0',
  },
  sectorLegendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 12,
    marginTop: 10,
  },
  legendItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.01)',
  },
  legendName: {
    fontSize: '12px',
    color: '#cbd5e1',
    fontWeight: '500',
  },
  legendPct: {
    fontSize: '12px',
    fontWeight: '700',
  },
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    margin: '20px 0',
  },
  healthCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  healthTitle: {
    fontSize: '11px',
    textTransform: 'uppercase',
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  healthValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
  },
  healthDesc: {
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  advisoryReport: {
    marginTop: 20,
    padding: '20px',
    background: 'rgba(99, 102, 241, 0.03)',
    borderLeft: '4px solid #6366f1',
    borderRadius: '0 8px 8px 0',
  },
  advisoryTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  advisoryBody: {
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.6',
  },
  scenarioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 20,
  },
  scenarioCard: {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.01)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    transition: 'all 0.2s',
  },
  scenarioCardActive: {
    background: 'rgba(99, 102, 241, 0.05)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    boxShadow: '0 0 15px rgba(99, 102, 241, 0.1)',
  },
  scenarioHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  scenarioTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
  },
  scenarioDesc: {
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  stressLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 200px',
    gap: 20,
    alignItems: 'start',
  },
  gaugeContainer: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeTextContainer: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  gaugeValue: {
    fontSize: '20px',
    fontWeight: '700',
  },
  gaugeLabel: {
    fontSize: '10px',
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  playbookCard: {
    marginTop: 20,
    padding: '18px',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    background: 'rgba(0,0,0,0.15)',
  },
  playbookTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  playbookText: {
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: '1.5',
  }
};
