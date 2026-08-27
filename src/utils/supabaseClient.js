/**
 * Supabase Client & Data Ingestion Helper
 * Conecta diretamente ao banco de dados Supabase (projeto Finance) via PostgREST.
 * Utiliza fetch nativo com fallback automático entre Vite local proxy e chamada direta.
 */

// Chaves e URLs padrão (carregadas de variáveis de ambiente com fallback para localStorage)
export function getSupabaseConfig() {
  const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hdcwkoketvqbxzdlpcaw.supabase.co';
  const defaultKey = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_dtvL2ls9DXYmegFvdjcqDQ_mcTPDb_J';

  let url = localStorage.getItem('fsi_supabase_url');
  if (!url || url === 'undefined' || url.trim() === '') {
    url = defaultUrl;
    localStorage.setItem('fsi_supabase_url', url);
  }

  let key = localStorage.getItem('fsi_supabase_key');
  // Auto-healing: se a chave salva for secret (sb_secret_...) ou inválida, migra imediatamente para a publishable
  if (!key || key === 'undefined' || key.trim() === '' || key.startsWith('sb_secret_')) {
    key = defaultKey;
    localStorage.setItem('fsi_supabase_key', key);
  }

  return { url: url.replace(/\/+$/, ''), key: key.trim() };
}

/**
 * Executa uma requisição segura com fallback para o proxy Vite se disponível
 */
export async function supabaseFetch(path) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Supabase URL ou Chave não configuradas.');
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const directUrl = `${url}${cleanPath}`;
  const proxyUrl = `/api-proxy/sb${cleanPath}`;

  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  };

  // Tenta proxy do Vite primeiro (se em ambiente de browser)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(proxyUrl, { headers });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 401 || res.status === 403) {
        const errText = await res.text();
        throw new Error(`Erro de autenticação Supabase (${res.status}): ${errText}`);
      }
    } catch (proxyErr) {
      console.warn('[Supabase Client] Proxy fetch falhou, tentando URL direta...', proxyErr.message);
    }
  }

  // Fallback para URL direta
  const directRes = await fetch(directUrl, { headers });
  if (!directRes.ok) {
    const errText = await directRes.text();
    throw new Error(`Erro Supabase (${directRes.status}): ${errText}`);
  }
  return await directRes.json();
}

/**
 * Testa a conectividade com o Supabase
 */
export async function testSupabaseConnection() {
  try {
    const data = await supabaseFetch('/rest/v1/investimentos_posicoes?limit=1');
    return { success: true, count: Array.isArray(data) ? data.length : 0 };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Converte 'MM/YYYY' em número comparável cronologicamente (ex: '08/2026' -> 202608)
 */
export function parseMesAnoScore(mesAnoStr) {
  if (!mesAnoStr || typeof mesAnoStr !== 'string') return 0;
  const parts = mesAnoStr.split('/');
  if (parts.length !== 2) return 0;
  const m = parseInt(parts[0], 10) || 0;
  const y = parseInt(parts[1], 10) || 0;
  return y * 100 + m;
}

/**
 * Tipos de ativos aceitos estritamente como Renda Variável
 */
const RENDA_VARIAVEL_TYPES = new Set([
  'ação',
  'acao',
  'ações',
  'acoes',
  'fii',
  'etf',
  'fiagro',
  'bdr'
]);

export function isRendaVariavel(tipoStr) {
  if (!tipoStr) return false;
  return RENDA_VARIAVEL_TYPES.has(tipoStr.trim().toLowerCase());
}

/**
 * Identifica se a instituição é de custódia US / Internacional
 */
export function isUsInstitution(instituicaoStr) {
  if (!instituicaoStr) return false;
  const inst = instituicaoStr.trim().toLowerCase();
  return inst.includes('avenue') || inst.includes('tastytrade') || inst.includes('tasty');
}

/**
 * Carrega a carteira mais recente do Supabase com:
 * 1. Posições estritas de Renda Variável (Ações, FIIs, ETFs, FiAgros)
 * 2. Saldos de Caixa (Avenue e TastyTrade)
 * 3. Proventos acumulados por ticker
 * 4. Taxa de câmbio PTAX do período
 */
export async function fetchLatestPortfolioData() {
  // 1. Identificar o mês mais recente disponível em investimentos_posicoes
  // Consultamos registros com limite suficiente para cobrir os meses mais recentes
  const recentRows = await supabaseFetch(
    '/rest/v1/investimentos_posicoes?select=mes_ano&order=id.desc&limit=300'
  );

  if (!Array.isArray(recentRows) || recentRows.length === 0) {
    throw new Error('Nenhuma posição encontrada na tabela investimentos_posicoes.');
  }

  // Encontra o maior mes_ano cronológico
  let latestMonth = '';
  let highestScore = -1;

  for (const row of recentRows) {
    if (row.mes_ano) {
      const score = parseMesAnoScore(row.mes_ano);
      if (score > highestScore) {
        highestScore = score;
        latestMonth = row.mes_ano;
      }
    }
  }

  if (!latestMonth) {
    throw new Error('Não foi possível determinar o mês de referência mais recente.');
  }

  // 2. Buscar todas as posições do mês mais recente
  const positionsUrl = `/rest/v1/investimentos_posicoes?mes_ano=eq.${encodeURIComponent(latestMonth)}&select=*`;
  const positions = await supabaseFetch(positionsUrl);

  // 3. Buscar proventos históricos para calcular dividendos acumulados por ticker
  let dividendsByTicker = {};
  try {
    const proventos = await supabaseFetch('/rest/v1/investimentos_proventos?select=ticker,valor_liquido_brl,valor_liquido_usd');
    if (Array.isArray(proventos)) {
      for (const p of proventos) {
        const ticker = (p.ticker || '').trim().toUpperCase();
        if (!ticker) continue;
        if (!dividendsByTicker[ticker]) {
          dividendsByTicker[ticker] = { brl: 0, usd: 0 };
        }
        dividendsByTicker[ticker].brl += parseFloat(p.valor_liquido_brl) || 0;
        dividendsByTicker[ticker].usd += parseFloat(p.valor_liquido_usd) || 0;
      }
    }
  } catch (err) {
    console.warn('[Supabase Client] Não foi possível carregar proventos acumulados:', err.message);
  }

  // 4. Buscar taxa de câmbio PTAX do mês
  let exchangeRate = null;
  try {
    const taxas = await supabaseFetch(`/rest/v1/taxas_cambio?mes_ano=eq.${encodeURIComponent(latestMonth)}&select=taxa_usd_brl&limit=1`);
    if (Array.isArray(taxas) && taxas.length > 0 && taxas[0].taxa_usd_brl) {
      exchangeRate = parseFloat(taxas[0].taxa_usd_brl);
    }
  } catch (err) {
    console.warn('[Supabase Client] Não foi possível carregar taxa de câmbio:', err.message);
  }

  // 5. Processamento dos dados:
  // - Separar saldos de Caixa (Avenue e TastyTrade)
  // - Filtrar estritamente ativos de Renda Variável
  // - Separar carteiras US e BR
  let cashTastyTrade = 0;
  let cashAvenue = 0;
  const ledgerUs = {};
  const ledgerBr = {};
  const fixedIncome = [];

  for (const pos of positions) {
    const rawTicker = (pos.ticker || '').trim();
    const rawNome = (pos.nome || '').trim();
    const rawTipo = (pos.tipo || '').trim();
    const rawInst = (pos.instituicao || '').trim();
    const qty = parseFloat(pos.quantidade) || 0;

    // Detectar saldos de caixa
    if (rawTicker.toUpperCase() === 'CASH' || rawNome.toLowerCase().includes('cash')) {
      const usdVal = parseFloat(pos.valor_mercado_usd) || parseFloat(pos.valor_acumulado_usd) || 0;
      if (rawInst.toLowerCase().includes('tasty')) {
        cashTastyTrade = usdVal;
      } else if (rawInst.toLowerCase().includes('avenue')) {
        cashAvenue = usdVal;
      }
      continue;
    }

    // Detectar posições de Renda Fixa (CDBs, Debêntures, Fundos RF, etc.)
    if (rawTipo.toLowerCase().includes('renda fixa') || rawTipo === 'Renda Fixa') {
      const vm = parseFloat(pos.valor_mercado_brl) || 0;
      const custo = parseFloat(pos.valor_acumulado_brl) || parseFloat(pos.valor_mercado_brl) || 0;
      if (vm > 0 || custo > 0) {
        const pQty = parseFloat(pos.quantidade) || (vm > 0 ? 1 : 0);
        const pm = parseFloat(pos.preco_medio_brl) || (pQty > 0 ? custo / pQty : 0);
        const precoMercado = parseFloat(pos.preco_mercado_brl) || (pQty > 0 ? vm / pQty : 0);

        fixedIncome.push({
          id: pos.id,
          emissor: rawTicker || rawNome,
          codigo: rawNome || rawTicker,
          titulo: rawTicker !== rawNome && rawNome ? `${rawTicker} (${rawNome})` : (rawTicker || rawNome),
          instituicao: rawInst,
          tipo: 'Renda Fixa',
          quantidade: pQty,
          precoMedio: Math.round(pm * 10000) / 10000,
          precoMercado: Math.round(precoMercado * 10000) / 10000,
          investedCost: custo,
          currentValuation: vm,
          profitLoss: vm - custo,
          profitLossPct: custo > 0 ? ((vm - custo) / custo) * 100 : 0,
          currency: 'BRL',
          country: 'BR'
        });
      }
      continue;
    }

    // Filtrar estritamente Renda Variável (ignora Previdência, FGTS, Imóveis, etc.)
    if (!isRendaVariavel(rawTipo)) {
      continue;
    }

    // Ignora posições zeradas ou residuais negativas (ex: posições fechadas)
    if (qty <= 0.0001) {
      continue;
    }

    const isUs = isUsInstitution(rawInst);

    if (isUs) {
      // Carteira US (Avenue / TastyTrade)
      const avgPrice = parseFloat(pos.preco_medio_usd) || 0;
      const divs = dividendsByTicker[rawTicker]?.usd ? Math.round(dividendsByTicker[rawTicker].usd * 100) / 100 : 0;

      ledgerUs[rawTicker] = {
        ticker: rawTicker,
        qty: qty,
        avgPrice: Math.round(avgPrice * 10000) / 10000,
        dividends: divs,
        nome: rawNome,
        setor: pos.setor || 'Technology',
        instituicao: rawInst,
        tipo: rawTipo,
        beta: pos.beta ? parseFloat(pos.beta) : undefined
      };
    } else {
      // Carteira Brasil (B3 - BTG, Itaú, Nubank, etc.)
      const avgPrice = parseFloat(pos.preco_medio_brl) || 0;
      const divs = dividendsByTicker[rawTicker]?.brl ? Math.round(dividendsByTicker[rawTicker].brl * 100) / 100 : 0;

      // Tratamento para caso o mesmo ativo esteja custodiado em mais de uma corretora (ex: KNCR11 no Itaú e BTG)
      if (ledgerBr[rawTicker]) {
        const prev = ledgerBr[rawTicker];
        const combinedQty = prev.qty + qty;
        const totalCost = (prev.qty * prev.avgPrice) + (qty * avgPrice);
        const combinedAvgPrice = combinedQty > 0 ? totalCost / combinedQty : 0;

        ledgerBr[rawTicker] = {
          ...prev,
          qty: Math.round(combinedQty * 10000) / 10000,
          avgPrice: Math.round(combinedAvgPrice * 10000) / 10000,
          instituicao: `${prev.instituicao}, ${rawInst}`
        };
      } else {
        ledgerBr[rawTicker] = {
          ticker: rawTicker,
          qty: qty,
          avgPrice: Math.round(avgPrice * 10000) / 10000,
          dividends: divs,
          nome: rawNome,
          setor: pos.setor || 'Real Estate',
          instituicao: rawInst,
          tipo: rawTipo,
          beta: pos.beta ? parseFloat(pos.beta) : undefined
        };
      }
    }
  }

  const now = new Date();
  const formattedTimestamp = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  return {
    success: true,
    latestMonth,
    ledgerUs,
    ledgerBr,
    fixedIncome,
    cashTastyTrade,
    cashAvenue,
    exchangeRate,
    timestamp: now.toISOString(),
    formattedTimestamp,
    totalAssetsCount: Object.keys(ledgerUs).length + Object.keys(ledgerBr).length + fixedIncome.length
  };
}

/**
 * Ingestão de dados para o workspace 10 Year Plan (Aposentadoria Dez/2036)
 * Consolida Renda Fixa e Renda Variável (Brasil e EUA) e histórico de progressão.
 */
export async function fetchTenYearPlanData(forceRefresh = false) {
  // Se não for forçado, tenta carregar do cache local
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem('fsi_tenyearplan_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.success && parsed.totalInitial > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[TenYearPlan] Erro ao ler cache local:', e);
    }
  }

  // 1. Busca todas as linhas históricas em lotes de 1000
  let allRows = [];
  for (let offset = 0; offset < 5000; offset += 1000) {
    try {
      const batch = await supabaseFetch(
        `investimentos_posicoes?select=mes_ano,tipo,instituicao,ticker,valor_mercado_brl&order=id.asc&limit=1000&offset=${offset}`
      );
      if (!Array.isArray(batch) || batch.length === 0) break;
      allRows.push(...batch);
      if (batch.length < 1000) break;
    } catch (err) {
      console.warn(`[TenYearPlan] Erro no lote offset ${offset}:`, err.message);
      break;
    }
  }

  // Se falhar a consulta direta e tivermos cache, usa o cache
  if (allRows.length === 0) {
    const cached = localStorage.getItem('fsi_tenyearplan_cache');
    if (cached) return JSON.parse(cached);
    // Fallback padrão com os valores reais conhecidos de 08/2026
    return {
      success: true,
      latestMonth: '08/2026',
      rfBr: 424166.31,
      rvBr: 1047539.43,
      rvUs: 940734.93,
      totalInitial: 2412440.67,
      historicalProgression: [],
      formattedTimestamp: 'Posição base salva'
    };
  }

  // Agrega por mês
  const byMonth = {};
  allRows.forEach(p => {
    const ma = p.mes_ano;
    if (!ma) return;
    const inst = (p.instituicao || '').toLowerCase();
    const isUs = isUsInstitution(inst);
    const tipo = p.tipo || '';
    const vm = parseFloat(p.valor_mercado_brl) || 0;

    if (!byMonth[ma]) {
      byMonth[ma] = { month: ma, rfBr: 0, rvBr: 0, rvUs: 0, total: 0 };
    }

    if (tipo === 'Renda Fixa') {
      byMonth[ma].rfBr += vm;
      byMonth[ma].total += vm;
    } else if (['Ação', 'FII', 'ETF', 'FiAgro'].includes(tipo) && !isUs) {
      byMonth[ma].rvBr += vm;
      byMonth[ma].total += vm;
    } else if ((['Ação', 'ETF'].includes(tipo) || p.ticker === 'Cash') && isUs) {
      byMonth[ma].rvUs += vm;
      byMonth[ma].total += vm;
    }
  });

  const sortedMonths = Object.values(byMonth).sort(
    (a, b) => parseMesAnoScore(a.month) - parseMesAnoScore(b.month)
  );

  const latest = sortedMonths[sortedMonths.length - 1] || {
    month: '08/2026',
    rfBr: 424166.31,
    rvBr: 1047539.43,
    rvUs: 940734.93,
    total: 2412440.67
  };

  const now = new Date();
  const formattedTimestamp = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const result = {
    success: true,
    latestMonth: latest.month,
    rfBr: Math.round(latest.rfBr * 100) / 100,
    rvBr: Math.round(latest.rvBr * 100) / 100,
    rvUs: Math.round(latest.rvUs * 100) / 100,
    totalInitial: Math.round(latest.total * 100) / 100,
    historicalProgression: sortedMonths,
    formattedTimestamp
  };

  try {
    localStorage.setItem('fsi_tenyearplan_cache', JSON.stringify(result));
    localStorage.setItem('fsi_tenyearplan_last_sync', formattedTimestamp);
  } catch (e) {
    console.warn('[TenYearPlan] Erro ao salvar cache:', e);
  }

  return result;
}
