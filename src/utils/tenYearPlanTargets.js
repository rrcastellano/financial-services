/**
 * src/utils/tenYearPlanTargets.js
 * Utilitário compartilhado para cálculo e aferição das metas mensais do Plano de 10 Anos (2026)
 * por classe de ativo (Renda Variável EUA, Renda Variável Brasil, Renda Fixa Brasil e Total Consolidado).
 */

export const JAN_2026_BASELINE = {
  month: '01/2026',
  total: 2201831.42,
  rfBr: 421942.05,
  rvBr: 1029245.57,
  rvUs: 750643.80
};

export const MONTH_NAMES_2026 = [
  { num: '01', name: 'Jan/2026', short: 'Jan/26' },
  { num: '02', name: 'Fev/2026', short: 'Fev/26' },
  { num: '03', name: 'Mar/2026', short: 'Mar/26' },
  { num: '04', name: 'Abr/2026', short: 'Abr/26' },
  { num: '05', name: 'Mai/2026', short: 'Mai/26' },
  { num: '06', name: 'Jun/2026', short: 'Jun/26' },
  { num: '07', name: 'Jul/2026', short: 'Jul/26' },
  { num: '08', name: 'Ago/2026', short: 'Ago/26' },
  { num: '09', name: 'Set/2026', short: 'Set/26' },
  { num: '10', name: 'Out/2026', short: 'Out/26' },
  { num: '11', name: 'Nov/2026', short: 'Nov/26' },
  { num: '12', name: 'Dez/2026', short: 'Dez/26' }
];

/**
 * Calcula a evolução mês a mês das metas de 2026 para cada classe de ativo
 */
export function get2026TargetsTimeline(options = {}) {
  const retUs = Number(options.retUs ?? localStorage.getItem('fsi_typ_ret_us')) || 25.0;
  const retBr = Number(options.retBr ?? localStorage.getItem('fsi_typ_ret_br')) || 12.0;
  const monthlyContrib = Number(options.monthlyContrib ?? localStorage.getItem('fsi_typ_monthly_contrib')) || 15000;
  const allocUs = Number(options.allocUs ?? localStorage.getItem('fsi_typ_alloc_us')) || 50;
  const allocRvBr = Number(options.allocRvBr ?? localStorage.getItem('fsi_typ_alloc_rv_br')) || 25;
  const allocRfBr = Number(options.allocRfBr ?? localStorage.getItem('fsi_typ_alloc_rf_br')) || 25;

  const monthlyUs = Math.pow(1 + retUs / 100, 1 / 12) - 1;
  const monthlyBr = Math.pow(1 + retBr / 100, 1 / 12) - 1;

  const contribUs = monthlyContrib * (allocUs / 100);
  const contribRvBr = monthlyContrib * (allocRvBr / 100);
  const contribRfBr = monthlyContrib * (allocRfBr / 100);

  let currentUs = JAN_2026_BASELINE.rvUs;
  let currentRvBr = JAN_2026_BASELINE.rvBr;
  let currentRfBr = JAN_2026_BASELINE.rfBr;
  let currentTotal = JAN_2026_BASELINE.total;

  const timeline = [];

  MONTH_NAMES_2026.forEach((mObj, idx) => {
    let plannedUs = currentUs;
    let plannedRvBr = currentRvBr;
    let plannedRfBr = currentRfBr;
    let plannedTotal = currentTotal;

    if (idx > 0) {
      plannedUs = currentUs * (1 + monthlyUs) + contribUs;
      plannedRvBr = currentRvBr * (1 + monthlyBr) + contribRvBr;
      plannedRfBr = currentRfBr * (1 + monthlyBr) + contribRfBr;
      plannedTotal = plannedUs + plannedRvBr + plannedRfBr;

      currentUs = plannedUs;
      currentRvBr = plannedRvBr;
      currentRfBr = plannedRfBr;
      currentTotal = plannedTotal;
    }

    timeline.push({
      monthKey: `${mObj.num}/2026`,
      monthLabel: mObj.name,
      shortLabel: mObj.short,
      isBase: idx === 0,
      us: plannedUs,
      rvBr: plannedRvBr,
      rfBr: plannedRfBr,
      total: plannedTotal
    });
  });

  return timeline;
}

/**
 * Compara os saldos atuais realizados de cada classe contra a respectiva meta do mês de referência.
 * 
 * @param {Object} actuals - { usBrl, rvBr, rfBr, totalBrl }
 * @param {Object} options - Parâmetros opcionais de cálculo
 */
export function evaluatePortfolioTargets(actuals = {}, options = {}) {
  const refMonth = options.refMonth || localStorage.getItem('fsi_supabase_ref_month') || '08/2026';
  const timeline = get2026TargetsTimeline(options);

  // Localiza a meta projetada para o mês de referência
  const targetRow = timeline.find(r => r.monthKey === refMonth) || timeline[7] || timeline[timeline.length - 1];

  const actualUs = Number(actuals.usBrl || 0);
  const actualRvBr = Number(actuals.rvBr || 0);
  const actualRfBr = Number(actuals.rfBr || 0);
  const actualTotal = Number(actuals.totalBrl || (actualUs + actualRvBr + actualRfBr));

  const calcDiff = (actual, target) => {
    const diff = actual - target;
    const diffPct = target > 0 ? (diff / target) * 100 : 0;
    const isBeaten = actual >= target;
    return { actual, target, diff, diffPct, isBeaten };
  };

  const usResult = calcDiff(actualUs, targetRow.us);
  const rvBrResult = calcDiff(actualRvBr, targetRow.rvBr);
  const rfBrResult = calcDiff(actualRfBr, targetRow.rfBr);
  const totalResult = calcDiff(actualTotal, targetRow.total);

  const beatenClassesCount = (usResult.isBeaten ? 1 : 0) + (rvBrResult.isBeaten ? 1 : 0) + (rfBrResult.isBeaten ? 1 : 0);

  return {
    refMonth: targetRow.monthKey,
    refMonthLabel: targetRow.monthLabel,
    shortLabel: targetRow.shortLabel,
    us: usResult,
    rvBr: rvBrResult,
    rfBr: rfBrResult,
    total: totalResult,
    beatenClassesCount,
    totalClassesCount: 3
  };
}
