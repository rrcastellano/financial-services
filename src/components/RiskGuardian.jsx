import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  AlertTriangle, 
  Layers, 
  TrendingDown, 
  RefreshCw, 
  Save, 
  Search, 
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { getCachePrice, fetchHistoricalCandles, updateLivePricesCache, safeGeminiGenerateContent } from '../utils/financeApi';

// Helper to robustly parse JSON from Gemini AI, removing code blocks and trailing explanations or non-whitespace garbage
function cleanAndParseJSON(text) {
  if (!text) throw new Error('Dados vazios recebidos para análise JSON.');
  
  let cleaned = text.trim();
  
  // Remove block code formatting if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  
  cleaned = cleaned.trim();
  
  // Find first '{' or '[' and last '}' or ']'
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  }
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonCandidate = cleaned.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(jsonCandidate);
    } catch (e) {
      console.warn('[cleanAndParseJSON] Substring parsing failed. Trying standard parse.', e);
    }
  }
  
  return JSON.parse(cleaned);
}

// Helpers to convert between native currency and display currency
const getDisplayPrice = (nativePrice, isBr, globalCurrency, usdToBrl) => {
  if (nativePrice === undefined || nativePrice === null || isNaN(nativePrice)) return nativePrice;
  if (isBr && globalCurrency === 'USD') {
    return nativePrice / usdToBrl;
  }
  if (!isBr && globalCurrency === 'BRL') {
    return nativePrice * usdToBrl;
  }
  return nativePrice;
};

const getNativePrice = (displayPrice, isBr, globalCurrency, usdToBrl) => {
  if (displayPrice === undefined || displayPrice === null || isNaN(displayPrice)) return displayPrice;
  if (isBr && globalCurrency === 'USD') {
    return displayPrice * usdToBrl;
  }
  if (!isBr && globalCurrency === 'BRL') {
    return displayPrice / usdToBrl;
  }
  return displayPrice;
};

// Stable Peak Price Calculator based on Ticker seed and currentPrice
const getPeakPrice = (ticker, currentPrice) => {
  if (!ticker) return currentPrice;
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) {
    seed += ticker.charCodeAt(i);
  }
  const pseudoRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  let maxHigh = currentPrice;
  let currentClose = currentPrice * 0.95;
  for (let i = 0; i < 15; i++) {
    const volatility = 0.025;
    const change = currentClose * volatility * (pseudoRandom() * 2 - 1.02 + (i * 0.003));
    const open = currentClose;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) * (1 + pseudoRandom() * 0.012);
    if (high > maxHigh) {
      maxHigh = high;
    }
    currentClose = close;
  }
  return maxHigh;
};

export default function RiskGuardian({ apiKey, apiMode }) {
  // Load and merge holdings from localStorage
  const [ledgerUs, setLedgerUs] = useState(() => {
    try {
      const saved = localStorage.getItem('fsi_user_portfolio_ledger_us');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [ledgerBr, setLedgerBr] = useState(() => {
    try {
      const saved = localStorage.getItem('fsi_user_portfolio_ledger_br');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // activePortfolio: 'GLOBAL', 'US', 'BR'
  const [activePortfolio, setActivePortfolio] = useState(() => {
    return localStorage.getItem('fsi_active_portfolio') || 'GLOBAL';
  });

  // Risk Parameters: { AAPL: { stopPrice: 150.00 }, ... }
  const [riskParams, setRiskParams] = useState(() => {
    try {
      const saved = localStorage.getItem('fsi_portfolio_risk_parameters');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });



  // Local state for edits: { AAPL: { stopPrice: '150.00' }, ... }
  const [editParams, setEditParams] = useState({});
  const [selectedTicker, setSelectedTicker] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cognitive advisor states
  const [isConsulting, setIsConsulting] = useState(false);
  const [advisorReport, setAdvisorReport] = useState(null);
  const [advisorError, setAdvisorError] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('hedging');
  const [historicalCandles, setHistoricalCandles] = useState(() => {
    try {
      const saved = localStorage.getItem('fsi_historical_candles_cache');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);

  // Currency multiplier
  const usdToBrl = useMemo(() => {
    try {
      const saved = localStorage.getItem('fsi_usd_to_brl');
      return saved ? parseFloat(saved) : 5.15;
    } catch (e) {
      return 5.15;
    }
  }, []);

  const [globalCurrency, setGlobalCurrency] = useState(() => {
    return localStorage.getItem('fsi_global_currency') || 'USD';
  });

  const adjustWithDividends = useMemo(() => {
    return localStorage.getItem('fsi_adjust_with_dividends') === 'true';
  }, []);

  const pricesCache = useMemo(() => {
    try {
      const saved = localStorage.getItem('fsi_prices_cache');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }, []);

  // Listen for portfolio updates
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const savedUs = localStorage.getItem('fsi_user_portfolio_ledger_us');
        if (savedUs) setLedgerUs(JSON.parse(savedUs));
        const savedBr = localStorage.getItem('fsi_user_portfolio_ledger_br');
        if (savedBr) setLedgerBr(JSON.parse(savedBr));
        const savedCurrency = localStorage.getItem('fsi_global_currency') || 'USD';
        setGlobalCurrency(savedCurrency);
        const savedParams = localStorage.getItem('fsi_portfolio_risk_parameters');
        if (savedParams) setRiskParams(JSON.parse(savedParams));
      } catch (e) {
        console.error('Failed to sync ledgers', e);
      }
    };
    window.addEventListener('portfolio_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('portfolio_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Combined Active Holdings List
  const holdings = useMemo(() => {
    const list = [];

    // Parse US holdings
    if (activePortfolio === 'GLOBAL' || activePortfolio === 'US') {
      Object.entries(ledgerUs).forEach(([ticker, asset]) => {
        const cacheVal = getCachePrice(pricesCache, ticker) || asset.currentPrice || 150;
        
        // Dynamic dividend abatement
        const rawAvg = asset.avgPrice || 120;
        const divs = asset.dividends || 0;
        const qty = asset.qty || 0;
        const adjustedAvg = qty > 0 ? Math.max(0, rawAvg - divs / qty) : rawAvg;
        const avgPriceNative = adjustWithDividends ? adjustedAvg : rawAvg;

        // Currency conversion
        let currentPrice = cacheVal;
        let avgPrice = avgPriceNative;
        
        if (globalCurrency === 'BRL') {
          currentPrice = cacheVal * usdToBrl;
          avgPrice = avgPriceNative * usdToBrl;
        }

        list.push({
          ticker,
          name: asset.name || `${ticker} Corp.`,
          qty,
          avgPrice,
          currentPrice,
          currency: globalCurrency === 'BRL' ? 'R$' : '$',
          isBr: false
        });
      });
    }

    // Parse BR holdings
    if (activePortfolio === 'GLOBAL' || activePortfolio === 'BR') {
      Object.entries(ledgerBr).forEach(([ticker, asset]) => {
        const cacheVal = getCachePrice(pricesCache, ticker) || asset.currentPrice || 40;
        
        // Dynamic dividend abatement
        const rawAvg = asset.avgPrice || 35;
        const divs = asset.dividends || 0;
        const qty = asset.qty || 0;
        const adjustedAvg = qty > 0 ? Math.max(0, rawAvg - divs / qty) : rawAvg;
        const avgPriceNative = adjustWithDividends ? adjustedAvg : rawAvg;

        // Currency conversion
        let currentPrice = cacheVal;
        let avgPrice = avgPriceNative;

        if (globalCurrency === 'USD') {
          currentPrice = cacheVal / usdToBrl;
          avgPrice = avgPriceNative / usdToBrl;
        }

        list.push({
          ticker,
          name: asset.name || `${ticker} S.A.`,
          qty,
          avgPrice,
          currentPrice,
          currency: globalCurrency === 'USD' ? '$' : 'R$',
          isBr: true
        });
      });
    }

    return list;
  }, [ledgerUs, ledgerBr, pricesCache, globalCurrency, usdToBrl, adjustWithDividends, activePortfolio]);

  // Set default selected ticker on load
  useEffect(() => {
    if (holdings.length > 0) {
      const match = holdings.find(h => h.ticker === selectedTicker);
      if (!match) {
        setSelectedTicker(holdings[0].ticker);
      }
    }
  }, [holdings, selectedTicker]);

  // Edits are initialized inline within table render and mock reports, avoiding background refreshes overwriting user inputs.

  // 1. Fetch real candles on selected ticker change
  useEffect(() => {
    if (!selectedTicker) return;

    // Check if we have real cached candles
    const cached = historicalCandles[selectedTicker.toUpperCase().trim()];
    if (cached && cached.length >= 10 && cached[0].isReal) {
      return; // Already loaded!
    }

    // Resolve active API details
    const activeProvider = localStorage.getItem('fsi_finance_api_provider') || 'simulated';
    if (activeProvider === 'simulated') {
      return; // Simulated mode, do not call external API
    }

    let active = true;
    const fetchCandles = async () => {
      setIsLoadingCandles(true);
      try {
        const data = await fetchHistoricalCandles(selectedTicker, activeProvider);
        if (data && data.length > 0 && active) {
          setHistoricalCandles(prev => {
            const symbolUpper = selectedTicker.toUpperCase().trim();
            const updated = { ...prev, [symbolUpper]: data };
            localStorage.setItem('fsi_historical_candles_cache', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error(`[RiskGuardian] Load candles error for ${selectedTicker}:`, err);
      } finally {
        if (active) setIsLoadingCandles(false);
      }
    };

    fetchCandles();

    return () => {
      active = false;
    };
  }, [selectedTicker, historicalCandles]);

  // 2. Progressive background pre-fetcher for all active holdings
  // Spaced by 3 seconds each to prevent rate limit blocks (COOP/429)
  useEffect(() => {
    const activeProvider = localStorage.getItem('fsi_finance_api_provider') || 'simulated';
    if (activeProvider === 'simulated' || holdings.length === 0) return;

    // Find any holdings that do not have real cached candles yet
    const missingTickers = holdings
      .map(h => h.ticker)
      .filter(ticker => {
        const cached = historicalCandles[ticker.toUpperCase().trim()];
        return !(cached && cached.length >= 10 && cached[0].isReal);
      });

    if (missingTickers.length === 0) return;

    console.log(`[RiskGuardian] Progressive background pre-fetch starting for missing tickers:`, missingTickers);

    let active = true;
    let timeoutId = null;

    const fetchNext = async (index) => {
      if (index >= missingTickers.length || !active) {
        console.log(`[RiskGuardian] Progressive background pre-fetch complete!`);
        return;
      }

      const ticker = missingTickers[index];
      console.log(`[RiskGuardian] Background pre-fetching historical candles for ${ticker}...`);

      try {
        const data = await fetchHistoricalCandles(ticker, activeProvider);
        if (data && data.length > 0 && active) {
          setHistoricalCandles(prev => {
            const symbolUpper = ticker.toUpperCase().trim();
            const updated = { ...prev, [symbolUpper]: data };
            localStorage.setItem('fsi_historical_candles_cache', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.warn(`[RiskGuardian] Background pre-fetch failed for ${ticker}:`, err);
      }

      // Schedule next ticker fetch in 3 seconds to be extremely safe with API rate limits
      if (active) {
        timeoutId = setTimeout(() => fetchNext(index + 1), 3000);
      }
    };

    // Delay the start of background pre-fetching by 2 seconds to prioritize main page loads
    timeoutId = setTimeout(() => fetchNext(0), 2000);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [holdings, historicalCandles]);

  // 3. Auto-refresh live prices for all active holdings on mount
  useEffect(() => {
    if (holdings.length === 0) return;
    
    const activeProvider = localStorage.getItem('fsi_finance_api_provider') || 'simulated';
    if (activeProvider === 'simulated') return;

    const refreshPrices = async () => {
      try {
        const tickers = holdings.map(h => h.ticker);
        console.log(`[RiskGuardian] Auto-refreshing live prices on mount for B3 and US assets:`, tickers);
        await updateLivePricesCache(tickers, activeProvider);
        window.dispatchEvent(new Event('portfolio_updated'));
      } catch (err) {
        console.error(`[RiskGuardian] Live prices mount refresh failed:`, err);
      }
    };

    const timer = setTimeout(refreshPrices, 800);
    return () => clearTimeout(timer);
  }, []);

  // Filtered holdings list
  const filteredHoldings = useMemo(() => {
    return holdings.filter(h => 
      h.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
      h.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [holdings, searchTerm]);

  // Save specific parameters
  const saveParameter = (ticker, stopPriceVal) => {
    const sp = parseFloat(stopPriceVal);
    const asset = holdings.find(h => h.ticker === ticker);
    const isBr = asset ? asset.isBr : false;
    const nativeSp = isNaN(sp) ? undefined : getNativePrice(sp, isBr, globalCurrency, usdToBrl);

    const updated = {
      ...riskParams,
      [ticker]: {
        stopPrice: nativeSp !== undefined ? Math.max(0, nativeSp) : undefined
      }
    };

    setRiskParams(updated);
    localStorage.setItem('fsi_portfolio_risk_parameters', JSON.stringify(updated));
    
    // Clear local edits state for this ticker so it falls back to the newly saved parameter
    setEditParams(prev => {
      const copy = { ...prev };
      delete copy[ticker];
      return copy;
    });
    
    // Dispatch events
    const event = new CustomEvent('fsi_risk_parameters_updated', { detail: updated });
    window.dispatchEvent(event);
  };

  // Save all parameters at once
  const saveAllParameters = () => {
    let updated = { ...riskParams };
    
    Object.entries(editParams).forEach(([ticker, edit]) => {
      const sp = parseFloat(edit.stopPrice);
      const asset = holdings.find(h => h.ticker === ticker);
      const isBr = asset ? asset.isBr : false;
      const nativeSp = isNaN(sp) ? undefined : getNativePrice(sp, isBr, globalCurrency, usdToBrl);
      
      updated[ticker] = {
        stopPrice: nativeSp !== undefined ? Math.max(0, nativeSp) : undefined
      };
    });

    setRiskParams(updated);
    localStorage.setItem('fsi_portfolio_risk_parameters', JSON.stringify(updated));
    
    // Clear all edits state so they fall back to newly saved parameters
    setEditParams({});
    
    // Dispatch events
    const event = new CustomEvent('fsi_risk_parameters_updated', { detail: updated });
    window.dispatchEvent(event);
    
    // Dispatch general sync event
    window.dispatchEvent(new Event('portfolio_updated'));

    alert('Configurações de todos os tickers salvas com sucesso!');
  };

  const handleEditChange = (ticker, field, value) => {
    setEditParams(prev => ({
      ...prev,
      [ticker]: {
        ...(prev[ticker] || { stopPrice: '' }),
        [field]: value
      }
    }));
  };



  const handleCurrencyChange = (currency) => {
    setGlobalCurrency(currency);
    localStorage.setItem('fsi_global_currency', currency);
    window.dispatchEvent(new Event('portfolio_updated'));
  };

  // Generate high-fidelity historical Candlestick data for SVG
  const selectedAssetData = useMemo(() => {
    if (!selectedTicker) return null;
    const asset = holdings.find(h => h.ticker === selectedTicker);
    if (!asset) return null;

    // Check if we have real historical candles loaded in state
    function symbolUpperClean(t) {
      return t.toUpperCase().trim();
    }
    const cachedReal = historicalCandles[symbolUpperClean(selectedTicker)];
    let candles = [];
    let isRealCandles = false;
    let lastRealClose = null;

    if (cachedReal && Array.isArray(cachedReal) && cachedReal.length > 0) {
      const lastCandle = cachedReal[cachedReal.length - 1];
      if (lastCandle && lastCandle.close !== undefined) {
        let rawClose = parseFloat(lastCandle.close);
        // Convert to display currency if needed
        if (asset.isBr && globalCurrency === 'USD') {
          rawClose = rawClose / usdToBrl;
        } else if (!asset.isBr && globalCurrency === 'BRL') {
          rawClose = rawClose * usdToBrl;
        }
        lastRealClose = rawClose;
      }

      candles = cachedReal.map(c => {
        let open = parseFloat(c.open);
        let high = parseFloat(c.high);
        let low = parseFloat(c.low);
        let close = parseFloat(c.close);

        // Perform currency conversion for historical candles to match display globalCurrency
        if (asset.isBr && globalCurrency === 'USD') {
          open = open / usdToBrl;
          high = high / usdToBrl;
          low = low / usdToBrl;
          close = close / usdToBrl;
        } else if (!asset.isBr && globalCurrency === 'BRL') {
          open = open * usdToBrl;
          high = high * usdToBrl;
          low = low * usdToBrl;
          close = close * usdToBrl;
        }

        return {
          date: c.date,
          open,
          high,
          low,
          close,
          isReal: true
        };
      });
      isRealCandles = true;
    }

    // We prioritize actual live price cache, then actual historical close price, then ledger average price, and finally a default.
    const hasLivePrice = pricesCache[selectedTicker.toUpperCase().trim()] !== undefined;
    const basePrice = hasLivePrice ? asset.currentPrice : (lastRealClose || asset.currentPrice || asset.avgPrice || (asset.isBr ? 40 : 150));

    if (!isRealCandles) {
      // Seed-based stable PRNG to prevent chart jumping on render
      let seed = 0;
      for (let i = 0; i < selectedTicker.length; i++) {
        seed += selectedTicker.charCodeAt(i);
      }

      const pseudoRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      let currentClose = basePrice * 0.95; // start slightly below basePrice

      // Construct 15 consecutive sessions
      for (let i = 0; i < 15; i++) {
        const volatility = 0.025; // +- 2.5% max volatility per candle
        const change = currentClose * volatility * (pseudoRandom() * 2 - 1.02 + (i * 0.003)); // slight uptrend
        const open = currentClose;
        const close = Math.max(1, open + change);
        
        const shadowHigh = Math.max(open, close) * (1 + pseudoRandom() * 0.012);
        const shadowLow = Math.min(open, close) * (1 - pseudoRandom() * 0.012);

        const d = new Date();
        d.setDate(d.getDate() - (15 - i));
        const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

        candles.push({
          date: dateStr,
          open,
          high: shadowHigh,
          low: shadowLow,
          close,
          isReal: false
        });
        currentClose = close;
      }
    }

    // Slice to exactly the last 15 days for a perfect SVG layout and prevent layout overflow
    candles = candles.slice(-15);

    // Force last candle close to match currentPrice exactly for visual coherence and real-time feel
    if (candles.length > 0) {
      const last = candles[candles.length - 1];
      last.close = basePrice;
      last.high = Math.max(last.high, basePrice);
      last.low = Math.min(last.low, last.open);
    }

    // Calculate EMAs (EMA 20 & 50 approximated on our 15-day range)
    let ema20 = candles[0]?.close || basePrice;
    let ema50 = (candles[0]?.close || basePrice) * 0.98;
    const k20 = 2 / (8 + 1); // accelerated smoothing for 15 candles
    const k50 = 2 / (15 + 1);

    const candlesWithIndicators = candles.map((c, idx) => {
      ema20 = c.close * k20 + ema20 * (1 - k20);
      ema50 = c.close * k50 + ema50 * (1 - k50);

      // Algorithmic pattern detection using strict float parsing to avoid alphabetical string comparison bugs
      const openVal = parseFloat(c.open);
      const closeVal = parseFloat(c.close);
      const highVal = parseFloat(c.high);
      const lowVal = parseFloat(c.low);

      const body = Math.abs(closeVal - openVal);
      const range = highVal - lowVal || 0.01;
      const isDoji = (body / range) < 0.12;
      const isHammer = ((openVal - lowVal) / range > 0.58 || (closeVal - lowVal) / range > 0.58) && (body / range < 0.22);
      const isUp = closeVal > openVal;

      let patternDetected = '';
      if (isDoji) patternDetected = 'Doji (Indecisão)';
      else if (isHammer) patternDetected = 'Martelo (Reversão Alta)';
      else if (idx > 0) {
        const prev = candles[idx - 1];
        const prevOpen = parseFloat(prev.open);
        const prevClose = parseFloat(prev.close);
        const prevBody = Math.abs(prevClose - prevOpen);
        const prevIsUp = prevClose > prevOpen;

        if (isUp && !prevIsUp && body > prevBody * 1.5 && closeVal > prevOpen && openVal < prevClose) {
          patternDetected = 'Engolfo de Alta';
        } else if (!isUp && prevIsUp && body > prevBody * 1.5 && closeVal < prevOpen && openVal > prevClose) {
          patternDetected = 'Engolfo de Baixa';
        }
      }

      return {
        ...c,
        ema20,
        ema50,
        pattern: patternDetected
      };
    });

    // Approximate Relative Strength Index (RSI) for the last candle
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < candles.length; i++) {
      const delta = candles[i].close - candles[i-1].close;
      if (delta > 0) gains += delta;
      else losses += Math.abs(delta);
    }
    const rs = losses === 0 ? 100 : gains / losses;
    const rsiVal = 100 - (100 / (1 + rs));

    // Compile active patterns
    const activePatterns = candlesWithIndicators
      .filter(c => c.pattern)
      .slice(-3)
      .map(c => `${c.date}: ${c.pattern}`);

    return {
      candles: candlesWithIndicators,
      rsi: parseFloat(rsiVal.toFixed(1)),
      ema20: ema20,
      ema50: ema50,
      patterns: activePatterns.length > 0 ? activePatterns : ['Nenhum padrão agressivo nas últimas sessões'],
      asset,
      isReal: isRealCandles
    };
  }, [selectedTicker, holdings, historicalCandles]);

  // Aggregate Portfolio Risks & Cushion
  const riskAggregates = useMemo(() => {
    let totalVal = 0;
    let activeBreaches = 0;
    let maxDrawdownProjected = 0;
    let totalStopLossLimit = 0;

    holdings.forEach(h => {
      totalVal += h.qty * h.currentPrice;
      const params = riskParams[h.ticker] || {};
      const peakPrice = getPeakPrice(h.ticker, h.currentPrice);

      let slPrice = params.stopPrice;
      if (slPrice !== undefined) {
        slPrice = getDisplayPrice(slPrice, h.isBr, globalCurrency, usdToBrl);
      } else {
        if (params.stopLoss !== undefined) {
          const stopBase = params.stopBase || 'avg';
          let refPrice = h.avgPrice;
          if (stopBase === 'current') refPrice = h.currentPrice;
          else if (stopBase === 'peak') refPrice = peakPrice;
          slPrice = refPrice * (1 - params.stopLoss / 100);
        } else {
          slPrice = peakPrice * 0.9;
        }
      }

      const isBreached = h.currentPrice < slPrice;
      if (isBreached) activeBreaches++;

      const individualDrawdown = (h.avgPrice - h.currentPrice) * h.qty;
      if (individualDrawdown > 0) {
        maxDrawdownProjected += individualDrawdown;
      }
      
      totalStopLossLimit += Math.max(0, (h.currentPrice - slPrice) * h.qty);
    });

    const vaR = totalVal * 0.045; // 4.5% VaR at 95% confidence
    const cashBuffer = totalVal > 0 ? Math.max(5000, totalVal * 0.15) : 10000;

    return {
      totalVal,
      activeBreaches,
      vaR,
      cashBuffer,
      maxDrawdownProjected,
      totalStopLossLimit
    };
  }, [holdings, riskParams, globalCurrency, usdToBrl]);



  // Custom Value Formatter
  const formatVal = (val, symbol = '$') => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    const hideValues = localStorage.getItem('fsi_hide_values') === 'true';
    if (hideValues) return `${symbol}••••`;
    
    return `${symbol}${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Invoke Gemini AI Strategy advisor
  const handleConsultAdvisor = async () => {
    setIsConsulting(true);
    setAdvisorError('');
    setAdvisorReport(null);

    const activeKey = apiKey || localStorage.getItem('fsi_api_key') || localStorage.getItem('fsi_gemini_api_key') || '';
    const activeMode = apiMode || localStorage.getItem('fsi_api_mode') || 'simulated';

    if (activeMode === 'gemini') {
      if (!activeKey || activeKey === 'AIzaSyA1xH6yLCDnzb4DQTakG-QL04HHV_5JNN8' || activeKey === 'AIzaSyBLs097x8ty9nuj5sJYtp_7FOq5xLt-Mnw') {
        setAdvisorError('Erro: Chave API do Gemini ausente ou inválida. Por favor, configure uma chave Gemini ativa no menu superior de Configurações para utilizar o modo Gemini AI.');
        setIsConsulting(false);
        return;
      }
    }

    const assetDetails = holdings.map(h => {
      const params = riskParams[h.ticker] || {};
      const peakPrice = getPeakPrice(h.ticker, h.currentPrice);

      let slPrice = params.stopPrice;
      if (slPrice !== undefined) {
        slPrice = getDisplayPrice(slPrice, h.isBr, globalCurrency, usdToBrl);
      } else {
        if (params.stopLoss !== undefined) {
          const stopBase = params.stopBase || 'avg';
          let refPrice = h.avgPrice;
          if (stopBase === 'current') refPrice = h.currentPrice;
          else if (stopBase === 'peak') refPrice = peakPrice;
          slPrice = refPrice * (1 - params.stopLoss / 100);
        } else {
          slPrice = peakPrice * 0.9;
        }
      }

      const isBreached = h.currentPrice < slPrice;
      const diffMarketPct = ((slPrice - h.currentPrice) / h.currentPrice) * 100;
      const diffPeakPct = ((slPrice - peakPrice) / peakPrice) * 100;

      return {
        ticker: h.ticker,
        company: h.name,
        qty: h.qty,
        avgPrice: h.avgPrice,
        currentPrice: h.currentPrice,
        stopPrice: slPrice,
        diffMarketPct: diffMarketPct.toFixed(1) + '%',
        diffPeakPct: diffPeakPct.toFixed(1) + '%',
        status: isBreached ? 'Stop Loss Rompido' : (diffMarketPct >= -5 ? 'Atenção (Próximo ao Stop)' : 'Seguro')
      };
    });

    const promptText = `
      Você é o Aura Cognitive Risk Advisor, um consultor quantitativo de gestão de risco e portfólio.
      Analise a carteira de ativos do usuário com base no cenário tático selecionado: "${selectedScenario}".
      
      Ativos em custódia do usuário (com seus respectivos preços de Stop Loss configurados manualmente e a relação percentual frente ao mercado e às máximas de 15 dias):
      ${JSON.stringify(assetDetails, null, 2)}
      
      Moeda ativa: ${globalCurrency}
      
      Estratégia do usuário: Buy & Hold de longo prazo, buscando limitar o stop loss a cerca de 10% abaixo da máxima de 15 dias.
      
      Responda em formato JSON válido com a seguinte estrutura estrita:
      {
        "executiveSummary": "Visão executiva da sensibilidade do portfólio a riscos e mitigação sugerida (máximo 4 linhas).",
        "assetsAnalysis": [
          {
            "ticker": "TICKER",
            "riskScore": "🟢 Seguro | 🟡 Moderado | 🔴 Risco Crítico",
            "technicalDiagnostic": "Breve diagnóstico integrando a proximidade do preço atual ao stop e as máximas recentes.",
            "hedgingAction": "Ação tática recomendada de proteção (ex: realocar em caixa, revisar o stop semanalmente, etc.)"
          }
        ],
        "tacticalAssetAllocation": "Recomendação final consolidada para alocação de caixa buffer e proteção patrimonial."
      }
      Retorne APENAS o JSON estruturado. Não use markdown no início ou no fim do output.
    `;

    try {
      if (activeMode === 'gemini') {
        const text = await safeGeminiGenerateContent(promptText, activeKey);
        const parsed = cleanAndParseJSON(text);
        setAdvisorReport(parsed);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1400));
        
        const mockReport = {
          executiveSummary: "O portfólio adota uma abordagem Buy & Hold com gerenciamento de stop tático. A recomendação principal é verificar semanalmente a proximidade dos limites de stop em relação às máximas de 15 dias (mantendo a margem de ~10% de folga).",
          assetsAnalysis: holdings.map(h => {
            const params = riskParams[h.ticker] || {};
            const peakPrice = getPeakPrice(h.ticker, h.currentPrice);
            
            const edit = editParams[h.ticker] || { stopPrice: '' };
            const editStopVal = parseFloat(edit.stopPrice);
            const savedStopDisplay = params.stopPrice !== undefined 
              ? getDisplayPrice(params.stopPrice, h.isBr, globalCurrency, usdToBrl) 
              : undefined;
            const slPrice = !isNaN(editStopVal) ? editStopVal : (savedStopDisplay || peakPrice * 0.9);
            
            const isBreached = h.currentPrice < slPrice;
            const diffMarket = h.currentPrice > 0 ? ((slPrice - h.currentPrice) / h.currentPrice) * 100 : 0;
            const isAlert = !isBreached && diffMarket >= -5;
            const diffPeak = ((slPrice - peakPrice) / peakPrice) * 100;
            
            return {
              ticker: h.ticker,
              riskScore: isBreached ? "🔴 Risco Crítico" : (isAlert ? "🟡 Alerta (Próximo)" : "🟢 Seguro"),
              technicalDiagnostic: isBreached 
                ? `Preço de mercado atual cruzou a barreira de Stop Loss manual de ${formatVal(slPrice, h.currency)}.`
                : (isAlert 
                    ? `Preço atual está a apenas ${Math.abs(diffMarket).toFixed(1)}% do preço de stop configurado (${formatVal(slPrice, h.currency)}).`
                    : `Operando a ${Math.abs(diffPeak).toFixed(1)}% de distância da máxima de 15 dias (${formatVal(peakPrice, h.currency)}). Margem confortável para Buy & Hold.`),
              hedgingAction: isBreached 
                ? `Acionar stop loss ou reavaliar suporte gráfico caso o rompimento seja um falso rompimento temporário.`
                : (isAlert
                    ? `Revisar o preço de stop ou preparar liquidez para rebalancear a posição caso haja acionamento nos próximos dias.`
                    : `Manter a posição e acompanhar a revisão semanal. Ajustar o stop para cima se o ativo registrar novas máximas.`)
            };
          }),
          tacticalAssetAllocation: "Manter a alocação atual de longo prazo e manter o caixa reserva pronto para novas compras caso ocorra o acionamento de stops de ativos correlacionados."
        };
        setAdvisorReport(mockReport);
      }
    } catch (err) {
      console.error(err);
      setAdvisorError('Falha ao processar consultoria cognitiva: ' + err.message);
    } finally {
      setIsConsulting(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade">
      
      {/* Portfolio Filter & Currency Selector Header Controls */}
      <div style={styles.controlHeader} className="glass-panel">
        
        {/* Left: Custody switcher tab segmented control */}
        <div style={styles.portfolioSwitcher}>
          <button 
            onClick={() => {
              setActivePortfolio('US');
              localStorage.setItem('fsi_active_portfolio', 'US');
            }}
            style={{ 
              ...styles.switchBtn, 
              ...(activePortfolio === 'US' ? styles.switchBtnActiveUs : {}) 
            }}
          >
            🇺🇸 Carteira EUA
          </button>
          <button 
            onClick={() => {
              setActivePortfolio('BR');
              localStorage.setItem('fsi_active_portfolio', 'BR');
            }}
            style={{ 
              ...styles.switchBtn, 
              ...(activePortfolio === 'BR' ? styles.switchBtnActiveBr : {}) 
            }}
          >
            🇧🇷 Carteira Brasil
          </button>
          <button 
            onClick={() => {
              setActivePortfolio('GLOBAL');
              localStorage.setItem('fsi_active_portfolio', 'GLOBAL');
            }}
            style={{ 
              ...styles.switchBtn, 
              ...(activePortfolio === 'GLOBAL' ? styles.switchBtnActiveGlobal : {}) 
            }}
          >
            🌐 Visão Consolidada
          </button>
        </div>

        {/* Right: Premium glassmorphic global currency switch */}
        <div style={styles.currencyToggleCard}>
          <span style={styles.toggleLabel}>MOEDA EXIBIÇÃO:</span>
          <div style={styles.currencyToggleGroup}>
            <button 
              onClick={() => handleCurrencyChange('USD')}
              style={{ 
                ...styles.currencyBtn, 
                ...(globalCurrency === 'USD' ? styles.currencyBtnActive : {}) 
              }}
            >
              USD ($)
            </button>
            <button 
              onClick={() => handleCurrencyChange('BRL')}
              style={{ 
                ...styles.currencyBtn, 
                ...(globalCurrency === 'BRL' ? styles.currencyBtnActive : {}) 
              }}
            >
              BRL (R$)
            </button>
          </div>
        </div>

      </div>

      {/* Risk Aggregates Dashboard Cards */}
      <div style={styles.gridAggregates}>
        <div style={{ ...styles.aggCard, borderLeft: '4px solid #6366f1' }} className="glass-panel">
          <div style={styles.aggIconWrapper}>
            <TrendingUp size={20} color="#6366f1" />
          </div>
          <div>
            <span style={styles.aggLabel}>Patrimônio Custodiado</span>
            <h3 style={styles.aggValue}>{formatVal(riskAggregates.totalVal, globalCurrency === 'USD' ? '$' : 'R$')}</h3>
            <p style={styles.aggDesc}>Soma de todas as posições em ações</p>
          </div>
        </div>

        <div style={{ ...styles.aggCard, borderLeft: '4px solid #a855f7' }} className="glass-panel">
          <div style={{ ...styles.aggIconWrapper, backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
            <ShieldAlert size={20} color="#a855f7" />
          </div>
          <div>
            <span style={styles.aggLabel}>Patrimônio Sob Risco (VaR 95%)</span>
            <h3 style={styles.aggValue}>{formatVal(riskAggregates.vaR, globalCurrency === 'USD' ? '$' : 'R$')}</h3>
            <p style={styles.aggDesc}>Flutuação máxima estimada por dia em estresse geopolítico</p>
          </div>
        </div>

        <div style={{ ...styles.aggCard, borderLeft: '4px solid #f43f5e' }} className="glass-panel">
          <div style={{ ...styles.aggIconWrapper, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}>
            <TrendingDown size={20} color="#f43f5e" />
          </div>
          <div>
            <span style={styles.aggLabel}>Disparos de Stop Loss Ativos</span>
            <h3 style={{ ...styles.aggValue, color: riskAggregates.activeBreaches > 0 ? '#f43f5e' : '#ffffff' }}>
              {riskAggregates.activeBreaches} Papéis
            </h3>
            <p style={styles.aggDesc}>Ativos cujo preço de mercado rompeu a barreira do stop</p>
          </div>
        </div>
      </div>



      <div style={styles.splitLayout}>
        {/* Left Side: Stop Loss and Take Profit planner table */}
        <div style={styles.plannerCard} className="glass-panel">
          <div style={styles.panelHeader}>
            <div>
              <h3 style={styles.panelTitle}>Planilha Tática de Proteções (Buy & Hold)</h3>
              <p style={styles.panelSubtitle}>Monitore as barreiras de Stop Loss com base nas máximas recentes e revise semanalmente</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                onClick={saveAllParameters}
                disabled={Object.keys(editParams).length === 0}
                className="btn btn-primary"
                style={{ height: '28px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', padding: '0 12px', cursor: 'pointer' }}
              >
                <Save size={12} /> Salvar Todos
              </button>

              <div style={styles.searchBox}>
                <Search size={14} color="#64748b" style={{ marginRight: 6 }} />
                <input 
                  type="text" 
                  placeholder="Filtrar ticker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tr}>
                  <th style={styles.th}>Ticker</th>
                  <th style={styles.th}>Custo Médio</th>
                  <th style={styles.th}>Preço Mercado</th>
                  <th style={styles.th}>Preço Stop (Manual)</th>
                  <th style={styles.th}>Stop x Mercado</th>
                  <th style={styles.th}>Stop x Máxima 15d</th>
                  <th style={styles.th}>Status de Risco</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.length > 0 ? (
                  filteredHoldings.map(h => {
                    const params = riskParams[h.ticker] || {};

                    // Compute Peak Price of 15 days
                    const peakPrice = getPeakPrice(h.ticker, h.currentPrice);

                    // Resolve stored native stopPrice to active display currency
                    const savedStopDisplay = params.stopPrice !== undefined 
                      ? getDisplayPrice(params.stopPrice, h.isBr, globalCurrency, usdToBrl) 
                      : undefined;

                    // Fallback to old percentages or 10% under peak
                    let defaultStopPrice = savedStopDisplay;
                    if (defaultStopPrice === undefined) {
                      if (params.stopLoss !== undefined) {
                        const stopBase = params.stopBase || 'avg';
                        let refPrice = h.avgPrice;
                        if (stopBase === 'current') refPrice = h.currentPrice;
                        else if (stopBase === 'peak') refPrice = peakPrice;
                        defaultStopPrice = refPrice * (1 - params.stopLoss / 100);
                      } else {
                        defaultStopPrice = peakPrice * 0.9;
                      }
                    }

                    const defaultStopPriceStr = defaultStopPrice !== undefined ? String(parseFloat(defaultStopPrice).toFixed(2)) : '';
                    
                    // Retrieve active edit or fall back to resolved saved/default value
                    const edit = editParams[h.ticker] || { stopPrice: defaultStopPriceStr };
                    const editStopVal = parseFloat(edit.stopPrice);
                    const slPrice = !isNaN(editStopVal) ? editStopVal : (defaultStopPrice || peakPrice * 0.9);

                    const isSlBreached = h.currentPrice < slPrice;

                    // Calculate relationships
                    const stopXMarket = h.currentPrice > 0 ? ((slPrice - h.currentPrice) / h.currentPrice) * 100 : 0;
                    const stopXPeak = peakPrice > 0 ? ((slPrice - peakPrice) / peakPrice) * 100 : 0;

                    let statusText = 'Seguro';
                    let statusClass = 'tag-success';
                    if (isSlBreached) {
                      statusText = 'Stop Rompido';
                      statusClass = 'tag-danger';
                    } else if (stopXMarket >= -5 && stopXMarket < 0) {
                      statusText = 'Atenção';
                      statusClass = 'tag-warning';
                    }

                    const isSelected = selectedTicker === h.ticker;

                    return (
                      <tr 
                        key={h.ticker} 
                        style={{
                          ...styles.tr,
                          ...(isSelected ? styles.trSelected : {}),
                        }}
                        onClick={() => setSelectedTicker(h.ticker)}
                      >
                        <td style={{ ...styles.td, fontWeight: 'bold' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '12px' }}>{h.isBr ? '🇧🇷' : '🇺🇸'}</span>
                            {h.ticker}
                          </div>
                        </td>
                        <td style={styles.td}>{formatVal(h.avgPrice, h.currency)}</td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: '600' }}>{formatVal(h.currentPrice, h.currency)}</span>
                            <span style={{ fontSize: '9px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                              Pico 15d: {formatVal(peakPrice, h.currency)}
                            </span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 10, color: '#64748b' }}>{h.currency}</span>
                            <input 
                              type="number"
                              step="0.01"
                              value={edit.stopPrice}
                              onChange={(e) => handleEditChange(h.ticker, 'stopPrice', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ ...styles.tableInput, width: '75px' }}
                            />
                          </div>
                        </td>
                        <td style={{ 
                          ...styles.td,
                          color: stopXMarket >= 0 ? '#f43f5e' : '#10b981',
                          fontWeight: '600',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {stopXMarket >= 0 ? '+' : ''}{stopXMarket.toFixed(2)}%
                        </td>
                        <td style={{ 
                          ...styles.td,
                          color: (stopXPeak >= -12 && stopXPeak <= -8) ? '#38bdf8' : (stopXPeak >= 0 ? '#f43f5e' : '#10b981'),
                          fontWeight: '600',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {stopXPeak >= 0 ? '+' : ''}{stopXPeak.toFixed(2)}%
                        </td>
                        <td style={styles.td}>
                          <span className={`tag ${statusClass}`} style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                            {statusText}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              saveParameter(h.ticker, edit.stopPrice);
                              alert(`Proteções de ${h.ticker} salvas com sucesso!`);
                            }}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', height: '24px', fontSize: '10px' }}
                          >
                            <Save size={10} style={{ marginRight: 2 }} /> Salvar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={styles.emptyTable}>
                      Nenhum ativo cadastrado nas custódias ativas. Visite a aba Portfolio Tracker para alimentar sua carteira.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: High fidelity SVG Candlestick Simulator & Indicators */}
        <div style={styles.chartCard} className="glass-panel">
          {selectedAssetData ? (
            <div style={styles.chartContainer} className="animate-fade">
              <div style={styles.chartHeader}>
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={styles.chartBadge}>
                      {selectedAssetData.asset.isBr ? '🇧🇷 B3 Brasil' : '🇺🇸 EUA Nasdaq/NYSE'}
                    </span>
                    <span style={{
                      ...styles.chartBadge,
                      background: selectedAssetData.isReal ? 'rgba(16, 185, 129, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                      color: selectedAssetData.isReal ? '#34d399' : '#fde68a'
                    }}>
                      {selectedAssetData.isReal ? '🟢 Histórico Real' : '🟡 Sandbox'}
                    </span>
                    {isLoadingCandles && (
                      <span style={{ fontSize: '9px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <RefreshCw size={10} className="animate-spin" /> Sincronizando...
                      </span>
                    )}
                    {!selectedAssetData.isReal && !isLoadingCandles && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const activeProvider = localStorage.getItem('fsi_finance_api_provider') || 'simulated';
                          if (activeProvider === 'simulated') {
                            alert('Configure um provedor de cotações ativo (Finnhub, Twelve Data ou BRAPI) nas Configurações do sistema para consultar o histórico oficial de mercado.');
                            return;
                          }
                          setIsLoadingCandles(true);
                          const data = await fetchHistoricalCandles(selectedTicker, activeProvider);
                          setIsLoadingCandles(false);
                          if (data) {
                            setHistoricalCandles(prev => {
                              const symbolUpper = selectedTicker.toUpperCase().trim();
                              const updated = { ...prev, [symbolUpper]: data };
                              localStorage.setItem('fsi_historical_candles_cache', JSON.stringify(updated));
                              return updated;
                            });
                            alert(`Histórico de mercado real para ${selectedTicker} carregado e salvo com sucesso no banco de dados local!`);
                          } else {
                            alert('Não foi possível obter dados históricos da API de mercado. Verifique sua conexão ou limite de requisições.');
                          }
                        }}
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                          fontSize: '9px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        Carregar Histórico Oficial
                      </button>
                    )}
                  </div>
                  <h3 style={{ fontSize: '15px', color: '#ffffff', marginTop: 6 }}>
                    {selectedAssetData.isReal ? 'Histórico Real de Velas (Candlesticks)' : 'Simulador Estocástico de Velas'} — {selectedTicker}
                  </h3>
                </div>

                <div style={styles.rsiBadge}>
                  RSI (14): <strong style={{ 
                    color: selectedAssetData.rsi > 70 ? '#f43f5e' : (selectedAssetData.rsi < 30 ? '#10b981' : '#38bdf8') 
                  }}>
                    {selectedAssetData.rsi}
                  </strong>
                  <span style={{ fontSize: 9, color: '#64748b', marginLeft: 4 }}>
                    {selectedAssetData.rsi > 70 ? '(Sobrecomprado)' : (selectedAssetData.rsi < 30 ? '(Sobrevendido)' : '(Neutro)')}
                  </span>
                </div>
              </div>

              {/* Chart SVG Draw */}
              <div style={styles.svgWrapper}>
                <svg viewBox="0 0 520 200" style={styles.svg}>
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="520" y2="50" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="520" y2="100" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                  <line x1="0" y1="150" x2="520" y2="150" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />

                  {/* Draw Candles */}
                  {(() => {
                    const prices = selectedAssetData.candles.flatMap(c => [c.high, c.low]);
                    const minP = Math.min(...prices) * 0.98;
                    const maxP = Math.max(...prices) * 1.02;
                    const rangeP = maxP - minP || 1;

                    const getY = (price) => {
                      return 180 - ((price - minP) / rangeP) * 150;
                    };

                    const pointsEma20 = [];
                    const pointsEma50 = [];

                    const totalCandles = selectedAssetData.candles.length || 1;
                    const spacing = Math.min(31, Math.floor((490 - 20) / totalCandles));

                    const candleDraws = selectedAssetData.candles.map((c, idx) => {
                      const x = 20 + idx * spacing;
                      const yOpen = getY(c.open);
                      const yClose = getY(c.close);
                      const yHigh = getY(c.high);
                      const yLow = getY(c.low);
                      
                      const isUp = parseFloat(c.close) > parseFloat(c.open);
                      const color = isUp ? '#10b981' : '#f43f5e';
                      
                      const bodyWidth = 14;
                      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
                      const bodyY = Math.min(yOpen, yClose);

                      pointsEma20.push(`${x + bodyWidth/2},${getY(c.ema20)}`);
                      pointsEma50.push(`${x + bodyWidth/2},${getY(c.ema50)}`);

                      return (
                        <g key={idx} className="candle-group">
                          <line x1={x + bodyWidth/2} y1={yHigh} x2={x + bodyWidth/2} y2={yLow} stroke={color} strokeWidth="1.5" />
                          <rect 
                            x={x} 
                            y={bodyY} 
                            width={bodyWidth} 
                            height={bodyHeight} 
                            fill={color} 
                            rx="1" 
                            style={{ filter: `drop-shadow(0 0 3px ${color}20)` }}
                          />
                          {idx % 3 === 0 && (
                            <text x={x} y="195" fill="#475569" fontSize="9" fontFamily="var(--font-mono)">
                              {c.date}
                            </text>
                          )}
                        </g>
                      );
                    });

                    return (
                      <>
                        <path 
                          d={`M ${pointsEma50.join(' L ')}`} 
                          fill="none" 
                          stroke="rgba(251, 191, 36, 0.4)" 
                          strokeWidth="1.2" 
                          strokeDasharray="4 2" 
                        />
                        <path 
                          d={`M ${pointsEma20.join(' L ')}`} 
                          fill="none" 
                          stroke="rgba(56, 189, 248, 0.7)" 
                          strokeWidth="1.5" 
                        />
                        {candleDraws}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Technical indicators readouts */}
              <div style={styles.technicalReadouts}>
                <div style={styles.readoutColumn}>
                  <h4 style={styles.readoutTitle}>Padrões Identificados</h4>
                  <div style={styles.patternList}>
                    {selectedAssetData.patterns.map((p, idx) => (
                      <div key={idx} style={styles.patternItem}>
                        <ChevronRight size={10} color="#fbbf24" style={{ marginTop: 2 }} />
                        <span style={styles.patternText}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.readoutColumn}>
                  <h4 style={styles.readoutTitle}>Médias Móveis</h4>
                  <div style={styles.emaInfoRow}>
                    <div style={styles.emaBox}>
                      <span style={{ fontSize: 9, color: '#38bdf8' }}>EMA 20 (Rápida)</span>
                      <strong style={{ fontSize: 12, color: '#ffffff' }}>
                        {formatVal(selectedAssetData.ema20, selectedAssetData.asset.currency)}
                      </strong>
                    </div>
                    <div style={styles.emaBox}>
                      <span style={{ fontSize: 9, color: '#fbbf24' }}>EMA 50 (Suave)</span>
                      <strong style={{ fontSize: 12, color: '#ffffff' }}>
                        {formatVal(selectedAssetData.ema50, selectedAssetData.asset.currency)}
                      </strong>
                    </div>
                  </div>
                  <p style={styles.trendParagraph}>
                    {selectedAssetData.asset.currentPrice > selectedAssetData.ema20 ? (
                      <span style={{ color: '#10b981' }}>📈 Tendência Primária de Alta (Acima da EMA 20)</span>
                    ) : (
                      <span style={{ color: '#f43f5e' }}>📉 Tendência Primária de Baixa (Abaixo da EMA 20)</span>
                    )}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div style={styles.emptyChart}>
              <Activity size={44} color="#334155" style={{ marginBottom: 12 }} />
              <h4>Selecione um ativo para analisar</h4>
              <p style={{ color: '#64748b', fontSize: 12, maxWidth: 220, textAlign: 'center', marginTop: 4 }}>
                Clique em qualquer linha da planilha de proteção para renderizar o gráfico histórico de candles e indicadores.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Geopolitical cognitive advisor advisor */}
      <div style={styles.advisorCard} className="glass-panel">
        <div style={styles.advisorHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#ec4899" />
            <h3 style={{ fontSize: 15, color: '#ffffff', margin: 0 }}>
              Aura Cognitive Strategy Advisor — Assessoria de Hedging & Proteção
            </h3>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select 
              value={selectedScenario} 
              onChange={(e) => setSelectedScenario(e.target.value)} 
              style={styles.scenarioSelect}
            >
              <option value="hedging">Estratégia Defensiva (Hedging)</option>
              <option value="drawdown">Análise de Redução (Drawdown Shock)</option>
              <option value="tax_efficiency">Otimização de Impostos & Realização</option>
            </select>

            <button 
              onClick={handleConsultAdvisor} 
              disabled={isConsulting || holdings.length === 0}
              className="btn btn-accent"
              style={{ height: 32, display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px' }}
            >
              {isConsulting ? (
                <>
                  <RefreshCw size={12} className="animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <Sparkles size={12} /> Consultar Consultoria Cognitiva
                </>
              )}
            </button>
          </div>
        </div>

        {advisorError && (
          <div style={styles.errorAlert}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{advisorError}</span>
          </div>
        )}

        {/* Advisor Report Output Panel */}
        <div style={styles.advisorReportArea}>
          {advisorReport ? (
            <div style={styles.reportContent} className="animate-fade">
              <div style={styles.reportSection}>
                <h4 style={styles.reportSectionTitle}>Parecer Executivo de Risco</h4>
                <p style={styles.reportText}>{advisorReport.executiveSummary}</p>
              </div>

              <div style={styles.reportSection}>
                <h4 style={styles.reportSectionTitle}>Diagnóstico Granular por Ativo</h4>
                <div style={styles.advisorGrid}>
                  {advisorReport.assetsAnalysis?.map((analysis, idx) => (
                    <div key={idx} style={styles.advisorAnalysisCard}>
                      <div style={styles.advisorCardHead}>
                        <strong style={{ fontSize: 12, color: '#ffffff' }}>{analysis.ticker}</strong>
                        <span className={`tag ${
                          analysis.riskScore?.includes('Risco Crítico') ? 'tag-danger' : 
                          (analysis.riskScore?.includes('Moderado') ? 'tag-warning' : 'tag-success')
                        }`} style={{ fontSize: 9 }}>
                          {analysis.riskScore}
                        </span>
                      </div>
                      
                      <p style={styles.analysisDesc}>{analysis.technicalDiagnostic}</p>
                      
                      <div style={styles.hedgeActionBox}>
                        <span style={styles.hedgeActionLabel}>Ação Protetiva Sugerida:</span>
                        <p style={styles.hedgeActionVal}>{analysis.hedgingAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...styles.reportSection, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                <h4 style={{ ...styles.reportSectionTitle, color: '#10b981' }}>Alocação Tática Recomendada</h4>
                <p style={{ ...styles.reportText, color: '#a7f3d0' }}>{advisorReport.tacticalAssetAllocation}</p>
              </div>
            </div>
          ) : (
            <div style={styles.emptyReport}>
              <HelpCircle size={32} color="#334155" style={{ marginBottom: 8 }} />
              <p style={{ color: '#64748b', fontSize: 12, maxWidth: 380, textAlign: 'center' }}>
                Clique no botão superior para despachar a matriz de ativos da carteira para análise cognitiva e receber orientações cirúrgicas de rebalanceamento tático.
              </p>
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
  controlHeader: {
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16
  },
  portfolioSwitcher: {
    display: 'flex',
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '3px',
    borderRadius: '8px',
    gap: 4
  },
  switchBtn: {
    background: 'transparent',
    border: '1px solid transparent',
    color: '#94a3b8',
    padding: '6px 14px',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    userSelect: 'none'
  },
  switchBtnActiveUs: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#a5b4fc',
    borderColor: 'rgba(99, 102, 241, 0.3)'
  },
  switchBtnActiveBr: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  switchBtnActiveGlobal: {
    background: 'rgba(251, 191, 36, 0.12)',
    color: '#fde68a',
    borderColor: 'rgba(251, 191, 36, 0.3)'
  },
  currencyToggleCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  toggleLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.5px'
  },
  currencyToggleGroup: {
    display: 'flex',
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '3px',
    borderRadius: '8px',
    gap: 4
  },
  currencyBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    padding: '6px 12px',
    fontSize: '10px',
    fontWeight: '700',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  currencyBtnActive: {
    background: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8'
  },
  gridAggregates: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 20,
  },
  aggCard: {
    padding: '16px 20px',
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    textAlign: 'left'
  },
  aggIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: '8px',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  aggLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  aggValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4
  },
  aggDesc: {
    fontSize: '10px',
    color: '#64748b',
    marginTop: 2
  },
  splitLayout: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: 20,
  },
  plannerCard: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    textAlign: 'left'
  },
  panelTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff'
  },
  panelSubtitle: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: 2
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    padding: '4px 10px',
    width: '180px'
  },
  searchInput: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '11px',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit'
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  trSelected: {
    background: 'rgba(99, 102, 241, 0.04)',
    borderBottom: '1px solid rgba(99, 102, 241, 0.2)'
  },
  th: {
    padding: '10px 8px',
    textAlign: 'left',
    color: '#94a3b8',
    fontWeight: '500',
    fontSize: '11px'
  },
  td: {
    padding: '12px 8px',
    color: '#cbd5e1',
    verticalAlign: 'middle',
    textAlign: 'left'
  },
  tableSelect: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '11px',
    padding: '2px 4px',
    outline: 'none',
    cursor: 'pointer'
  },
  tableInput: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    color: '#ffffff',
    width: '45px',
    textAlign: 'center',
    padding: '2px 4px',
    fontSize: '11px',
    outline: 'none',
    fontFamily: 'var(--font-mono)'
  },
  emptyTable: {
    padding: '32px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '12px'
  },
  chartCard: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center'
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: '100%'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left'
  },
  chartBadge: {
    fontSize: '9px',
    background: 'rgba(99, 102, 241, 0.12)',
    color: '#a5b4fc',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  rsiBadge: {
    fontSize: '11px',
    color: '#cbd5e1'
  },
  svgWrapper: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.03)',
    padding: '12px 14px 4px 8px',
    width: '100%'
  },
  svg: {
    width: '100%',
    height: 'auto',
    maxHeight: '190px',
    overflow: 'visible'
  },
  technicalReadouts: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.1fr',
    gap: 16,
    textAlign: 'left'
  },
  readoutColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  readoutTitle: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  patternList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  patternItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 4
  },
  patternText: {
    fontSize: '11px',
    color: '#cbd5e1',
    fontWeight: '500'
  },
  emaInfoRow: {
    display: 'flex',
    gap: 12
  },
  emaBox: {
    flex: 1,
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '6px',
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  },
  trendParagraph: {
    fontSize: '11px',
    fontWeight: '600',
    marginTop: 2
  },
  emptyChart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 0',
    color: '#334155'
  },
  advisorCard: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  advisorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: 14
  },
  scenarioSelect: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '11px',
    padding: '4px 8px',
    outline: 'none',
    cursor: 'pointer'
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(244, 63, 94, 0.08)',
    border: '1px solid rgba(244, 63, 94, 0.2)',
    borderRadius: '6px',
    padding: '10px 14px',
    color: '#fda4af',
    fontSize: '11px',
    textAlign: 'left'
  },
  advisorReportArea: {
    width: '100%'
  },
  reportContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    textAlign: 'left'
  },
  reportSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  reportSectionTitle: {
    fontSize: '12px',
    color: '#ec4899',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  reportText: {
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: '1.5',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.02)',
    borderRadius: '6px',
    padding: '12px'
  },
  advisorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 14,
    marginTop: 4
  },
  advisorAnalysisCard: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  advisorCardHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  analysisDesc: {
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.4'
  },
  hedgeActionBox: {
    marginTop: 4,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '4px',
    padding: '6px 8px'
  },
  hedgeActionLabel: {
    fontSize: '9px',
    color: '#a5b4fc',
    fontWeight: '600',
    textTransform: 'uppercase',
    display: 'block'
  },
  hedgeActionVal: {
    fontSize: '11px',
    color: '#ffffff',
    marginTop: 2,
    lineHeight: '1.3'
  },
  emptyReport: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px 0',
    color: '#334155'
  }
};
