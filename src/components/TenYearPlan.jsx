import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Percent, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw, 
  RefreshCw, 
  Sliders, 
  Award, 
  Zap, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Database,
  History,
  LineChart,
  Layers,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { fetchTenYearPlanData } from '../utils/supabaseClient';

// Dataset padrão com todo o histórico de 63 meses (06/2021 a 08/2026) consolidado do Supabase
const PRELOADED_HISTORY = [
  {"month":"06/2021","rfBr":0,"rvBr":972.9,"rvUs":0,"total":972.9},
  {"month":"07/2021","rfBr":0,"rvBr":947.6,"rvUs":0,"total":947.6},
  {"month":"08/2021","rfBr":0,"rvBr":839.04,"rvUs":0,"total":839.04},
  {"month":"09/2021","rfBr":0,"rvBr":6553.38,"rvUs":0,"total":6553.38},
  {"month":"10/2021","rfBr":5029.61,"rvBr":4940.17,"rvUs":0,"total":9969.78},
  {"month":"11/2021","rfBr":5069.49,"rvBr":3564.6,"rvUs":0,"total":8634.09},
  {"month":"12/2021","rfBr":5122.2,"rvBr":3299.54,"rvUs":0,"total":8421.74},
  {"month":"01/2022","rfBr":5172.89,"rvBr":3199,"rvUs":0,"total":8371.89},
  {"month":"02/2022","rfBr":50306.09,"rvBr":2746.57,"rvUs":0,"total":53052.66},
  {"month":"03/2022","rfBr":50836.05,"rvBr":14710.74,"rvUs":0,"total":65546.79},
  {"month":"04/2022","rfBr":51300.73,"rvBr":10526.16,"rvUs":0,"total":61826.89},
  {"month":"05/2022","rfBr":61914.31,"rvBr":11744.04,"rvUs":0,"total":73658.35},
  {"month":"06/2022","rfBr":93760.78,"rvBr":7387.38,"rvUs":0,"total":101148.16},
  {"month":"07/2022","rfBr":94765.5,"rvBr":22000.36,"rvUs":0,"total":116765.86},
  {"month":"08/2022","rfBr":115439.25,"rvBr":46759.09,"rvUs":0,"total":162198.34},
  {"month":"09/2022","rfBr":116439.22,"rvBr":45011.5,"rvUs":0,"total":161450.72},
  {"month":"10/2022","rfBr":117463.47,"rvBr":58797,"rvUs":0,"total":176260.47},
  {"month":"11/2022","rfBr":118497.7,"rvBr":94805.76,"rvUs":0,"total":213303.46},
  {"month":"12/2022","rfBr":119827.25,"rvBr":90233.32,"rvUs":0,"total":210060.57},
  {"month":"01/2023","rfBr":121140.93,"rvBr":113592.38,"rvUs":0,"total":234733.31},
  {"month":"02/2023","rfBr":79721.98,"rvBr":247825.67,"rvUs":0,"total":327547.65},
  {"month":"03/2023","rfBr":80700.58,"rvBr":345045.37,"rvUs":0,"total":425745.95},
  {"month":"04/2023","rfBr":100625.76,"rvBr":368861.94,"rvUs":0,"total":469487.7},
  {"month":"05/2023","rfBr":101763.96,"rvBr":375543.51,"rvUs":0,"total":477307.47},
  {"month":"06/2023","rfBr":102877.38,"rvBr":347045.38,"rvUs":0,"total":449922.76},
  {"month":"07/2023","rfBr":139310.43,"rvBr":369099.39,"rvUs":0,"total":508409.82},
  {"month":"08/2023","rfBr":150794.44,"rvBr":384564.03,"rvUs":0,"total":535358.47},
  {"month":"09/2023","rfBr":152303.41,"rvBr":410849.77,"rvUs":0,"total":563153.18},
  {"month":"10/2023","rfBr":133554.22,"rvBr":381677.54,"rvUs":0,"total":515231.76},
  {"month":"11/2023","rfBr":135291.69,"rvBr":85251.53,"rvUs":31424.59,"total":251967.81},
  {"month":"12/2023","rfBr":136629.42,"rvBr":116738.26,"rvUs":103033.91,"total":356401.59},
  {"month":"01/2024","rfBr":138078.48,"rvBr":260409.48,"rvUs":156432.85,"total":554920.81},
  {"month":"02/2024","rfBr":189799.26,"rvBr":447370.23,"rvUs":165461.3,"total":802630.79},
  {"month":"03/2024","rfBr":191618.31,"rvBr":514589.45,"rvUs":361256.51,"total":1067464.27},
  {"month":"04/2024","rfBr":193591.99,"rvBr":525062.85,"rvUs":352784.89,"total":1071439.73},
  {"month":"05/2024","rfBr":182294.72,"rvBr":531817.64,"rvUs":399425.92,"total":1113538.28},
  {"month":"06/2024","rfBr":167606.1,"rvBr":607147.26,"rvUs":422331.81,"total":1197085.17},
  {"month":"07/2024","rfBr":129955.84,"rvBr":852603.17,"rvUs":432835.52,"total":1415394.53},
  {"month":"08/2024","rfBr":146313.3,"rvBr":866622.58,"rvUs":413827.98,"total":1426763.86},
  {"month":"09/2024","rfBr":165141.02,"rvBr":838137.92,"rvUs":389985.65,"total":1393264.59},
  {"month":"10/2024","rfBr":187192.71,"rvBr":799523.73,"rvUs":444380.17,"total":1431096.61},
  {"month":"11/2024","rfBr":356582.64,"rvBr":825099.71,"rvUs":516553.68,"total":1698236.03},
  {"month":"12/2024","rfBr":359228.8,"rvBr":792756.35,"rvUs":510156.62,"total":1662141.77},
  {"month":"01/2025","rfBr":362911.14,"rvBr":827064.1,"rvUs":495020.11,"total":1684995.35},
  {"month":"02/2025","rfBr":366365.36,"rvBr":839693.42,"rvUs":443214.64,"total":1649273.42},
  {"month":"03/2025","rfBr":368917.76,"rvBr":911778.15,"rvUs":609708.31,"total":1890404.22},
  {"month":"04/2025","rfBr":376727.58,"rvBr":915278.45,"rvUs":632205.06,"total":1924211.09},
  {"month":"05/2025","rfBr":553129.7,"rvBr":963234.24,"rvUs":685050.76,"total":2201414.7},
  {"month":"06/2025","rfBr":574682.6,"rvBr":965185,"rvUs":723651.38,"total":2263518.98},
  {"month":"07/2025","rfBr":589126.98,"rvBr":883777.02,"rvUs":759089.62,"total":2231993.62},
  {"month":"08/2025","rfBr":567141.56,"rvBr":944132.9,"rvUs":744120.48,"total":2255394.94},
  {"month":"09/2025","rfBr":523921.67,"rvBr":966501.8,"rvUs":761430.62,"total":2251854.09},
  {"month":"10/2025","rfBr":493989.43,"rvBr":952850.27,"rvUs":782729.8,"total":2229569.5},
  {"month":"11/2025","rfBr":458928.5,"rvBr":956595,"rvUs":773101.74,"total":2188625.24},
  {"month":"12/2025","rfBr":444284.33,"rvBr":969213.08,"rvUs":793341.62,"total":2206839.03},
  {"month":"01/2026","rfBr":421942.05,"rvBr":1029245.57,"rvUs":750643.8,"total":2201831.42},
  {"month":"02/2026","rfBr":410588.9,"rvBr":1032193.87,"rvUs":703639.19,"total":2146421.96},
  {"month":"03/2026","rfBr":393885.19,"rvBr":1064626.68,"rvUs":693889.45,"total":2152401.32},
  {"month":"04/2026","rfBr":393001.2,"rvBr":1111523.2,"rvUs":803201.36,"total":2307725.76},
  {"month":"05/2026","rfBr":375136.19,"rvBr":1089916.73,"rvUs":864764.24,"total":2329817.16},
  {"month":"06/2026","rfBr":380890.14,"rvBr":1048228.26,"rvUs":921813.14,"total":2350931.54},
  {"month":"07/2026","rfBr":410092.2,"rvBr":1056100.95,"rvUs":842702.4,"total":2308895.55},
  {"month":"08/2026","rfBr":424166.31,"rvBr":1047539.43,"rvUs":940734.93,"total":2412440.67}
];

export default function TenYearPlan() {
  // Estado de privacidade / ocultar valores
  const [hideValues, setHideValues] = useState(() => {
    return localStorage.getItem('fsi_portfolio_hide_values') === 'true';
  });

  // Dados da base Supabase com histórico completo
  const [baselineData, setBaselineData] = useState(() => {
    const cached = localStorage.getItem('fsi_tenyearplan_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.success && parsed.totalInitial > 0) {
          if (!parsed.historicalProgression || parsed.historicalProgression.length === 0) {
            parsed.historicalProgression = PRELOADED_HISTORY;
          }
          return parsed;
        }
      } catch (e) {}
    }
    return {
      latestMonth: '08/2026',
      rfBr: 424166.31,
      rvBr: 1047539.43,
      rvUs: 940734.93,
      totalInitial: 2412440.67,
      historicalProgression: PRELOADED_HISTORY,
      formattedTimestamp: 'Posição base salva'
    };
  });

  const [loadingData, setLoadingData] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    return localStorage.getItem('fsi_tenyearplan_last_sync') || '27/08/2026 às 16:25';
  });

  // Parâmetros Macroeconômicos Editáveis com Persistência em LocalStorage
  const [targetIncomeToday, setTargetIncomeToday] = useState(() => {
    return Number(localStorage.getItem('fsi_typ_target_income')) || 50000;
  });
  const [withdrawalRateMonthly, setWithdrawalRateMonthly] = useState(() => {
    return Number(localStorage.getItem('fsi_typ_swr')) || 0.40;
  });
  const [annualInflation, setAnnualInflation] = useState(() => {
    return Number(localStorage.getItem('fsi_typ_inflation')) || 5.0;
  });
  const [annualReturnUs, setAnnualReturnUs] = useState(() => {
    return Number(localStorage.getItem('fsi_typ_ret_us')) || 25.0;
  });
  const [annualReturnBr, setAnnualReturnBr] = useState(() => {
    return Number(localStorage.getItem('fsi_typ_ret_br')) || 12.0;
  });

  // Sliders de Alocação de Novos Aportes (soma 100%)
  const [allocUs, setAllocUs] = useState(50);
  const [allocRvBr, setAllocRvBr] = useState(25);
  const [allocRfBr, setAllocRfBr] = useState(25);

  // Aporte Mensal Simulado
  const [monthlyContribution, setMonthlyContribution] = useState(15000);
  const [adjustContributionForInflation, setAdjustContributionForInflation] = useState(true);

  // Controle de Visualização dos Gráficos: 'projected' (10 anos) vs 'history' (todo o histórico 2021-2026)
  const [activeChartTab, setActiveChartTab] = useState('projected');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Controle de Visualização do Comparativo 2026: 'ALL' (Matricial) | 'TOTAL' | 'US' | 'RV_BR' | 'RF_BR'
  const [comparisonAssetClass, setComparisonAssetClass] = useState('ALL');

  // Salva alterações de variáveis no localStorage
  useEffect(() => {
    localStorage.setItem('fsi_typ_target_income', String(targetIncomeToday));
    localStorage.setItem('fsi_typ_swr', String(withdrawalRateMonthly));
    localStorage.setItem('fsi_typ_inflation', String(annualInflation));
    localStorage.setItem('fsi_typ_ret_us', String(annualReturnUs));
    localStorage.setItem('fsi_typ_ret_br', String(annualReturnBr));
  }, [targetIncomeToday, withdrawalRateMonthly, annualInflation, annualReturnUs, annualReturnBr]);

  // Restaura parâmetros padrão
  const handleResetDefaults = () => {
    setTargetIncomeToday(50000);
    setWithdrawalRateMonthly(0.40);
    setAnnualInflation(5.0);
    setAnnualReturnUs(25.0);
    setAnnualReturnBr(12.0);
  };

  // Busca dados atualizados do Supabase sob demanda
  const handleSyncSupabase = async () => {
    setLoadingData(true);
    try {
      const res = await fetchTenYearPlanData(true);
      if (res && res.success) {
        if (!res.historicalProgression || res.historicalProgression.length === 0) {
          res.historicalProgression = PRELOADED_HISTORY;
        }
        setBaselineData(res);
        setLastSyncTime(res.formattedTimestamp);
      }
    } catch (e) {
      console.warn('[TenYearPlan] Erro ao sincronizar:', e);
    } finally {
      setLoadingData(false);
    }
  };

  // Gerenciamento inteligente dos sliders para manter soma = 100%
  const handleSliderChange = (changed, newVal) => {
    const val = Math.max(0, Math.min(100, Math.round(newVal)));
    if (val === 100) {
      if (changed === 'us') { setAllocUs(100); setAllocRvBr(0); setAllocRfBr(0); }
      else if (changed === 'rvBr') { setAllocUs(0); setAllocRvBr(100); setAllocRfBr(0); }
      else { setAllocUs(0); setAllocRvBr(0); setAllocRfBr(100); }
      return;
    }

    const remaining = 100 - val;
    if (changed === 'us') {
      const currentOthers = allocRvBr + allocRfBr;
      if (currentOthers === 0) {
        setAllocUs(val);
        setAllocRvBr(Math.round(remaining / 2));
        setAllocRfBr(remaining - Math.round(remaining / 2));
      } else {
        const ratioRv = allocRvBr / currentOthers;
        const newRv = Math.round(remaining * ratioRv);
        setAllocUs(val);
        setAllocRvBr(newRv);
        setAllocRfBr(remaining - newRv);
      }
    } else if (changed === 'rvBr') {
      const currentOthers = allocUs + allocRfBr;
      if (currentOthers === 0) {
        setAllocRvBr(val);
        setAllocUs(Math.round(remaining / 2));
        setAllocRfBr(remaining - Math.round(remaining / 2));
      } else {
        const ratioUs = allocUs / currentOthers;
        const newUs = Math.round(remaining * ratioUs);
        setAllocRvBr(val);
        setAllocUs(newUs);
        setAllocRfBr(remaining - newUs);
      }
    } else if (changed === 'rfBr') {
      const currentOthers = allocUs + allocRvBr;
      if (currentOthers === 0) {
        setAllocRfBr(val);
        setAllocUs(Math.round(remaining / 2));
        setAllocRvBr(remaining - Math.round(remaining / 2));
      } else {
        const ratioUs = allocUs / currentOthers;
        const newUs = Math.round(remaining * ratioUs);
        setAllocRfBr(val);
        setAllocUs(newUs);
        setAllocRvBr(remaining - newUs);
      }
    }
  };

  // Presets de Alocação Rápidos
  const applyPreset = (us, rvBr, rfBr) => {
    setAllocUs(us);
    setAllocRvBr(rvBr);
    setAllocRfBr(rfBr);
  };

  // Formatação monetária segura
  const formatMoney = (val, hidePrefix = false) => {
    if (hideValues) return '••••••';
    if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
    return (hidePrefix ? '' : 'R$ ') + Number(val).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatShortMoney = (val) => {
    if (hideValues) return '••••';
    if (val >= 1e6) return `R$ ${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `R$ ${(val / 1e3).toFixed(1)}k`;
    return `R$ ${val.toFixed(0)}`;
  };

  // Constantes de tempo: De 08/2026 até 12/2036 = 124 meses
  const TOTAL_MONTHS = 124;

  // Taxas equivalentes mensais
  const monthlyRates = useMemo(() => {
    const monthlyInf = Math.pow(1 + annualInflation / 100, 1 / 12) - 1;
    const monthlyUs = Math.pow(1 + annualReturnUs / 100, 1 / 12) - 1;
    const monthlyBr = Math.pow(1 + annualReturnBr / 100, 1 / 12) - 1;
    const swr = withdrawalRateMonthly / 100;
    
    // Fator acumulado de inflação em 124 meses
    const totalInflationFactor = Math.pow(1 + annualInflation / 100, TOTAL_MONTHS / 12);
    
    // Salário nominal alvo em Dez/2036
    const targetIncomeNominal2036 = targetIncomeToday * totalInflationFactor;
    
    // Patrimônio necessário
    const targetWealthToday = targetIncomeToday / swr; // Ex: R$ 12.5M
    const targetWealthNominal2036 = targetIncomeNominal2036 / swr; // Ex: ~R$ 20.69M

    return {
      monthlyInf,
      monthlyUs,
      monthlyBr,
      swr,
      totalInflationFactor,
      targetIncomeNominal2036,
      targetWealthToday,
      targetWealthNominal2036
    };
  }, [annualInflation, annualReturnUs, annualReturnBr, withdrawalRateMonthly, targetIncomeToday]);

  // Função simuladora pura para cálculo de trajetória e solver
  const simulateTrajectory = useCallback((initialRf, initialRvBr, initialRvUs, monthlyContrib, adjustInf, wUs, wRvBr, wRfBr) => {
    const { monthlyInf, monthlyUs, monthlyBr, swr } = monthlyRates;
    
    let curRf = initialRf;
    let curRvBr = initialRvBr;
    let curRvUs = initialRvUs;
    let totalContrib = 0;
    
    const timeline = [];
    const baseYear = 2026;
    const baseMonth = 8; // Agosto

    for (let m = 0; m <= TOTAL_MONTHS; m++) {
      const monthDate = new Date(baseYear, (baseMonth - 1) + m, 1);
      const mStr = `${String(monthDate.getMonth() + 1).padStart(2, '0')}/${monthDate.getFullYear()}`;
      const year = monthDate.getFullYear();
      
      const inflationFactor = Math.pow(1 + monthlyInf, m);
      const totalNominal = curRf + curRvBr + curRvUs;
      const totalReal = totalNominal / inflationFactor;
      const monthlyIncomeNominal = totalNominal * swr;
      const monthlyIncomeReal = totalReal * swr;

      timeline.push({
        monthIndex: m,
        monthLabel: mStr,
        year,
        rf: curRf,
        rvBr: curRvBr,
        rvUs: curRvUs,
        totalNominal,
        totalReal,
        inflationFactor,
        monthlyIncomeNominal,
        monthlyIncomeReal,
        totalContributions: totalContrib
      });

      if (m < TOTAL_MONTHS) {
        // Aplica rendimento mensal
        curRf = curRf * (1 + monthlyBr);
        curRvBr = curRvBr * (1 + monthlyBr);
        curRvUs = curRvUs * (1 + monthlyUs);

        // Aplica aporte mensal
        const actualContrib = adjustInf ? monthlyContrib * Math.pow(1 + monthlyInf, m + 1) : monthlyContrib;
        curRf += actualContrib * (wRfBr / 100);
        curRvBr += actualContrib * (wRvBr / 100);
        curRvUs += actualContrib * (wUs / 100);
        totalContrib += actualContrib;
      }
    }

    return timeline;
  }, [monthlyRates]);

  // Solver: Aporte mensal exato necessário para atingir a meta em Dez/2036
  const requiredMonthlyContribution = useMemo(() => {
    const { targetWealthNominal2036 } = monthlyRates;
    const initRf = baselineData.rfBr || 0;
    const initRvBr = baselineData.rvBr || 0;
    const initRvUs = baselineData.rvUs || 0;

    let low = 0;
    let high = 1000000;
    let optimal = 0;

    for (let iter = 0; iter < 40; iter++) {
      const mid = (low + high) / 2;
      const res = simulateTrajectory(initRf, initRvBr, initRvUs, mid, adjustContributionForInflation, allocUs, allocRvBr, allocRfBr);
      const finalVal = res[res.length - 1].totalNominal;
      
      if (finalVal >= targetWealthNominal2036) {
        optimal = mid;
        high = mid;
      } else {
        low = mid;
      }
    }

    return Math.round(optimal);
  }, [monthlyRates, baselineData, adjustContributionForInflation, allocUs, allocRvBr, allocRfBr, simulateTrajectory]);

  // Sincroniza o aporte simulado automaticamente sempre que a meta ou parâmetros são alterados
  useEffect(() => {
    if (requiredMonthlyContribution > 0) {
      setMonthlyContribution(requiredMonthlyContribution);
    }
  }, [requiredMonthlyContribution]);

  // Projeção futura completa mês a mês calculada com o aporte atual
  const simulationTimeline = useMemo(() => {
    return simulateTrajectory(
      baselineData.rfBr || 0,
      baselineData.rvBr || 0,
      baselineData.rvUs || 0,
      monthlyContribution,
      adjustContributionForInflation,
      allocUs,
      allocRvBr,
      allocRfBr
    );
  }, [baselineData, monthlyContribution, adjustContributionForInflation, allocUs, allocRvBr, allocRfBr, simulateTrajectory]);

  // Status de conclusão da meta
  const milestoneTargetIndex = useMemo(() => {
    const idx = simulationTimeline.findIndex(t => t.totalNominal >= monthlyRates.targetWealthNominal2036);
    return idx >= 0 ? idx : -1;
  }, [simulationTimeline, monthlyRates]);

  const targetReachedMonth = milestoneTargetIndex >= 0 ? simulationTimeline[milestoneTargetIndex] : null;

  // Marcos anuais (Dezembro de cada ano)
  const annualMilestones = useMemo(() => {
    const milestones = [];
    const byYear = {};
    
    simulationTimeline.forEach(t => {
      byYear[t.year] = t;
    });

    Object.values(byYear).forEach(t => {
      milestones.push(t);
    });

    return milestones;
  }, [simulationTimeline]);

  // -------------------------------------------------------------
  // ANÁLISE DE DESEMPENHO 2026 (DESDE JAN/2026): REALIZADO VS META
  // -------------------------------------------------------------
  const months2026Comparison = useMemo(() => {
    const history = (baselineData.historicalProgression && baselineData.historicalProgression.length > 0) 
      ? baselineData.historicalProgression 
      : PRELOADED_HISTORY;
    const history2026Map = {};
    history.forEach(h => {
      if (h.month) {
        history2026Map[h.month.trim()] = h;
      }
    });

    // Ponto de partida em Jan/2026: R$ 2.201.831,42
    const janData = history2026Map['01/2026'] || { total: 2201831.42, rfBr: 421942.05, rvBr: 1029245.57, rvUs: 750643.80 };
    const { monthlyUs, monthlyBr } = monthlyRates;

    const monthNames = [
      { num: '01', name: 'Jan/2026' },
      { num: '02', name: 'Fev/2026' },
      { num: '03', name: 'Mar/2026' },
      { num: '04', name: 'Abr/2026' },
      { num: '05', name: 'Mai/2026' },
      { num: '06', name: 'Jun/2026' },
      { num: '07', name: 'Jul/2026' },
      { num: '08', name: 'Ago/2026' },
      { num: '09', name: 'Set/2026' },
      { num: '10', name: 'Out/2026' },
      { num: '11', name: 'Nov/2026' },
      { num: '12', name: 'Dez/2026' }
    ];

    let currentTargetTotal = Number(janData.total);
    let currentTargetUs = Number(janData.rvUs);
    let currentTargetRvBr = Number(janData.rvBr);
    let currentTargetRfBr = Number(janData.rfBr);

    const contribUs = monthlyContribution * (allocUs / 100);
    const contribRvBr = monthlyContribution * (allocRvBr / 100);
    const contribRfBr = monthlyContribution * (allocRfBr / 100);

    const rows = [];

    monthNames.forEach((mObj, idx) => {
      const monthKey = `${mObj.num}/2026`;
      const realItem = history2026Map[monthKey] || history2026Map[mObj.name];
      const hasReal = !!realItem && Number(realItem.total) > 0;

      const realTotal = hasReal ? Number(realItem.total) : null;
      const realUs = hasReal ? Number(realItem.rvUs) : null;
      const realRvBr = hasReal ? Number(realItem.rvBr) : null;
      const realRfBr = hasReal ? Number(realItem.rfBr) : null;

      let plannedTargetTotal = currentTargetTotal;
      let plannedTargetUs = currentTargetUs;
      let plannedTargetRvBr = currentTargetRvBr;
      let plannedTargetRfBr = currentTargetRfBr;

      if (idx > 0) {
        // Cada classe evolui de acordo com a sua taxa de retorno esperado + sua fatia do aporte mensal
        plannedTargetUs = currentTargetUs * (1 + monthlyUs) + contribUs;
        plannedTargetRvBr = currentTargetRvBr * (1 + monthlyBr) + contribRvBr;
        plannedTargetRfBr = currentTargetRfBr * (1 + monthlyBr) + contribRfBr;
        plannedTargetTotal = plannedTargetUs + plannedTargetRvBr + plannedTargetRfBr;

        currentTargetUs = plannedTargetUs;
        currentTargetRvBr = plannedTargetRvBr;
        currentTargetRfBr = plannedTargetRfBr;
        currentTargetTotal = plannedTargetTotal;
      }

      // Função auxiliar para métricas de cada classe
      const calcClassDiff = (real, planned) => {
        if (!hasReal || real === null || planned === null) {
          return { diff: null, diffPct: null, isBeaten: false };
        }
        const diff = real - planned;
        const diffPct = planned > 0 ? (diff / planned) * 100 : 0;
        const isBeaten = real >= planned;
        return { diff, diffPct, isBeaten };
      };

      const metricsTotal = calcClassDiff(realTotal, plannedTargetTotal);
      const metricsUs = calcClassDiff(realUs, plannedTargetUs);
      const metricsRvBr = calcClassDiff(realRvBr, plannedTargetRvBr);
      const metricsRfBr = calcClassDiff(realRfBr, plannedTargetRfBr);

      rows.push({
        monthKey,
        monthLabel: mObj.name,
        hasReal,
        isBase: idx === 0,

        // Total
        realVal: realTotal,
        plannedTarget: plannedTargetTotal,
        diff: metricsTotal.diff,
        diffPct: metricsTotal.diffPct,
        isBeaten: metricsTotal.isBeaten,

        // EUA (RV US)
        us: {
          realVal: realUs,
          plannedTarget: plannedTargetUs,
          diff: metricsUs.diff,
          diffPct: metricsUs.diffPct,
          isBeaten: metricsUs.isBeaten
        },

        // Brasil RV (RV BR)
        rvBr: {
          realVal: realRvBr,
          plannedTarget: plannedTargetRvBr,
          diff: metricsRvBr.diff,
          diffPct: metricsRvBr.diffPct,
          isBeaten: metricsRvBr.isBeaten
        },

        // Brasil RF (RF BR)
        rfBr: {
          realVal: realRfBr,
          plannedTarget: plannedTargetRfBr,
          diff: metricsRfBr.diff,
          diffPct: metricsRfBr.diffPct,
          isBeaten: metricsRfBr.isBeaten
        }
      });
    });

    const realizedRows = rows.filter(r => r.hasReal);
    const realizedCount = realizedRows.length;

    // Estatísticas agregadas por classe
    const computeStats = (accessor) => {
      if (realizedCount === 0) return { beatenCount: 0, growth: 0, growthPct: '0.00', latestDiff: 0, latestDiffPct: 0, first: 0, last: 0 };
      const beatenCount = realizedRows.filter(r => r.isBase || accessor(r).isBeaten).length;
      const first = accessor(realizedRows[0]).realVal || 0;
      const last = accessor(realizedRows[realizedRows.length - 1]).realVal || 0;
      const growth = last - first;
      const growthPct = first > 0 ? ((growth / first) * 100).toFixed(2) : '0.00';
      const latestDiff = accessor(realizedRows[realizedRows.length - 1]).diff || 0;
      const latestDiffPct = accessor(realizedRows[realizedRows.length - 1]).diffPct || 0;
      return { beatenCount, growth, growthPct, latestDiff, latestDiffPct, first, last };
    };

    const totalStats = computeStats(r => ({ realVal: r.realVal, diff: r.diff, diffPct: r.diffPct, isBeaten: r.isBeaten }));
    const usStats = computeStats(r => r.us);
    const rvBrStats = computeStats(r => r.rvBr);
    const rfBrStats = computeStats(r => r.rfBr);

    return {
      rows,
      realizedCount,
      total: totalStats,
      us: usStats,
      rvBr: rvBrStats,
      rfBr: rfBrStats,
      // Retrocompatibilidade
      beatenCount: totalStats.beatenCount,
      totalGrowth2026: totalStats.growth,
      totalGrowthPct2026: totalStats.growthPct,
      currentMonthDiff: totalStats.latestDiff
    };
  }, [baselineData, monthlyRates, monthlyContribution, allocUs, allocRvBr, allocRfBr]);

  // -------------------------------------------------------------
  // ANÁLISE DE CRESCIMENTO HOMÓLOGO ANUAL (YoY POR CLASSE DE ATIVO)
  // -------------------------------------------------------------
  const yoyAnalysis = useMemo(() => {
    const history = (baselineData.historicalProgression && baselineData.historicalProgression.length > 0)
      ? baselineData.historicalProgression
      : PRELOADED_HISTORY;
      
    const map = {};
    history.forEach(h => {
      if (h.month) map[h.month.trim()] = h;
    });

    const currentMonth = baselineData.latestMonth || '08/2026';
    const [mNum, yNumStr] = currentMonth.split('/');
    const yNum = Number(yNumStr);

    const mYear1 = `${mNum}/${yNum - 1}`; // ex: 08/2025
    const mYear2 = `${mNum}/${yNum - 2}`; // ex: 08/2024

    const monthAbbrs = {
      '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };

    const curLabel = `${monthAbbrs[mNum] || mNum}/${String(yNum).slice(-2)}`;
    const y1Label = `${monthAbbrs[mNum] || mNum}/${String(yNum - 1).slice(-2)}`;
    const y2Label = `${monthAbbrs[mNum] || mNum}/${String(yNum - 2).slice(-2)}`;

    const currData = map[currentMonth] || { rfBr: baselineData.rfBr, rvBr: baselineData.rvBr, rvUs: baselineData.rvUs, total: baselineData.totalInitial };
    const y1Data = map[mYear1] || null;
    const y2Data = map[mYear2] || null;

    function calcDelta(curr, prev) {
      if (curr === undefined || prev === undefined || prev === null || prev === 0) {
        return { diff: 0, pct: 0, hasData: false };
      }
      const diff = curr - prev;
      const pct = (diff / prev) * 100;
      return { diff, pct, hasData: true };
    }

    const classes = [
      {
        id: 'total',
        name: 'Total Consolidado',
        icon: Award,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.25)',
        curr: currData.total,
        valY1: y1Data?.total,
        valY2: y2Data?.total,
        d1: calcDelta(currData.total, y1Data?.total),
        d2: calcDelta(y1Data?.total, y2Data?.total),
        d24m: calcDelta(currData.total, y2Data?.total)
      },
      {
        id: 'us',
        name: 'Renda Variável EUA',
        icon: TrendingUp,
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.1)',
        border: 'rgba(52, 211, 153, 0.25)',
        curr: currData.rvUs,
        valY1: y1Data?.rvUs,
        valY2: y2Data?.rvUs,
        d1: calcDelta(currData.rvUs, y1Data?.rvUs),
        d2: calcDelta(y1Data?.rvUs, y2Data?.rvUs),
        d24m: calcDelta(currData.rvUs, y2Data?.rvUs)
      },
      {
        id: 'rvBr',
        name: 'Renda Variável Brasil',
        icon: Layers,
        color: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.1)',
        border: 'rgba(96, 165, 250, 0.25)',
        curr: currData.rvBr,
        valY1: y1Data?.rvBr,
        valY2: y2Data?.rvBr,
        d1: calcDelta(currData.rvBr, y1Data?.rvBr),
        d2: calcDelta(y1Data?.rvBr, y2Data?.rvBr),
        d24m: calcDelta(currData.rvBr, y2Data?.rvBr)
      },
      {
        id: 'rfBr',
        name: 'Renda Fixa Brasil',
        icon: ShieldCheck,
        color: '#a78bfa',
        bg: 'rgba(167, 139, 250, 0.1)',
        border: 'rgba(167, 139, 250, 0.25)',
        curr: currData.rfBr,
        valY1: y1Data?.rfBr,
        valY2: y2Data?.rfBr,
        d1: calcDelta(currData.rfBr, y1Data?.rfBr),
        d2: calcDelta(y1Data?.rfBr, y2Data?.rfBr),
        d24m: calcDelta(currData.rfBr, y2Data?.rfBr)
      }
    ];

    return {
      currentMonth,
      mYear1,
      mYear2,
      curLabel,
      y1Label,
      y2Label,
      classes
    };
  }, [baselineData]);

  // Progresso do patrimônio atual em relação ao alvo de hoje
  const progressPercentToday = Math.min(100, ((baselineData.totalInitial / monthlyRates.targetWealthToday) * 100)).toFixed(1);

  // -------------------------------------------------------------
  // DADOS DO GRÁFICO 1: PROJEÇÃO 10 ANOS (SVG)
  // -------------------------------------------------------------
  const chartWidth = 960;
  const chartHeight = 300;
  const padLeft = 65;
  const padRight = 40;
  const padTop = 25;
  const padBottom = 35;
  const pWidth = chartWidth - padLeft - padRight;
  const pHeight = chartHeight - padTop - padBottom;

  const maxProjectedVal = useMemo(() => {
    const maxFuture = simulationTimeline[simulationTimeline.length - 1]?.totalNominal || 1;
    const maxTarget = monthlyRates.targetWealthNominal2036;
    return Math.max(maxFuture, maxTarget) * 1.08;
  }, [simulationTimeline, monthlyRates]);

  const getProjX = (idx, total) => padLeft + (idx / (total - 1)) * pWidth;
  const getProjY = (val) => padTop + pHeight - (val / maxProjectedVal) * pHeight;

  const projectedPathD = useMemo(() => {
    const pts = simulationTimeline.map((t, i) => `${getProjX(i, simulationTimeline.length)},${getProjY(t.totalNominal)}`);
    return pts.length > 0 ? `M ${pts.join(' L ')}` : '';
  }, [simulationTimeline, maxProjectedVal]);

  const realPathD = useMemo(() => {
    const pts = simulationTimeline.map((t, i) => `${getProjX(i, simulationTimeline.length)},${getProjY(t.totalReal)}`);
    return pts.length > 0 ? `M ${pts.join(' L ')}` : '';
  }, [simulationTimeline, maxProjectedVal]);

  const targetLineY = getProjY(monthlyRates.targetWealthNominal2036);

  // -------------------------------------------------------------
  // DADOS DO GRÁFICO 2: HISTÓRICO COMPLETO (63 MESES) (SVG)
  // -------------------------------------------------------------
  const fullHistory = useMemo(() => {
    return baselineData.historicalProgression || PRELOADED_HISTORY;
  }, [baselineData]);

  const maxHistoryVal = useMemo(() => {
    const maxVal = Math.max(...fullHistory.map(h => h.total), 1);
    return maxVal * 1.1;
  }, [fullHistory]);

  const getHistX = (idx, total) => padLeft + (idx / (total - 1)) * pWidth;
  const getHistY = (val) => padTop + pHeight - (val / maxHistoryVal) * pHeight;

  const historyTotalPathD = useMemo(() => {
    const pts = fullHistory.map((h, i) => `${getHistX(i, fullHistory.length)},${getHistY(h.total)}`);
    return pts.length > 0 ? `M ${pts.join(' L ')}` : '';
  }, [fullHistory, maxHistoryVal]);

  const historyAreaD = useMemo(() => {
    const pts = fullHistory.map((h, i) => `${getHistX(i, fullHistory.length)},${getHistY(h.total)}`);
    if (pts.length === 0) return '';
    const bottomY = padTop + pHeight;
    return `M ${getHistX(0, fullHistory.length)},${bottomY} L ${pts.join(' L ')} L ${getHistX(fullHistory.length - 1, fullHistory.length)},${bottomY} Z`;
  }, [fullHistory, maxHistoryVal]);

  const historyUsPathD = useMemo(() => {
    const pts = fullHistory.map((h, i) => `${getHistX(i, fullHistory.length)},${getHistY(h.rvUs)}`);
    return pts.length > 0 ? `M ${pts.join(' L ')}` : '';
  }, [fullHistory, maxHistoryVal]);

  const historyRvBrPathD = useMemo(() => {
    const pts = fullHistory.map((h, i) => `${getHistX(i, fullHistory.length)},${getHistY(h.rvBr)}`);
    return pts.length > 0 ? `M ${pts.join(' L ')}` : '';
  }, [fullHistory, maxHistoryVal]);

  const historyRfBrPathD = useMemo(() => {
    const pts = fullHistory.map((h, i) => `${getHistX(i, fullHistory.length)},${getHistY(h.rfBr)}`);
    return pts.length > 0 ? `M ${pts.join(' L ')}` : '';
  }, [fullHistory, maxHistoryVal]);

  // Estatísticas de todo o histórico
  const histStart = fullHistory[0] || { total: 972.90, month: '06/2021' };
  const histEnd = fullHistory[fullHistory.length - 1] || { total: 2412440.67, month: '08/2026' };
  const histTotalGain = histEnd.total - histStart.total;
  const histTotalGainPct = ((histTotalGain / histStart.total) * 100).toFixed(0);

  return (
    <div style={styles.container}>
      
      {/* Top Action & Navigation Header */}
      <div style={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={styles.badge}>
              <Target size={13} color="#a78bfa" />
              <span>Plano Estratégico 2026 - 2036</span>
            </span>
            <span style={styles.timeBadge}>
              <Calendar size={12} color="#38bdf8" />
              <span>Meta: Dezembro de 2036 (124 meses)</span>
            </span>
          </div>
          <h2 style={styles.pageTitle}>10 Year Plan — Aposentadoria</h2>
          <p style={styles.pageSubtitle}>
            Simulador atuarial e acompanhamento da meta de <strong>R$ {targetIncomeToday.toLocaleString('pt-BR')}/mês</strong> em poder de compra atual (retirada de {withdrawalRateMonthly}% ao mês).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const nextVal = !hideValues;
              setHideValues(nextVal);
              localStorage.setItem('fsi_portfolio_hide_values', String(nextVal));
            }}
            className="btn btn-secondary"
            style={{ height: '38px', padding: '0 12px', background: 'rgba(255,255,255,0.03)' }}
            title={hideValues ? 'Mostrar Valores' : 'Ocultar Valores'}
          >
            {hideValues ? <EyeOff size={16} color="#fca5a5" /> : <Eye size={16} color="#94a3b8" />}
          </button>

          <button
            onClick={handleSyncSupabase}
            className="btn btn-primary"
            style={styles.syncBtn}
            disabled={loadingData}
            title="Sincronizar posições de Renda Fixa e Variável do Supabase"
          >
            <Database size={14} className={loadingData ? 'spin-animation' : ''} />
            <span>{loadingData ? 'Sincronizando...' : 'Sincronizar Supabase'}</span>
          </button>
        </div>
      </div>

      {/* Database Status Banner */}
      <div style={styles.statusBar} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={styles.statusDot}></span>
          <span style={{ fontWeight: '600', color: '#10b981' }}>Base de Ativos:</span>
          <span>Renda Fixa + Renda Variável (Brasil e EUA)</span>
          <span style={styles.tagMuted}>Mês Ref: {baselineData.latestMonth}</span>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>({fullHistory.length} meses históricos carregados)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '12px', color: '#94a3b8' }}>
          <span>Última Sincronização: <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{lastSyncTime}</strong></span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={styles.kpiGrid}>
        
        {/* Card 1: Salário Desejado */}
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #8b5cf6' }} className="glass-panel">
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Meta de Renda Mensal (Hoje)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button 
                onClick={() => setTargetIncomeToday(v => Math.max(5000, v - 5000))}
                style={{ ...styles.stepBtn, height: '22px', padding: '0 6px', fontSize: '10px' }}
                title="Diminuir R$ 5.000/mês"
              >
                -5k
              </button>
              <button 
                onClick={() => setTargetIncomeToday(v => v + 5000)}
                style={{ ...styles.stepBtn, height: '22px', padding: '0 6px', fontSize: '10px' }}
                title="Aumentar R$ 5.000/mês"
              >
                +5k
              </button>
              <DollarSign size={16} color="#a78bfa" style={{ marginLeft: 2 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <div style={styles.kpiValue}>{formatMoney(targetIncomeToday)}</div>
            <span style={styles.kpiUnit}>/mês</span>
          </div>
          <div style={styles.kpiFooter}>
            <span>Em 2036 (com {annualInflation}% a.a. inflação): </span>
            <strong style={{ color: '#c4b5fd' }}>{formatMoney(monthlyRates.targetIncomeNominal2036)}/mês</strong>
          </div>
        </div>

        {/* Card 2: Patrimônio Alvo */}
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #38bdf8' }} className="glass-panel">
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Patrimônio Alvo em Dez/2036</span>
            <Award size={16} color="#38bdf8" />
          </div>
          <div style={styles.kpiValue}>{formatShortMoney(monthlyRates.targetWealthNominal2036)}</div>
          <div style={styles.kpiFooter}>
            <span>Equivale hoje a: </span>
            <strong style={{ color: '#7dd3fc' }}>{formatShortMoney(monthlyRates.targetWealthToday)}</strong> (a {withdrawalRateMonthly}%/mês)
          </div>
        </div>

        {/* Card 3: Posição Atual */}
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #10b981' }} className="glass-panel">
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Patrimônio Atual em Investimentos</span>
            <ShieldCheck size={16} color="#34d399" />
          </div>
          <div style={styles.kpiValue}>{formatMoney(baselineData.totalInitial)}</div>
          <div style={styles.kpiFooter}>
            <span>Progresso da meta atual: </span>
            <strong style={{ color: '#6ee7b7' }}>{progressPercentToday}%</strong>
          </div>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${progressPercentToday}%` }}></div>
          </div>
        </div>

        {/* Card 4: Aporte Recomendado */}
        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #f59e0b' }} className="glass-panel">
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Aporte Calculado para Bater a Meta</span>
            <Zap size={16} color="#fbbf24" />
          </div>
          <div style={{ ...styles.kpiValue, color: '#fbbf24' }}>{formatMoney(requiredMonthlyContribution)}<span style={styles.kpiUnit}>/mês</span></div>
          <div style={{ ...styles.kpiFooter, justifyContent: 'space-between' }}>
            <span>{adjustContributionForInflation ? `Corrigido por ${annualInflation}% a.a.` : 'Fixo nominal'}</span>
            <button 
              onClick={() => setMonthlyContribution(requiredMonthlyContribution)}
              style={styles.applyBtn}
              title="Preencher o simulador com este valor de aporte"
            >
              Aplicar no Simulador
            </button>
          </div>
        </div>

      </div>

      {/* Interactive Simulation & Editable Variables Console */}
      <div style={styles.consoleContainer} className="glass-panel">
        <div style={styles.consoleHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={18} color="#8b5cf6" />
            <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>Console de Parâmetros & Sliders de Alocação</h3>
          </div>
          <button onClick={handleResetDefaults} style={styles.resetBtn} title="Restaurar valores padrão">
            <RotateCcw size={12} />
            <span>Restaurar Padrões</span>
          </button>
        </div>

        <div style={styles.consoleGrid}>
          
          {/* Coluna 1: Meta de Renda, Aporte Mensal & Variáveis Editáveis */}
          <div style={styles.consoleCol}>
            
            {/* Meta de Renda Mensal Desejada (Hoje) */}
            <div style={{ marginBottom: 4 }}>
              <label style={styles.inputLabel}>
                <span>Meta de Renda Mensal Desejada (Poder de Compra Hoje)</span>
                <strong style={{ color: '#c4b5fd' }}>{formatMoney(targetIncomeToday)}/mês</strong>
              </label>
              <div style={styles.inputRow}>
                <input
                  type="number"
                  value={targetIncomeToday}
                  onChange={(e) => setTargetIncomeToday(Math.max(1000, Number(e.target.value)))}
                  step="5000"
                  style={{ ...styles.numberInput, borderColor: 'rgba(139, 92, 246, 0.4)', color: '#ffffff' }}
                  className="form-input"
                />
                <div style={styles.stepBtnGroup}>
                  <button onClick={() => setTargetIncomeToday(v => Math.max(5000, v - 5000))} style={styles.stepBtn}>-5k</button>
                  <button onClick={() => setTargetIncomeToday(v => v + 5000)} style={styles.stepBtn}>+5k</button>
                  <button onClick={() => setTargetIncomeToday(v => v + 10000)} style={styles.stepBtn}>+10k</button>
                </div>
              </div>
              <div style={{ ...styles.presetGroup, marginTop: 6 }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Metas Rápidas:</span>
                {[30000, 40000, 50000, 60000, 75000, 100000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setTargetIncomeToday(amt)}
                    style={{
                      ...styles.presetBtn,
                      background: targetIncomeToday === amt ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      borderColor: targetIncomeToday === amt ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)',
                      color: targetIncomeToday === amt ? '#c4b5fd' : '#cbd5e1',
                      fontWeight: targetIncomeToday === amt ? '700' : 'normal'
                    }}
                  >
                    R$ {amt / 1000}k
                  </button>
                ))}
              </div>
            </div>

            {/* Aporte Mensal Simulado */}
            <div style={{ marginTop: 6 }}>
              <label style={styles.inputLabel}>
                <span>Aporte Mensal Simulado (R$)</span>
                <strong style={{ color: '#38bdf8' }}>{formatMoney(monthlyContribution)}</strong>
              </label>
              <div style={styles.inputRow}>
                <input
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                  step="1000"
                  style={styles.numberInput}
                  className="form-input"
                />
                <div style={styles.stepBtnGroup}>
                  <button onClick={() => setMonthlyContribution(v => Math.max(0, v - 5000))} style={styles.stepBtn}>-5k</button>
                  <button onClick={() => setMonthlyContribution(v => v + 5000)} style={styles.stepBtn}>+5k</button>
                  <button onClick={() => setMonthlyContribution(v => v + 10000)} style={styles.stepBtn}>+10k</button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="inf-adjust"
                checked={adjustContributionForInflation}
                onChange={(e) => setAdjustContributionForInflation(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="inf-adjust" style={{ fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                Reajustar aporte anualmente pela inflação de <strong>{annualInflation}% a.a.</strong>
              </label>
            </div>

            {/* Premissas Macroeconômicas Editáveis */}
            <div style={styles.macroBox}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#a78bfa', marginBottom: 10, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                <span>Parâmetros de Mercado (Editáveis)</span>
                <span style={{ color: '#64748b', fontWeight: 'normal' }}>Clique para alterar</span>
              </div>
              <div style={styles.macroInputsGrid}>
                <div>
                  <label style={styles.subInputLabel}>Rendimento EUA (% a.a.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={annualReturnUs}
                    onChange={(e) => setAnnualReturnUs(Number(e.target.value))}
                    style={{ ...styles.smallNumberInput, borderColor: 'rgba(52, 211, 153, 0.3)', color: '#34d399' }}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={styles.subInputLabel}>Rendimento Brasil (% a.a.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={annualReturnBr}
                    onChange={(e) => setAnnualReturnBr(Number(e.target.value))}
                    style={{ ...styles.smallNumberInput, borderColor: 'rgba(96, 165, 250, 0.3)', color: '#60a5fa' }}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={styles.subInputLabel}>Inflação Anual (% a.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={annualInflation}
                    onChange={(e) => setAnnualInflation(Number(e.target.value))}
                    style={{ ...styles.smallNumberInput, borderColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' }}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={styles.subInputLabel}>Taxa de Retirada (% a.m.)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={withdrawalRateMonthly}
                    onChange={(e) => setWithdrawalRateMonthly(Number(e.target.value))}
                    style={{ ...styles.smallNumberInput, borderColor: 'rgba(167, 139, 250, 0.3)', color: '#a78bfa' }}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2: Sliders de Alocação de Novos Aportes */}
          <div style={styles.consoleCol}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={styles.inputLabel}>Mix de Alocação dos Novos Aportes</span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                color: (allocUs + allocRvBr + allocRfBr === 100) ? '#10b981' : '#f59e0b' 
              }}>
                Soma: {allocUs + allocRvBr + allocRfBr}%
              </span>
            </div>

            {/* Slider EUA */}
            <div style={styles.sliderRow}>
              <div style={styles.sliderHeader}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399' }}>
                  <span>🇺🇸 Renda Variável EUA</span>
                  <span style={styles.rateBadge}>{annualReturnUs}% a.a.</span>
                </span>
                <strong style={{ color: '#34d399', fontFamily: 'monospace' }}>{allocUs}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={allocUs}
                onChange={(e) => handleSliderChange('us', Number(e.target.value))}
                style={{ ...styles.rangeInput, accentColor: '#10b981' }}
              />
            </div>

            {/* Slider RV Brasil */}
            <div style={styles.sliderRow}>
              <div style={styles.sliderHeader}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#60a5fa' }}>
                  <span>🇧🇷 Renda Variável Brasil</span>
                  <span style={styles.rateBadge}>{annualReturnBr}% a.a.</span>
                </span>
                <strong style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{allocRvBr}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={allocRvBr}
                onChange={(e) => handleSliderChange('rvBr', Number(e.target.value))}
                style={{ ...styles.rangeInput, accentColor: '#3b82f6' }}
              />
            </div>

            {/* Slider RF Brasil */}
            <div style={styles.sliderRow}>
              <div style={styles.sliderHeader}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a78bfa' }}>
                  <span>🇧🇷 Renda Fixa Brasil</span>
                  <span style={styles.rateBadge}>{annualReturnBr}% a.a.</span>
                </span>
                <strong style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{allocRfBr}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={allocRfBr}
                onChange={(e) => handleSliderChange('rfBr', Number(e.target.value))}
                style={{ ...styles.rangeInput, accentColor: '#8b5cf6' }}
              />
            </div>

            {/* Preset Buttons */}
            <div style={styles.presetGroup}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Presets:</span>
              <button onClick={() => applyPreset(100, 0, 0)} style={styles.presetBtn}>100% EUA</button>
              <button onClick={() => applyPreset(0, 100, 0)} style={styles.presetBtn}>100% RV BR</button>
              <button onClick={() => applyPreset(0, 0, 100)} style={styles.presetBtn}>100% RF BR</button>
              <button onClick={() => applyPreset(50, 25, 25)} style={styles.presetBtn}>50/25/25</button>
              <button onClick={() => applyPreset(40, 30, 30)} style={styles.presetBtn}>40/30/30</button>
            </div>

          </div>

        </div>

      </div>

      {/* PAINEL DE CRESCIMENTO HOMÓLOGO ANUAL (YoY POR CLASSE DE ATIVO) */}
      <div style={styles.yoyPanel} className="glass-panel">
        <div style={styles.yoyHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>
                Crescimento Anual Homólogo por Classe de Ativo (YoY)
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Comparação do mesmo mês nos últimos 3 anos ({yoyAnalysis.curLabel} vs {yoyAnalysis.y1Label} e {yoyAnalysis.y1Label} vs {yoyAnalysis.y2Label})
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: '11px', color: '#94a3b8', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }}></span>
              <span><strong>{yoyAnalysis.curLabel} vs {yoyAnalysis.y1Label}</strong> (12 meses)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#38bdf8' }}></span>
              <span><strong>{yoyAnalysis.y1Label} vs {yoyAnalysis.y2Label}</strong> (Ano anterior)</span>
            </span>
          </div>
        </div>

        {/* Grid de 4 Cards por Classe de Ativo */}
        <div style={styles.yoyGrid}>
          {yoyAnalysis.classes.map(cls => {
            const Icon = cls.icon;
            const isPos1 = cls.d1.diff >= 0;
            const isPos2 = cls.d2.diff >= 0;
            const isPos24m = cls.d24m.diff >= 0;

            return (
              <div key={cls.id} style={{ ...styles.yoyCard, borderTop: `3px solid ${cls.color}` }}>
                {/* Header do Card */}
                <div style={styles.yoyCardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ ...styles.yoyIconBadge, background: cls.bg, border: `1px solid ${cls.border}` }}>
                      <Icon size={16} color={cls.color} />
                    </div>
                    <div>
                      <h4 style={styles.yoyClassTitle}>{cls.name}</h4>
                      <span style={styles.yoyCurrentVal}>{formatMoney(cls.curr)}</span>
                    </div>
                  </div>
                </div>

                {/* Linha 1: Mês Atual vs Ano Anterior (ex: Ago/26 vs Ago/25) */}
                <div style={styles.yoyRow}>
                  <div style={styles.yoyPeriodLabel}>
                    <span style={{ fontWeight: '700', color: '#f8fafc' }}>{yoyAnalysis.curLabel} vs {yoyAnalysis.y1Label}</span>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>
                      Base {yoyAnalysis.y1Label}: {formatMoney(cls.valY1)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      ...styles.yoyBadge,
                      background: isPos1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isPos1 ? '#34d399' : '#f87171',
                      borderColor: isPos1 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                    }}>
                      {isPos1 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      <span>{isPos1 ? '+' : ''}{cls.d1.pct.toFixed(2)}%</span>
                    </div>
                    <div style={styles.yoyDeltaMoney}>
                      {isPos1 ? '+' : ''}{formatMoney(cls.d1.diff)}
                    </div>
                  </div>
                </div>

                {/* Linha 2: Ano Anterior vs 2 Anos Atrás (ex: Ago/25 vs Ago/24) */}
                <div style={{ ...styles.yoyRow, borderTop: '1px dashed rgba(255, 255, 255, 0.05)', paddingTop: 8 }}>
                  <div style={styles.yoyPeriodLabel}>
                    <span style={{ fontWeight: '600', color: '#cbd5e1' }}>{yoyAnalysis.y1Label} vs {yoyAnalysis.y2Label}</span>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>
                      Base {yoyAnalysis.y2Label}: {formatMoney(cls.valY2)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      ...styles.yoyBadge,
                      background: isPos2 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: isPos2 ? '#38bdf8' : '#f87171',
                      borderColor: isPos2 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(239, 68, 68, 0.25)'
                    }}>
                      {isPos2 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      <span>{isPos2 ? '+' : ''}{cls.d2.pct.toFixed(2)}%</span>
                    </div>
                    <div style={styles.yoyDeltaMoney}>
                      {isPos2 ? '+' : ''}{formatMoney(cls.d2.diff)}
                    </div>
                  </div>
                </div>

                {/* Linha 3: Acumulado 24 Meses (ex: Ago/26 vs Ago/24) */}
                <div style={styles.yoyFooter}>
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>Acumulado 24 Meses:</span>
                  <strong style={{ color: isPos24m ? '#34d399' : '#f87171', fontFamily: 'monospace', fontSize: '12px' }}>
                    {isPos24m ? '+' : ''}{cls.d24m.pct.toFixed(2)}%
                  </strong>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO NOBRE: DESEMPENHO 2026 (DESDE JAN/2026: REALIZADO VS META) */}
      <div style={styles.scorecardPanel} className="glass-panel">
        <div style={styles.scorecardHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} color="#34d399" />
              <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>Desempenho 2026: Realizado vs. Meta Mensal</h3>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Acompanhamento mês a mês dos resultados reais de 2026 frente à meta proporcional por classe de ativo
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={styles.scorecardPill}>
              <span style={{ color: '#94a3b8' }}>
                {comparisonAssetClass === 'US' ? 'EUA Batidos:' : comparisonAssetClass === 'RV_BR' ? 'RV BR Batidos:' : comparisonAssetClass === 'RF_BR' ? 'RF BR Batidos:' : 'Total Batidos:'}
              </span>
              <strong style={{ color: '#34d399', fontSize: '13px' }}>
                {comparisonAssetClass === 'US' 
                  ? `${months2026Comparison.us.beatenCount} de ${months2026Comparison.realizedCount} meses`
                  : comparisonAssetClass === 'RV_BR'
                    ? `${months2026Comparison.rvBr.beatenCount} de ${months2026Comparison.realizedCount} meses`
                    : comparisonAssetClass === 'RF_BR'
                      ? `${months2026Comparison.rfBr.beatenCount} de ${months2026Comparison.realizedCount} meses`
                      : `${months2026Comparison.total.beatenCount} de ${months2026Comparison.realizedCount} meses`}
              </strong>
            </div>
            <div style={styles.scorecardPill}>
              <span style={{ color: '#94a3b8' }}>Crescimento 2026:</span>
              <strong style={{ color: '#38bdf8', fontSize: '13px' }}>
                {comparisonAssetClass === 'US'
                  ? `+${formatMoney(months2026Comparison.us.growth)} (${months2026Comparison.us.growthPct}%)`
                  : comparisonAssetClass === 'RV_BR'
                    ? `+${formatMoney(months2026Comparison.rvBr.growth)} (${months2026Comparison.rvBr.growthPct}%)`
                    : comparisonAssetClass === 'RF_BR'
                      ? `+${formatMoney(months2026Comparison.rfBr.growth)} (${months2026Comparison.rfBr.growthPct}%)`
                      : `+${formatMoney(months2026Comparison.total.growth)} (${months2026Comparison.total.growthPct}%)`}
              </strong>
            </div>
          </div>
        </div>

        {/* Seletor de Abas de Comparação por Classe de Ativo */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          <button
            onClick={() => setComparisonAssetClass('ALL')}
            style={{
              ...styles.scorecardTabBtn,
              ...(comparisonAssetClass === 'ALL' ? styles.scorecardTabBtnActive : {})
            }}
          >
            <Layers size={14} />
            <span>Comparativo Matricial (Todas as Classes)</span>
          </button>
          <button
            onClick={() => setComparisonAssetClass('TOTAL')}
            style={{
              ...styles.scorecardTabBtn,
              ...(comparisonAssetClass === 'TOTAL' ? styles.scorecardTabBtnActive : {})
            }}
          >
            <Briefcase size={14} />
            <span>💰 Total Consolidado</span>
          </button>
          <button
            onClick={() => setComparisonAssetClass('US')}
            style={{
              ...styles.scorecardTabBtn,
              ...(comparisonAssetClass === 'US' ? { ...styles.scorecardTabBtnActive, borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.15)' } : {})
            }}
          >
            <span>🇺🇸 RV EUA</span>
          </button>
          <button
            onClick={() => setComparisonAssetClass('RV_BR')}
            style={{
              ...styles.scorecardTabBtn,
              ...(comparisonAssetClass === 'RV_BR' ? { ...styles.scorecardTabBtnActive, borderColor: 'rgba(16, 185, 129, 0.4)', color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.15)' } : {})
            }}
          >
            <span>🇧🇷 RV Brasil</span>
          </button>
          <button
            onClick={() => setComparisonAssetClass('RF_BR')}
            style={{
              ...styles.scorecardTabBtn,
              ...(comparisonAssetClass === 'RF_BR' ? { ...styles.scorecardTabBtnActive, borderColor: 'rgba(167, 139, 250, 0.4)', color: '#c4b5fd', background: 'rgba(167, 139, 250, 0.15)' } : {})
            }}
          >
            <span>🏛️ RF Brasil</span>
          </button>
        </div>

        {/* 4 Mini Cards Comparativos Interativos */}
        <div style={styles.scorecardMiniGrid}>
          {/* Card Total */}
          <div 
            onClick={() => setComparisonAssetClass('TOTAL')}
            style={{
              ...styles.scorecardMiniCard,
              borderLeft: '3px solid #38bdf8',
              ...(comparisonAssetClass === 'TOTAL' ? styles.scorecardMiniCardActive : {})
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' }}>
                💰 Total Consolidado
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                {months2026Comparison.total.beatenCount}/{months2026Comparison.realizedCount} batidos
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', fontFamily: 'monospace' }}>
              {formatMoney(months2026Comparison.total.last)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: 4, color: '#94a3b8' }}>
              <span>Meta: {formatMoney(months2026Comparison.rows[months2026Comparison.realizedCount - 1]?.plannedTarget)}</span>
              <span style={{ color: months2026Comparison.total.latestDiff >= 0 ? '#34d399' : '#f87171', fontWeight: '700' }}>
                {months2026Comparison.total.latestDiff >= 0 ? '+' : ''}{months2026Comparison.total.latestDiffPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Card EUA */}
          <div 
            onClick={() => setComparisonAssetClass('US')}
            style={{
              ...styles.scorecardMiniCard,
              borderLeft: '3px solid #818cf8',
              ...(comparisonAssetClass === 'US' ? styles.scorecardMiniCardActive : {})
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#a5b4fc', textTransform: 'uppercase' }}>
                🇺🇸 RV EUA
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                {months2026Comparison.us.beatenCount}/{months2026Comparison.realizedCount} batidos
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', fontFamily: 'monospace' }}>
              {formatMoney(months2026Comparison.us.last)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: 4, color: '#94a3b8' }}>
              <span>Meta: {formatMoney(months2026Comparison.rows[months2026Comparison.realizedCount - 1]?.us.plannedTarget)}</span>
              <span style={{ color: months2026Comparison.us.latestDiff >= 0 ? '#34d399' : '#f87171', fontWeight: '700' }}>
                {months2026Comparison.us.latestDiff >= 0 ? '+' : ''}{months2026Comparison.us.latestDiffPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Card RV Brasil */}
          <div 
            onClick={() => setComparisonAssetClass('RV_BR')}
            style={{
              ...styles.scorecardMiniCard,
              borderLeft: '3px solid #34d399',
              ...(comparisonAssetClass === 'RV_BR' ? styles.scorecardMiniCardActive : {})
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#6ee7b7', textTransform: 'uppercase' }}>
                🇧🇷 RV Brasil
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                {months2026Comparison.rvBr.beatenCount}/{months2026Comparison.realizedCount} batidos
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', fontFamily: 'monospace' }}>
              {formatMoney(months2026Comparison.rvBr.last)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: 4, color: '#94a3b8' }}>
              <span>Meta: {formatMoney(months2026Comparison.rows[months2026Comparison.realizedCount - 1]?.rvBr.plannedTarget)}</span>
              <span style={{ color: months2026Comparison.rvBr.latestDiff >= 0 ? '#34d399' : '#f87171', fontWeight: '700' }}>
                {months2026Comparison.rvBr.latestDiff >= 0 ? '+' : ''}{months2026Comparison.rvBr.latestDiffPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Card RF Brasil */}
          <div 
            onClick={() => setComparisonAssetClass('RF_BR')}
            style={{
              ...styles.scorecardMiniCard,
              borderLeft: '3px solid #c084fc',
              ...(comparisonAssetClass === 'RF_BR' ? styles.scorecardMiniCardActive : {})
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#c4b5fd', textTransform: 'uppercase' }}>
                🏛️ RF Brasil
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                {months2026Comparison.rfBr.beatenCount}/{months2026Comparison.realizedCount} batidos
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', fontFamily: 'monospace' }}>
              {formatMoney(months2026Comparison.rfBr.last)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: 4, color: '#94a3b8' }}>
              <span>Meta: {formatMoney(months2026Comparison.rows[months2026Comparison.realizedCount - 1]?.rfBr.plannedTarget)}</span>
              <span style={{ color: months2026Comparison.rfBr.latestDiff >= 0 ? '#34d399' : '#f87171', fontWeight: '700' }}>
                {months2026Comparison.rfBr.latestDiff >= 0 ? '+' : ''}{months2026Comparison.rfBr.latestDiffPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* TABELA DE COMPARATIVO 2026 */}
        {comparisonAssetClass === 'ALL' ? (
          /* TABELA COMPARATIVA MATRICIAL: TODAS AS CLASSES DE ATIVO */
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Mês</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>🇺🇸 RV EUA (Real vs Meta)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>🇧🇷 RV Brasil (Real vs Meta)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>🏛️ RF Brasil (Real vs Meta)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>💰 Total Consolidado</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Metas Batidas</th>
                </tr>
              </thead>
              <tbody>
                {months2026Comparison.rows.map((r, idx) => {
                  const beatenClassesCount = (r.us.isBeaten ? 1 : 0) + (r.rvBr.isBeaten ? 1 : 0) + (r.rfBr.isBeaten ? 1 : 0);

                  const renderClassCell = (clsData) => {
                    if (!r.hasReal) {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                          <span style={{ color: '#64748b', fontFamily: 'monospace' }}>—</span>
                          <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                            Meta: {formatMoney(clsData.plannedTarget)}
                          </span>
                        </div>
                      );
                    }
                    const isPos = clsData.diff >= 0;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: '700', color: '#ffffff', fontFamily: 'monospace', fontSize: '13px' }}>
                            {formatMoney(clsData.realVal)}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: r.isBase ? 'rgba(56,189,248,0.15)' : (isPos ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'),
                            color: r.isBase ? '#38bdf8' : (isPos ? '#34d399' : '#f87171'),
                            border: `1px solid ${r.isBase ? 'rgba(56,189,248,0.3)' : (isPos ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)')}`,
                            fontFamily: 'monospace'
                          }}>
                            {r.isBase ? 'Base' : `${isPos ? '+' : ''}${clsData.diffPct.toFixed(1)}%`}
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          Meta: {formatMoney(clsData.plannedTarget)}
                        </span>
                      </div>
                    );
                  };

                  return (
                    <tr key={idx} style={{ 
                      ...styles.tr, 
                      backgroundColor: r.isBase ? 'rgba(56, 189, 248, 0.04)' : (r.isBeaten ? 'rgba(16, 185, 129, 0.04)' : 'transparent')
                    }}>
                      <td style={styles.td}>
                        <span style={{ fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{r.monthLabel}</span>
                          {r.isBase && <span style={styles.baseBadge}>Mês Base</span>}
                          {r.monthKey === baselineData.latestMonth && <span style={styles.currentBadge}>Mês Atual</span>}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        {renderClassCell(r.us)}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        {renderClassCell(r.rvBr)}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        {renderClassCell(r.rfBr)}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        {renderClassCell({ realVal: r.realVal, plannedTarget: r.plannedTarget, diff: r.diff, diffPct: r.diffPct, isBeaten: r.isBeaten })}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        {r.isBase ? (
                          <span style={styles.statusBadgeBase}>Ponto de Partida</span>
                        ) : r.hasReal ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            fontFamily: 'monospace',
                            background: beatenClassesCount === 3 
                              ? 'rgba(16, 185, 129, 0.15)' 
                              : beatenClassesCount >= 1 
                                ? 'rgba(251, 191, 36, 0.15)' 
                                : 'rgba(239, 68, 68, 0.15)',
                            color: beatenClassesCount === 3 
                              ? '#34d399' 
                              : beatenClassesCount >= 1 
                                ? '#fbbf24' 
                                : '#f87171',
                            border: `1px solid ${beatenClassesCount === 3 ? 'rgba(16, 185, 129, 0.3)' : beatenClassesCount >= 1 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                          }}>
                            {beatenClassesCount === 3 ? '🟢 3/3 Batidas' : beatenClassesCount === 2 ? '🟡 2/3 Batidas' : beatenClassesCount === 1 ? '🟠 1/3 Batida' : '🔴 0/3 Batidas'}
                          </span>
                        ) : (
                          <span style={styles.statusBadgePending}>⏳ Previsto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* TABELA DETALHADA DE UMA CLASSE SELECIONADA */
          (() => {
            const classConfig = comparisonAssetClass === 'US'
              ? { name: 'Renda Variável EUA', accessor: r => r.us, rate: annualReturnUs, alloc: allocUs, color: '#818cf8' }
              : comparisonAssetClass === 'RV_BR'
                ? { name: 'Renda Variável Brasil', accessor: r => r.rvBr, rate: annualReturnBr, alloc: allocRvBr, color: '#34d399' }
                : comparisonAssetClass === 'RF_BR'
                  ? { name: 'Renda Fixa Brasil', accessor: r => r.rfBr, rate: annualReturnBr, alloc: allocRfBr, color: '#c084fc' }
                  : { name: 'Total Consolidado', accessor: r => ({ realVal: r.realVal, plannedTarget: r.plannedTarget, diff: r.diff, diffPct: r.diffPct, isBeaten: r.isBeaten }), rate: null, alloc: 100, color: '#38bdf8' };

            return (
              <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Mês</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Realizado ({classConfig.name})</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>
                        Meta Calculada {classConfig.rate ? `(${classConfig.rate}% a.a. + Aporte ${classConfig.alloc}%)` : ''}
                      </th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Diferença (R$)</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Variação (%)</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months2026Comparison.rows.map((r, idx) => {
                      const data = classConfig.accessor(r);
                      const hasDiff = data.diff !== null;
                      const isPositive = hasDiff && data.diff >= 0;

                      return (
                        <tr key={idx} style={{ 
                          ...styles.tr, 
                          backgroundColor: r.isBase ? 'rgba(56, 189, 248, 0.04)' : (data.isBeaten ? 'rgba(16, 185, 129, 0.04)' : 'transparent')
                        }}>
                          <td style={styles.td}>
                            <span style={{ fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{r.monthLabel}</span>
                              {r.isBase && <span style={styles.baseBadge}>Mês Base</span>}
                              {r.monthKey === baselineData.latestMonth && <span style={styles.currentBadge}>Mês Atual</span>}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', fontWeight: '700', color: r.hasReal ? '#ffffff' : '#64748b', fontFamily: 'monospace' }}>
                            {r.hasReal ? formatMoney(data.realVal) : '—'}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', color: '#cbd5e1', fontFamily: 'monospace' }}>
                            {formatMoney(data.plannedTarget)}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: hasDiff ? (isPositive ? '#34d399' : '#f87171') : '#64748b' }}>
                            {hasDiff ? (r.isBase ? 'R$ 0,00' : `${isPositive ? '+' : ''}${formatMoney(data.diff)}`) : '—'}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', color: hasDiff ? (isPositive ? '#34d399' : '#f87171') : '#64748b' }}>
                            {hasDiff ? (r.isBase ? '0,00%' : `${isPositive ? '+' : ''}${data.diffPct.toFixed(2)}%`) : '—'}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            {r.isBase ? (
                              <span style={styles.statusBadgeBase}>Ponto de Partida</span>
                            ) : r.hasReal ? (
                              data.isBeaten ? (
                                <span style={styles.statusBadgeSuccess}>🟢 Batida</span>
                              ) : (
                                <span style={styles.statusBadgeDanger}>🔴 Abaixo</span>
                              )
                            ) : (
                              <span style={styles.statusBadgePending}>⏳ Previsto</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()
        )}
      </div>

      {/* ÁREA DE GRÁFICOS COM ABAS: PROJEÇÃO 10 ANOS VS HISTÓRICO COMPLETO */}
      <div style={styles.chartPanel} className="glass-panel">
        
        {/* Seletor de Gráfico */}
        <div style={styles.chartTabBar}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setActiveChartTab('projected'); setHoveredPoint(null); }}
              style={{
                ...styles.chartTabBtn,
                ...(activeChartTab === 'projected' ? styles.chartTabBtnActive : {})
              }}
            >
              <TrendingUp size={15} />
              <span>Projeção 10 Anos (2026 — 2036)</span>
            </button>
            <button
              onClick={() => { setActiveChartTab('history'); setHoveredPoint(null); }}
              style={{
                ...styles.chartTabBtn,
                ...(activeChartTab === 'history' ? styles.chartTabBtnActiveHistory : {})
              }}
            >
              <History size={15} />
              <span>Histórico Completo ({fullHistory.length} meses: 2021 — 2026)</span>
            </button>
          </div>

          {activeChartTab === 'projected' ? (
            <div style={styles.chartLegend}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#8b5cf6' }}></span>
                <span>Nominal Projetado</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#38bdf8', borderRadius: 0, height: 2, width: 12 }}></span>
                <span>Poder de Compra Real</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#f59e0b', borderRadius: 0, borderTop: '2px dashed #f59e0b', width: 14 }}></span>
                <span>Meta ({formatShortMoney(monthlyRates.targetWealthNominal2036)})</span>
              </div>
            </div>
          ) : (
            <div style={styles.chartLegend}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#10b981' }}></span>
                <span>Total Consolidado</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#60a5fa' }}></span>
                <span>RV Brasil</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#34d399' }}></span>
                <span>RV EUA</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#a78bfa' }}></span>
                <span>RF Brasil</span>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* GRÁFICO 1: PROJEÇÃO 10 ANOS */}
        {/* ------------------------------------------------------------- */}
        {activeChartTab === 'projected' && (
          <div>
            <div style={styles.svgWrapper}>
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                style={styles.svg}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Linhas horizontais de grade */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                  const yVal = padTop + pHeight * (1 - ratio);
                  const labelVal = maxProjectedVal * ratio;
                  return (
                    <g key={i}>
                      <line x1={padLeft} y1={yVal} x2={chartWidth - padRight} y2={yVal} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" />
                      <text x={padLeft - 8} y={yVal + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                        {formatShortMoney(labelVal)}
                      </text>
                    </g>
                  );
                })}

                {/* Linha da Meta */}
                <line x1={padLeft} y1={targetLineY} x2={chartWidth - padRight} y2={targetLineY} stroke="#f59e0b" strokeWidth="1.8" strokeDasharray="6 4" />
                <text x={chartWidth - padRight - 8} y={targetLineY - 6} fill="#fbbf24" fontSize="11" fontWeight="600" textAnchor="end">
                  Meta: {formatShortMoney(monthlyRates.targetWealthNominal2036)}
                </text>

                {/* Curva Real Deflacionada */}
                <path d={realPathD} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" opacity="0.8" />

                {/* Curva Nominal Projetada */}
                <path d={projectedPathD} fill="none" stroke="#8b5cf6" strokeWidth="3.2" filter="drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))" />

                {/* Eixo X: Anos */}
                {annualMilestones.map((m, i) => {
                  const x = getProjX(m.monthIndex, simulationTimeline.length);
                  return (
                    <g key={i}>
                      <line x1={x} y1={padTop} x2={x} y2={padTop + pHeight} stroke="rgba(255, 255, 255, 0.04)" />
                      <text x={x} y={chartHeight - 10} fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="500">
                        {m.year}
                      </text>
                    </g>
                  );
                })}

                {/* Ponto da Meta */}
                {milestoneTargetIndex >= 0 && (
                  <circle
                    cx={getProjX(milestoneTargetIndex, simulationTimeline.length)}
                    cy={getProjY(simulationTimeline[milestoneTargetIndex].totalNominal)}
                    r="6"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                    filter="drop-shadow(0 0 6px #10b981)"
                  />
                )}

                {/* Overlay de Hover */}
                {simulationTimeline.map((t, i) => {
                  const x = getProjX(i, simulationTimeline.length);
                  const wCol = pWidth / simulationTimeline.length;
                  return (
                    <rect
                      key={i}
                      x={x - wCol / 2}
                      y={padTop}
                      width={wCol}
                      height={pHeight}
                      fill="transparent"
                      style={{ cursor: 'crosshair' }}
                      onMouseEnter={() => setHoveredPoint({ ...t, isProjected: true })}
                    />
                  );
                })}

                {hoveredPoint && hoveredPoint.isProjected && (
                  <g>
                    <line x1={getProjX(hoveredPoint.monthIndex, simulationTimeline.length)} y1={padTop} x2={getProjX(hoveredPoint.monthIndex, simulationTimeline.length)} y2={padTop + pHeight} stroke="rgba(255, 255, 255, 0.3)" strokeDasharray="2 2" />
                    <circle cx={getProjX(hoveredPoint.monthIndex, simulationTimeline.length)} cy={getProjY(hoveredPoint.totalNominal)} r="5" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
                  </g>
                )}
              </svg>
            </div>

            {hoveredPoint && hoveredPoint.isProjected && (
              <div style={styles.hoverTooltip}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
                  <span style={{ fontWeight: '700', color: '#f8fafc' }}>Mês: {hoveredPoint.monthLabel}</span>
                  <span style={{ color: '#a78bfa' }}>Mês nº {hoveredPoint.monthIndex}</span>
                </div>
                <div style={styles.tooltipRow}>
                  <span>Patrimônio Nominal:</span>
                  <strong style={{ color: '#8b5cf6', fontFamily: 'monospace' }}>{formatMoney(hoveredPoint.totalNominal)}</strong>
                </div>
                <div style={styles.tooltipRow}>
                  <span>Poder de Compra Real:</span>
                  <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{formatMoney(hoveredPoint.totalReal)}</strong>
                </div>
                <div style={styles.tooltipRow}>
                  <span>Renda Real (Hoje):</span>
                  <strong style={{ color: '#34d399', fontFamily: 'monospace' }}>{formatMoney(hoveredPoint.monthlyIncomeReal)}/mês</strong>
                </div>
                <div style={styles.tooltipRow}>
                  <span>Renda Nominal:</span>
                  <span style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{formatMoney(hoveredPoint.monthlyIncomeNominal)}/mês</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* GRÁFICO 2: HISTÓRICO COMPLETO (63 MESES REAIS 2021-2026) */}
        {/* ------------------------------------------------------------- */}
        {activeChartTab === 'history' && (
          <div>
            {/* Banner de Estatísticas Históricas */}
            <div style={styles.historyStatsBar}>
              <div>
                <span style={styles.statLabel}>Início ({histStart.month}):</span>
                <strong style={{ color: '#94a3b8' }}>{formatMoney(histStart.total)}</strong>
              </div>
              <div>
                <span style={styles.statLabel}>Posição Atual ({histEnd.month}):</span>
                <strong style={{ color: '#34d399' }}>{formatMoney(histEnd.total)}</strong>
              </div>
              <div>
                <span style={styles.statLabel}>Ganho Patrimonial Total:</span>
                <strong style={{ color: '#38bdf8' }}>+{formatMoney(histTotalGain)} (+{histTotalGainPct}%)</strong>
              </div>
              <div>
                <span style={styles.statLabel}>Meses Contínuos:</span>
                <strong style={{ color: '#a78bfa' }}>{fullHistory.length} meses</strong>
              </div>
            </div>

            <div style={styles.svgWrapper}>
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                style={styles.svg}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Linhas de Grade */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                  const yVal = padTop + pHeight * (1 - ratio);
                  const labelVal = maxHistoryVal * ratio;
                  return (
                    <g key={i}>
                      <line x1={padLeft} y1={yVal} x2={chartWidth - padRight} y2={yVal} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" />
                      <text x={padLeft - 8} y={yVal + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                        {formatShortMoney(labelVal)}
                      </text>
                    </g>
                  );
                })}

                {/* Área Preenchida com Gradiente */}
                <defs>
                  <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={historyAreaD} fill="url(#historyGradient)" />

                {/* Linhas de decomposição */}
                <path d={historyRfBrPathD} fill="none" stroke="#8b5cf6" strokeWidth="1.6" opacity="0.6" />
                <path d={historyRvBrPathD} fill="none" stroke="#3b82f6" strokeWidth="1.6" opacity="0.7" />
                <path d={historyUsPathD} fill="none" stroke="#34d399" strokeWidth="1.6" opacity="0.7" />

                {/* Linha Total Histórico Consolidado */}
                <path d={historyTotalPathD} fill="none" stroke="#10b981" strokeWidth="3" filter="drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))" />

                {/* Eixo X: Marcadores Anuais */}
                {fullHistory.filter((_, idx) => idx % 12 === 0 || idx === fullHistory.length - 1).map((h, i) => {
                  const idx = fullHistory.findIndex(item => item.month === h.month);
                  const x = getHistX(idx, fullHistory.length);
                  return (
                    <g key={i}>
                      <line x1={x} y1={padTop} x2={x} y2={padTop + pHeight} stroke="rgba(255, 255, 255, 0.06)" />
                      <text x={x} y={chartHeight - 10} fill="#94a3b8" fontSize="11" textAnchor="middle">
                        {h.month}
                      </text>
                    </g>
                  );
                })}

                {/* Hover overlay */}
                {fullHistory.map((h, i) => {
                  const x = getHistX(i, fullHistory.length);
                  const wCol = pWidth / fullHistory.length;
                  return (
                    <rect
                      key={i}
                      x={x - wCol / 2}
                      y={padTop}
                      width={wCol}
                      height={pHeight}
                      fill="transparent"
                      style={{ cursor: 'crosshair' }}
                      onMouseEnter={() => setHoveredPoint({ ...h, isProjected: false, index: i })}
                    />
                  );
                })}

                {hoveredPoint && !hoveredPoint.isProjected && (
                  <g>
                    <line x1={getHistX(hoveredPoint.index, fullHistory.length)} y1={padTop} x2={getHistX(hoveredPoint.index, fullHistory.length)} y2={padTop + pHeight} stroke="rgba(255, 255, 255, 0.3)" strokeDasharray="2 2" />
                    <circle cx={getHistX(hoveredPoint.index, fullHistory.length)} cy={getHistY(hoveredPoint.total)} r="5" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
                  </g>
                )}
              </svg>
            </div>

            {hoveredPoint && !hoveredPoint.isProjected && (
              <div style={styles.hoverTooltip}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 6 }}>
                  <strong style={{ color: '#f8fafc' }}>Mês: {hoveredPoint.month}</strong>
                  <span style={{ color: '#10b981' }}>Histórico Real</span>
                </div>
                <div style={styles.tooltipRow}>
                  <span>Total Consolidado:</span>
                  <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>{formatMoney(hoveredPoint.total)}</strong>
                </div>
                <div style={styles.tooltipRow}>
                  <span>Renda Variável Brasil:</span>
                  <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{formatMoney(hoveredPoint.rvBr)}</span>
                </div>
                <div style={styles.tooltipRow}>
                  <span>Renda Variável EUA:</span>
                  <span style={{ color: '#34d399', fontFamily: 'monospace' }}>{formatMoney(hoveredPoint.rvUs)}</span>
                </div>
                <div style={styles.tooltipRow}>
                  <span>Renda Fixa Brasil:</span>
                  <span style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{formatMoney(hoveredPoint.rfBr)}</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Annual Milestones Checkpoints Table */}
      <div style={styles.tablePanel} className="glass-panel">
        <div style={styles.tableHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>Tabela de Marcos Anuais de Aposentadoria (2026 - 2036)</h3>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Acompanhe o fechamento estimado de cada ano até a conclusão em Dez/2036
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Marco Anual</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Patrimônio Projetado</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Poder de Compra Real</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>
                  <span>Renda Mensal ({withdrawalRateMonthly}%)</span>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal', textTransform: 'none', marginTop: 2 }}>
                    Poder de Compra Hoje (e Nominal)
                  </div>
                </th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Aportes Acumulados</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>% da Meta Final</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {annualMilestones.map((m, idx) => {
                const pct = Math.min(100, (m.monthlyIncomeReal / targetIncomeToday) * 100).toFixed(1);
                const isTargetYear = m.monthlyIncomeReal >= targetIncomeToday - 1;

                return (
                  <tr key={idx} style={{ 
                    ...styles.tr, 
                    backgroundColor: isTargetYear ? 'rgba(16, 185, 129, 0.06)' : (idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent') 
                  }}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Dez/{m.year}</span>
                        {isTargetYear && <Award size={14} color="#10b981" />}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: '600', color: '#8b5cf6', fontFamily: 'monospace' }}>
                      {formatMoney(m.totalNominal)}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', color: '#38bdf8', fontFamily: 'monospace' }}>
                      {formatMoney(m.totalReal)}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', color: '#34d399', fontFamily: 'monospace', fontSize: '13px' }}>
                        {formatMoney(m.monthlyIncomeReal)}<span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'normal' }}>/mês</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#a78bfa', fontFamily: 'monospace', marginTop: 2 }}>
                        Nominal: {formatMoney(m.monthlyIncomeNominal)}/mês
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', color: '#cbd5e1', fontFamily: 'monospace' }}>
                      {formatMoney(m.totalContributions)}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>{pct}%</span>
                        <div style={{ width: 60, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: isTargetYear ? '#10b981' : '#8b5cf6' }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {isTargetYear ? (
                        <span style={styles.statusBadgeSuccess}>Meta Atingida</span>
                      ) : (
                        <span style={styles.statusBadgeProgress}>Em Acumulação</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1440px',
    margin: '0 auto',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    color: '#ffffff',
    margin: '0 0 6px 0'
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
    maxWidth: '780px',
    lineHeight: 1.5
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 10px',
    borderRadius: '20px',
    background: 'rgba(139, 92, 246, 0.12)',
    border: '1px solid rgba(139, 92, 246, 0.25)',
    color: '#c4b5fd',
    fontSize: '11px',
    fontWeight: '600'
  },
  timeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 10px',
    borderRadius: '20px',
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    color: '#7dd3fc',
    fontSize: '11px',
    fontWeight: '600'
  },
  syncBtn: {
    height: '38px',
    padding: '0 16px',
    gap: '6px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    borderColor: '#8b5cf6',
    color: '#ffffff',
    boxShadow: '0 0 14px rgba(139, 92, 246, 0.3)'
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderRadius: '8px',
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: '12px',
    flexWrap: 'wrap',
    gap: 10
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 8px #10b981',
    display: 'inline-block'
  },
  tagMuted: {
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#a7f3d0',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px'
  },
  kpiCard: {
    background: 'rgba(30, 41, 59, 0.35)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative'
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8'
  },
  kpiValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.02em',
    marginBottom: '8px',
    fontFamily: 'monospace'
  },
  kpiUnit: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#94a3b8',
    marginLeft: '4px'
  },
  kpiFooter: {
    fontSize: '11px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  progressBarBg: {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: 'rgba(255, 255, 255, 0.08)',
    marginTop: '10px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
    borderRadius: '2px',
    transition: 'width 0.4s ease'
  },
  applyBtn: {
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    color: '#fbbf24',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  consoleContainer: {
    background: 'rgba(30, 41, 59, 0.35)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '20px'
  },
  consoleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: 8,
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '12px'
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#cbd5e1',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    cursor: 'pointer'
  },
  consoleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '24px'
  },
  consoleCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  inputLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#cbd5e1',
    display: 'flex',
    justifyContent: 'space-between'
  },
  inputRow: {
    display: 'flex',
    gap: '8px'
  },
  numberInput: {
    flex: 1,
    height: '38px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '0 12px',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'monospace'
  },
  stepBtnGroup: {
    display: 'flex',
    gap: '4px'
  },
  stepBtn: {
    height: '38px',
    padding: '0 10px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#cbd5e1',
    fontSize: '12px',
    cursor: 'pointer'
  },
  macroBox: {
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '4px'
  },
  macroInputsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  subInputLabel: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: '3px'
  },
  smallNumberInput: {
    width: '100%',
    height: '32px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid',
    borderRadius: '6px',
    padding: '0 8px',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: 'monospace'
  },
  sliderRow: {
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '8px',
    padding: '10px 14px'
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    fontSize: '12px',
    fontWeight: '600'
  },
  rateBadge: {
    fontSize: '10px',
    padding: '1px 5px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.06)',
    color: '#94a3b8'
  },
  rangeInput: {
    width: '100%',
    height: '6px',
    cursor: 'pointer'
  },
  presetGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '4px'
  },
  presetBtn: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '11px',
    color: '#cbd5e1',
    cursor: 'pointer'
  },
  yoyPanel: {
    background: 'rgba(30, 41, 59, 0.35)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '20px'
  },
  yoyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: 10,
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '12px'
  },
  yoyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px'
  },
  yoyCard: {
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  yoyCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    paddingBottom: '10px'
  },
  yoyIconBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  yoyClassTitle: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '700',
    color: '#f8fafc'
  },
  yoyCurrentVal: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'monospace'
  },
  yoyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  yoyPeriodLabel: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '12px'
  },
  yoyBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
    fontFamily: 'monospace',
    border: '1px solid'
  },
  yoyDeltaMoney: {
    fontSize: '10px',
    color: '#94a3b8',
    marginTop: '2px',
    fontFamily: 'monospace'
  },
  yoyFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    paddingTop: '8px',
    marginTop: 'auto'
  },
  scorecardPanel: {
    background: 'rgba(30, 41, 59, 0.35)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '20px'
  },
  scorecardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '12px'
  },
  scorecardPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px'
  },
  scorecardTabBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  scorecardTabBtnActive: {
    background: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    boxShadow: '0 0 10px rgba(56, 189, 248, 0.1)'
  },
  scorecardMiniGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '10px',
    marginTop: '14px',
    marginBottom: '16px'
  },
  scorecardMiniCard: {
    padding: '12px 14px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  scorecardMiniCardActive: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    boxShadow: '0 0 12px rgba(56, 189, 248, 0.08)'
  },
  baseBadge: {
    fontSize: '10px',
    padding: '1px 5px',
    borderRadius: '4px',
    background: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    fontWeight: '600'
  },
  currentBadge: {
    fontSize: '10px',
    padding: '1px 5px',
    borderRadius: '4px',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    fontWeight: '600'
  },
  statusBadgeBase: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    background: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    fontSize: '10px',
    fontWeight: '600'
  },
  statusBadgeSuccess: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    fontSize: '10px',
    fontWeight: '700'
  },
  statusBadgeDanger: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    fontSize: '10px',
    fontWeight: '700'
  },
  statusBadgePending: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#94a3b8',
    fontSize: '10px'
  },
  chartPanel: {
    background: 'rgba(30, 41, 59, 0.35)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '20px',
    position: 'relative'
  },
  chartTabBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: 12
  },
  chartTabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  chartTabBtnActive: {
    background: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    color: '#c4b5fd'
  },
  chartTabBtnActiveHistory: {
    background: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    color: '#6ee7b7'
  },
  chartLegend: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    fontSize: '11px',
    color: '#cbd5e1',
    flexWrap: 'wrap'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  historyStatsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '8px',
    padding: '8px 16px',
    marginBottom: '12px',
    fontSize: '12px',
    flexWrap: 'wrap',
    gap: 12
  },
  statLabel: {
    color: '#94a3b8',
    marginRight: 6
  },
  svgWrapper: {
    width: '100%',
    overflowX: 'auto'
  },
  svg: {
    width: '100%',
    height: 'auto',
    display: 'block'
  },
  hoverTooltip: {
    position: 'absolute',
    top: '70px',
    right: '30px',
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'none'
  },
  tooltipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 3,
    fontSize: '11px',
    color: '#cbd5e1'
  },
  tablePanel: {
    background: 'rgba(30, 41, 59, 0.35)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '20px'
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: 8
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px'
  },
  thRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    transition: 'background-color 0.2s ease'
  },
  td: {
    padding: '12px 14px'
  },
  statusBadgeProgress: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    background: 'rgba(139, 92, 246, 0.12)',
    color: '#c4b5fd',
    fontSize: '10px',
    fontWeight: '600',
    border: '1px solid rgba(139, 92, 246, 0.25)'
  }
};
