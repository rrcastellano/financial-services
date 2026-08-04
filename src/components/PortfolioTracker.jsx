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
  Sparkles,
  Layers
} from 'lucide-react';
import { fetchCompanyData, updateLivePricesCache, formatDateTime, fetchCompanyFundamentalsViaGemini, REAL_TICKERS } from '../utils/financeApi';

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

const DEFAULT_PORTFOLIO_LEDGER = {
  NVDA: { ticker: 'NVDA', qty: 15, avgPrice: 820.00, dividends: 150.00 },
  GOOGL: { ticker: 'GOOGL', qty: 45, avgPrice: 152.00, dividends: 80.00 },
  AVGO: { ticker: 'AVGO', qty: 8, avgPrice: 122.00, dividends: 0 },
  FISV: { ticker: 'FISV', qty: 25, avgPrice: 141.00, dividends: 0 },
  GEV: { ticker: 'GEV', qty: 30, avgPrice: 148.00, dividends: 120.00 },
  LLY: { ticker: 'LLY', qty: 10, avgPrice: 690.00, dividends: 50.00 },
  META: { ticker: 'META', qty: 12, avgPrice: 410.00, dividends: 0 },
  OMF: { ticker: 'OMF', qty: 60, avgPrice: 42.00, dividends: 180.00 },
  PLTR: { ticker: 'PLTR', qty: 150, avgPrice: 32.00, dividends: 0 },
  RCL: { ticker: 'RCL', qty: 35, avgPrice: 115.00, dividends: 0 },
  HSBC: { ticker: 'HSBC', qty: 80, avgPrice: 36.00, dividends: 240.00 },
  STX: { ticker: 'STX', qty: 40, avgPrice: 85.00, dividends: 0 },
  LITE: { ticker: 'LITE', qty: 50, avgPrice: 46.00, dividends: 0 },
  SNDK: { ticker: 'SNDK', qty: 75, avgPrice: 65.00, dividends: 0 }
};

const DEFAULT_BR_PORTFOLIO_LEDGER = {
  PETR4: { ticker: 'PETR4', qty: 100, avgPrice: 34.00, dividends: 450.00 },
  VALE3: { ticker: 'VALE3', qty: 80, avgPrice: 68.00, dividends: 240.00 },
  ITUB4: { ticker: 'ITUB4', qty: 120, avgPrice: 28.50, dividends: 180.00 },
  WEGE3: { ticker: 'WEGE3', qty: 150, avgPrice: 35.00, dividends: 150.00 },
  BBDC4: { ticker: 'BBDC4', qty: 90, avgPrice: 13.80, dividends: 45.00 }
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

// High-Fidelity local cognitive simulation engine fallback (Portuguese)
const generateMockCognitiveReport = (scenarioText, holdings) => {
  const text = scenarioText.toLowerCase();
  let summary = '';
  const tickersAnalysis = [];

  // Determine main themes using precise regex word boundary matching to avoid false positives on common Portuguese substrings (e.g. 'ai' in 'ainda' or 'ia' in 'mídia')
  const isTaiwan = /\b(taiwan|semicondutores|chips)\b/i.test(text) || text.includes('estreito de taiwan');
  const isJuros = /\b(juros?|selic|fed|copom|banco central)\b/i.test(text) || text.includes('infla');
  const isPetroleo = /\b(petr[oó]leo|opep|combust[ií]vel|energia|ormuz|ir[aã]|teer[aã]|paquist[aã]o|oriente m[eé]dio|guerra|conflito)\b/i.test(text);
  const isImposto = /\b(impostos?|tribut[aá]r[ií]o|fiscal|taxa[cç][aã]o|governo|reforma)\b/i.test(text);
  const isTech = /\b(ia|ai|nvidia|tecnologia|intelig[eê]ncia)\b/i.test(text);

  if (isTaiwan) {
    summary = 'O acirramento das tensões geopolíticas no Estreito de Taiwan impõe sérios riscos logísticos e operacionais na cadeia global de semicondutores. Empresas altamente dependentes de fundições de ponta (como NVDA e AAPL) sofrem risco crítico de supply-chain, enquanto ativos de commodities ou energia atuam como potenciais hedges defensivos em cenários de aversão ao risco severa.';
  } else if (isJuros) {
    summary = 'A perspectiva de manutenção de taxas de juros elevadas pelo Federal Reserve e Banco Central do Brasil eleva o custo de capital global, penalizando companhias de hipercrescimento com múltiplos elevados. Em contrapartida, instituições financeiras tradicionais e ativos de valor consolidado absorvem melhor a volatilidade, beneficiando-se de spreads mais largos ou fluxos de caixa resilientes.';
  } else if (isPetroleo) {
    summary = 'Instabilidade geopolítica nos principais polos produtores gera choques na oferta global de energia e combustíveis fósseis, impulsionando a cotação internacional do barril. Enquanto companhias do setor de energia tradicional (como PETR4) experimentam expressiva expansão de margens de lucro operacionais, setores intensivos em transporte, manufatura e tecnologia de consumo enfrentam pressões inflacionárias severas.';
  } else if (isImposto) {
    summary = 'A introdução de novos pacotes tributários ou alterações de política fiscal acarreta pressões imediatas sobre as margens operacionais de setores domésticos e multinacionais expostos a tarifas. A elevação tributária penaliza setores de consumo de alta elasticidade e manufatura de hardware, enquanto ativos atrelados a fluxos internacionais ou moedas fortes operam sob blindagem moderada.';
  } else if (isTech) {
    summary = 'A corrida global pela infraestrutura de Inteligência Artificial entra em nova fase de consolidação corporativa com fortes injeções de CAPEX pelas Big Techs. Fornecedores diretos de hardware de aceleração computacional e semicondutores (como NVDA) capturam fluxos massivos de receita, ao passo que empresas periféricas enfrentam competição acirrada por insumos.';
  } else {
    summary = 'Cenário de incerteza macroeconômica global eleva a volatilidade nos mercados de capitais e gera redistribuição tática de fluxo financeiro entre ativos de crescimento (Growth) e valor (Value). Setores cíclicos tradicionais apresentam comportamento defensivo, enquanto empresas de alta tecnologia de consumo mostram sensibilidade ampliada a ajustes de carteira globais.';
  }

  // Generate impact & reason per ticker based on theme
  holdings.forEach(h => {
    const ticker = h.ticker;
    let impact = 'neutral';
    let reason = 'Exposição moderada; dinâmicas micro operacionais específicas devem ditar o ritmo no curto prazo.';

    if (isTaiwan) {
      if (['NVDA', 'AAPL', 'AVGO', 'LITE', 'STX', 'SNDK'].includes(ticker)) {
        impact = 'critical';
        reason = 'Dependência crítica de chips da TSMC em Taiwan expõe a cadeia a risco absoluto.';
      } else if (['MSFT', 'GOOGL', 'META', 'PLTR'].includes(ticker)) {
        impact = 'high-risk';
        reason = 'A interrupção de hardware avançado compromete o ritmo de expansão do data center.';
      } else if (['PETR4', 'VALE3', 'ETHA'].includes(ticker)) {
        impact = 'positive';
        reason = 'Alta nos preços de commodities atua como hedge tático contra instabilidade internacional.';
      } else if (['GEV', 'WEGE3'].includes(ticker)) {
        impact = 'hedge';
        reason = 'Demanda por infraestrutura local de energia e segurança industrial cresce em crises.';
      } else if (['ITUB4', 'BBDC4', 'JPM', 'HSBC', 'OMF', 'FI'].includes(ticker)) {
        impact = 'neutral';
        reason = 'Margens bancárias resilientes; carteira sob flutuações macro limitadas nesta crise.';
      } else {
        impact = 'neutral';
        reason = 'Impacto direto secundário na operação core da empresa.';
      }
    } else if (isJuros) {
      if (['NVDA', 'TSLA', 'AAPL', 'MSFT', 'AVGO', 'PLTR'].includes(ticker)) {
        impact = 'high-risk';
        reason = 'Taxas mais altas reduzem o valor presente dos fluxos de caixa futuros projetados.';
      } else if (['ITUB4', 'BBDC4', 'JPM', 'HSBC', 'OMF'].includes(ticker)) {
        impact = 'positive';
        reason = 'Spreads de crédito mais amplos e receitas financeiras favorecidas por juros altos.';
      } else if (['ETHA'].includes(ticker)) {
        impact = 'critical';
        reason = 'Aumento do rendimento dos títulos de governo soberanos reduz atratividade de criptoativos.';
      } else if (['VALE3', 'PETR4', 'WEGE3', 'GEV'].includes(ticker)) {
        impact = 'hedge';
        reason = 'Fluxo de caixa robusto e forte pagamento de dividendos oferecem blindagem.';
      } else {
        impact = 'neutral';
        reason = 'Equilíbrio entre custos de captação e poder de repasse de preços ao consumidor.';
      }
    } else if (isPetroleo) {
      if (['PETR4'].includes(ticker)) {
        impact = 'positive';
        reason = 'Alta direta da commodity expande imediatamente a margem operacional e dividendos.';
      } else if (['VALE3', 'WEGE3', 'GEV'].includes(ticker)) {
        impact = 'hedge';
        reason = 'Ativos industriais e de materiais capturam resiliência estrutural em ciclo inflacionário.';
      } else if (['TSLA'].includes(ticker)) {
        impact = 'positive';
        reason = 'Combustível caro acelera a transição do consumidor para veículos elétricos e baterias.';
      } else if (['RCL'].includes(ticker)) {
        impact = 'critical';
        reason = 'Combustível de navio mais caro corrói diretamente as margens de lucro operacionais.';
      } else if (['AAPL', 'MSFT', 'NVDA', 'AVGO', 'STX'].includes(ticker)) {
        impact = 'high-risk';
        reason = 'Custo logístico elevado e compressão de renda disponível do consumidor mundial.';
      } else {
        impact = 'neutral';
        reason = 'Exposição neutra no curto prazo; custos repassados gradualmente ao cliente final.';
      }
    } else if (isImposto) {
      if (['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'WEGE3'].includes(ticker)) {
        impact = 'critical';
        reason = 'Carga tributária doméstica ampliada retira rentabilidade líquida passível de distribuição.';
      } else if (['AAPL', 'TSLA', 'AVGO'].includes(ticker)) {
        impact = 'high-risk';
        reason = 'Aumento de tarifas alfandegárias eleva o custo final dos produtos importados.';
      } else if (['MSFT', 'GOOGL', 'META'].includes(ticker)) {
        impact = 'hedge';
        reason = 'Modelo de negócios global intangível e caixa robusto oferecem forte resiliência.';
      } else if (['ETHA'].includes(ticker)) {
        impact = 'neutral';
        reason = 'Ativos descentralizados reagem de forma descorrelacionada à tributação corporativa.';
      } else {
        impact = 'neutral';
        reason = 'Impacto moderado; empresa ajustará estrutura societária ou repassará margem.';
      }
    } else if (isTech) {
      if (['NVDA', 'AVGO', 'LITE', 'STX', 'PLTR'].includes(ticker)) {
        impact = 'positive';
        reason = 'Demanda explosiva por infraestrutura de computação de alto desempenho e software AI.';
      } else if (['MSFT', 'GOOGL', 'META'].includes(ticker)) {
        impact = 'hedge';
        reason = 'Liderança estrutural em nuvem e ecossistema digital consolida posições fortes.';
      } else if (['AAPL'].includes(ticker)) {
        impact = 'neutral';
        reason = 'Evolução incremental de IA nos dispositivos locais gera receitas estáveis.';
      } else if (['TSLA'].includes(ticker)) {
        impact = 'high-risk';
        reason = 'Elevados investimentos necessários em supercomputação de condução autônoma geram custos.';
      } else {
        impact = 'neutral';
        reason = 'Impacto neutro; ganho indireto por meio de adoção de produtividade sistêmica.';
      }
    } else {
      // General macro scenario
      if (['VALE3', 'PETR4', 'WEGE3', 'GEV', 'JPM'].includes(ticker)) {
        impact = 'hedge';
        reason = 'Balanço sólido e forte geração de fluxo de caixa garantem proteção macro.';
      } else if (['NVDA', 'TSLA', 'RCL', 'LITE'].includes(ticker)) {
        impact = 'high-risk';
        reason = 'Maior sensibilidade cíclica e beta de mercado acentuado elevam a volatilidade.';
      } else if (['AAPL', 'MSFT', 'GOOGL', 'META', 'ITUB4', 'BBDC4'].includes(ticker)) {
        impact = 'positive';
        reason = 'Líderes de mercado atraem capital defensivo devido à alta previsibilidade operacional.';
      } else {
        impact = 'neutral';
        reason = 'Comportamento defensivo padrão com flutuações próximas à média do mercado.';
      }
    }

    tickersAnalysis.push({
      ticker,
      impact,
      reason
    });
  });

  return {
    summary,
    tickers: tickersAnalysis
  };
};

// High-Fidelity simulated offline news generation templates
const MOCK_NEWS_TEMPLATES = [
  {
    title: "Guidance operacional de IA impulsiona fornecedores de hardware e semicondutores",
    source: "Bloomberg FSI",
    summary: "Comentários favoráveis de grandes corporações sobre investimentos de CAPEX em tecnologia de nuvem e silício customizado geram fluxo de compras forte em ativos de infraestrutura computacional.",
    tags: ["NVDA", "AVGO", "STX", "PLTR"],
    impacts: { NVDA: "positive", AVGO: "positive", STX: "positive", PLTR: "positive" },
    scenario: "baseline",
    country: "US"
  },
  {
    title: "Tensões geopolíticas no Oriente Médio elevam preço do Brent acima de $85",
    source: "Reuters Business",
    summary: "O fluxo marítimo global enfrenta novas ameaças após pronunciamento oficial de restrição à navegação. Analistas projetam choques de custo logístico em cruzeiros e ganhos defensivos em geradoras e infraestrutura local.",
    tags: ["RCL", "GEV", "OMF", "PETR4"],
    impacts: { RCL: "critical", GEV: "positive", OMF: "high-risk", PETR4: "positive" },
    scenario: "iran",
    country: "US"
  },
  {
    title: "Federal Reserve adota cautela sobre inflação e sinaliza juros elevados persistentes",
    source: "WSJ Markets",
    summary: "Membros do FOMC expressaram receio sobre a resiliência dos preços no setor de serviços. Ativos de crédito registram ganhos nas margens financeiras líquidas, enquanto empresas de alto crescimento com múltiplos esticados sofrem volatilidade moderada.",
    tags: ["HSBC", "OMF", "PLTR", "META", "GOOGL"],
    impacts: { HSBC: "positive", OMF: "positive", PLTR: "negative", META: "negative", GOOGL: "neutral" },
    scenario: "rates",
    country: "US"
  },
  {
    title: "Avanço regulatório em terapias metabólicas globais gera otimismo no setor de saúde",
    source: "CNBC Healthcare",
    summary: "Novos resultados clínicos promissores e contratos de fornecimento estratégico sustentam a liderança e resiliência de grandes laboratórios como porto seguro defensivo contra volatilidade geopolítica.",
    tags: ["LLY"],
    impacts: { LLY: "positive" },
    scenario: "baseline",
    country: "US"
  },
  {
    title: "Capex de Big Techs em Inteligência Artificial deve atingir novo recorde em 2026",
    source: "TechCrunch AI",
    summary: "Provedores de serviços em nuvem anunciam ampliação nas aquisições de aceleradores e infraestrutura óptica. Margens industriais continuam superando as previsões mais otimistas de Wall Street.",
    tags: ["NVDA", "AVGO", "GOOGL", "META"],
    impacts: { NVDA: "positive", AVGO: "positive", GOOGL: "positive", META: "positive" },
    scenario: "baseline",
    country: "US"
  },
  {
    title: "Contratos governamentais bilionários impulsionam adoção corporativa de plataformas de dados",
    source: "Defense News",
    summary: "A integração de inteligência analítica em larga escala em infraestruturas públicas garante receitas estáveis de longo prazo e valida o papel tático dos novos sistemas preditivos.",
    tags: ["PLTR"],
    impacts: { PLTR: "positive" },
    scenario: "baseline",
    country: "US"
  },
  {
    title: "Ata do COPOM indica preocupação fiscal e sinaliza Selic estável por mais tempo",
    source: "Valor Econômico",
    summary: "O Comitê de Política Monetária reafirmou a importância de âncoras fiscais sólidas para ancorar expectativas inflacionárias. Instituições bancárias brasileiras operam com spreads saudáveis e carteiras de crédito robustas.",
    tags: ["ITUB4", "BBDC4"],
    impacts: { ITUB4: "positive", BBDC4: "positive" },
    scenario: "selic",
    country: "BR"
  },
  {
    title: "Preço do minério de ferro reage na bolsa de Dalian após anúncios de incentivo econômico",
    source: "InfoMoney",
    summary: "Novas medidas de estímulo à infraestrutura e habitação impulsionam compras físicas de matérias-primas básicas. Exportadoras brasileiras capturam elevação nos preços e anunciam novos patamares de geração de caixa.",
    tags: ["VALE3"],
    impacts: { VALE3: "positive" },
    scenario: "commodities",
    country: "BR"
  },
  {
    title: "Petrobras bate recorde operacional de extração em blocos profundos do pré-sal",
    source: "Estadão Economia",
    summary: "A estatal reportou eficiência operacional máxima em meio a flutuações nas cotações de referência internacional. Forte dividend yield projeta atratividade ampliada perante fundos internacionais.",
    tags: ["PETR4"],
    impacts: { PETR4: "positive" },
    scenario: "oil",
    country: "BR"
  },
  {
    title: "Expansão de parques industriais globais acelera pedidos de bens de capital e equipamentos",
    source: "Exame",
    summary: "Empresas com exposição industrial internacional e alto retorno sobre capital investido (ROIC) colhem frutos da descarbonização global, expandindo plantas e receitas dolarizadas.",
    tags: ["WEGE3"],
    impacts: { WEGE3: "positive" },
    scenario: "baseline",
    country: "BR"
  },
  {
    title: "B3 registra fluxo positivo de investimentos internacionais no mercado secundário",
    source: "G1 Economia",
    summary: "Investidores estrangeiros ampliam a exposição a papéis de valor altamente líquidos na bolsa brasileira. Múltiplos atraentes e yields saudáveis continuam sustentando a atração de capital global.",
    tags: ["ITUB4", "VALE3", "PETR4", "WEGE3"],
    impacts: { ITUB4: "positive", VALE3: "positive", PETR4: "positive", WEGE3: "positive" },
    scenario: "baseline",
    country: "BR"
  }
];

const generateMockNewsFeed = (activeHoldings) => {
  const activeTickers = activeHoldings.map(h => h.ticker);
  
  if (activeTickers.length === 0) {
    return MOCK_NEWS_TEMPLATES.sort(() => 0.5 - Math.random()).slice(0, 4).map((item, idx) => ({
      ...item,
      id: 2000 + idx,
      time: `${idx * 15 + 5}min atrás`
    }));
  }

  const matchingTemplates = MOCK_NEWS_TEMPLATES.filter(t => t.tags.some(tag => activeTickers.includes(tag)));
  const pool = matchingTemplates.length > 0 ? matchingTemplates : MOCK_NEWS_TEMPLATES;

  const chosen = [...pool].sort(() => 0.5 - Math.random()).slice(0, 4);

  while (chosen.length < 4 && chosen.length < MOCK_NEWS_TEMPLATES.length) {
    const nextItem = MOCK_NEWS_TEMPLATES.find(t => !chosen.some(c => c.title === t.title));
    if (nextItem) {
      chosen.push(nextItem);
    } else {
      break;
    }
  }

  return chosen.sort(() => 0.5 - Math.random()).map((item, idx) => {
    const minutes = Math.floor(Math.random() * 15) + idx * 20 + 3;
    const timeStr = minutes < 60 ? `${minutes}min atrás` : `${Math.floor(minutes/60)}h atrás`;
    return {
      ...item,
      id: 3000 + idx + (Date.now() % 1000),
      time: timeStr
    };
  });
};

export default function PortfolioTracker({
  apiKey,
  setApiKey,
  apiMode,
  setApiMode,
} = {}) {
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
  const [dividendsInput, setDividendsInput] = useState('');
  
  const [editingKey, setEditingKey] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editAvgPrice, setEditAvgPrice] = useState('');
  const [editDividends, setEditDividends] = useState('');

  const [hideValues, setHideValues] = useState(() => {
    return localStorage.getItem('fsi_hide_values') === 'true';
  });

  const [adjustWithDividends, setAdjustWithDividends] = useState(() => {
    return localStorage.getItem('fsi_adjust_with_dividends') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('fsi_adjust_with_dividends', adjustWithDividends ? 'true' : 'false');
  }, [adjustWithDividends]);

  const [cashTastyTrade, setCashTastyTrade] = useState(() => {
    try {
      const saved = localStorage.getItem('fsi_cash_tastytrade');
      return saved ? parseFloat(saved) : 0;
    } catch (e) {
      return 0;
    }
  });

  const [cashAvenue, setCashAvenue] = useState(() => {
    try {
      const saved = localStorage.getItem('fsi_cash_avenue');
      return saved ? parseFloat(saved) : 0;
    } catch (e) {
      return 0;
    }
  });

  const [isEditingCash, setIsEditingCash] = useState(false);
  const [tempTastyTrade, setTempTastyTrade] = useState('');
  const [tempAvenue, setTempAvenue] = useState('');

  const handleStartEditingCash = () => {
    setTempTastyTrade(String(cashTastyTrade || ''));
    setTempAvenue(String(cashAvenue || ''));
    setIsEditingCash(true);
  };

  const handleSaveCash = () => {
    const valTasty = parseFloat(tempTastyTrade);
    const parsedTasty = isNaN(valTasty) ? 0 : Math.max(0, valTasty);

    const valAvenue = parseFloat(tempAvenue);
    const parsedAvenue = isNaN(valAvenue) ? 0 : Math.max(0, valAvenue);

    setCashTastyTrade(parsedTasty);
    localStorage.setItem('fsi_cash_tastytrade', String(parsedTasty));

    setCashAvenue(parsedAvenue);
    localStorage.setItem('fsi_cash_avenue', String(parsedAvenue));

    setIsEditingCash(false);

    // Dispatch sync event
    window.dispatchEvent(new CustomEvent('portfolio_updated'));
  };

  const handleCancelEditingCash = () => {
    setIsEditingCash(false);
  };

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const savedTasty = localStorage.getItem('fsi_cash_tastytrade');
        const parsedTasty = savedTasty ? parseFloat(savedTasty) : 0;
        const savedAvenue = localStorage.getItem('fsi_cash_avenue');
        const parsedAvenue = savedAvenue ? parseFloat(savedAvenue) : 0;

        setCashTastyTrade(parsedTasty);
        setCashAvenue(parsedAvenue);

        if (!isEditingCash) {
          setTempTastyTrade(String(parsedTasty || ''));
          setTempAvenue(String(parsedAvenue || ''));
        }
      } catch (e) {
        console.error('Failed to sync cash', e);
      }
    };
    window.addEventListener('portfolio_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('portfolio_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [isEditingCash]);

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
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('fsi_api_key') || localStorage.getItem('fsi_gemini_api_key') || '';
  });
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customScenario, setCustomScenario] = useState('');
  const [isSimulatingNews, setIsSimulatingNews] = useState(false);
  const [newsSimError, setNewsSimError] = useState('');
  const [aiReport, setAiReport] = useState(null);
  const [showOfflineFallback, setShowOfflineFallback] = useState(false);

  // Dynamic news feed state & loaders
  const [newsFeed, setNewsFeed] = useState(() => [
    ...SAMPLE_NEWS.map(n => ({ ...n, country: 'US' })),
    ...BR_NEWS.map(n => ({ ...n, country: 'BR' }))
  ]);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [newsLastUpdated, setNewsLastUpdated] = useState(() => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [activeNewsArticle, setActiveNewsArticle] = useState(null);

  // Keep state in sync with external settings modal updates
  useEffect(() => {
    if (apiKey) {
      setGeminiApiKey(apiKey);
    }
  }, [apiKey]);

  const analyzeScenarioWithGemini = async (scenarioText) => {
    if (!scenarioText || !scenarioText.trim()) {
      setNewsSimError('Por favor, digite um cenário válido para simulação.');
      return;
    }

    const activeMode = apiMode || localStorage.getItem('fsi_api_mode') || 'simulated';
    const activeKey = apiKey || localStorage.getItem('fsi_api_key') || localStorage.getItem('fsi_gemini_api_key') || geminiApiKey;
    
    setIsSimulatingNews(true);
    setNewsSimError('');
    setAiReport(null);
    setShowOfflineFallback(false);

    // Se estiver em modo gemini, a chave de API deve ser válida e presente. Caso contrário, gera erro explícito.
    if (activeMode === 'gemini') {
      if (!activeKey || activeKey === 'AIzaSyA1xH6yLCDnzb4DQTakG-QL04HHV_5JNN8' || activeKey === 'AIzaSyBLs097x8ty9nuj5sJYtp_7FOq5xLt-Mnw') {
        setNewsSimError('Erro: Chave API do Gemini ausente ou inválida. Por favor, configure uma chave Gemini ativa no menu de Configurações no canto superior direito para poder utilizar o modo Gemini AI Ativo.');
        setIsSimulatingNews(false);
        return;
      }
    }

    // Se estiver em modo simulado, usa a simulação local diretamente
    if (activeMode === 'simulated') {
      await new Promise(resolve => setTimeout(resolve, 1200)); // Premium processing delay
      try {
        const report = generateMockCognitiveReport(scenarioText, activeHoldings);
        setAiReport(report);
        setSuccessMessage('Simulação concluída com sucesso (Processada via Simulação Local/Offline)!');
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch (err) {
        setNewsSimError(`Erro ao gerar simulação offline: ${err.message}`);
      } finally {
        setIsSimulatingNews(false);
      }
      return;
    }
    
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

INSTRUÇÃO CRÍTICA DE ESCOPO: Limite a sua análise geopolítica estritamente ao evento e aos países/regiões explicitamente mencionados na notícia. NÃO mencione e NÃO traga à tona crises, países ou cenários adicionais que não constem na notícia (por exemplo, se a notícia fala apenas de tensões ou conflitos envolvendo o Irã, o Paquistão, o Estreito de Ormuz ou os EUA, NÃO mencione, NÃO traga à tona e NÃO invente tensões ou crises envolvendo a China, Taiwan, TSMC ou suprimento de semicondutores/chips asiáticos sob hipótese alguma. Mantenha o foco 100% no contexto geopolítico fornecido).

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
      const url = `${baseUrl}/v1beta/models/gemini-flash-latest:generateContent?key=${activeKey}`;
      
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
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${activeKey}`;
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
      
      const parsedData = cleanAndParseJSON(resText);
      setAiReport(parsedData);
      setSuccessMessage('Simulação concluída com sucesso (Processada via Gemini AI Ativa)!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      const isConnectionError = err.message.toLowerCase().includes('failed to fetch') || 
                                 err.message.toLowerCase().includes('network error') ||
                                 err.message.toLowerCase().includes('cors') ||
                                 err.message.toLowerCase().includes('load failed') ||
                                 err.message.toLowerCase().includes('404') ||
                                 err.message.toLowerCase().includes('not found') ||
                                 err.message.toLowerCase().includes('not supported for generatecontent');

      const isKeyBlocked = err.message.toLowerCase().includes('leaked') || 
                           err.message.toLowerCase().includes('invalid key') || 
                           err.message.toLowerCase().includes('key not valid') ||
                           err.message.toLowerCase().includes('api_key_invalid') ||
                           err.message.toLowerCase().includes('api key') ||
                           (err.message.toLowerCase().includes('403') && !err.message.toLowerCase().includes('model') && !err.message.toLowerCase().includes('quota'));
      
      if (isKeyBlocked) {
        setNewsSimError('A chave API do Gemini foi rejeitada pelo Google (ou relatada como vazada/inválida).');
        setShowOfflineFallback(true);
      } else if (isConnectionError) {
        setNewsSimError('Falha na simulação: Erro de conexão, erro de roteamento (ex: modelo inexistente no v1beta) ou bloqueio de CORS. Certifique-se de que a aplicação está sendo servida pelo Vite (ex: executando "npm run dev") para que as requisições passem pelo proxy reverso "/api-proxy/gm". Se a aplicação for aberta como arquivo estático ou sem o servidor ativo, o navegador impedirá o acesso direto à API do Google.');
      } else {
        setNewsSimError(`Falha na simulação: ${err.message}`);
      }
    } finally {
      setIsSimulatingNews(false);
    }
  };

  const handleRefreshNews = async () => {
    setIsRefreshingNews(true);
    setErrorMessage('');
    setSuccessMessage('');

    const activeMode = apiMode || localStorage.getItem('fsi_api_mode') || 'simulated';
    const activeKey = apiKey || localStorage.getItem('fsi_api_key') || localStorage.getItem('fsi_gemini_api_key') || geminiApiKey;

    // Build active holdings text context
    const holdingsData = activeHoldings.map(h => {
      const totalVal = activeHoldings.reduce((acc, curr) => acc + curr.currentValuation, 0);
      const share = totalVal > 0 ? (h.currentValuation / totalVal) * 100 : 0;
      return `${h.ticker} (${h.name}, participacao: ${share.toFixed(1)}%)`;
    }).join(', ');

    if (activeMode === 'gemini') {
      if (!activeKey || activeKey === 'AIzaSyA1xH6yLCDnzb4DQTakG-QL04HHV_5JNN8' || activeKey === 'AIzaSyBLs097x8ty9nuj5sJYtp_7FOq5xLt-Mnw') {
        setErrorMessage('Erro: Chave API do Gemini ausente ou inválida. Por favor, configure uma chave Gemini ativa no menu de Configurações para poder atualizar via Gemini.');
        setIsRefreshingNews(false);
        return;
      }

      const promptText = `Você é um correspondente financeiro e analista macroeconômico sênior. 
Gere um conjunto de 4 notícias recentes e altamente realistas escritas em português, focando em eventos macroeconômicos globais e brasileiros que impactam diretamente a seguinte carteira de investimentos ativa do usuário: [ ${holdingsData} ]

Cada notícia deve ter o potencial de influenciar significativamente a precificação ou risco de um ou mais ativos dessa carteira. 

A notícia deve ser estruturada estritamente de acordo com o seguinte formato JSON, retornando um array de objetos que atenda às seguintes condições:
1. Pelo menos 2 notícias com "country": "BR" (se houver ativos brasileiros na carteira) e pelo menos 2 notícias com "country": "US" (se houver ativos dos EUA na carteira). Se houver apenas uma das classes, gere todas as 4 focadas nesse mercado.
2. As tags de cada notícia devem corresponder EXATAMENTE a tickers presentes na carteira fornecida.
3. O campo "scenario" deve ser um dos seguintes: "taiwan", "iran", "rates", "selic", "baseline", "commodities", "oil".
4. O campo "impacts" é um objeto que mapeia cada ticker listado nas "tags" ao seu respectivo impacto, que deve ser um dos: "critical", "high-risk", "positive", "hedge", "neutral".

Exemplo do formato JSON estrito esperado (NÃO inclua marcações de markdown de código, crases, \`\`\`json ou qualquer outro texto explicativo fora do JSON):
[
  {
    "id": 1001,
    "title": "Ata do COPOM indica preocupação fiscal e sinaliza Selic estável",
    "source": "Valor Econômico",
    "time": "Agora mesmo",
    "summary": "O Comitê de Política Monetária reafirmou a importância de âncoras fiscais sólidas.",
    "tags": ["ITUB4", "BBDC4"],
    "impacts": { "ITUB4": "positive", "BBDC4": "positive" },
    "scenario": "selic",
    "country": "BR"
  }
]`;

      try {
        const baseUrl = typeof window !== 'undefined' ? '/api-proxy/gm' : 'https://generativelanguage.googleapis.com';
        const url = `${baseUrl}/v1beta/models/gemini-flash-latest:generateContent?key=${activeKey}`;
        
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
          console.warn('[Proxy Fallback] Local proxy failed for Gemini news. Falling back to direct URL.', err);
          const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${activeKey}`;
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
          throw new Error(`HTTP ${response.status}`);
        }

        const resData = await response.json();
        const resText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!resText) {
          throw new Error('Formato de resposta inválido recebido da API Gemini.');
        }

        const parsedData = cleanAndParseJSON(resText);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setNewsFeed(parsedData);
          setNewsLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setSuccessMessage('Feed de Notícias atualizado com sucesso via Gemini AI Ativo!');
        } else {
          throw new Error('Formato JSON de notícias inválido retornado.');
        }
      } catch (err) {
        console.warn('Gemini news refresh failed, falling back to simulated news generation', err);
        const simulated = generateMockNewsFeed(activeHoldings);
        setNewsFeed(simulated);
        setNewsLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setSuccessMessage('Feed de Notícias atualizado via Simulação Local (Fallback do Gemini)!');
      } finally {
        setIsRefreshingNews(false);
        setTimeout(() => {
          setSuccessMessage('');
          setErrorMessage('');
        }, 4000);
      }
      return;
    }

    // Modo Offline (Simulação)
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay premium de carregamento
    try {
      const simulated = generateMockNewsFeed(activeHoldings);
      setNewsFeed(simulated);
      setNewsLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setSuccessMessage('Feed de Notícias atualizado via Simulação Local!');
    } catch (err) {
      setErrorMessage(`Erro ao gerar notícias locais: ${err.message}`);
    } finally {
      setIsRefreshingNews(false);
      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 4000);
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

  // Auto-refresh news feed silently on mount (1.5s delay to let positions settle)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRefreshNews();
    }, 1500);
    return () => clearTimeout(timer);
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
      // Para ativos customizados sem metadados locais, busca fundamentos reais via Gemini AI em background
      const geminiKey = localStorage.getItem('fsi_api_key') || localStorage.getItem('fsi_gemini_api_key') || import.meta.env.VITE_GEMINI || '';
      if (geminiKey) {
        tickers.forEach(async (t) => {
          if (!REAL_TICKERS[t]) {
            try {
              const cachedComp = JSON.parse(localStorage.getItem('fsi_companies_cache') || '{}');
              if (!cachedComp[t]) {
                await fetchCompanyFundamentalsViaGemini(t, geminiKey);
                setPriceUpdateTrigger(prev => prev + 1);
              }
            } catch (e) {
              // Silencioso
            }
          }
        });
      }

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
      // Obter parâmetros de risco (stop loss) do localStorage
      let riskParams = {};
      try {
        const savedParams = localStorage.getItem('fsi_portfolio_risk_parameters');
        if (savedParams) {
          riskParams = JSON.parse(savedParams);
        }
      } catch (e) {
        console.error("Erro ao ler fsi_portfolio_risk_parameters do localStorage", e);
      }

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        exchangeRate: usdToBrlInput,
        ledgerUs,
        ledgerBr,
        cashTastyTrade,
        cashAvenue,
        riskParams
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
          if (asset.dividends !== undefined) {
            const divs = parseFloat(asset.dividends);
            if (isNaN(divs) || divs < 0) {
              throw new Error(`Dados de dividendos inválidos para ${ticker} na carteira EUA.`);
            }
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
          if (asset.dividends !== undefined) {
            const divs = parseFloat(asset.dividends);
            if (isNaN(divs) || divs < 0) {
              throw new Error(`Dados de dividendos inválidos para ${ticker} na carteira Brasil.`);
            }
          }
        }

        // Sanitize to standard upgraded schema
        const sanitizedUs = {};
        for (const ticker of Object.keys(parsed.ledgerUs)) {
          const asset = parsed.ledgerUs[ticker];
          sanitizedUs[ticker] = {
            ticker: asset.ticker,
            qty: parseFloat(asset.qty),
            avgPrice: parseFloat(asset.avgPrice),
            dividends: asset.dividends !== undefined ? parseFloat(asset.dividends) : 0
          };
        }

        const sanitizedBr = {};
        for (const ticker of Object.keys(parsed.ledgerBr)) {
          const asset = parsed.ledgerBr[ticker];
          sanitizedBr[ticker] = {
            ticker: asset.ticker,
            qty: parseFloat(asset.qty),
            avgPrice: parseFloat(asset.avgPrice),
            dividends: asset.dividends !== undefined ? parseFloat(asset.dividends) : 0
          };
        }

        // Apply state changes if everything is valid
        setLedgerUs(sanitizedUs);
        setLedgerBr(sanitizedBr);

        if (parsed.exchangeRate) {
          const rate = parseFloat(parsed.exchangeRate);
          if (!isNaN(rate) && rate > 0) {
            setUsdToBrlInput(parsed.exchangeRate);
            localStorage.setItem('fsi_usd_to_brl', parsed.exchangeRate);
          }
        }

        // Import cash values if present in the backup
        if (parsed.cashTastyTrade !== undefined) {
          const tastyVal = parseFloat(parsed.cashTastyTrade);
          if (!isNaN(tastyVal)) {
            const val = Math.max(0, tastyVal);
            setCashTastyTrade(val);
            localStorage.setItem('fsi_cash_tastytrade', String(val));
          }
        }
        if (parsed.cashAvenue !== undefined) {
          const avenueVal = parseFloat(parsed.cashAvenue);
          if (!isNaN(avenueVal)) {
            const val = Math.max(0, avenueVal);
            setCashAvenue(val);
            localStorage.setItem('fsi_cash_avenue', String(val));
          }
        }

        // Import risk parameters if present in the backup
        if (parsed.riskParams && typeof parsed.riskParams === 'object') {
          const importedRiskParams = {};
          for (const ticker of Object.keys(parsed.riskParams)) {
            const param = parsed.riskParams[ticker];
            if (param && typeof param === 'object') {
              importedRiskParams[ticker] = {};
              if (param.stopPrice !== undefined && param.stopPrice !== null) {
                const sp = parseFloat(param.stopPrice);
                if (!isNaN(sp)) {
                  importedRiskParams[ticker].stopPrice = Math.max(0, sp);
                }
              }
            }
          }
          localStorage.setItem('fsi_portfolio_risk_parameters', JSON.stringify(importedRiskParams));
        }

        // Explicitly write to localStorage to prevent race conditions during updates
        localStorage.setItem('fsi_user_portfolio_ledger_us', JSON.stringify(sanitizedUs));
        localStorage.setItem('fsi_user_portfolio_ledger_br', JSON.stringify(sanitizedBr));

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
    const divs = parseFloat(dividendsInput) || 0;

    if (!symbol || isNaN(qty) || qty <= 0 || isNaN(avg) || avg <= 0 || isNaN(divs) || divs < 0) {
      alert("Por favor, preencha todos os campos com valores válidos maiores ou iguais a zero.");
      return;
    }

    if (activePortfolio === 'US') {
      const updated = {
        ...ledgerUs,
        [symbol]: { ticker: symbol, qty, avgPrice: avg, dividends: divs }
      };
      setLedgerUs(updated);
    } else if (activePortfolio === 'BR') {
      const updated = {
        ...ledgerBr,
        [symbol]: { ticker: symbol, qty, avgPrice: avg, dividends: divs }
      };
      setLedgerBr(updated);
    }
    
    setTickerInput('');
    setQtyInput('');
    setAvgPriceInput('');
    setDividendsInput('');

    // Dispara a atualização imediata das cotações incluindo o novo ativo recém-adicionado
    setTimeout(() => {
      handleRefreshPrices();
    }, 150);
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
    const nativePrice = item.avgPriceNative !== undefined ? item.avgPriceNative : item.avgPrice;
    setEditAvgPrice(nativePrice.toString());
    const divsVal = item.dividendsNative !== undefined ? item.dividendsNative : (item.dividends || 0);
    setEditDividends(divsVal.toString());
  };

  // Salvar edição
  const saveEditing = (symbol) => {
    const qty = parseFloat(editQty);
    const avg = parseFloat(editAvgPrice);
    const divs = parseFloat(editDividends) || 0;

    if (isNaN(qty) || qty <= 0 || isNaN(avg) || avg <= 0 || isNaN(divs) || divs < 0) {
      alert("Por favor, digite valores válidos maiores ou iguais a zero.");
      return;
    }

    if (activePortfolio === 'US') {
      const updated = {
        ...ledgerUs,
        [symbol]: { ticker: symbol, qty, avgPrice: avg, dividends: divs }
      };
      setLedgerUs(updated);
    } else {
      const updated = {
        ...ledgerBr,
        [symbol]: { ticker: symbol, qty, avgPrice: avg, dividends: divs }
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
    const code = currencyCode || globalCurrency;
    if (hideValues) {
      return code === 'BRL' ? 'R$ ••••' : '$ ••••';
    }
    if (code === 'BRL') {
      return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Cálculos consolidados da carteira EUA (USD) - NATIVO
  const holdingsUsNative = Object.values(ledgerUs).map(item => {
    const comp = fetchCompanyData(item.ticker);
    const divs = parseFloat(item.dividends) || 0;
    const rawAvgPrice = item.avgPrice;
    
    // Calcula o preço médio ajustado (abate de dividendos)
    const adjustedAvgPrice = item.qty > 0 ? Math.max(0, rawAvgPrice - divs / item.qty) : rawAvgPrice;
    const activeAvgPrice = adjustWithDividends ? adjustedAvgPrice : rawAvgPrice;
    
    const invested = item.qty * activeAvgPrice;
    const currentVal = item.qty * comp.price;
    const profitLoss = currentVal - invested;
    const profitLossPct = invested > 0 ? (profitLoss / invested) * 100 : 0;
    
    const charCodeSum = item.ticker.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const simulatedDailyChange = parseFloat((-1.8 + (charCodeSum % 40) * 0.1).toFixed(2)); 
    const dailyChangeVal = currentVal * (simulatedDailyChange / 100);

    return {
      ...item,
      dividends: divs,
      rawAvgPrice: rawAvgPrice,
      adjustedAvgPrice: adjustedAvgPrice,
      avgPrice: activeAvgPrice,
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

  const totalInvestedUsNative = holdingsUsNative.reduce((acc, h) => acc + h.investedCost, 0);
  const totalValuationUsNative = holdingsUsNative.reduce((acc, h) => acc + h.currentValuation, 0);
  const totalProfitLossUsNative = totalValuationUsNative - totalInvestedUsNative;
  const totalProfitLossPctUsNative = totalInvestedUsNative > 0 ? (totalProfitLossUsNative / totalInvestedUsNative) * 100 : 0;
  const totalDailyChangeValUsNative = holdingsUsNative.reduce((acc, h) => acc + h.dailyChangeVal, 0);

  // holdingsUs convertido para visualização
  const holdingsUs = holdingsUsNative.map(h => {
    const multiplier = globalCurrency === 'BRL' ? USD_TO_BRL : 1;
    return {
      ...h,
      avgPriceNative: h.rawAvgPrice,
      dividendsNative: h.dividends,
      avgPrice: h.avgPrice * multiplier,
      rawAvgPrice: h.rawAvgPrice * multiplier,
      adjustedAvgPrice: h.adjustedAvgPrice * multiplier,
      dividends: h.dividends * multiplier,
      investedCost: h.investedCost * multiplier,
      currentPrice: h.currentPrice * multiplier,
      currentValuation: h.currentValuation * multiplier,
      profitLoss: h.profitLoss * multiplier,
      dailyChangeVal: h.dailyChangeVal * multiplier,
      currency: globalCurrency
    };
  });

  const totalInvestedUs = holdingsUs.reduce((acc, h) => acc + h.investedCost, 0);
  const totalValuationUs = holdingsUs.reduce((acc, h) => acc + h.currentValuation, 0);
  const totalProfitLossUs = totalValuationUs - totalInvestedUs;
  const totalProfitLossPctUs = totalInvestedUs > 0 ? (totalProfitLossUs / totalInvestedUs) * 100 : 0;
  const totalDailyChangeValUs = holdingsUs.reduce((acc, h) => acc + h.dailyChangeVal, 0);

  // Cálculos consolidados da carteira Brasil (BRL) - NATIVO
  const holdingsBrNative = Object.values(ledgerBr).map(item => {
    const comp = fetchCompanyData(item.ticker);
    const divs = parseFloat(item.dividends) || 0;
    const rawAvgPrice = item.avgPrice;
    
    // Calcula o preço médio ajustado (abate de dividendos)
    const adjustedAvgPrice = item.qty > 0 ? Math.max(0, rawAvgPrice - divs / item.qty) : rawAvgPrice;
    const activeAvgPrice = adjustWithDividends ? adjustedAvgPrice : rawAvgPrice;
    
    const invested = item.qty * activeAvgPrice;
    const currentVal = item.qty * comp.price;
    const profitLoss = currentVal - invested;
    const profitLossPct = invested > 0 ? (profitLoss / invested) * 100 : 0;
    
    const charCodeSum = item.ticker.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    const simulatedDailyChange = parseFloat((-1.8 + (charCodeSum % 40) * 0.1).toFixed(2));
    const dailyChangeVal = currentVal * (simulatedDailyChange / 100);

    return {
      ...item,
      dividends: divs,
      rawAvgPrice: rawAvgPrice,
      adjustedAvgPrice: adjustedAvgPrice,
      avgPrice: activeAvgPrice,
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

  const totalInvestedBrNative = holdingsBrNative.reduce((acc, h) => acc + h.investedCost, 0);
  const totalValuationBrNative = holdingsBrNative.reduce((acc, h) => acc + h.currentValuation, 0);
  const totalProfitLossBrNative = totalValuationBrNative - totalInvestedBrNative;
  const totalProfitLossPctBrNative = totalInvestedBrNative > 0 ? (totalProfitLossBrNative / totalInvestedBrNative) * 100 : 0;
  const totalDailyChangeValBrNative = holdingsBrNative.reduce((acc, h) => acc + h.dailyChangeVal, 0);

  // holdingsBr convertido para visualização
  const holdingsBr = holdingsBrNative.map(h => {
    const multiplier = globalCurrency === 'USD' ? (1 / USD_TO_BRL) : 1;
    return {
      ...h,
      avgPriceNative: h.rawAvgPrice,
      dividendsNative: h.dividends,
      avgPrice: h.avgPrice * multiplier,
      rawAvgPrice: h.rawAvgPrice * multiplier,
      adjustedAvgPrice: h.adjustedAvgPrice * multiplier,
      dividends: h.dividends * multiplier,
      investedCost: h.investedCost * multiplier,
      currentPrice: h.currentPrice * multiplier,
      currentValuation: h.currentValuation * multiplier,
      profitLoss: h.profitLoss * multiplier,
      dailyChangeVal: h.dailyChangeVal * multiplier,
      currency: globalCurrency
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
      return {
        ...h,
        investedCostGlobal: h.investedCost,
        currentValuationGlobal: h.currentValuation,
        profitLossGlobal: h.profitLoss,
        dailyChangeValGlobal: h.dailyChangeVal
      };
    }),
    ...holdingsBr.map(h => {
      return {
        ...h,
        investedCostGlobal: h.investedCost,
        currentValuationGlobal: h.currentValuation,
        profitLossGlobal: h.profitLoss,
        dailyChangeValGlobal: h.dailyChangeVal
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
      } else if (sortField === 'dividends') {
        aVal = a.dividends || 0;
        bVal = b.dividends || 0;
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

  // Dynamic Cash & Liquidity calculations in display currency
  const cashDetails = React.useMemo(() => {
    const multiplier = globalCurrency === 'BRL' ? usdToBrl : 1;
    const displayTasty = cashTastyTrade * multiplier;
    const displayAvenue = cashAvenue * multiplier;
    const totalCash = displayTasty + displayAvenue;
    const activeCash = activePortfolio === 'BR' ? 0 : totalCash;
    const consolidatedWealth = activeCash + totalValuation;

    return {
      displayTasty,
      displayAvenue,
      totalCash,
      activeCash,
      totalInvestments: totalValuation,
      consolidatedWealth
    };
  }, [cashTastyTrade, cashAvenue, totalValuation, activePortfolio, globalCurrency, usdToBrl]);

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
  const ALL_NEWS = newsFeed;

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
              {hideValues ? '••••' : `${globalCurrency === 'USD' ? '$' : 'R$'}${(totalValuation / 1000).toFixed(1)}K`}
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

  const activeMode = apiMode || localStorage.getItem('fsi_api_mode') || 'simulated';
  const activeKey = apiKey || localStorage.getItem('fsi_api_key') || localStorage.getItem('fsi_gemini_api_key') || geminiApiKey;

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

          <div style={styles.currencyToggleContainer}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>MOEDA EXIBIÇÃO:</span>
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

          <div style={styles.currencyToggleContainer}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>ABATER DIVIDENDOS:</span>
            <div style={styles.toggleGroup}>
              <button 
                onClick={() => setAdjustWithDividends(false)} 
                style={{ 
                  ...styles.toggleBtn, 
                  ...(!adjustWithDividends ? { ...styles.toggleBtnActive, background: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1' } : {}) 
                }}
              >
                Sem
              </button>
              <button 
                onClick={() => setAdjustWithDividends(true)} 
                style={{ 
                  ...styles.toggleBtn, 
                  ...(adjustWithDividends ? { ...styles.toggleBtnActive, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' } : {}) 
                }}
              >
                Com
              </button>
            </div>
          </div>

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
              <strong style={styles.custodyValueUsd}>{formatVal(totalValuationUsNative, 'USD')}</strong>
            </div>
            <div style={styles.custodyRow}>
              <span style={styles.custodyLabel}>Custo Médio:</span>
              <span style={styles.custodyText}>{formatVal(totalInvestedUsNative, 'USD')}</span>
            </div>
            <div style={styles.custodyRow}>
              <span style={styles.custodyLabel}>Retorno Histórico:</span>
              <span style={{ color: totalProfitLossUsNative >= 0 ? '#10b981' : '#f43f5e', fontWeight: 'bold' }}>
                {totalProfitLossUsNative >= 0 ? '+' : ''}{formatVal(totalProfitLossUsNative, 'USD')} ({totalProfitLossPctUsNative.toFixed(2)}%)
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
              <strong style={styles.custodyValueBrl}>{formatVal(totalValuationBrNative, 'BRL')}</strong>
            </div>
            <div style={styles.custodyRow}>
              <span style={styles.custodyLabel}>Custo Médio:</span>
              <span style={styles.custodyText}>{formatVal(totalInvestedBrNative, 'BRL')}</span>
            </div>
            <div style={styles.custodyRow}>
              <span style={styles.custodyLabel}>Retorno Histórico:</span>
              <span style={{ color: totalProfitLossBrNative >= 0 ? '#10b981' : '#f43f5e', fontWeight: 'bold' }}>
                {totalProfitLossBrNative >= 0 ? '+' : ''}{formatVal(totalProfitLossBrNative, 'BRL')} ({totalProfitLossPctBrNative.toFixed(2)}%)
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
              {activePortfolio === 'BR' ? 'Patrimônio da Carteira' : 'Patrimônio Consolidado'}
            </span>
            <span style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Valuation</span>
          </div>
          <span style={styles.kpiValue}>
            {formatVal(activePortfolio === 'BR' ? totalValuation : cashDetails.consolidatedWealth)}
          </span>
          <span style={styles.kpiDesc}>
            {activePortfolio === 'BR' 
              ? 'Patrimônio totalizado com base nas cotações de mercado' 
              : 'Soma de investimentos + caixa total disponível'}
          </span>
        </div>

        {activePortfolio !== 'BR' && (
          <div style={{ ...styles.kpiCard, borderLeft: '4px solid #38bdf8' }} className="glass-panel">
            <div style={styles.kpiMeta}>
              <span style={styles.kpiTitle}>Caixa Total Disponível</span>
              <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Caixa</span>
            </div>
            <span style={styles.kpiValue}>{formatVal(cashDetails.totalCash)}</span>
            <span style={styles.kpiDesc}>
              TastyTrade: {formatVal(cashDetails.displayTasty)} | Avenue: {formatVal(cashDetails.displayAvenue)}
            </span>
          </div>
        )}

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

      {/* Cash Management Panel */}
      {activePortfolio !== 'BR' && (
        <div style={styles.cashPanel} className="glass-panel">
          <div style={styles.cashHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} color="#38bdf8" />
              <div>
                <h3 style={styles.cashTitle}>Caixa e Liquidez Disponível</h3>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0, marginTop: 2 }}>Informe seus saldos em caixa para ter a visão consolidada do portfólio</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
              {!isEditingCash ? (
                <button 
                  onClick={handleStartEditingCash}
                  className="btn"
                  style={{ 
                    height: '26px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    fontSize: '11px', 
                    padding: '0 12px', 
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    transition: 'all 0.2s'
                  }}
                >
                  <Edit3 size={12} color="#38bdf8" /> Habilitar Alterações
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleSaveCash}
                    className="btn btn-primary"
                    style={{ height: '26px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', padding: '0 12px', cursor: 'pointer' }}
                  >
                    <Save size={12} /> Salvar
                  </button>
                  <button 
                    onClick={handleCancelEditingCash}
                    className="btn"
                    style={{ 
                      height: '26px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      fontSize: '11px', 
                      padding: '0 12px', 
                      cursor: 'pointer',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '6px',
                      color: '#fda4af',
                      transition: 'all 0.2s'
                    }}
                  >
                    <X size={12} /> Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div style={styles.cashBody}>
            {/* Inputs Section */}
            <div style={styles.cashInputsRow}>
              <div style={styles.cashInputGroup}>
                <span style={styles.cashInputLabel}>TastyTrade (USD)</span>
                {isEditingCash ? (
                  <div style={{
                    ...styles.cashInputWrapper,
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    background: 'rgba(0, 0, 0, 0.4)',
                  }}>
                    <span style={styles.cashCurrencySymbol}>$</span>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={tempTastyTrade}
                      onChange={(e) => setTempTastyTrade(e.target.value)}
                      style={styles.cashInput}
                    />
                  </div>
                ) : (
                  <div style={styles.cashDisplayVal}>
                    <span>{formatVal(cashDetails.displayTasty)}</span>
                    {globalCurrency === 'BRL' && (
                      <span style={styles.cashNativeBadge}>
                        $ {cashTastyTrade.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div style={styles.cashInputGroup}>
                <span style={styles.cashInputLabel}>Avenue (USD)</span>
                {isEditingCash ? (
                  <div style={{
                    ...styles.cashInputWrapper,
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    background: 'rgba(0, 0, 0, 0.4)',
                  }}>
                    <span style={styles.cashCurrencySymbol}>$</span>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={tempAvenue}
                      onChange={(e) => setTempAvenue(e.target.value)}
                      style={styles.cashInput}
                    />
                  </div>
                ) : (
                  <div style={styles.cashDisplayVal}>
                    <span>{formatVal(cashDetails.displayAvenue)}</span>
                    {globalCurrency === 'BRL' && (
                      <span style={styles.cashNativeBadge}>
                        $ {cashAvenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Allocations Summary & Progress Bar */}
            <div style={styles.cashSummaryCol}>
              <div style={styles.cashStatsRow}>
                <div style={styles.cashStat}>
                  <span style={styles.cashStatLabel}>Caixa Total:</span>
                  <strong style={{ ...styles.cashStatValue, color: '#38bdf8' }}>
                    {formatVal(cashDetails.totalCash)}
                  </strong>
                </div>
                <div style={styles.cashStat}>
                  <span style={styles.cashStatLabel}>Ações Custodiadas:</span>
                  <strong style={{ ...styles.cashStatValue, color: '#10b981' }}>
                    {formatVal(cashDetails.totalInvestments)}
                  </strong>
                </div>
                <div style={styles.cashStat}>
                  <span style={styles.cashStatLabel}>Patrimônio Total:</span>
                  <strong style={{ ...styles.cashStatValue, color: '#ffffff' }}>
                    {formatVal(cashDetails.consolidatedWealth)}
                  </strong>
                </div>
              </div>
              
              {/* Visual allocation progress bar */}
              {cashDetails.consolidatedWealth > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  <div style={styles.progressBarBg}>
                    <div 
                      style={{ 
                        ...styles.progressBarFill, 
                        width: `${(cashDetails.totalCash / cashDetails.consolidatedWealth) * 100}%`,
                        background: 'linear-gradient(90deg, #38bdf8, #a855f7)',
                      }} 
                    />
                  </div>
                  <div style={styles.progressLabels}>
                    <span style={{ color: '#38bdf8' }}>
                      Caixa: {((cashDetails.totalCash / cashDetails.consolidatedWealth) * 100).toFixed(1)}%
                    </span>
                    <span style={{ color: '#10b981' }}>
                      Investimentos: {((cashDetails.totalInvestments / cashDetails.consolidatedWealth) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                    {adjustWithDividends ? 'Custo Médio (Líq.)' : 'Custo Médio'}{renderSortIndicator('avgPrice')}
                  </th>
                  <th 
                    className="spreadsheet-th" 
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                    onClick={() => handleSort('dividends')}
                  >
                    Div. Recebidos{renderSortIndicator('dividends')}
                  </th>
                  <th 
                    className="spreadsheet-th" 
                    style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                    onClick={() => handleSort('investedCost')}
                  >
                    {adjustWithDividends ? 'Custo Total (Líq.)' : 'Custo Total'}{renderSortIndicator('investedCost')}
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
                    <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
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

                        {/* Dividends Cell */}
                        <td 
                          className="spreadsheet-td" 
                          style={{ 
                            textAlign: 'right', 
                            cursor: activePortfolio === 'GLOBAL' ? 'default' : 'pointer', 
                            color: '#10b981', 
                            backgroundColor: isEditing ? 'rgba(99, 102, 241, 0.1)' : 'transparent' 
                          }}
                          onDoubleClick={() => activePortfolio !== 'GLOBAL' && startEditing(h.ticker, h)}
                        >
                          {isEditing ? (
                            <input 
                              type="number"
                              value={editDividends}
                              onChange={(e) => setEditDividends(e.target.value)}
                              style={styles.inlineInput}
                            />
                          ) : (
                            formatVal(h.dividends || 0, h.currency)
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
              <h4 style={{ fontSize: '12px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', gridColumn: 'span 5' }}>
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
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Div. Recebidos ({activePortfolio === 'US' ? 'USD' : 'BRL'})
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 150.00"
                  value={dividendsInput}
                  onChange={(e) => setDividendsInput(e.target.value)}
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
                {newsLastUpdated && (
                  <span style={{ color: '#64748b', marginLeft: 8, fontStyle: 'italic' }}>
                    (Última atualização: {newsLastUpdated})
                  </span>
                )}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Dynamic News Feed Refresh Button */}
              <button 
                onClick={handleRefreshNews}
                disabled={isRefreshingNews}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: isRefreshingNews 
                    ? 'rgba(56, 189, 248, 0.1)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid',
                  borderColor: isRefreshingNews 
                    ? '#38bdf8' 
                    : 'rgba(255, 255, 255, 0.1)',
                  color: isRefreshingNews ? '#38bdf8' : '#e2e8f0',
                  fontSize: '11px',
                  cursor: isRefreshingNews ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  outline: 'none',
                }}
              >
                <RefreshCw 
                  size={13} 
                  style={{ 
                    animation: isRefreshingNews ? 'spin 1s linear infinite' : 'none',
                    marginRight: 2
                  }}
                />
                {isRefreshingNews ? 'Atualizando...' : 'Atualizar Feed'}
              </button>

              <button 
                onClick={() => setShowKeyConfig(!showKeyConfig)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: (activeMode === 'simulated')
                    ? 'rgba(251, 191, 36, 0.1)'
                    : activeKey
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid',
                  borderColor: (activeMode === 'simulated')
                    ? 'rgba(251, 191, 36, 0.25)'
                    : activeKey 
                      ? 'rgba(16, 185, 129, 0.25)' 
                      : 'rgba(255, 255, 255, 0.1)',
                  color: (activeMode === 'simulated')
                    ? '#fbbf24'
                    : activeKey 
                      ? '#10b981' 
                      : '#94a3b8',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  outline: 'none',
                }}
              >
                <Cpu 
                  size={14} 
                  color={
                    (activeMode === 'simulated')
                      ? '#fbbf24'
                      : activeKey 
                        ? '#10b981' 
                        : '#94a3b8'
                  } 
                />
                {
                  (activeMode === 'simulated')
                    ? 'Simulação Offline'
                    : activeKey 
                      ? 'Gemini AI Ativo' 
                      : 'Configurar Gemini'
                }
              </button>
            </div>
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
            flexDirection: 'column',
            gap: 12,
            padding: '16px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: 20,
          }}>
            {/* API Key Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                <Key size={12} /> Gemini API Key:
              </span>
              <input 
                type="password"
                value={geminiApiKey}
                onChange={(e) => {
                  setGeminiApiKey(e.target.value);
                  localStorage.setItem('fsi_api_key', e.target.value);
                  localStorage.setItem('fsi_gemini_api_key', e.target.value);
                  if (setApiKey) setApiKey(e.target.value);
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
                  localStorage.removeItem('fsi_api_key');
                  localStorage.removeItem('fsi_gemini_api_key');
                  if (setApiKey) setApiKey('');
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

            {/* Mode Selection Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 10 }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Cpu size={12} /> Modo de Execução:
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    localStorage.setItem('fsi_api_mode', 'simulated');
                    if (setApiMode) setApiMode('simulated');
                    // Force state update to re-render
                    setPriceUpdateTrigger(p => p + 1);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: (activeMode === 'simulated') ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                    border: '1px solid',
                    borderColor: (activeMode === 'simulated') ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
                    color: (activeMode === 'simulated') ? '#fbbf24' : '#94a3b8',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Offline (Simulação)
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('fsi_api_mode', 'gemini');
                    if (setApiMode) setApiMode('gemini');
                    // Force state update to re-render
                    setPriceUpdateTrigger(p => p + 1);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: (activeMode === 'gemini') ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    border: '1px solid',
                    borderColor: (activeMode === 'gemini') ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)',
                    color: (activeMode === 'gemini') ? '#06b6d4' : '#94a3b8',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Gemini AI Ativo
                </button>
              </div>
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                {activeMode === 'simulated' 
                  ? 'Usa o motor inteligente local offline.' 
                  : 'Chama a API do Google Gemini com a chave fornecida.'}
              </span>
            </div>
          </div>
        )}

        {/* Geopolitical Stress Simulator Panel */}
        {true && (
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
                {showOfflineFallback && (
                  <div style={{
                    marginTop: 4,
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <p style={{ fontSize: '11px', color: '#fbbf24', margin: 0, lineHeight: '1.4' }}>
                      <strong>Recuperação Aura FSI:</strong> Identificamos que sua chave Gemini padrão foi bloqueada/vazada. Você pode alternar instantaneamente para a <strong>Simulação Offline Premium de Alta Fidelidade</strong> local (zero latência, 100% funcional e totalmente gratuita).
                    </p>
                    <button
                      onClick={async () => {
                        setShowOfflineFallback(false);
                        setNewsSimError('');
                        setIsSimulatingNews(true);
                        // Delay estético premium
                        await new Promise(r => setTimeout(r, 800));
                        const report = generateMockCognitiveReport(customScenario, activeHoldings);
                        setAiReport(report);
                        localStorage.setItem('fsi_api_mode', 'simulated');
                        if (setApiMode) setApiMode('simulated');
                        setSuccessMessage('Alternado para Simulação Offline com sucesso!');
                        setTimeout(() => setSuccessMessage(''), 4000);
                        setIsSimulatingNews(false);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        background: '#fbbf24',
                        border: 'none',
                        color: '#000000',
                        fontWeight: 'bold',
                        fontSize: '10px',
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      Ativar Simulação Offline & Executar
                    </button>
                  </div>
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
                  
                  {/* Link to read full article */}
                  <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                    <span 
                      onClick={() => setActiveNewsArticle(news)}
                      style={{
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'underline',
                        transition: 'all 0.2s',
                        userSelect: 'none'
                      }}
                    >
                      Leia a matéria completa →
                    </span>
                  </div>
                  
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

      {/* Modal de Leitura Completa de Notícias */}
      {activeNewsArticle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(9, 11, 17, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="glass-panel animate-fade" style={{
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(56, 189, 248, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0) 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Newspaper color="#fbbf24" size={18} />
                <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Aura Cognitive Wire • {activeNewsArticle.source}
                </span>
              </div>
              <button 
                onClick={() => setActiveNewsArticle(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: '#94a3b8',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  outline: 'none',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              {/* Meta info */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                <span>{activeNewsArticle.time || 'Agora mesmo'}</span>
                <span>•</span>
                <span style={{ 
                  color: activeNewsArticle.country === 'US' ? '#a5b4fc' : '#6ee7b7',
                  fontWeight: 'bold'
                }}>
                  {activeNewsArticle.country === 'US' ? 'ESTADOS UNIDOS' : 'BRASIL B3'}
                </span>
              </div>

              {/* Title */}
              <h2 style={{ fontSize: '20px', color: '#ffffff', lineHeight: '1.4', margin: 0, fontWeight: '700' }}>
                {activeNewsArticle.title}
              </h2>

              {/* Reporter */}
              <div style={{ fontSize: '11px', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '10px' }}>
                Por <strong style={{ color: '#e2e8f0' }}>Aura FSI Intelligence Team</strong> | Publicado em tempo de execução
              </div>

              {/* Content Paragraphs */}
              <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p>
                  <strong>{activeNewsArticle.source}</strong> — {activeNewsArticle.summary}
                </p>
                <p>
                  De acordo com análises compiladas pelo nosso motor cognitivo, a matéria reflete desdobramentos críticos para a alocação de carteira atual. Investidores institucionais estão monitorando de perto o impacto deste cenário macroeconômico nos fluxos de caixa descontados (DCF) e nos custos de captação (WACC), com reflexos imediatos na volatilidade intra-diária.
                </p>
                <p>
                  A recomendação do comitê de Wealth Management da Aura Cognitive é manter a disciplina de alocação de ativos e utilizar a ferramenta de Rebalanceamento Dinâmico para calibrar a exposição aos tickers impactados de forma cirúrgica.
                </p>
              </div>

              {/* Asset Sensitivity & Recommendations */}
              <div style={{
                marginTop: '10px',
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <h4 style={{ fontSize: '12px', color: '#fbbf24', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Sensibilidade de Ativos na Carteira Real
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeNewsArticle.tags.map(ticker => {
                    const impact = activeNewsArticle.impacts?.[ticker] || 'neutral';
                    let color = '#94a3b8';
                    let label = 'Neutro / Sem impacto imediato';
                    let detail = 'O ativo possui baixa sensibilidade às variáveis deste cenário específico, atuando de forma estável.';
                    let bgColor = 'rgba(255, 255, 255, 0.03)';
                    
                    if (impact === 'critical') {
                      color = '#f43f5e';
                      label = 'Risco Crítico';
                      detail = 'Exposição direta a fluxos negativos ou gargalos de custos. Sugere-se hedge ou proteção de lucros.';
                      bgColor = 'rgba(244, 63, 94, 0.05)';
                    } else if (impact === 'high-risk') {
                      color = '#fbbf24';
                      label = 'Aviso de Risco';
                      detail = 'Risco de volatilidade elevada. Recomenda-se monitorar de perto as margens e níveis de suporte.';
                      bgColor = 'rgba(251, 191, 36, 0.05)';
                    } else if (impact === 'positive') {
                      color = '#10b981';
                      label = 'Ganho Estimado (Oportunidade)';
                      detail = 'Geração de valor positiva imediata devido à melhora nos ventos favoráveis operacionais do setor.';
                      bgColor = 'rgba(16, 185, 129, 0.05)';
                    } else if (impact === 'hedge') {
                      color = '#6366f1';
                      label = 'Porto Seguro (Hedge)';
                      detail = 'Ativo defensivo resiliente neste cenário, atuando como amortecedor natural da volatilidade.';
                      bgColor = 'rgba(99, 102, 241, 0.05)';
                    }

                    return (
                      <div key={ticker} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '10px',
                        borderRadius: '6px',
                        backgroundColor: bgColor,
                        borderLeft: `3px solid ${color}`,
                      }}>
                        <div style={{
                          fontWeight: 'bold',
                          color: '#ffffff',
                          fontSize: '12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}>{ticker}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ color: color, fontSize: '11px', fontWeight: 'bold' }}>{label}</span>
                          <span style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.4' }}>{detail}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.5)',
            }}>
              {/* Search Google link */}
              <a 
                href={`https://www.google.com/search?q=${encodeURIComponent(activeNewsArticle.title)}`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  fontSize: '12px',
                  color: '#38bdf8',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '500',
                }}
              >
                🔍 Pesquisar no Google Notícias
              </a>

              <button 
                onClick={() => setActiveNewsArticle(null)}
                className="btn btn-secondary"
                style={{ padding: '6px 16px', fontSize: '12px', borderRadius: '6px' }}
              >
                Fechar Leitura
              </button>
            </div>
          </div>
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
    gridTemplateColumns: '1fr 1fr 1fr 1fr 120px',
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
  },
  cashPanel: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    textAlign: 'left',
    marginTop: 16,
  },
  cashHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: 12,
    marginBottom: 4,
  },
  cashTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
  },
  cashSubtitle: {
    fontSize: '11px',
    color: '#64748b',
    marginLeft: 'auto',
  },
  cashBody: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 24,
    alignItems: 'center',
  },
  cashInputsRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  cashInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
    minWidth: '130px',
  },
  cashInputLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'left',
  },
  cashInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '6px 10px',
  },
  cashCurrencySymbol: {
    color: '#64748b',
    fontSize: '12px',
    marginRight: 6,
    userSelect: 'none',
  },
  cashInput: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '12px',
    outline: 'none',
    width: '100%',
    fontFamily: 'var(--font-mono)',
  },
  cashDisplayVal: {
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'var(--font-mono)',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
  },
  cashNativeBadge: {
    fontSize: '9px',
    color: '#64748b',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    padding: '1px 5px',
    marginLeft: 'auto',
    fontWeight: 'normal',
    fontFamily: 'var(--font-mono)',
  },
  cashSummaryCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cashStatsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  cashStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
  },
  cashStatLabel: {
    fontSize: '10px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cashStatValue: {
    fontSize: '13px',
    fontWeight: '600',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.4s ease-out',
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    fontWeight: '600',
  }
};
