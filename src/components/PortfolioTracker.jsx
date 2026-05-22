import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  RefreshCw, 
  Info, 
  AlertTriangle, 
  PieChart, 
  Newspaper, 
  DollarSign, 
  Compass, 
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Activity,
  Globe,
  Download,
  Upload,
  Eye,
  EyeOff,
  Cpu,
  Key,
  Sparkles
} from 'lucide-react';
import { fetchCompanyData, updateLivePricesCache, formatDateTime } from '../utils/financeApi';

const DEFAULT_PORTFOLIO_LEDGER = {
  NVDA: { ticker: 'NVDA', qty: 15, avgPrice: 820.00 },
  GOOGL: { ticker: 'GOOGL', qty: 45, avgPrice: 152.00 },
  AVGO: { ticker: 'AVGO', qty: 8, avgPrice: 122.00 },
  FISV: { ticker: 'FISV', qty: 25, avgPrice: 141.00 },
  GEV: { ticker: 'GEV', qty: 30, avgPrice: 148.00 },
  LLY: { ticker: 'LLY', qty: 10, avgPrice: 690.00 },
  META: { ticker: 'META', qty: 12, avgPrice: 410.00 },
  OMF: { ticker: 'OMF', qty: 60, avgPrice: 42.00 },
  PLTR: { ticker: 'PLTR', qty: 150, avgPrice: 32.00 },
  RCL: { ticker: 'RCL', qty: 35, avgPrice: 115.00 },
  HSBC: { ticker: 'HSBC', qty: 80, avgPrice: 36.00 },
  STX: { ticker: 'STX', qty: 40, avgPrice: 85.00 },
  LITE: { ticker: 'LITE', qty: 50, avgPrice: 46.00 },
  SNDK: { ticker: 'SNDK', qty: 75, avgPrice: 65.00 }
};

const DEFAULT_BR_PORTFOLIO_LEDGER = {
  PETR4: { ticker: 'PETR4', qty: 100, avgPrice: 34.00 },
  VALE3: { ticker: 'VALE3', qty: 80, avgPrice: 68.00 },
  ITUB4: { ticker: 'ITUB4', qty: 120, avgPrice: 28.50 },
  WEGE3: { ticker: 'WEGE3', qty: 150, avgPrice: 35.00 },
  BBDC4: { ticker: 'BBDC4', qty: 90, avgPrice: 13.80 }
};

const SAMPLE_NEWS = [
  {
    id: 1,
    title: "Tensões no Estreito de Taiwan geram alerta vermelho para suprimento de Chips",
    source: "Bloomberg FSI",
    time: "10min atrás",
    summary: "Analistas estimam que uma paralisação nas fundições asiáticas geraria prejuízos imediatos de cadeia de hardware, impactando posições em semicondutores e gerando busca por portos seguros de saúde.",
    tags: ["NVDA", "AVGO", "STX", "LLY"],
    impacts: { NVDA: "critical", AVGO: "critical", STX: "high-risk", LLY: "hedge" },
    scenario: "taiwan"
  },
  {
    id: 2,
    title: "Escalada no Oriente Médio pressiona custos de bunker marítimo e fretes",
    source: "Reuters Business",
    time: "45min atrás",
    summary: "Com as tensões escalando no Golfo, o preço do petróleo tipo Brent dispara. Empresas do setor de cruzeiros enfrentam elevação de custos de combustível imediata, enquanto infraestruturas domésticas de energia ganham apelo.",
    tags: ["RCL", "GEV", "OMF"],
    impacts: { RCL: "critical", GEV: "positive", OMF: "high-risk" },
    scenario: "iran"
  },
  {
    id: 3,
    title: "Federal Reserve sinaliza manutenção de juros altos por período prolongado",
    source: "WSJ Markets",
    time: "2h atrás",
    summary: "O Comitê de Política Monetária (FOMC) expressou preocupação com a segurança e persistência de preços elevados em serviços de habitação e energia. Ativos financeiros de crédito e bancos de varejo sentem o aumento das margens, enquanto ativos de alto crescimento sofrem re-rating.",
    tags: ["HSBC", "OMF", "PLTR", "META"],
    impacts: { HSBC: "positive", OMF: "positive", PLTR: "negative", META: "negative" },
    scenario: "rates"
  },
  {
    id: 4,
    title: "Eli Lilly supera expectativas em vendas do Zepbound e anuncia expansão fabril",
    source: "CNBC Healthcare",
    time: "4h atrás",
    summary: "A gigante de saúde relatou uma demanda sem precedentes por tratamentos metabólicos e obesidade. A margem operacional robusta e o fluxo de caixa resiliente solidificam seu papel como uma âncora defensiva contra volatilidades geopolíticas.",
    tags: ["LLY"],
    impacts: { LLY: "positive" },
    scenario: "baseline"
  },
  {
    id: 5,
    title: "NVIDIA e Broadcom consolidam nova arquitetura de AI em data centers globais",
    source: "TechCrunch AI",
    time: "5h atrás",
    summary: "Grandes provedores de nuvem aumentaram o guidance de capex computacional. As vendas consolidadas de aceleradores e silício customizado continuam em ritmo de hiperdesenvolvimento de receita.",
    tags: ["NVDA", "AVGO", "GOOGL"],
    impacts: { NVDA: "positive", AVGO: "positive", GOOGL: "positive" },
    scenario: "baseline"
  },
  {
    id: 6,
    title: "Palantir fecha contrato de $480M com o Departamento de Defesa dos EUA",
    source: "Defense News",
    time: "8h atrás",
    summary: "O software de inteligência artificial AIP foi selecionado para expandir o processamento de dados e análise preditiva tática. Analistas veem aumento duradouro nas receitas recorrentes de inteligência de soberania.",
    tags: ["PLTR"],
    impacts: { PLTR: "positive" },
    scenario: "baseline"
  }
];

const BR_NEWS = [
  {
    id: 101,
    title: "COPOM mantém taxa Selic estável em meio a preocupações fiscais",
    source: "Valor Econômico",
    time: "15min atrás",
    summary: "O Comitê de Política Monetária do Banco Central sinalizou vigilância rigorosa sobre a inflação prospectiva. Bancos brasileiros de varejo registram estabilização de margens financeiras com clientes.",
    tags: ["ITUB4", "BBDC4"],
    impacts: { ITUB4: "positive", BBDC4: "positive" },
    scenario: "selic"
  },
  {
    id: 102,
    title: "Minério de ferro recupera patamar de $110/t em Dalian e impulsiona exportadoras",
    source: "InfoMoney",
    time: "1h atrás",
    summary: "Dados de estímulo de infraestrutura na Ásia reacendem demanda por commodities metálicas. A gigante de mineração brasileira registra forte fluxo comprador, atuando como porto seguro de dividendos.",
    tags: ["VALE3"],
    impacts: { VALE3: "positive" },
    scenario: "commodities"
  },
  {
    id: 103,
    title: "Petrobras eleva produção no pré-sal e anuncia nova política de dividendos extraordinários",
    source: "Estadão Economia",
    time: "3h atrás",
    summary: "Com a cotação do Brent se consolidando acima de $80, a estatal brasileira registra recorde operacional. Analistas destacam o dividend yield robusto em comparação com petrolíferas americanas.",
    tags: ["PETR4"],
    impacts: { PETR4: "positive" },
    scenario: "oil"
  },
  {
    id: 104,
    title: "WEG anuncia investimento de R$ 600 milhões para expansão de fábrica de motores elétricos",
    source: "Exame",
    time: "6h atrás",
    summary: "A multinacional catarinense expandirá sua capacidade industrial de olho na transição energética global. A resiliência das receitas dolarizadas e o retorno sobre capital investido (ROIC) continuam como diferenciais competitivos.",
    tags: ["WEGE3"],
    impacts: { WEGE3: "positive" },
    scenario: "baseline"
  },
  {
    id: 105,
    title: "Fluxo de capital estrangeiro atinge recorde na B3 no primeiro trimestre de 2026",
    source: "G1 Economia",
    time: "12h atrás",
    summary: "Investidores globais buscam ativos subvalorizados de mercados emergentes. Blue-chips brasileiras com múltiplos atraentes lideram o volume de compras na bolsa paulista.",
    tags: ["ITUB4", "VALE3", "PETR4"],
    impacts: { ITUB4: "positive", VALE3: "positive", PETR4: "positive" },
    scenario: "baseline"
  }
];

export default function PortfolioTracker() {
  const [ledgerUs, setLedgerUs] = useState(() => {
    const savedUs = localStorage.getItem('fsi_user_portfolio_ledger_us');
    if (savedUs) {
      try {
        const parsed = JSON.parse(savedUs);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      } catch (e) {
        // Ignored
      }
    }
    // Fallback migration from old unsuffixed key
    const oldSaved = localStorage.getItem('fsi_user_portfolio_ledger');
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          localStorage.setItem('fsi_user_portfolio_ledger_us', oldSaved);
          return parsed;
        }
      } catch (e) {
        // Ignored
      }
    }
    return DEFAULT_PORTFOLIO_LEDGER;
  });

  const [ledgerBr, setLedgerBr] = useState(() => {
    const savedBr = localStorage.getItem('fsi_user_portfolio_ledger_br');
    if (savedBr) {
      try {
        const parsed = JSON.parse(savedBr);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      } catch (e) {
        // Ignored
      }
    }
    return DEFAULT_BR_PORTFOLIO_LEDGER;
  });

  const [activePortfolio, setActivePortfolio] = useState('US'); // 'US', 'BR', 'GLOBAL'
  const [globalCurrency, setGlobalCurrency] = useState('BRL'); // 'USD', 'BRL'
  const [usdToBrlInput, setUsdToBrlInput] = useState(() => localStorage.getItem('fsi_usd_to_brl') || '5.15');
  const usdToBrl = parseFloat(usdToBrlInput) || 5.15;

  const handleExchangeRateChange = (valStr) => {
    setUsdToBrlInput(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      localStorage.setItem('fsi_usd_to_brl', valStr);
    }
  };

  const [tickerInput, setTickerInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [avgPriceInput, setAvgPriceInput] = useState('');
  
  const [editingKey, setEditingKey] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editAvgPrice, setEditAvgPrice] = useState('');

  const [hideValues, setHideValues] = useState(() => {
    return localStorage.getItem('fsi_hide_values') === 'true';
  });

  const [sortField, setSortField] = useState(null); // 'ticker', 'name', 'qty', 'avgPrice', 'investedCost', 'currentPrice', 'currentValuation', 'profitLossPct', 'country'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <span style={{ opacity: 0.25, marginLeft: 4, fontSize: '9px', fontFamily: 'monospace' }}>▲▼</span>;
    }
    return sortDirection === 'asc' 
      ? <span style={{ color: '#38bdf8', marginLeft: 4, fontSize: '10px' }}>▲</span>
      : <span style={{ color: '#38bdf8', marginLeft: 4, fontSize: '10px' }}>▼</span>;
  };

  const [loadingPrices, setLoadingPrices] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedNewsFilter, setSelectedNewsFilter] = useState('all');
  const [priceUpdateTrigger, setPriceUpdateTrigger] = useState(0);
  // Farol de status por ticker: { GEV: 'ok', AVGO: 'failed', ... }
  const [tickerStatus, setTickerStatus] = useState({});

  // Simulador de Rebalanceamento
  const [simTicker, setSimTicker] = useState('NVDA');
  const [simQty, setSimQty] = useState('10');
  const [simPrice, setSimPrice] = useState('');
  const [simType, setSimType] = useState('buy'); // buy or sell
  const [simulationResult, setSimulationResult] = useState(null);

  // Gemini API Geopolitical News Correlation States
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('fsi_gemini_api_key') || '');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customScenario, setCustomScenario] = useState('');
  const [isSimulatingNews, setIsSimulatingNews] = useState(false);
  const [newsSimError, setNewsSimError] = useState('');
  const [aiReport, setAiReport] = useState(null);

  const analyzeScenarioWithGemini = async (scenarioText) => {
    if (!geminiApiKey) {
      setNewsSimError('Por favor, configure sua chave API do Gemini primeiro.');
      return;
    }
    if (!scenarioText || !scenarioText.trim()) {
      setNewsSimError('Por favor, digite um cenário válido para simulação.');
      return;
    }
    
    setIsSimulatingNews(true);
    setNewsSimError('');
    setAiReport(null);
    
    // Prepare tickers data for current active holdings
    const holdingsData = activeHoldings.map(h => {
      const totalVal = activeHoldings.reduce((acc, curr) => acc + curr.currentValuation, 0);
      const share = totalVal > 0 ? (h.currentValuation / totalVal) * 100 : 0;
      return `${h.ticker} (${h.name}, participacao: ${share.toFixed(1)}%)`;
    }).join(', ');
    
    const promptText = `Você é um analista macroeconômico e geopolítico sênior especializado em mercado de capitais global.
    
Analise o seguinte cenário/evento e determine o impacto direcional potencial e a justificativa para cada um dos ativos na carteira do usuário.

Cenário Geopolítico/Macro: "${scenarioText}"

Carteira de Ativos sob análise: [ ${holdingsData} ]

Por favor, analise a correlação macro de cada ativo de forma rigorosa e realista:
- Identifique a exposição a insumos, restrições comerciais, volatilidade cambial, taxa de juros ou demanda setorial.
- Defina o impacto de cada ativo em uma destas 5 categorias:
  1. "critical" (impacto severamente negativo)
  2. "high-risk" (impacto moderadamente negativo, requer atenção)
  3. "positive" (impacto altamente benéfico/ganho de margem)
  4. "hedge" (porto seguro clássico contra esse tipo de crise ou volatilidade)
  5. "neutral" (pouco ou nenhum impacto esperado)

Forneça a resposta estritamente no seguinte formato JSON, sem crases de bloco de código (\`\`\`json ...) ou qualquer outro texto explicativo fora do JSON:
{
  "summary": "Resumo analítico profissional de alto nível (2 a 3 frases) em português, detalhando a geopolítica do cenário e o impacto agregado nesta carteira de investimentos específica.",
  "tickers": [
    {
      "ticker": "NVDA",
      "impact": "critical",
      "reason": "Explicação macro/operacional em 1 frase curta e concisa (máximo 15 palavras) em português."
    }
  ]
}`;

    try {
      const baseUrl = typeof window !== 'undefined' ? '/api-proxy/gm' : 'https://generativelanguage.googleapis.com';
      const url = `${baseUrl}/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: promptText }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });
      } catch (err) {
        console.warn('[Proxy Fallback] Local proxy failed for Gemini. Falling back to direct URL.', err);
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
        response = await fetch(directUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: promptText }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });
      }
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }
      
      const resData = await response.json();
      const resText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resText) {
        throw new Error('Formato de resposta inválido recebido da API Gemini.');
      }
      
      const parsedData = JSON.parse(resText.trim());
      setAiReport(parsedData);
      setSuccessMessage('Simulação geopolítica concluída com sucesso!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setNewsSimError(`Falha na simulação: ${err.message}`);
    } finally {
      setIsSimulatingNews(false);
    }
  };

  // Escuta cotações
  useEffect(() => {
    const handleUpdate = () => {
      setPriceUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('fsi_prices_updated', handleUpdate);
    return () => window.removeEventListener('fsi_prices_updated', handleUpdate);
  }, []);

  // Reseta a ordenação ao mudar de portfólio ativo
  useEffect(() => {
    setSortField(null);
    setSortDirection('asc');
  }, [activePortfolio]);

  // Persiste ledgers e notifica outros componentes
  useEffect(() => {
    localStorage.setItem('fsi_user_portfolio_ledger_us', JSON.stringify(ledgerUs));
    window.dispatchEvent(new CustomEvent('portfolio_updated'));
  }, [ledgerUs]);

  useEffect(() => {
    localStorage.setItem('fsi_user_portfolio_ledger_br', JSON.stringify(ledgerBr));
    window.dispatchEvent(new CustomEvent('portfolio_updated'));
  }, [ledgerBr]);

  const handleRefreshPrices = async () => {
    // Agrega sempre todos os tickers de ambas as carteiras para atualizar tudo simultaneamente
    const tickers = [...Object.keys(ledgerUs), ...Object.keys(ledgerBr)];
    
    setLoadingPrices(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTickerStatus({}); // Reseta o status de todos os tickers para cinza (aguardando atualização)
    
    const provider = localStorage.getItem('fsi_finance_api_provider') || 'simulated';
    const apiKey = localStorage.getItem('fsi_finance_api_key') || '';
    
    // O cache fsi_prices_cache não deve ser limpo aqui para atuar como uma base local persistente.
    // O auto-healing de troca de provedor já é tratado diretamente pelo motor de cotações em financeApi.js.
    
    let exchangeUpdated = false;
    let exchangeRateStr = '';
    
    // Busca câmbio automaticamente
    try {
      const exchangeRes = await fetch('https://open.er-api.com/v6/latest/USD');
      if (exchangeRes.ok) {
        const exchangeData = await exchangeRes.json();
        if (exchangeData && exchangeData.rates && exchangeData.rates.BRL) {
          const rate = parseFloat(exchangeData.rates.BRL);
          if (rate > 2 && rate < 10) {
            exchangeRateStr = rate.toFixed(4);
            setUsdToBrlInput(exchangeRateStr);
            localStorage.setItem('fsi_usd_to_brl', exchangeRateStr);
            exchangeUpdated = true;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to fetch USD-BRL automatically:", e);
    }
    
    if (tickers.length === 0) {
      setLoadingPrices(false);
      if (exchangeUpdated) {
        setSuccessMessage(`Taxa de câmbio USD/BRL atualizada automaticamente para R$ ${exchangeRateStr} com sucesso!`);
      } else {
        setErrorMessage('Nenhum ativo cadastrado para atualizar.');
      }
      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 4000);
      return;
    }
    
    try {
      const res = await updateLivePricesCache(tickers, provider, apiKey);
      
      // Atualiza o farol de status por ticker
      if (res.updatedSymbols !== undefined) {
        const updatedSet = new Set(res.updatedSymbols);
        const newStatus = {};
        tickers.forEach(t => {
          newStatus[t] = updatedSet.has(t) ? 'ok' : 'failed';
        });
        setTickerStatus(newStatus);
      }
      
      if (res.success) {
        if (res.rateLimited) {
          setErrorMessage(`Aviso: Limite de requisições atingido (429). ${res.updatedCount || 0}/${tickers.length} cotações atualizadas.`);
        } else {
          const msg = exchangeUpdated 
            ? `Cotações e câmbio USD/BRL (R$ ${exchangeRateStr}) atualizados com sucesso! (${res.updatedCount}/${tickers.length} ativos)`
            : `Cotações atualizadas via ${provider.toUpperCase()}! (${res.updatedCount || 0}/${tickers.length} ativos)`;
          setSuccessMessage(msg);
        }
        setPriceUpdateTrigger(prev => prev + 1);
        window.dispatchEvent(new Event('fsi_prices_updated'));
      } else {
        if (res.rateLimited) {
          setErrorMessage("Aviso: Limite de requisições atingido (429) em algumas cotações. Usando cache para posições restantes.");
        } else {
          setErrorMessage(`Aviso: ${res.reason || 'Usando cache ou cotações simuladas locais'}`);
        }
      }
    } catch (e) {
      setErrorMessage(`Erro ao atualizar cotações: ${e.message}`);
    } finally {
      setLoadingPrices(false);
      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 6000);
    }
  };

  // Auto-refresh em background no carregamento inicial da página
  useEffect(() => {
    // Adiciona um pequeno delay de 800ms para evitar sobreposição de processos
    const timer = setTimeout(() => {
      handleRefreshPrices();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Carrega preço simulador padrão
  useEffect(() => {
    if (simTicker) {
      const comp = fetchCompanyData(simTicker);
      setSimPrice(comp.price.toString());
    }
  }, [simTicker]);

  // Sincroniza ticker padrão do simulador ao mudar de aba
  useEffect(() => {
    if (activePortfolio === 'US' && Object.keys(ledgerUs).length > 0) {
      setSimTicker(Object.keys(ledgerUs)[0]);
    } else if (activePortfolio === 'BR' && Object.keys(ledgerBr).length > 0) {
      setSimTicker(Object.keys(ledgerBr)[0]);
    } else if (activePortfolio === 'GLOBAL') {
      const allKeys = [...Object.keys(ledgerUs), ...Object.keys(ledgerBr)];
      if (allKeys.length > 0) {
        setSimTicker(allKeys[0]);
      }
    }
  }, [activePortfolio, ledgerUs, ledgerBr]);

  // Exportar carteiras (EUA e Brasil)
  const handleExportPortfolios = () => {
    try {
      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        exchangeRate: usdToBrlInput,
        ledgerUs,
        ledgerBr
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `aura_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      setSuccessMessage("Carteiras exportadas com sucesso!");
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (e) {
      setErrorMessage(`Erro ao exportar: ${e.message}`);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // Importar carteiras (EUA e Brasil)
  const handleImportPortfolios = (event) => {
    const fileReader = new FileReader();
    const file = event.target.files[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        
        // Robust Schema Validation
        if (!parsed || typeof parsed !== 'object') {
          throw new Error("Formato inválido: O arquivo de backup deve ser um objeto JSON.");
        }

        // We require ledgerUs and ledgerBr to exist
        if (!parsed.ledgerUs || typeof parsed.ledgerUs !== 'object') {
          throw new Error("Arquivo corrompido: A carteira EUA ('ledgerUs') está ausente ou inválida.");
        }
        if (!parsed.ledgerBr || typeof parsed.ledgerBr !== 'object') {
          throw new Error("Arquivo corrompido: A carteira Brasil ('ledgerBr') está ausente ou inválida.");
        }

        // Validate tickers, quantities, and average prices in ledgerUs
        for (const ticker of Object.keys(parsed.ledgerUs)) {
          const asset = parsed.ledgerUs[ticker];
          if (!asset || typeof asset !== 'object') {
            throw new Error(`Ativo ${ticker} inválido na carteira EUA.`);
          }
          if (typeof asset.ticker !== 'string' || !asset.ticker) {
            throw new Error(`Ticker inválido para o ativo ${ticker} na carteira EUA.`);
          }
          const qty = parseFloat(asset.qty);
          const avgPrice = parseFloat(asset.avgPrice);
          if (isNaN(qty) || qty <= 0 || isNaN(avgPrice) || avgPrice <= 0) {
            throw new Error(`Dados de quantidade ou preço médio inválidos para ${ticker} na carteira EUA.`);
          }
        }

        // Validate tickers, quantities, and average prices in ledgerBr
        for (const ticker of Object.keys(parsed.ledgerBr)) {
          const asset = parsed.ledgerBr[ticker];
          if (!asset || typeof asset !== 'object') {
            throw new Error(`Ativo ${ticker} inválido na carteira Brasil.`);
          }
          if (typeof asset.ticker !== 'string' || !asset.ticker) {
            throw new Error(`Ticker inválido para o ativo ${ticker} na carteira Brasil.`);
          }
          const qty = parseFloat(asset.qty);
          const avgPrice = parseFloat(asset.avgPrice);
          if (isNaN(qty) || qty <= 0 || isNaN(avgPrice) || avgPrice <= 0) {
            throw new Error(`Dados de quantidade ou preço médio inválidos para ${ticker} na carteira Brasil.`);
          }
        }

        // Apply state changes if everything is valid
        setLedgerUs(parsed.ledgerUs);
        setLedgerBr(parsed.ledgerBr);

        if (parsed.exchangeRate) {
          const rate = parseFloat(parsed.exchangeRate);
          if (!isNaN(rate) && rate > 0) {
            setUsdToBrlInput(parsed.exchangeRate);
            localStorage.setItem('fsi_usd_to_brl', parsed.exchangeRate);
          }
        }

        // Explicitly write to localStorage to prevent race conditions during updates
        localStorage.setItem('fsi_user_portfolio_ledger_us', JSON.stringify(parsed.ledgerUs));
        localStorage.setItem('fsi_user_portfolio_ledger_br', JSON.stringify(parsed.ledgerBr));

        setSuccessMessage("Backup importado com sucesso! Suas carteiras foram restauradas.");
        
        // Notify other widgets
        window.dispatchEvent(new CustomEvent('portfolio_updated'));
        
        // Sincronizar preços de mercado imediatamente
        setTimeout(() => {
          handleRefreshPrices();
        }, 300);

      } catch (err) {
        setErrorMessage(`Falha na importação: ${err.message}`);
      } finally {
        event.target.value = '';
        setTimeout(() => {
          setSuccessMessage('');
          setErrorMessage('');
        }, 6000);
      }
    };

    fileReader.readAsText(file);
  };

  // Adicionar ativo
  const handleAddHolding = (e) => {
    e.preventDefault();
    const symbol = tickerInput.trim().toUpperCase();
    const qty = parseFloat(qtyInput);
    const avg = parseFloat(avgPriceInput);

    if (!symbol || isNaN(qty) || qty <= 0 || isNaN(avg) || avg <= 0) {
      alert("Por favor, preencha todos os campos com valores válidos maiores que zero.");
      return;
    }

    if (activePortfolio === 'US') {
      const updated = {
        ...ledgerUs,
        [symbol]: { ticker: symbol, qty, avgPrice: avg }
      };
      setLedgerUs(updated);
    } else if (activePortfolio === 'BR') {
      const updated = {
        ...ledgerBr,
        [symbol]: { ticker: symbol, qty, avgPrice: avg }
      };
      setLedgerBr(updated);
    }
    
    setTickerInput('');
    setQtyInput('');
    setAvgPriceInput('');
  };

  // Remover ativo
  const handleRemoveHolding = (symbol) => {
    if (confirm(`Tem certeza de que deseja remover ${symbol} da sua carteira?`)) {
      if (activePortfolio === 'US') {
        const updated = { ...ledgerUs };
        delete updated[symbol];
        setLedgerUs(updated);
      } else {
        const updated = { ...ledgerBr };
        delete updated[symbol];
        setLedgerBr(updated);
      }
    }
  };

  // Ativar modo de edição
  const startEditing = (symbol, item) => {
    setEditingKey(symbol);
    setEditQty(item.qty.toString());
    setEditAvgPrice(item.avgPrice.toString());
  };

  // Salvar edição
  const saveEditing = (symbol) => {
    const qty = parseFloat(editQty);
    const avg = parseFloat(editAvgPrice);

    if (isNaN(qty) || qty <= 0 || isNaN(avg) || avg <= 0) {
      alert("Por favor, digite valores válidos.");
      return;
    }

    if (activePortfolio === 'US') {
      const updated = {
        ...ledgerUs,
        [symbol]: { ticker: symbol, qty, avgPrice: avg }
      };
      setLedgerUs(updated);
    } else {
      const updated = {
        ...ledgerBr,
        [symbol]: { ticker: symbol, qty, avgPrice: avg }
      };
      setLedgerBr(updated);
    }
    setEditingKey(null);
  };

  // Limpar toda a carteira ativa
  const handleClearLedger = () => {
    const pName = activePortfolio === 'US' ? 'EUA (USD)' : 'Brasil (BRL)';
    if (confirm(`Tem certeza de que deseja limpar todos os ativos da carteira ${pName}?`)) {
      if (activePortfolio === 'US') {
        setLedgerUs({});
      } else {
        setLedgerBr({});
      }
    }
  };

  // Taxa Cambial Dinâmica
  const USD_TO_BRL = usdToBrl;

  // Formatter dinâmico
  const formatVal = (val, currencyCode) => {
    const code = currencyCode || (activePortfolio === 'US' ? 'USD' : activePortfolio === 'BR' ? 'BRL' : globalCurrency);
    if (hideValues) {
      return code === 'BRL' ? 'R$ ••••' : '$ ••••';
    }
    if (code === 'BRL') {
      return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Cálculos consolidados da carteira EUA (USD)
  const holdingsUs = Object.values(ledgerUs).map(item => {
    const comp = fetchCompanyData(item.ticker);
    const invested = item.qty * item.avgPrice;
    const currentVal = item.qty * comp.price;
    const profitLoss = currentVal - invested;
    const profitLossPct = invested > 0 ? (profitLoss / invested) * 100 : 0;
    
    const charCodeSum = item.ticker.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const simulatedDailyChange = parseFloat((-1.8 + (charCodeSum % 40) * 0.1).toFixed(2)); 
    const dailyChangeVal = currentVal * (simulatedDailyChange / 100);

    return {
      ...item,
      name: comp.name,
      sector: comp.sector || 'Outros',
      currentPrice: comp.price,
      investedCost: invested,
      currentValuation: currentVal,
      profitLoss: profitLoss,
      profitLossPct: profitLossPct,
      dailyChangePct: simulatedDailyChange,
      dailyChangeVal: dailyChangeVal,
      currency: 'USD',
      country: 'US',
      updatedAt: comp.updatedAt,
      provider: comp.provider
    };
  });

  const totalInvestedUs = holdingsUs.reduce((acc, h) => acc + h.investedCost, 0);
  const totalValuationUs = holdingsUs.reduce((acc, h) => acc + h.currentValuation, 0);
  const totalProfitLossUs = totalValuationUs - totalInvestedUs;
  const totalProfitLossPctUs = totalInvestedUs > 0 ? (totalProfitLossUs / totalInvestedUs) * 100 : 0;
  const totalDailyChangeValUs = holdingsUs.reduce((acc, h) => acc + h.dailyChangeVal, 0);

  // Cálculos consolidados da carteira Brasil (BRL)
  const holdingsBr = Object.values(ledgerBr).map(item => {
    const comp = fetchCompanyData(item.ticker);
    const invested = item.qty * item.avgPrice;
    const currentVal = item.qty * comp.price;
    const profitLoss = currentVal - invested;
    const profitLossPct = invested > 0 ? (profitLoss / invested) * 100 : 0;
    
    const charCodeSum = item.ticker.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const simulatedDailyChange = parseFloat((-1.8 + (charCodeSum % 40) * 0.1).toFixed(2));
    const dailyChangeVal = currentVal * (simulatedDailyChange / 100);

    return {
      ...item,
      name: comp.name,
      sector: comp.sector || 'Outros',
      currentPrice: comp.price,
      investedCost: invested,
      currentValuation: currentVal,
      profitLoss: profitLoss,
      profitLossPct: profitLossPct,
      dailyChangePct: simulatedDailyChange,
      dailyChangeVal: dailyChangeVal,
      currency: 'BRL',
      country: 'BR',
      updatedAt: comp.updatedAt,
      provider: comp.provider
    };
  });

  const totalInvestedBr = holdingsBr.reduce((acc, h) => acc + h.investedCost, 0);
  const totalValuationBr = holdingsBr.reduce((acc, h) => acc + h.currentValuation, 0);
  const totalProfitLossBr = totalValuationBr - totalInvestedBr;
  const totalProfitLossPctBr = totalInvestedBr > 0 ? (totalProfitLossBr / totalInvestedBr) * 100 : 0;
  const totalDailyChangeValBr = holdingsBr.reduce((acc, h) => acc + h.dailyChangeVal, 0);

  // Unifica dados de carteira global
  const holdingsGlobal = [
    ...holdingsUs.map(h => {
      const multiplier = globalCurrency === 'BRL' ? USD_TO_BRL : 1;
      return {
        ...h,
        investedCostGlobal: h.investedCost * multiplier,
        currentValuationGlobal: h.currentValuation * multiplier,
        profitLossGlobal: h.profitLoss * multiplier,
        dailyChangeValGlobal: h.dailyChangeVal * multiplier
      };
    }),
    ...holdingsBr.map(h => {
      const multiplier = globalCurrency === 'USD' ? (1 / USD_TO_BRL) : 1;
      return {
        ...h,
        investedCostGlobal: h.investedCost * multiplier,
        currentValuationGlobal: h.currentValuation * multiplier,
        profitLossGlobal: h.profitLoss * multiplier,
        dailyChangeValGlobal: h.dailyChangeVal * multiplier
      };
    })
  ];

  const totalInvestedGlobal = holdingsGlobal.reduce((acc, h) => acc + h.investedCostGlobal, 0);
  const totalValuationGlobal = holdingsGlobal.reduce((acc, h) => acc + h.currentValuationGlobal, 0);
  const totalProfitLossGlobal = totalValuationGlobal - totalInvestedGlobal;
  const totalProfitLossPctGlobal = totalInvestedGlobal > 0 ? (totalProfitLossGlobal / totalInvestedGlobal) * 100 : 0;
  const totalDailyChangeValGlobal = holdingsGlobal.reduce((acc, h) => acc + h.dailyChangeValGlobal, 0);
  const totalDailyChangePctGlobal = totalValuationGlobal > 0 ? (totalDailyChangeValGlobal / totalValuationGlobal) * 100 : 0;

  // Chaves gerais ativas conforme a aba selecionada
  const activeHoldings = activePortfolio === 'US' 
    ? holdingsUs 
    : activePortfolio === 'BR' 
      ? holdingsBr 
      : holdingsGlobal;

  // Ordenação de holdings ativos
  const sortedHoldings = React.useMemo(() => {
    if (!sortField) return activeHoldings;
    
    return [...activeHoldings].sort((a, b) => {
      let aVal, bVal;
      
      if (sortField === 'ticker') {
        aVal = a.ticker;
        bVal = b.ticker;
      } else if (sortField === 'name') {
        aVal = a.name || '';
        bVal = b.name || '';
      } else if (sortField === 'qty') {
        aVal = a.qty;
        bVal = b.qty;
      } else if (sortField === 'avgPrice') {
        aVal = a.avgPrice;
        bVal = b.avgPrice;
      } else if (sortField === 'investedCost') {
        aVal = activePortfolio === 'GLOBAL' ? a.investedCostGlobal : a.investedCost;
        bVal = activePortfolio === 'GLOBAL' ? b.investedCostGlobal : b.investedCost;
      } else if (sortField === 'currentPrice') {
        aVal = a.currentPrice;
        bVal = b.currentPrice;
      } else if (sortField === 'currentValuation' || sortField === 'share') {
        aVal = activePortfolio === 'GLOBAL' ? a.currentValuationGlobal : a.currentValuation;
        bVal = activePortfolio === 'GLOBAL' ? b.currentValuationGlobal : b.currentValuation;
      } else if (sortField === 'profitLossPct') {
        aVal = a.profitLossPct;
        bVal = b.profitLossPct;
      } else if (sortField === 'country') {
        aVal = a.country || '';
        bVal = b.country || '';
      } else if (sortField === 'updatedAt') {
        aVal = a.updatedAt || '';
        bVal = b.updatedAt || '';
      } else {
        return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' 
          ? aVal - bVal 
          : bVal - aVal;
      }
    });
  }, [activeHoldings, sortField, sortDirection, activePortfolio]);

  const totalInvested = activePortfolio === 'US' 
    ? totalInvestedUs 
    : activePortfolio === 'BR' 
      ? totalInvestedBr 
      : totalInvestedGlobal;

  const totalValuation = activePortfolio === 'US' 
    ? totalValuationUs 
    : activePortfolio === 'BR' 
      ? totalValuationBr 
      : totalValuationGlobal;

  const totalProfitLoss = activePortfolio === 'US' 
    ? totalProfitLossUs 
    : activePortfolio === 'BR' 
      ? totalProfitLossBr 
      : totalProfitLossGlobal;

  const totalProfitLossPct = activePortfolio === 'US' 
    ? totalProfitLossPctUs 
    : activePortfolio === 'BR' 
      ? totalProfitLossPctBr 
      : totalProfitLossPctGlobal;

  const totalDailyChangeVal = activePortfolio === 'US' 
    ? totalDailyChangeValUs 
    : activePortfolio === 'BR' 
      ? totalDailyChangeValBr 
      : totalDailyChangeValGlobal;

  const totalDailyChangePct = activePortfolio === 'US' 
    ? (totalValuationUs > 0 ? (totalDailyChangeValUs / totalValuationUs) * 100 : 0)
    : activePortfolio === 'BR' 
      ? (totalValuationBr > 0 ? (totalDailyChangeValBr / totalValuationBr) * 100 : 0)
      : totalDailyChangePctGlobal;

  // Concentração setorial
  const sectorCounts = {};
  activeHoldings.forEach(h => {
    const val = activePortfolio === 'GLOBAL' ? h.currentValuationGlobal : h.currentValuation;
    sectorCounts[h.sector] = (sectorCounts[h.sector] || 0) + val;
  });
  
  const sectors = Object.keys(sectorCounts).map(sec => {
    return {
      name: sec,
      value: sectorCounts[sec],
      pct: totalValuation > 0 ? (sectorCounts[sec] / totalValuation) * 100 : 0
    };
  }).sort((a, b) => b.value - a.value);

  // Alerta de Concentração Setorial
  const techSector = sectors.find(s => s.name === 'Technology');
  const showTechAlert = techSector && techSector.pct > 40;

  // Filtragem de notícias direcionada correlacionada com a carteira real do usuário
  const ALL_NEWS = [
    ...SAMPLE_NEWS.map(n => ({ ...n, country: 'US' })),
    ...BR_NEWS.map(n => ({ ...n, country: 'BR' }))
  ];

  const activeTickers = activePortfolio === 'US'
    ? Object.keys(ledgerUs)
    : activePortfolio === 'BR'
      ? Object.keys(ledgerBr)
      : [...Object.keys(ledgerUs), ...Object.keys(ledgerBr)];

  const filteredNews = ALL_NEWS.filter(n => {
    // Filtro inicial por aba de portfólio
    if (activePortfolio === 'US' && n.country !== 'US') return false;
    if (activePortfolio === 'BR' && n.country !== 'BR') return false;

    // Exibe apenas notícias correlacionadas com ativos que o usuário possui na aba ativa (se houver ativos cadastrados)
    if (activeTickers.length > 0) {
      const hasIntersection = n.tags.some(t => activeTickers.includes(t));
      if (!hasIntersection) return false;
    }

    // Filtros de categoria internos
    if (selectedNewsFilter === 'all') return true;
    if (selectedNewsFilter === 'geopolitics') return ['taiwan', 'iran', 'geopolitics', 'commodities', 'oil'].includes(n.scenario);
    if (selectedNewsFilter === 'macro') return ['rates', 'selic'].includes(n.scenario);
    return n.tags.includes(selectedNewsFilter);
  });

  // Cores dos setores
  const getSectorColor = (sectorName) => {
    const colors = {
      Technology: '#6366f1',     // Indigo
      Financials: '#10b981',     // Emerald
      Healthcare: '#f43f5e',     // Rose
      Industrials: '#f59e0b',    // Amber
      'Consumer Cyclical': '#06b6d4', // Cyan
      Energy: '#ec4899',         // Pink
      'Basic Materials': '#14b8a6' // Teal
    };
    return colors[sectorName] || '#8b5cf6'; // Violet default
  };

  // Identifica moeda do simulador
  const isBrSim = simTicker && (['PETR4', 'VALE3', 'ITUB4', 'WEGE3', 'BBDC4'].includes(simTicker) || simTicker.endsWith('3') || simTicker.endsWith('4'));
  const simCurrency = isBrSim ? 'BRL' : 'USD';
  const simSymbol = simCurrency === 'BRL' ? 'R$' : '$';

  // Executa simulação
  const runSimulation = (e) => {
    if (e) e.preventDefault();
    const qtyVal = parseFloat(simQty);
    const priceVal = parseFloat(simPrice);
    if (!simTicker || isNaN(qtyVal) || qtyVal <= 0 || isNaN(priceVal) || priceVal <= 0) return;

    const currentLedger = isBrSim ? ledgerBr : ledgerUs;
    const currentHolding = currentLedger[simTicker] || { ticker: simTicker, qty: 0, avgPrice: 0 };
    
    let newQty = currentHolding.qty;
    let newAvgPrice = currentHolding.avgPrice;
    
    if (simType === 'buy') {
      const currentCost = currentHolding.qty * currentHolding.avgPrice;
      const additionalCost = qtyVal * priceVal;
      newQty += qtyVal;
      newAvgPrice = newQty > 0 ? (currentCost + additionalCost) / newQty : 0;
    } else {
      newQty = Math.max(0, currentHolding.qty - qtyVal);
    }

    const company = fetchCompanyData(simTicker);
    const simulatedValuation = newQty * company.price;
    const simulatedCost = newQty * newAvgPrice;
    const simulatedReturn = simulatedValuation - simulatedCost;

    setSimulationResult({
      ticker: simTicker,
      oldQty: currentHolding.qty,
      oldAvg: currentHolding.avgPrice,
      newQty: newQty,
      newAvg: newAvgPrice,
      valuation: simulatedValuation,
      totalCost: simulatedCost,
      gainLoss: simulatedReturn,
      gainLossPct: simulatedCost > 0 ? (simulatedReturn / simulatedCost) * 100 : 0,
      currency: simCurrency
    });
  };

  // Aplica simulação na carteira real
  const applySimulation = () => {
    if (!simulationResult) return;
    const { ticker, newQty, newAvg, currency } = simulationResult;
    
    const isBr = currency === 'BRL';
    let updated = isBr ? { ...ledgerBr } : { ...ledgerUs };
    
    if (newQty === 0) {
      delete updated[ticker];
    } else {
      updated[ticker] = {
        ticker: ticker,
        qty: newQty,
        avgPrice: newAvg
      };
    }
    
    if (isBr) {
      setLedgerBr(updated);
    } else {
      setLedgerUs(updated);
    }
    setSimulationResult(null);
    alert(`Simulação aplicada! Sua carteira para ${ticker} foi atualizada.`);
  };

  // Lista de ativos únicos no simulador
  const simOptions = activePortfolio === 'GLOBAL'
    ? [...holdingsUs, ...holdingsBr]
    : activePortfolio === 'US'
      ? holdingsUs
      : holdingsBr;

  // Donut SVG
  const renderDonutChart = () => {
    if (activeHoldings.length === 0) return null;
    
    const valuationKey = activePortfolio === 'GLOBAL' ? 'currentValuationGlobal' : 'currentValuation';
    const sortedHoldings = [...activeHoldings]
      .sort((a,b) => b[valuationKey] - a[valuationKey])
      .slice(0, 5);
      
    const othersVal = activeHoldings
      .sort((a,b) => b[valuationKey] - a[valuationKey])
      .slice(5)
      .reduce((acc, h) => acc + h[valuationKey], 0);

    const chartData = sortedHoldings.map(h => ({
      label: h.ticker,
      value: h[valuationKey],
      color: getSectorColor(h.sector)
    }));

    if (othersVal > 0) {
      chartData.push({
        label: 'Outros',
        value: othersVal,
        color: '#64748b'
      });
    }

    const total = chartData.reduce((acc, d) => acc + d.value, 0);
    let accumulatedAngle = 0;
    const radius = 35;
    const cx = 50;
    const cy = 50;

    return (
      <div style={styles.donutContainer}>
        <div style={{ position: 'relative', width: '130px', height: '130px' }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            {chartData.map((d, i) => {
              const percentage = total > 0 ? (d.value / total) : 0;
              const angle = percentage * 360;
              
              const x1 = cx + radius * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
              const y1 = cy + radius * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
              
              accumulatedAngle += angle;
              
              const x2 = cx + radius * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
              const y2 = cy + radius * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const pathData = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
              ].join(' ');

              return (
                <path 
                  key={d.label}
                  d={pathData}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="11"
                  strokeDasharray="none"
                  style={{
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  title={`${d.label}: ${(percentage * 100).toFixed(1)}%`}
                />
              );
            })}
            <circle cx="50" cy="50" r="28" fill="#0c0e17" />
            <text x="50" y="47" textAnchor="middle" fill="#94a3b8" fontSize="6" fontWeight="bold">TOTAL</text>
            <text x="50" y="58" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
              {hideValues ? '••••' : `${activePortfolio === 'US' ? '$' : activePortfolio === 'BR' ? 'R$' : globalCurrency === 'USD' ? '$' : 'R$'}${(totalValuation / 1000).toFixed(1)}K`}
            </text>
          </svg>
        </div>
        <div style={styles.donutLegend}>
          {chartData.map((d) => (
            <div key={d.label} style={styles.donutLegendItem}>
              <span style={{ ...styles.donutDot, backgroundColor: d.color }}></span>
              <strong style={{ fontSize: '11px', color: '#ffffff' }}>{d.label}</strong>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 'auto' }}>
                {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Encontra a cotação com o timestamp mais recente da base
  const lastGlobalUpdate = React.useMemo(() => {
    let mostRecent = null;
    
    // First, check activeHoldings
    activeHoldings.forEach(h => {
      if (h.updatedAt) {
        const d = new Date(h.updatedAt);
        if (!mostRecent || d > mostRecent) {
          mostRecent = d;
        }
      }
    });
    
    // Then fallback to parsing fsi_prices_cache directly to be extra comprehensive
    try {
      const cacheStr = localStorage.getItem('fsi_prices_cache');
      if (cacheStr) {
        const cache = JSON.parse(cacheStr);
        if (cache) {
          Object.values(cache).forEach(entry => {
            if (entry && typeof entry === 'object' && entry.updatedAt) {
              const d = new Date(entry.updatedAt);
              if (!mostRecent || d > mostRecent) {
                mostRecent = d;
              }
            }
          });
        }
      }
    } catch (e) {
      // Ignored
    }
    
    return mostRecent ? mostRecent.toISOString() : null;
  }, [activeHoldings]);

  return (
    <div style={styles.container} className="animate-fade">
      
      {/* Messages */}
      {successMessage && (
        <div style={{ ...styles.toast, backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981', color: '#6ee7b7' }} className="animate-slide">
          <CheckCircle size={16} /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{ ...styles.toast, backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#ef4444', color: '#fca5a5' }} className="animate-slide">
          <AlertTriangle size={16} /> {errorMessage}
        </div>
      )}

      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h2 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Briefcase color="#10b981" /> Aura Portfolio & Wealth Manager
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: 4 }}>
            Monitore o custo médio, cotação real, rentabilidade acumulada e o impacto macroeconômico das suas posições.
          </p>
        </div>
        
        <div style={styles.headerButtons}>
          <div style={styles.exchangeRateContainer}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>CÂMBIO (USD/BRL):</span>
            <div style={styles.exchangeInputWrapper}>
              <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 'bold' }}>R$</span>
              <input
                type="text"
                value={usdToBrlInput}
                onChange={(e) => handleExchangeRateChange(e.target.value)}
                style={styles.exchangeInput}
                placeholder="5.15"
              />
            </div>
          </div>

          {activePortfolio === 'GLOBAL' && (
            <div style={styles.currencyToggleContainer}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>CONVERSÃO CAMBIAL:</span>
              <div style={styles.toggleGroup}>
                <button 
                  onClick={() => setGlobalCurrency('USD')} 
                  style={{ ...styles.toggleBtn, ...(globalCurrency === 'USD' ? styles.toggleBtnActive : {}) }}
                >
                  🇺🇸 USD ($)
                </button>
                <button 
                  onClick={() => setGlobalCurrency('BRL')} 
                  style={{ ...styles.toggleBtn, ...(globalCurrency === 'BRL' ? styles.toggleBtnActive : {}) }}
                >
                  🇧🇷 BRL (R$)
                </button>
              </div>
            </div>
          )}

          <input 
            type="file" 
            id="portfolio-import-file" 
            style={{ display: 'none' }} 
            accept=".json" 
            onChange={handleImportPortfolios} 
          />

          <button 
            onClick={() => {
              const newVal = !hideValues;
              setHideValues(newVal);
              localStorage.setItem('fsi_hide_values', newVal ? 'true' : 'false');
            }} 
            className="btn btn-secondary" 
            style={{ 
              height: '38px', 
              width: '38px', 
              padding: 0, 
              display: 'flex',
              justifyContent: 'center', 
              alignItems: 'center', 
              background: hideValues ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)', 
              borderColor: hideValues ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease-in-out'
            }}
            title={hideValues ? "Mostrar Valores Absolutos" : "Esconder Valores Absolutos"}
          >
            {hideValues ? <EyeOff size={16} color="#fca5a5" /> : <Eye size={16} color="#e2e8f0" />}
          </button>

          <button 
            onClick={handleExportPortfolios} 
            className="btn btn-secondary" 
            style={{ height: '38px', gap: 6, background: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.2)' }}
            title="Exportar backup completo das carteiras (JSON)"
          >
            <Download size={14} color="#a5b4fc" />
            <span>Exportar</span>
          </button>

          <button 
            onClick={() => document.getElementById('portfolio-import-file').click()} 
            className="btn btn-secondary" 
            style={{ height: '38px', gap: 6, background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
            title="Importar backup das carteiras (JSON)"
          >
            <Upload size={14} color="#6ee7b7" />
            <span>Importar</span>
          </button>

          <button 
            onClick={handleRefreshPrices} 
            className="btn btn-secondary" 
            style={{ height: '38px', gap: 6 }}
            disabled={loadingPrices}
          >
            <RefreshCw size={14} className={loadingPrices ? "spin-animation" : ""} />
            {loadingPrices ? "Buscando Preços..." : "Atualizar Cotações"}
          </button>
        </div>
      </div>

      {/* Portfolio Segmented Tab Switcher */}
      <div style={styles.tabContainer} className="glass-panel">
        <button 
          onClick={() => { setActivePortfolio('US'); setSelectedNewsFilter('all'); }} 
          style={{ 
            ...styles.tabBtn, 
            ...(activePortfolio === 'US' ? styles.tabBtnActiveUS : {}) 
          }}
        >
          🇺🇸 Carteira EUA (USD)
        </button>
        <button 
          onClick={() => { setActivePortfolio('BR'); setSelectedNewsFilter('all'); }} 
          style={{ 
            ...styles.tabBtn, 
            ...(activePortfolio === 'BR' ? styles.tabBtnActiveBR : {}) 
          }}
        >
          🇧🇷 Carteira Brasil (BRL)
        </button>
        <button 
          onClick={() => { setActivePortfolio('GLOBAL'); setSelectedNewsFilter('all'); }} 
          style={{ 
            ...styles.tabBtn, 
            ...(activePortfolio === 'GLOBAL' ? styles.tabBtnActiveGlobal : {}) 
          }}
        >
          🌐 Visão Consolidada (Global)
        </button>
      </div>

      {/* Global Local Database Status Indicator */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderRadius: '8px',
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
          marginBottom: '16px',
          fontSize: '12px',
          color: '#cbd5e1'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: '#10b981', 
            boxShadow: '0 0 8px #10b981',
            display: 'inline-block'
          }}></span>
          <span style={{ fontWeight: '600', color: '#38bdf8' }}>Base de Dados Local:</span>
          <span>SQLite/localStorage Engine Ativa</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Última Sincronização Geral: </span>
          <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>
            {lastGlobalUpdate ? formatDateTime(lastGlobalUpdate) : 'Nenhuma consulta realizada'}
          </strong>
        </div>
      </div>

      {/* GLOBAL Custody Summary Breakdown Cards */}
      {activePortfolio === 'GLOBAL' && (
        <div style={styles.custodySummaryGrid}>
          <div style={{ ...styles.custodyCard, borderLeft: '4px solid #6366f1' }} className="glass-panel">
            <div style={styles.custodyHeader}>
              <h4 style={{ color: '#a5b4fc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                🇺🇸 Custódia EUA (Internacional)
              </h4>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Original em USD</span>
            </div>
            <div style={styles.custodyRow}>
              <span style={styles.custodyLabel}>Patrimônio:</span>
              <strong style={styles.custodyValueUsd}>{formatVal(totalValuationUs, 'USD')}</strong>
            </div>
            <div style={styles.custodyRow}>
              <span style={styles.custodyLabel}>Custo Médio:</span>
              <span style={styles.custodyText}>{formatVal(totalInvestedUs, 'USD')}</span>
            </div>
            <div style={styles.custodyRow}>
              <span style={styles.custodyLabel}>Retorno Histórico:</span>
              <span style={{ color: totalProfitLossUs >= 0 ? '#10b981' : '#f43f5e', fontWeight: 'bold' }}>
                {totalProfitLossUs >= 0 ? '+' : ''}{formatVal(totalProfitLossUs, 'USD')} ({totalProfitLossPctUs.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div style={{ ...styles.custodyCard, borderLeft: '4px solid #10b981' }} className="glass-panel">
            <div style={styles.custodyHeader}>
              <h4 style={{ color: '#6ee7b7', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                🇧🇷 Custódia Brasil (Doméstico)
              </h4>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Original em BRL</span>
            </div>
            <div style={styles.custodyRow}>
              <span style={styles.custodyLabel}>Patrimônio:</span>
              <strong style={styles.custodyValueBrl}>{formatVal(totalValuationBr, 'BRL')}</strong>
            </div>
            <div style={styles.custodyRow}>
              <span style={styles.custodyLabel}>Custo Médio:</span>
              <span style={styles.custodyText}>{formatVal(totalInvestedBr, 'BRL')}</span>
            </div>
            <div style={styles.custodyRow}>
              <span style={styles.custodyLabel}>Retorno Histórico:</span>
              <span style={{ color: totalProfitLossBr >= 0 ? '#10b981' : '#f43f5e', fontWeight: 'bold' }}>
                {totalProfitLossBr >= 0 ? '+' : ''}{formatVal(totalProfitLossBr, 'BRL')} ({totalProfitLossPctBr.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div style={styles.kpiGrid}>
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #6366f1' }} className="glass-panel">
          <div style={styles.kpiMeta}>
            <span style={styles.kpiTitle}>
              {activePortfolio === 'GLOBAL' ? 'Patrimônio Consolidado' : 'Patrimônio da Carteira'}
            </span>
            <span style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Valuation</span>
          </div>
          <span style={styles.kpiValue}>{formatVal(totalValuation)}</span>
          <span style={styles.kpiDesc}>Patrimônio totalizado com base nas cotações de mercado</span>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #94a3b8' }} className="glass-panel">
          <div style={styles.kpiMeta}>
            <span style={styles.kpiTitle}>Custo Total Investido</span>
            <span style={{ color: '#94a3b8', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Invested</span>
          </div>
          <span style={styles.kpiValue}>{formatVal(totalInvested)}</span>
          <span style={styles.kpiDesc}>Capital desembolsado ($\sum Qty \times Preço Médio$)</span>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: `4px solid ${totalProfitLoss >= 0 ? '#10b981' : '#ef4444'}` }} className="glass-panel">
          <div style={styles.kpiMeta}>
            <span style={styles.kpiTitle}>Rentabilidade Total</span>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              color: totalProfitLoss >= 0 ? '#10b981' : '#ef4444',
              backgroundColor: totalProfitLoss >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {totalProfitLoss >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {totalProfitLossPct.toFixed(2)}%
            </div>
          </div>
          <span style={{ ...styles.kpiValue, color: totalProfitLoss >= 0 ? '#6ee7b7' : '#fca5a5' }}>
            {totalProfitLoss >= 0 ? '+' : ''}{formatVal(totalProfitLoss)}
          </span>
          <span style={styles.kpiDesc}>Retorno histórico sobre o custo de aquisição acumulado</span>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: `4px solid ${totalDailyChangeVal >= 0 ? '#10b981' : '#ef4444'}` }} className="glass-panel">
          <div style={styles.kpiMeta}>
            <span style={styles.kpiTitle}>Resultado Diário (Estimado)</span>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              color: totalDailyChangeVal >= 0 ? '#10b981' : '#ef4444',
              backgroundColor: totalDailyChangeVal >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {totalDailyChangePct >= 0 ? '+' : ''}{totalDailyChangePct.toFixed(2)}%
            </div>
          </div>
          <span style={{ ...styles.kpiValue, color: totalDailyChangeVal >= 0 ? '#6ee7b7' : '#fca5a5' }}>
            {totalDailyChangeVal >= 0 ? '+' : ''}{formatVal(totalDailyChangeVal)}
          </span>
          <span style={styles.kpiDesc}>Ganho ou perda estimado na sessão de hoje</span>
        </div>
      </div>

      {/* Main Workspace Layout Split */}
      <div style={styles.layoutSplit}>
        
        {/* Left Side: Ledger Spreadsheet & Form */}
        <div style={styles.leftSection} className="glass-panel">
          
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={{ fontSize: '15px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                📋 Cadastro de Ativos e Lançamentos (Custódia)
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                {activePortfolio === 'GLOBAL' 
                  ? "Visualização consolidada de todos os seus ativos domésticos e internacionais."
                  : "Dê um duplo clique nos valores de Quantidade ou Preço Médio para editá-los diretamente na planilha."}
              </p>
            </div>
            
            {activePortfolio !== 'GLOBAL' && (
              <button onClick={handleClearLedger} className="btn btn-secondary" style={{ ...styles.smallBtn, color: '#fda4af' }}>
                Limpar Carteira
              </button>
            )}
          </div>

          {/* Holdings Ledger Table */}
          <div className="spreadsheet-container" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden', marginTop: 12 }}>
            <table className="spreadsheet-table">
              <thead>
                <tr>
                  <th className="spreadsheet-th" style={{ width: '35px' }}></th>
                  {activePortfolio === 'GLOBAL' && (
                    <th 
                      className="spreadsheet-th" 
                      style={{ width: '70px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('country')}
                    >
                      Carteira{renderSortIndicator('country')}
                    </th>
                  )}
                  <th 
                    className="spreadsheet-th" 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('ticker')}
                  >
                    Ticker{renderSortIndicator('ticker')}
                  </th>
                  <th 
                    className="spreadsheet-th" 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('name')}
                  >
                    Empresa{renderSortIndicator('name')}
                  </th>
                  <th 
                    className="spreadsheet-th" 
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                    onClick={() => handleSort('qty')}
                  >
                    Qtde.{renderSortIndicator('qty')}
                  </th>
                  <th 
                    className="spreadsheet-th" 
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                    onClick={() => handleSort('avgPrice')}
                  >
                    Custo Médio{renderSortIndicator('avgPrice')}
                  </th>
                  <th 
                    className="spreadsheet-th" 
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                    onClick={() => handleSort('investedCost')}
                  >
                    Custo Total{renderSortIndicator('investedCost')}
                  </th>
                  <th 
                    className="spreadsheet-th" 
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                    onClick={() => handleSort('currentPrice')}
                  >
                    Preço Mercado{renderSortIndicator('currentPrice')}
                  </th>
                  <th 
                    className="spreadsheet-th" 
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                    onClick={() => handleSort('currentValuation')}
                  >
                    {activePortfolio === 'GLOBAL' ? `Valuation (${globalCurrency})` : 'Valor de Mercado'}{renderSortIndicator('currentValuation')}
                  </th>
                  <th 
                    className="spreadsheet-th" 
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right', width: '75px' }}
                    onClick={() => handleSort('share')}
                  >
                    Part. (%){renderSortIndicator('share')}
                  </th>
                  <th 
                    className="spreadsheet-th" 
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                    onClick={() => handleSort('profitLossPct')}
                  >
                    Retorno{renderSortIndicator('profitLossPct')}
                  </th>

                  {activePortfolio !== 'GLOBAL' && <th className="spreadsheet-th" style={{ width: '80px', textAlign: 'center' }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                      Nenhum ativo cadastrado. Utilize as abas de portfólio para adicionar ações!
                    </td>
                  </tr>
                ) : (
                  sortedHoldings.map((h, idx) => {
                    const isEditing = editingKey === h.ticker;
                    const isProfit = h.profitLoss >= 0;
                    
                    return (
                      <tr key={h.ticker} style={styles.trHover}>
                        <td className="spreadsheet-row-header">{idx + 1}</td>
                        
                        {/* GLOBAL country badge */}
                        {activePortfolio === 'GLOBAL' && (
                          <td className="spreadsheet-td" style={{ textAlign: 'center' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '10px', 
                              fontSize: '9px', 
                              fontWeight: 'bold',
                              color: h.country === 'US' ? '#a5b4fc' : '#6ee7b7',
                              background: h.country === 'US' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                              border: `1px solid ${h.country === 'US' ? 'rgba(99,102,241,0.25)' : 'rgba(16,185,129,0.25)'}`
                            }}>
                              {h.country === 'US' ? '🇺🇸 EUA' : '🇧🇷 Brasil'}
                            </span>
                          </td>
                        )}

                        <td className="spreadsheet-td" style={{ fontWeight: '800', color: '#ffffff', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            {/* Farol de status da cotação */}
                            {tickerStatus[h.ticker] !== undefined ? (
                              <span 
                                title={tickerStatus[h.ticker] === 'ok' ? 'Cotação atualizada via API' : 'Não atualizado — usando cache'}
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  flexShrink: 0,
                                  display: 'inline-block',
                                  backgroundColor: tickerStatus[h.ticker] === 'ok' ? '#10b981' : '#ef4444',
                                  boxShadow: tickerStatus[h.ticker] === 'ok' 
                                    ? '0 0 6px rgba(16,185,129,0.8)' 
                                    : '0 0 6px rgba(239,68,68,0.8)'
                                }}
                              />
                            ) : (
                              <span 
                                title="Aguardando atualização"
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  flexShrink: 0,
                                  display: 'inline-block',
                                  backgroundColor: '#475569'
                                }}
                              />
                            )}
                            {h.ticker}
                          </div>
                        </td>
                        <td className="spreadsheet-td" style={{ fontSize: '11px', color: '#cbd5e1', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {h.name}
                        </td>
                        
                        {/* Quantidade Cell */}
                        <td 
                          className="spreadsheet-td" 
                          style={{ 
                            textAlign: 'right', 
                            cursor: activePortfolio === 'GLOBAL' ? 'default' : 'pointer', 
                            backgroundColor: isEditing ? 'rgba(99, 102, 241, 0.1)' : 'transparent' 
                          }}
                          onDoubleClick={() => activePortfolio !== 'GLOBAL' && startEditing(h.ticker, h)}
                        >
                          {isEditing ? (
                            <input 
                              type="number"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              style={styles.inlineInput}
                              autoFocus
                            />
                          ) : (
                            hideValues ? '••••' : h.qty.toLocaleString()
                          )}
                        </td>

                        {/* Preço de Custo Médio Cell */}
                        <td 
                          className="spreadsheet-td" 
                          style={{ 
                            textAlign: 'right', 
                            cursor: activePortfolio === 'GLOBAL' ? 'default' : 'pointer', 
                            color: '#38bdf8', 
                            backgroundColor: isEditing ? 'rgba(99, 102, 241, 0.1)' : 'transparent' 
                          }}
                          onDoubleClick={() => activePortfolio !== 'GLOBAL' && startEditing(h.ticker, h)}
                        >
                          {isEditing ? (
                            <input 
                              type="number"
                              value={editAvgPrice}
                              onChange={(e) => setEditAvgPrice(e.target.value)}
                              style={styles.inlineInput}
                            />
                          ) : (
                            formatVal(h.avgPrice, h.currency)
                          )}
                        </td>

                        {/* Custo Total */}
                        <td className="spreadsheet-td" style={{ textAlign: 'right' }}>
                          {activePortfolio === 'GLOBAL' 
                            ? formatVal(h.investedCostGlobal, globalCurrency)
                            : formatVal(h.investedCost, h.currency)}
                        </td>

                        {/* Preço de Mercado Atual */}
                        <td className="spreadsheet-td" style={{ textAlign: 'right', fontWeight: '500', color: '#e2e8f0' }}>
                          {formatVal(h.currentPrice, h.currency)}
                        </td>

                        {/* Valor de Mercado Atual (Valuation) */}
                        <td className="spreadsheet-td" style={{ textAlign: 'right', fontWeight: 'bold', color: '#ffffff' }}>
                          {activePortfolio === 'GLOBAL' 
                            ? formatVal(h.currentValuationGlobal, globalCurrency)
                            : formatVal(h.currentValuation, h.currency)}
                        </td>

                        {/* Part. (%) */}
                        <td className="spreadsheet-td" style={{ textAlign: 'right', fontWeight: '500', color: '#38bdf8', fontSize: '12px' }}>
                          {(() => {
                            const hVal = activePortfolio === 'GLOBAL' ? h.currentValuationGlobal : h.currentValuation;
                            const share = totalValuation > 0 ? (hVal / totalValuation) * 100 : 0;
                            return `${share.toFixed(1)}%`;
                          })()}
                        </td>

                        {/* Retorno individual */}
                        <td className="spreadsheet-td" style={{ textAlign: 'right' }}>
                          <span style={{ color: isProfit ? '#10b981' : '#f43f5e', fontSize: '12px', fontWeight: '600' }}>
                            {isProfit ? '+' : ''}{h.profitLossPct.toFixed(1)}%
                          </span>
                          <div style={{ fontSize: '10px', color: isProfit ? '#6ee7b7' : '#fda4af', marginTop: 1 }}>
                            {isProfit ? '+' : ''}
                            {activePortfolio === 'GLOBAL'
                              ? formatVal(h.profitLossGlobal, globalCurrency)
                              : formatVal(h.profitLoss, h.currency)}
                          </div>
                        </td>



                        {/* Ações */}
                        {activePortfolio !== 'GLOBAL' && (
                          <td className="spreadsheet-td" style={{ textAlign: 'center' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                <button onClick={() => saveEditing(h.ticker)} style={{ ...styles.iconBtn, color: '#10b981' }} title="Salvar">
                                  <Save size={13} />
                                </button>
                                <button onClick={() => setEditingKey(null)} style={{ ...styles.iconBtn, color: '#ef4444' }} title="Cancelar">
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                <button onClick={() => startEditing(h.ticker, h)} style={{ ...styles.iconBtn, color: '#94a3b8' }} title="Editar">
                                  <Edit3 size={13} />
                                </button>
                                <button onClick={() => handleRemoveHolding(h.ticker)} style={{ ...styles.iconBtn, color: '#ef4444' }} title="Remover">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Add Asset Form */}
          {activePortfolio !== 'GLOBAL' ? (
            <form onSubmit={handleAddHolding} style={styles.addForm}>
              <h4 style={{ fontSize: '12px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', gridColumn: 'span 4' }}>
                ➕ Adicionar Novo Ativo à Carteira {activePortfolio === 'US' ? 'EUA (USD)' : 'Brasil (BRL)'}
              </h4>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ticker</label>
                <input 
                  type="text" 
                  placeholder={activePortfolio === 'US' ? "Ex: AAPL" : "Ex: PETR4"}
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Quantidade</label>
                <input 
                  type="number" 
                  placeholder="Ex: 100"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Preço Médio ({activePortfolio === 'US' ? 'USD' : 'BRL'})
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder={activePortfolio === 'US' ? "Ex: 175.50" : "Ex: 34.00"}
                  value={avgPriceInput}
                  onChange={(e) => setAvgPriceInput(e.target.value)}
                  style={styles.input}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={styles.formBtn}>
                <Plus size={15} /> Adicionar
              </button>
            </form>
          ) : (
            <div style={styles.globalNoticeCard} className="glass-panel">
              <Globe size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                <strong>Gestão Multi-Custódia Ativa:</strong> Para adicionar novos ativos, gerenciar quantidades ou ajustar o preço de custo médio, acesse as abas individuais <strong>🇺🇸 Carteira EUA</strong> ou <strong>🇧🇷 Carteira Brasil</strong> no topo.
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Charts & Diagnostics */}
        <div style={styles.rightSection} className="glass-panel">
          
          <h3 style={{ fontSize: '15px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <PieChart color="#6366f1" size={16} /> Asset Allocation & Analytics
          </h3>
          
          {renderDonutChart()}

          {/* Sector distribution bar charts */}
          <div style={styles.sectorBarWrapper}>
            <h4 style={{ fontSize: '12px', color: '#94a3b8', marginBottom: 12 }}>Distribuição Setorial da Carteira</h4>
            <div style={styles.sectorProgressContainer}>
              {sectors.length === 0 ? (
                <span style={{ fontSize: '11px', color: '#64748b' }}>Cadastre ativos para gerar a análise setorial.</span>
              ) : (
                sectors.map(s => {
                  const color = getSectorColor(s.name);
                  let ptName = s.name;
                  if (s.name === 'Technology') ptName = 'Tecnologia';
                  else if (s.name === 'Financials') ptName = 'Finanças';
                  else if (s.name === 'Healthcare') ptName = 'Saúde';
                  else if (s.name === 'Industrials') ptName = 'Indústria';
                  else if (s.name === 'Consumer Cyclical') ptName = 'Consumo Cíclico';
                  else if (s.name === 'Energy') ptName = 'Energia';
                  else if (s.name === 'Basic Materials') ptName = 'Materiais Básicos';
                  
                  return (
                    <div key={s.name} style={styles.sectorRow}>
                      <div style={styles.sectorMeta}>
                        <span style={styles.sectorLabelName}>{ptName}</span>
                        <span style={{ fontSize: '11px', color: color, fontWeight: 'bold' }}>{s.pct.toFixed(0)}%</span>
                      </div>
                      <div style={styles.progressBarBg}>
                        <div style={{ ...styles.progressBarFill, width: `${s.pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}50` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Concentration Warnings */}
          {showTechAlert && (
            <div style={styles.alertCard}>
              <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: '12px', color: '#fbbf24', display: 'block' }}>Alerta de Concentração Setorial!</strong>
                <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: 4, lineHeight: '1.4' }}>
                  Sua carteira possui <strong>{techSector.pct.toFixed(1)}%</strong> alocada no setor de Tecnologia. Sugerimos hedge estrutural em ativos resilientes de transição energética (<strong>GEV</strong>) ou posições domésticas defensivas de mineração/utilidades.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Interactive Rebalancing Simulator */}
      <div style={styles.simulatorPanel} className="glass-panel">
        <h3 style={{ fontSize: '15px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Activity color="#a5b4fc" size={16} /> Rebalancing & Purchase Simulator (Simulador de Lançamentos)
        </h3>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: 16 }}>
          Simule o impacto de novas compras ou vendas sobre o seu custo médio e valuation consolidado antes de efetivá-los em carteira.
        </p>

        <div style={styles.simFlex}>
          <form onSubmit={runSimulation} style={styles.simForm}>
            <div style={styles.simGroup}>
              <label style={styles.label}>Ticker</label>
              <select 
                value={simTicker} 
                onChange={(e) => setSimTicker(e.target.value)} 
                style={styles.simSelect}
              >
                {simOptions.length > 0 ? (
                  simOptions.map(h => <option key={h.ticker} value={h.ticker}>{h.ticker} - {h.name}</option>)
                ) : (
                  [...Object.keys(DEFAULT_PORTFOLIO_LEDGER), ...Object.keys(DEFAULT_BR_PORTFOLIO_LEDGER)].map(t => <option key={t} value={t}>{t}</option>)
                )}
              </select>
            </div>
            
            <div style={styles.simGroup}>
              <label style={styles.label}>Operação</label>
              <div style={styles.radioGroup}>
                <button 
                  type="button" 
                  onClick={() => setSimType('buy')}
                  style={{ ...styles.radioBtn, ...(simType === 'buy' ? styles.radioBtnActiveBuy : {}) }}
                >
                  COMPRAR
                </button>
                <button 
                  type="button" 
                  onClick={() => setSimType('sell')}
                  style={{ ...styles.radioBtn, ...(simType === 'sell' ? styles.radioBtnActiveSell : {}) }}
                >
                  VENDER
                </button>
              </div>
            </div>

            <div style={styles.simGroup}>
              <label style={styles.label}>Quantidade</label>
              <input 
                type="number" 
                value={simQty}
                onChange={(e) => setSimQty(e.target.value)}
                style={styles.simInput}
              />
            </div>

            <div style={styles.simGroup}>
              <label style={styles.label}>Preço da Operação ({simSymbol})</label>
              <input 
                type="number" 
                step="0.01"
                value={simPrice}
                onChange={(e) => setSimPrice(e.target.value)}
                style={styles.simInput}
              />
            </div>

            <button type="submit" className="btn btn-accent" style={{ height: '36px', marginTop: 'auto', gridColumn: 'span 4' }}>
              Simular Impacto
            </button>
          </form>

          {/* Results Side */}
          <div style={styles.simResultArea}>
            {simulationResult ? (
              <div style={styles.simResultCard} className="animate-fade">
                <h4 style={{ fontSize: '12px', color: '#fbbf24', textTransform: 'uppercase', marginBottom: 12 }}>
                  Resultados da Simulação Projetada
                </h4>
                
                <div style={styles.simMetricsGrid}>
                  <div style={styles.simMetricItem}>
                    <span style={styles.simMetricLabel}>Quantidade Anterior</span>
                    <span style={styles.simMetricValue}>{hideValues ? '••••' : simulationResult.oldQty}</span>
                  </div>
                  <div style={styles.simMetricItem}>
                    <span style={styles.simMetricLabel}>Nova Quantidade</span>
                    <span style={styles.simMetricValue}>{hideValues ? '••••' : simulationResult.newQty}</span>
                  </div>
                  <div style={styles.simMetricItem}>
                    <span style={styles.simMetricLabel}>Custo Médio Anterior</span>
                    <span style={styles.simMetricValue}>
                      {formatVal(simulationResult.oldAvg, simulationResult.currency)}
                    </span>
                  </div>
                  <div style={styles.simMetricItem}>
                    <span style={{ ...styles.simMetricLabel, color: '#38bdf8' }}>Novo Custo Médio</span>
                    <span style={{ ...styles.simMetricValue, color: '#38bdf8' }}>
                      {formatVal(simulationResult.newAvg, simulationResult.currency)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                  <button onClick={applySimulation} className="btn btn-primary" style={{ ...styles.smallBtn, flex: 1 }}>
                    Aplicar na Carteira Real
                  </button>
                  <button onClick={() => setSimulationResult(null)} className="btn btn-secondary" style={styles.smallBtn}>
                    Descartar
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.simEmpty}>
                <Info size={22} color="#64748b" style={{ marginBottom: 6 }} />
                <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                  Insira uma quantidade e preço de operação ao lado e clique em Simular.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Correlated News & Geopolitical Impact Aggregator Feed */}
      <div style={styles.newsPanel} className="glass-panel">
        
        <div style={{ ...styles.newsPanelHeader, flexDirection: 'column', alignItems: 'stretch', gap: 15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '15px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <Newspaper color="#fbbf24" size={16} /> Correlated Geopolitical News & Impact Engine
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2, margin: 0 }}>
                Comunicados e relatórios macroeconômicos cruzados com sensibilidade aos ativos e setores da sua carteira.
              </p>
            </div>
            
            <button 
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: '6px',
                background: geminiApiKey ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid',
                borderColor: geminiApiKey ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                color: geminiApiKey ? '#10b981' : '#94a3b8',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                outline: 'none',
              }}
            >
              <Cpu size={14} color={geminiApiKey ? '#10b981' : '#94a3b8'} />
              {geminiApiKey ? 'Gemini AI Ativo' : 'Configurar Gemini'}
            </button>
          </div>

          {/* Filtering row */}
          <div style={styles.filterRow}>
            <button 
              onClick={() => setSelectedNewsFilter('all')} 
              style={{ ...styles.filterTab, ...(selectedNewsFilter === 'all' ? styles.filterTabActive : {}) }}
            >
              Tudo
            </button>
            <button 
              onClick={() => setSelectedNewsFilter('geopolitics')} 
              style={{ ...styles.filterTab, ...(selectedNewsFilter === 'geopolitics' ? styles.filterTabActive : {}) }}
            >
              💥 Estresse Geopolítico & Commodities
            </button>
            <button 
              onClick={() => setSelectedNewsFilter('macro')} 
              style={{ ...styles.filterTab, ...(selectedNewsFilter === 'macro' ? styles.filterTabActive : {}) }}
            >
              🏦 Juros & Bancos Centrais
            </button>
            <select 
              value={selectedNewsFilter.startsWith('all') || ['geopolitics', 'macro'].includes(selectedNewsFilter) ? 'all' : selectedNewsFilter} 
              onChange={(e) => setSelectedNewsFilter(e.target.value)} 
              style={styles.newsSelectFilter}
            >
              <option value="all">Filtrar por Ação...</option>
              {activeHoldings.map(h => <option key={h.ticker} value={h.ticker}>{h.ticker}</option>)}
            </select>
          </div>
        </div>

        {/* Gemini API Key Configuration Panel */}
        {showKeyConfig && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: 20,
          }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
              <Key size={12} /> Gemini API Key:
            </span>
            <input 
              type="password"
              value={geminiApiKey}
              onChange={(e) => {
                setGeminiApiKey(e.target.value);
                localStorage.setItem('fsi_gemini_api_key', e.target.value);
              }}
              placeholder="Insira sua chave AI do Gemini..."
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                padding: '6px 10px',
                color: '#ffffff',
                fontSize: '11px',
                outline: 'none',
              }}
            />
            <button 
              onClick={() => {
                setGeminiApiKey('');
                localStorage.removeItem('fsi_gemini_api_key');
                setAiReport(null);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                color: '#f43f5e',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Limpar
            </button>
          </div>
        )}

        {/* Geopolitical Stress Simulator Panel */}
        {geminiApiKey && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.04) 0%, rgba(251, 191, 36, 0) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.1)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ fontSize: '13px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <Sparkles size={14} color="#fbbf24" /> Simulador de Estresse Geopolítico & Macro AI
              </h4>
              {aiReport && (
                <button 
                  onClick={() => {
                    setAiReport(null);
                    setCustomScenario('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Resetar Simulação
                </button>
              )}
            </div>

            {!aiReport ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                  Digite qualquer acontecimento geopolítico, elevação de impostos, conflitos ou choques macroeconômicos. A inteligência do Gemini cruzará as exposições operacionais imediatas e projetará os impactos diretos em cada holding do seu portfólio de <strong>{activePortfolio === 'GLOBAL' ? 'BRL + USD' : activePortfolio}</strong> ativo.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <textarea 
                    value={customScenario}
                    onChange={(e) => setCustomScenario(e.target.value)}
                    placeholder="Ex: Escalada súbita no Mar da China gera embargo total nas exportações de terras raras e eleva taxas alfandegárias de semicondutores em 40%..."
                    style={{
                      flex: 1,
                      minHeight: '60px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(251, 191, 36, 0.15)',
                      borderRadius: '6px',
                      padding: '10px',
                      color: '#ffffff',
                      fontSize: '12px',
                      lineHeight: '1.4',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                {newsSimError && (
                  <span style={{ fontSize: '11px', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ⚠️ {newsSimError}
                  </span>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => analyzeScenarioWithGemini(customScenario)}
                    disabled={isSimulatingNews || !customScenario.trim()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: '6px',
                      background: isSimulatingNews 
                        ? 'rgba(251, 191, 36, 0.2)' 
                        : 'linear-gradient(90deg, #fbbf24 0%, #d97706 100%)',
                      border: 'none',
                      color: '#000000',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      cursor: isSimulatingNews || !customScenario.trim() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.15)',
                    }}
                  >
                    {isSimulatingNews ? (
                      <>
                        <div className="spinner" style={{
                          width: 12,
                          height: 12,
                          border: '2px solid #000000',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                          marginRight: 4
                        }} />
                        Analisando com Gemini...
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} /> Executar Análise Cognitiva AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Dynamic AI Simulation Report Display */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(251, 191, 36, 0.05)',
                  borderLeft: '4px solid #fbbf24',
                }}>
                  <strong style={{ fontSize: '11px', color: '#fbbf24', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Cenário Simulado:</strong>
                  <span style={{ fontSize: '12px', color: '#e2e8f0', fontStyle: 'italic' }}>"{customScenario}"</span>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}>
                  <strong style={{ fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Cpu size={12} /> Diagnóstico Macroeconômico AI:
                  </strong>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                    {aiReport.summary}
                  </p>
                </div>

                <div>
                  <strong style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Análise por Ativo da Carteira ({activePortfolio}):
                  </strong>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {aiReport.tickers?.map(item => {
                      const h = activeHoldings.find(ah => ah.ticker === item.ticker);
                      const shares = h ? `${h.qty} ações` : '';
                      
                      let color = '#94a3b8';
                      let label = 'Neutro';
                      let bgColor = 'rgba(255, 255, 255, 0.05)';
                      
                      if (item.impact === 'critical') {
                        color = '#f43f5e';
                        label = 'Risco Crítico';
                        bgColor = 'rgba(244, 63, 94, 0.1)';
                      } else if (item.impact === 'high-risk') {
                        color = '#fbbf24';
                        label = 'Aviso Risco';
                        bgColor = 'rgba(251, 191, 36, 0.1)';
                      } else if (item.impact === 'positive') {
                        color = '#10b981';
                        label = 'Ganho Est.';
                        bgColor = 'rgba(16, 185, 129, 0.1)';
                      } else if (item.impact === 'hedge') {
                        color = '#6366f1';
                        label = 'Porto Seguro';
                        bgColor = 'rgba(99, 102, 241, 0.1)';
                      }

                      return (
                        <div 
                          key={item.ticker}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            padding: '10px 12px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid rgba(255,255,255,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <strong style={{ fontSize: '12px', color: '#ffffff', minWidth: '55px' }}>{item.ticker}</strong>
                            {shares && <span style={{ fontSize: '10px', color: '#64748b', minWidth: '80px' }}>{shares}</span>}
                            <span style={{ fontSize: '11px', color: '#cbd5e1' }}>{item.reason}</span>
                          </div>
                          
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: bgColor,
                            border: '1px solid',
                            borderColor: `${color}30`,
                            color: color,
                            fontSize: '10px',
                            fontWeight: '600',
                          }}>
                            {label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* News Feed Grid */}
        <div style={styles.newsGrid}>
          {filteredNews.length === 0 ? (
            <div style={{ textAlign: 'center', gridColumn: 'span 3', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>
              Nenhuma notícia correlacionada para os filtros aplicados neste portfólio.
            </div>
          ) : (
            filteredNews.map(news => {
              return (
                <div key={news.id} style={styles.newsCard}>
                  <div style={styles.newsCardMeta}>
                    <span style={styles.newsSource}>{news.source}</span>
                    <span style={styles.newsDotSeparator}>•</span>
                    <span style={styles.newsTime}>{news.time}</span>
                    <span style={styles.newsDotSeparator}>•</span>
                    <span style={{ 
                      color: news.country === 'US' ? '#a5b4fc' : '#6ee7b7',
                      fontWeight: 'bold'
                    }}>
                      {news.country === 'US' ? 'EUA' : 'BRASIL'}
                    </span>
                  </div>
                  
                  <h4 style={styles.newsCardTitle}>{news.title}</h4>
                  <p style={styles.newsCardText}>{news.summary}</p>
                  
                  {/* Visual Impact mapping for holdings */}
                  <div style={styles.newsImpactArea}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Ativos Relacionados:</span>
                    <div style={styles.impactPills}>
                      {news.tags.map(ticker => {
                        // Exibe a pílula de impacto apenas se o ativo estiver na carteira ativa do usuário
                        if (activeTickers.length > 0 && !activeTickers.includes(ticker)) return null;

                        const impact = news.impacts[ticker] || 'neutral';
                        let color = '#94a3b8';
                        let label = 'Neutro';
                        let bgColor = 'rgba(255,255,255,0.05)';
                        
                        if (impact === 'critical') {
                          color = '#f43f5e';
                          label = 'Risco Crítico';
                          bgColor = 'rgba(244,63,94,0.1)';
                        } else if (impact === 'high-risk') {
                          color = '#fbbf24';
                          label = 'Aviso Risco';
                          bgColor = 'rgba(251,191,36,0.1)';
                        } else if (impact === 'positive') {
                          color = '#10b981';
                          label = 'Ganho Est.';
                          bgColor = 'rgba(16,185,129,0.1)';
                        } else if (impact === 'hedge') {
                          color = '#6366f1';
                          label = 'Porto Seguro';
                          bgColor = 'rgba(99,102,241,0.1)';
                        }

                        return (
                          <div key={ticker} style={{ ...styles.impactPill, backgroundColor: bgColor, borderColor: `${color}30` }}>
                            <strong style={{ color: '#ffffff', fontSize: '10px' }}>{ticker}</strong>
                            <span style={{ color: color, fontSize: '9px', fontWeight: '500' }}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })
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
    paddingBottom: '40px',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 18px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: '500',
    position: 'fixed',
    top: '20px',
    right: '30px',
    zIndex: 1000,
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    padding: '16px 20px',
    borderRadius: '12px',
  },
  headerButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  tabContainer: {
    display: 'flex',
    gap: 8,
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    padding: '6px',
    borderRadius: '30px',
    width: 'fit-content',
    alignSelf: 'center',
    marginBottom: '10px',
  },
  tabBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: '600',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  tabBtnActiveUS: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#ffffff',
    boxShadow: '0 0 12px rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
  },
  tabBtnActiveBR: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#ffffff',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  tabBtnActiveGlobal: {
    background: 'rgba(251, 191, 36, 0.15)',
    color: '#ffffff',
    boxShadow: '0 0 12px rgba(251, 191, 36, 0.15)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
  },
  currencyToggleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    padding: '6px 12px',
    borderRadius: '20px',
  },
  exchangeRateContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    padding: '6px 12px',
    borderRadius: '20px',
  },
  exchangeInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '15px',
    padding: '2px 8px',
  },
  exchangeInput: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    width: '45px',
    textAlign: 'center',
    outline: 'none',
  },
  toggleGroup: {
    display: 'flex',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '15px',
    padding: '2px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  toggleBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '4px 12px',
    borderRadius: '12px',
    transition: 'all 0.2s',
  },
  toggleBtnActive: {
    background: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
  },
  custodySummaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: '10px',
  },
  custodyCard: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  custodyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '8px',
  },
  custodyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  custodyLabel: {
    color: '#94a3b8',
  },
  custodyText: {
    color: '#ffffff',
    fontFamily: 'var(--font-mono)',
  },
  custodyValueUsd: {
    color: '#a5b4fc',
    fontFamily: 'var(--font-mono)',
  },
  custodyValueBrl: {
    color: '#6ee7b7',
    fontFamily: 'var(--font-mono)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  kpiCard: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  kpiMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiTitle: {
    fontSize: '11px',
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.05em',
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-mono)',
  },
  kpiDesc: {
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  layoutSplit: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 20,
  },
  leftSection: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  smallBtn: {
    padding: '4px 10px',
    fontSize: '11px',
    height: 'auto',
  },
  trHover: {
    transition: 'background-color 0.2s',
  },
  inlineInput: {
    width: '100%',
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid #6366f1',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '12px',
    textAlign: 'right',
    padding: '2px 6px',
    outline: 'none',
    fontFamily: 'var(--font-mono)',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'inline-flex',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  addForm: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 120px',
    gap: 12,
    marginTop: 20,
    background: 'rgba(0,0,0,0.15)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.03)',
  },
  globalNoticeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px',
    background: 'rgba(251,191,36,0.05)',
    borderLeft: '4px solid #fbbf24',
    borderRadius: '0 8px 8px 0',
    marginTop: 20,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  input: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '6px',
    color: '#ffffff',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  },
  formBtn: {
    height: '38px',
    alignSelf: 'end',
    fontSize: '12px',
  },
  rightSection: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  donutContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: 'rgba(0,0,0,0.2)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.02)',
  },
  donutLegend: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  donutLegendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  donutDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
  },
  sectorBarWrapper: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.02)',
    borderRadius: '8px',
    padding: '16px',
  },
  sectorProgressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sectorRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sectorMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
  },
  sectorLabelName: {
    fontWeight: '500',
    color: '#cbd5e1',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  alertCard: {
    padding: '12px 14px',
    background: 'rgba(251,191,36,0.05)',
    borderLeft: '4px solid #fbbf24',
    borderRadius: '0 8px 8px 0',
    display: 'flex',
    gap: 10,
  },
  simulatorPanel: {
    padding: '24px',
  },
  simFlex: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 20,
    marginTop: 16,
  },
  simForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    background: 'rgba(0,0,0,0.15)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.03)',
  },
  simGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  simSelect: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '6px',
    color: '#ffffff',
    padding: '8px',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  radioGroup: {
    display: 'flex',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '6px',
    padding: '2px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  radioBtn: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '6px 0',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  radioBtnActiveBuy: {
    background: 'rgba(16,185,129,0.12)',
    color: '#10b981',
  },
  radioBtnActiveSell: {
    background: 'rgba(244,63,94,0.12)',
    color: '#f43f5e',
  },
  simInput: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '6px',
    color: '#ffffff',
    padding: '8px 10px',
    fontSize: '13px',
    fontFamily: 'var(--font-mono)',
    outline: 'none',
  },
  simResultArea: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  simEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  simResultCard: {
    width: '100%',
  },
  simMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    background: 'rgba(255,255,255,0.02)',
    padding: '10px',
    borderRadius: '6px',
  },
  simMetricItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  simMetricLabel: {
    fontSize: '9px',
    textTransform: 'uppercase',
    color: '#64748b',
    fontWeight: '700',
  },
  simMetricValue: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  newsPanel: {
    padding: '24px',
  },
  newsPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: 16,
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '20px',
    color: '#94a3b8',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterTabActive: {
    background: 'rgba(251,191,36,0.12)',
    borderColor: '#fbbf24',
    color: '#ffffff',
    boxShadow: '0 0 10px rgba(251,191,36,0.1)',
  },
  newsSelectFilter: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    color: '#ffffff',
    padding: '6px 12px',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
  },
  newsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16,
    marginTop: 20,
  },
  newsCard: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'all 0.3s',
  },
  newsCardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '10px',
  },
  newsSource: {
    color: '#6366f1',
    fontWeight: '600',
  },
  newsDotSeparator: {
    color: '#475569',
  },
  newsTime: {
    color: '#64748b',
  },
  newsCardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: '1.4',
  },
  newsCardText: {
    fontSize: '11px',
    color: '#cbd5e1',
    lineHeight: '1.5',
    flex: 1,
  },
  newsImpactArea: {
    borderTop: '1px solid rgba(255,255,255,0.03)',
    paddingTop: '10px',
    marginTop: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  impactPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  impactPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '2px 8px',
    borderRadius: '12px',
    border: '1px solid',
  }
};
