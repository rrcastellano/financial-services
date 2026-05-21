import React, { useState } from 'react';
import { FileSpreadsheet, Percent, Calculator, ChevronRight, BarChart3 } from 'lucide-react';
import { calculateDCF, calculateLBO, fetchCompsAnalysis } from '../utils/financeApi';

export default function ExcelViewer({ company }) {
  const [activeTab, setActiveTab] = useState('comps'); // comps, dcf, lbo
  
  // Custom interactive sliders for key metrics
  const [wacc, setWacc] = useState(Math.round((company?.wacc || 0.08) * 1000) / 10); // in %
  const [terminalMult, setTerminalMult] = useState(company?.terminalMultiple || 15.0);
  const [growth, setGrowth] = useState(Math.round((company?.revenueGrowth || 0.05) * 1000) / 10); // in %
  const [leverage, setLeverage] = useState(4.5); // LBO leverage multiple
  
  if (!company) return null;

  // Apply sliders back to our temporary model company
  const updatedCompany = {
    ...company,
    wacc: wacc / 100,
    terminalMultiple: parseFloat(terminalMult),
    revenueGrowth: growth / 100,
    growthRateYear1: growth / 100,
    growthRateYear2: (growth * 0.95) / 100,
    growthRateYear3: (growth * 0.9) / 100,
    growthRateYear4: (growth * 0.85) / 100,
    growthRateYear5: (growth * 0.8) / 100,
  };

  const compsData = fetchCompsAnalysis(updatedCompany);
  const dcfData = calculateDCF(updatedCompany);
  const lboData = calculateLBO(updatedCompany, leverage);

  return (
    <div style={styles.container} className="glass-panel animate-fade">
      
      {/* Excel Header Toolbar */}
      <div style={styles.excelToolbar}>
        <div style={styles.titleArea}>
          <FileSpreadsheet size={18} color="#10b981" />
          <span style={styles.sheetTitle}>Excel Model: {company.ticker}_Valuation_Model.xlsx</span>
        </div>
        
        {/* Sliders panel for dynamic formulas */}
        <div style={styles.slidersRow}>
          <div style={styles.sliderControl}>
            <label style={styles.sliderLabel}>Growth (YoY): {growth}%</label>
            <input 
              type="range" 
              min="1" 
              max="50" 
              step="0.5"
              value={growth} 
              onChange={(e) => setGrowth(parseFloat(e.target.value))}
              style={styles.sliderInput} 
            />
          </div>
          
          <div style={styles.sliderControl}>
            <label style={styles.sliderLabel}>WACC: {wacc}%</label>
            <input 
              type="range" 
              min="4" 
              max="20" 
              step="0.1"
              value={wacc} 
              onChange={(e) => setWacc(parseFloat(e.target.value))}
              style={styles.sliderInput} 
            />
          </div>

          <div style={styles.sliderControl}>
            <label style={styles.sliderLabel}>Exit Mult: {terminalMult}x</label>
            <input 
              type="range" 
              min="5" 
              max="40" 
              step="0.5"
              value={terminalMult} 
              onChange={(e) => setTerminalMult(parseFloat(e.target.value))}
              style={styles.sliderInput} 
            />
          </div>

          {activeTab === 'lbo' && (
            <div style={styles.sliderControl} className="animate-fade">
              <label style={styles.sliderLabel}>Leverage: {leverage}x Debt</label>
              <input 
                type="range" 
                min="1" 
                max="8" 
                step="0.1"
                value={leverage} 
                onChange={(e) => setLeverage(parseFloat(e.target.value))}
                style={styles.sliderInput} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        <button 
          style={{...styles.tab, ...(activeTab === 'comps' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('comps')}
        >
          📈 Comparable Companies
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'dcf' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('dcf')}
        >
          ⚡ DCF Projection & Valuation
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'lbo' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('lbo')}
        >
          🏢 LBO Buyout Returns
        </button>
      </div>

      {/* Sheet Content Workspace */}
      <div style={styles.workspace} className="spreadsheet-container">
        
        {/* COMPS TAB */}
        {activeTab === 'comps' && (
          <table className="spreadsheet-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th className="spreadsheet-th" style={{ width: '40px' }}></th>
                <th className="spreadsheet-th">Company</th>
                <th className="spreadsheet-th">Ticker</th>
                <th className="spreadsheet-th">Price ($)</th>
                <th className="spreadsheet-th">Market Cap ($M)</th>
                <th className="spreadsheet-th">Enterprise Value ($M)</th>
                <th className="spreadsheet-th">Revenue ($M)</th>
                <th className="spreadsheet-th">YoY Growth %</th>
                <th className="spreadsheet-th">EBITDA ($M)</th>
                <th className="spreadsheet-th">EBITDA Margin</th>
                <th className="spreadsheet-th">EV/Rev Multiple</th>
                <th className="spreadsheet-th">EV/EBITDA Multiple</th>
                <th className="spreadsheet-th">P/E Multiple</th>
              </tr>
            </thead>
            <tbody>
              {compsData.map((row, idx) => (
                <tr 
                  key={row.ticker} 
                  style={{
                    background: row.isTarget ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    borderBottom: '1px solid var(--xls-border)'
                  }}
                >
                  <td className="spreadsheet-row-header">{idx + 1}</td>
                  <td className="spreadsheet-td" style={{ fontWeight: row.isTarget ? 'bold' : 'normal' }}>
                    {row.name} {row.isTarget && '(Target)'}
                  </td>
                  <td className="spreadsheet-td" style={{ textAlign: 'center' }}>{row.ticker}</td>
                  <td className="spreadsheet-td spreadsheet-cell-input" style={{ textAlign: 'right' }}>{row.price}</td>
                  <td className="spreadsheet-td" style={{ textAlign: 'right' }}>{row.marketCap.toLocaleString()}</td>
                  <td className="spreadsheet-td" style={{ textAlign: 'right' }}>{row.ev.toLocaleString()}</td>
                  <td className="spreadsheet-td" style={{ textAlign: 'right' }}>{row.revenue.toLocaleString()}</td>
                  <td className="spreadsheet-td" style={{ textAlign: 'right' }}>{(row.growth * 100).toFixed(1)}%</td>
                  <td className="spreadsheet-td" style={{ textAlign: 'right' }}>{row.ebitda.toLocaleString()}</td>
                  <td className="spreadsheet-td" style={{ textAlign: 'right' }}>{(row.ebitdaMargin * 100).toFixed(1)}%</td>
                  <td className="spreadsheet-td spreadsheet-cell-formula" style={{ textAlign: 'right' }}>{row.evRevenue}x</td>
                  <td className="spreadsheet-td spreadsheet-cell-formula" style={{ textAlign: 'right' }}>{row.evEbitda}x</td>
                  <td className="spreadsheet-td spreadsheet-cell-formula" style={{ textAlign: 'right' }}>{row.pe}x</td>
                </tr>
              ))}

              {/* Blank Separation */}
              <tr>
                <td className="spreadsheet-row-header">{compsData.length + 1}</td>
                <td colSpan={12} style={{ height: 18, background: '#0f172a' }}></td>
              </tr>

              {/* Statistical median summary */}
              <tr style={{ background: 'rgba(255,255,255, 0.02)' }}>
                <td className="spreadsheet-row-header">{compsData.length + 2}</td>
                <td className="spreadsheet-td" style={{ fontWeight: 'bold', color: '#38bdf8' }}>Comps Median</td>
                <td className="spreadsheet-td" colSpan={5}></td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {(compsData.reduce((acc, r) => acc + r.growth, 0) / compsData.length * 100).toFixed(1)}%
                </td>
                <td className="spreadsheet-td"></td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {(compsData.reduce((acc, r) => acc + r.ebitdaMargin, 0) / compsData.length * 100).toFixed(1)}%
                </td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', fontWeight: 'bold', color: '#f43f5e' }}>
                  {(compsData.reduce((acc, r) => acc + r.evRevenue, 0) / compsData.length).toFixed(1)}x
                </td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', fontWeight: 'bold', color: '#f43f5e' }}>
                  {(compsData.reduce((acc, r) => acc + r.evEbitda, 0) / compsData.length).toFixed(1)}x
                </td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', fontWeight: 'bold', color: '#f43f5e' }}>
                  {(compsData.reduce((acc, r) => acc + r.pe, 0) / compsData.length).toFixed(1)}x
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* DCF VALUATION TAB */}
        {activeTab === 'dcf' && (
          <table className="spreadsheet-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th className="spreadsheet-th" style={{ width: '40px' }}></th>
                <th className="spreadsheet-th">Financial Metric ($M)</th>
                <th className="spreadsheet-th" style={{ textAlign: 'right' }}>Base (LTM)</th>
                <th className="spreadsheet-th" style={{ textAlign: 'right' }}>Year 1</th>
                <th className="spreadsheet-th" style={{ textAlign: 'right' }}>Year 2</th>
                <th className="spreadsheet-th" style={{ textAlign: 'right' }}>Year 3</th>
                <th className="spreadsheet-th" style={{ textAlign: 'right' }}>Year 4</th>
                <th className="spreadsheet-th" style={{ textAlign: 'right' }}>Year 5</th>
              </tr>
            </thead>
            <tbody>
              {/* Revenue */}
              <tr>
                <td className="spreadsheet-row-header">1</td>
                <td className="spreadsheet-td">Revenue Forecast</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right' }}>{company.revenueLTM.toLocaleString()}</td>
                {dcfData.projections.map(p => (
                  <td key={p.year} className="spreadsheet-td spreadsheet-cell-formula" style={{ textAlign: 'right' }}>
                    {p.revenue.toLocaleString()}
                  </td>
                ))}
              </tr>

              {/* YoY Growth */}
              <tr>
                <td className="spreadsheet-row-header">2</td>
                <td className="spreadsheet-td">Revenue Growth %</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right' }}>{(company.revenueGrowth * 100).toFixed(1)}%</td>
                {dcfData.projections.map(p => (
                  <td key={p.year} className="spreadsheet-td spreadsheet-cell-input" style={{ textAlign: 'right' }}>
                    {(p.growth * 100).toFixed(1)}%
                  </td>
                ))}
              </tr>

              {/* EBITDA */}
              <tr>
                <td className="spreadsheet-row-header">3</td>
                <td className="spreadsheet-td">Projected EBITDA</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right' }}>{company.ebitda.toLocaleString()}</td>
                {dcfData.projections.map(p => (
                  <td key={p.year} className="spreadsheet-td spreadsheet-cell-formula" style={{ textAlign: 'right' }}>
                    {p.ebitda.toLocaleString()}
                  </td>
                ))}
              </tr>

              {/* FCF Proxy */}
              <tr style={{ borderBottom: '2px solid var(--xls-border)' }}>
                <td className="spreadsheet-row-header">4</td>
                <td className="spreadsheet-td" style={{ fontWeight: '500' }}>Free Cash Flow (FCF)</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right' }}>{company.freeCashFlowLTM.toLocaleString()}</td>
                {dcfData.projections.map(p => (
                  <td key={p.year} className="spreadsheet-td spreadsheet-cell-formula" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {p.fcf.toLocaleString()}
                  </td>
                ))}
              </tr>

              {/* Discount Factor */}
              <tr>
                <td className="spreadsheet-row-header">5</td>
                <td className="spreadsheet-td">Discount Factor (@{wacc}% WACC)</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right' }}>1.0000</td>
                {dcfData.projections.map(p => (
                  <td key={p.year} className="spreadsheet-td" style={{ textAlign: 'right', color: '#94a3b8' }}>
                    {p.df}
                  </td>
                ))}
              </tr>

              {/* PV of Cash Flow */}
              <tr style={{ background: 'rgba(255,255,255, 0.01)' }}>
                <td className="spreadsheet-row-header">6</td>
                <td className="spreadsheet-td" style={{ fontWeight: '500', color: '#10b981' }}>Present Value (PV) of FCF</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right' }}>-</td>
                {dcfData.projections.map(p => (
                  <td key={p.year} className="spreadsheet-td spreadsheet-cell-formula" style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>
                    {p.pv.toLocaleString()}
                  </td>
                ))}
              </tr>

              {/* blank */}
              <tr>
                <td className="spreadsheet-row-header">7</td>
                <td colSpan={7} style={{ height: 16, background: '#0f172a' }}></td>
              </tr>

              {/* Valuation block */}
              <tr style={{ borderTop: '2px solid #6366f1' }}>
                <td className="spreadsheet-row-header">8</td>
                <td className="spreadsheet-td" style={{ fontWeight: 'bold' }}>Valuation Outputs</td>
                <td className="spreadsheet-td" style={{ fontWeight: 'bold', color: '#6366f1' }}>Implied Price</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', color: '#38bdf8', fontSize: '15px', fontWeight: 'bold' }} colSpan={2}>
                  ${dcfData.impliedPerShare} / share
                </td>
                <td className="spreadsheet-td" style={{ color: '#94a3b8' }} colSpan={3}>
                  (Current Share Price: ${company.price})
                </td>
              </tr>

              <tr>
                <td className="spreadsheet-row-header">9</td>
                <td className="spreadsheet-td">Sum PV of 5-Yr Cash Flows</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right' }} colSpan={2}>{dcfData.sumPVOfCashFlows.toLocaleString()}</td>
                <td className="spreadsheet-td" colSpan={4}></td>
              </tr>

              <tr>
                <td className="spreadsheet-row-header">10</td>
                <td className="spreadsheet-td">PV of Terminal Value ({terminalMult}x Multiple)</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right' }} colSpan={2}>{dcfData.pvTerminalValue.toLocaleString()}</td>
                <td className="spreadsheet-td" colSpan={4}>
                  Terminal EBITDA: {dcfData.terminalEbitda.toLocaleString()} | Terminal Value: {dcfData.terminalValue.toLocaleString()}
                </td>
              </tr>

              <tr style={{ borderTop: '1px dashed var(--xls-border)', fontWeight: 'bold' }}>
                <td className="spreadsheet-row-header">11</td>
                <td className="spreadsheet-td" style={{ color: '#ffffff' }}>Implied Enterprise Value ($M)</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', color: '#ffffff' }} colSpan={2}>
                  {dcfData.enterpriseValue.toLocaleString()}
                </td>
                <td className="spreadsheet-td" colSpan={4}></td>
              </tr>

              <tr>
                <td className="spreadsheet-row-header">12</td>
                <td className="spreadsheet-td">Less: Net Debt ($M)</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', color: '#f87171' }} colSpan={2}>
                  {company.netDebt.toLocaleString()}
                </td>
                <td className="spreadsheet-td" colSpan={4}></td>
              </tr>

              <tr style={{ borderTop: '2px solid var(--xls-border)', fontWeight: 'bold' }}>
                <td className="spreadsheet-row-header">13</td>
                <td className="spreadsheet-td" style={{ color: '#10b981' }}>Implied Equity Value ($M)</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', color: '#10b981' }} colSpan={2}>
                  {dcfData.equityValue.toLocaleString()}
                </td>
                <td className="spreadsheet-td" style={{ color: '#94a3b8' }} colSpan={4}>
                  Shares Outstanding: {company.shares.toLocaleString()} Million
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* LBO BUYOUT RETURNS TAB */}
        {activeTab === 'lbo' && (
          <table className="spreadsheet-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th className="spreadsheet-th" style={{ width: '40px' }}></th>
                <th className="spreadsheet-th">LBO Transaction Metric</th>
                <th className="spreadsheet-th" style={{ textAlign: 'right' }}>Value ($M)</th>
                <th className="spreadsheet-th">Details & Assumptions</th>
              </tr>
            </thead>
            <tbody>
              {/* Entry multiples */}
              <tr>
                <td className="spreadsheet-row-header">1</td>
                <td className="spreadsheet-td" style={{ fontWeight: '500' }}>Implied Acquisition Enterprise Value</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {lboData.impliedEV.toLocaleString()}
                </td>
                <td className="spreadsheet-td" style={{ color: '#94a3b8' }}>
                  Based on target market cap + net debt at entry
                </td>
              </tr>

              <tr>
                <td className="spreadsheet-row-header">2</td>
                <td className="spreadsheet-td">Debt Funding (Leverage: {leverage}x EBITDA)</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', color: '#38bdf8' }}>
                  {lboData.debtFunding.toLocaleString()}
                </td>
                <td className="spreadsheet-td" style={{ color: '#94a3b8' }}>
                  Senior secured debt at entry, amortized over 5 years
                </td>
              </tr>

              <tr style={{ borderBottom: '2px solid var(--xls-border)' }}>
                <td className="spreadsheet-row-header">3</td>
                <td className="spreadsheet-td" style={{ fontWeight: '500' }}>Sponsor Equity Funding</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', color: '#a7f3d0' }}>
                  {lboData.equityFunding.toLocaleString()}
                </td>
                <td className="spreadsheet-td" style={{ color: '#94a3b8' }}>
                  Required cash equity investment from PE sponsor at close
                </td>
              </tr>

              {/* Exit metrics */}
              <tr>
                <td className="spreadsheet-row-header">4</td>
                <td className="spreadsheet-td">Projected Exit EBITDA (Year 5)</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right' }}>
                  {lboData.exitEbitda.toLocaleString()}
                </td>
                <td className="spreadsheet-td" style={{ color: '#94a3b8' }}>
                  Grow based on {growth}% target revenue growth assumption
                </td>
              </tr>

              <tr>
                <td className="spreadsheet-row-header">5</td>
                <td className="spreadsheet-td">Projected Exit Enterprise Value</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right' }}>
                  {lboData.exitEV.toLocaleString()}
                </td>
                <td className="spreadsheet-td" style={{ color: '#94a3b8' }}>
                  Exit at {terminalMult}x Multiple (matches comps median)
                </td>
              </tr>

              <tr>
                <td className="spreadsheet-row-header">6</td>
                <td className="spreadsheet-td">Less: Ending Debt Balance</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', color: '#f87171' }}>
                  {lboData.endingDebt.toLocaleString()}
                </td>
                <td className="spreadsheet-td" style={{ color: '#94a3b8' }}>
                  Debt remaining after 5 years of cash flows amortization
                </td>
              </tr>

              <tr style={{ borderBottom: '2px solid var(--xls-border)', background: 'rgba(255,255,255,0.01)' }}>
                <td className="spreadsheet-row-header">7</td>
                <td className="spreadsheet-td" style={{ fontWeight: 'bold' }}>Projected Sponsor Exit Equity Value</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                  {lboData.exitEquityValue.toLocaleString()}
                </td>
                <td className="spreadsheet-td" style={{ color: '#94a3b8' }}>
                  Equity proceed to PE firm at exit
                </td>
              </tr>

              {/* LBO Returns SUMMARY */}
              <tr style={{ background: 'rgba(99, 102, 241, 0.06)' }}>
                <td className="spreadsheet-row-header">8</td>
                <td className="spreadsheet-td" style={{ fontWeight: 'bold', color: '#c7d2fe' }}>Sponsor IRR (%)</td>
                <td className="spreadsheet-td" style={{ textAlign: 'right', fontSize: 16, fontWeight: 'bold', color: '#fbbf24' }}>
                  {lboData.irr}%
                </td>
                <td className="spreadsheet-td" style={{ fontWeight: '500', color: '#ffffff' }}>
                  Multiple of Invested Capital (MOIC): <span style={{ color: '#fbbf24' }}>{lboData.moic}x</span>
                </td>
              </tr>
            </tbody>
          </table>
        )}

      </div>

      {/* Spreadsheet Bottom Stats bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusCell}>
          <ChevronRight size={14} />
          <span>READY</span>
        </div>
        <div style={styles.statusCell}>
          <Calculator size={14} />
          <span>AUTOCALCULATE: ON</span>
        </div>
        <div style={styles.statusCell}>
          <span>SUM: {dcfData.impliedPerShare}</span>
        </div>
      </div>

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  excelToolbar: {
    background: '#0f172a',
    borderBottom: '1px solid var(--xls-border)',
    padding: '12px 18px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  titleArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: '500',
    fontSize: '13px',
    color: '#e2e8f0',
  },
  slidersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  sliderControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  sliderLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontFamily: 'var(--font-display)',
    fontWeight: '500',
  },
  sliderInput: {
    width: '100px',
    height: '4px',
    accentColor: '#6366f1',
    cursor: 'pointer',
  },
  tabBar: {
    display: 'flex',
    background: '#1e293b',
    borderBottom: '1px solid var(--xls-border)',
    padding: '0 8px',
  },
  tab: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontFamily: 'var(--font-display)',
    fontWeight: '500',
    fontSize: '13px',
    padding: '10px 16px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: '#38bdf8',
    borderBottomColor: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.05)',
  },
  workspace: {
    padding: '0',
    background: '#020617',
    border: 'none',
    maxHeight: '400px',
  },
  statusBar: {
    background: '#0f172a',
    borderTop: '1px solid var(--xls-border)',
    padding: '6px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    fontSize: '11px',
    color: '#94a3b8',
    fontFamily: 'var(--font-display)',
    fontWeight: '500',
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
};
