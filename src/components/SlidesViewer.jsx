import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Presentation, Download, MonitorPlay } from 'lucide-react';
import { calculateDCF } from '../utils/financeApi';

export default function SlidesViewer({ company }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!company) return null;

  // Recalculate DCF implied price for dynamic slide values
  const dcfVal = calculateDCF(company);

  // Dynamic football field scale calculations
  const ffRange52wk = [company.price * 0.7, company.price * 1.15];
  const ffTradingComps = [company.price * 0.85, company.price * 1.1];
  const ffDcf = [dcfVal.impliedPerShare * 0.85, dcfVal.impliedPerShare * 1.15];
  const ffLbo = [company.price * 0.75, company.price * 0.95];
  const ffCurrent = company.price;

  const ffPrices = [
    ffRange52wk[0], ffRange52wk[1],
    ffTradingComps[0], ffTradingComps[1],
    ffDcf[0], ffDcf[1],
    ffLbo[0], ffLbo[1],
    ffCurrent
  ];

  const ffMin = Math.min(...ffPrices) * 0.9; // 10% bottom buffer
  const ffMax = Math.max(...ffPrices) * 1.1; // 10% top buffer
  const ffDiff = ffMax - ffMin;

  const ffGetPercent = (val) => {
    if (ffDiff === 0) return 50;
    const pct = ((val - ffMin) / ffDiff) * 100;
    return Math.max(2, Math.min(98, pct));
  };

  const getFFBarStyles = (minVal, maxVal, color) => {
    const leftPct = ffGetPercent(minVal);
    const rightPct = ffGetPercent(maxVal);
    const widthPct = rightPct - leftPct;
    return {
      ...styles.footballBar,
      left: `${leftPct}%`,
      width: `${Math.max(8, widthPct)}%`,
      background: color
    };
  };

  const refLineLeft = `calc(136px + (100% - 152px) * ${ffGetPercent(ffCurrent) / 100})`;
  
  const slides = [
    // Slide 1: Title
    {
      title: `${company.name} (NYSE: ${company.ticker})`,
      subtitle: "Strategic Alternatives Evaluation & Valuation Overview",
      content: (
        <div style={styles.titleSlideContent}>
          <div style={styles.brandingHeader}>MERGERS & ACQUISITIONS ADVISORY GROUP</div>
          <div style={styles.largeTicker}>{company.ticker}</div>
          <div style={styles.divider}></div>
          <div style={styles.presentationDetails}>
            <p>Prepared for: Board of Directors</p>
            <p>Strictly Private & Confidential</p>
            <p>May 2026</p>
          </div>
        </div>
      ),
    },
    // Slide 2: Company Overview & Strategic Situation
    {
      title: "Executive Summary & Market Context",
      subtitle: "Business positioning overview and sector challenges",
      content: (
        <div style={styles.grid2x2}>
          <div style={styles.slideCard}>
            <h4 style={styles.cardHeader}>Business Description</h4>
            <p style={styles.cardText}>{company.description}</p>
          </div>
          
          <div style={styles.slideCard}>
            <h4 style={styles.cardHeader}>Financial Strength</h4>
            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>Revenue (LTM)</span>
                <span style={styles.statVal}>${(company.revenueLTM / 1000).toFixed(1)}B</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>EBITDA Margin</span>
                <span style={styles.statVal}>{(company.ebitdaMargin * 100).toFixed(1)}%</span>
              </div>
            </div>
            <p style={{...styles.cardText, marginTop: 12}}>
              Exhibits strong financial fundamentals with revenue growing at {(company.revenueGrowth * 100).toFixed(1)}% YoY.
            </p>
          </div>

          <div style={{ ...styles.slideCard, gridColumn: 'span 2' }}>
            <h4 style={styles.cardHeader}>Strategic Thesis & Key Valuation Drivers</h4>
            <ul style={styles.slideList}>
              <li><strong>Market Leadership:</strong> Robust competitive advantages driving superior gross margins of {(company.grossMargin * 100).toFixed(1)}%.</li>
              <li><strong>Capital Efficiency:</strong> Exceptionally strong cash flow profile with LTM Free Cash Flow of ${(company.freeCashFlowLTM / 1000).toFixed(1)}B.</li>
              <li><strong>Value Unlock Opportunity:</strong> Implied valuation models suggest significant disconnects between current equity price and intrinsic business value.</li>
            </ul>
          </div>
        </div>
      ),
    },
    // Slide 3: Comparable Valuation
    {
      title: "Trading Comparable Benchmarking",
      subtitle: "Valuation multiples comparison against selected public peers",
      content: (
        <div style={styles.chartSlide}>
          <p style={styles.leadParagraph}>
            Select peer trading multiples suggest the market values peer leaders at a premium.
          </p>
          <div style={styles.compsChartRow}>
            {/* Peer multiple bars */}
            <div style={styles.barChartContainer}>
              <div style={styles.chartTitle}>EV / EBITDA Multiples</div>
              <div style={styles.chartBars}>
                <div style={styles.chartBarWrapper}>
                  <div style={{...styles.chartBar, height: `${company.ebitdaMargin * 100 * 1.5}%`}}>
                    <span style={styles.barVal}>{(company.terminalMultiple * 0.95).toFixed(1)}x</span>
                  </div>
                  <span style={styles.barLabel}>{company.ticker} (Target)</span>
                </div>
                <div style={styles.chartBarWrapper}>
                  <div style={{...styles.chartBar, height: '70%', background: '#0891b2'}}>
                    <span style={styles.barVal}>16.2x</span>
                  </div>
                  <span style={styles.barLabel}>Peer Avg</span>
                </div>
                <div style={styles.chartBarWrapper}>
                  <div style={{...styles.chartBar, height: '90%', background: '#6366f1'}}>
                    <span style={styles.barVal}>22.5x</span>
                  </div>
                  <span style={styles.barLabel}>Peer Leader</span>
                </div>
              </div>
            </div>

            <div style={styles.chartNotes}>
              <h4 style={styles.cardHeader}>Comps Insights</h4>
              <p style={styles.cardText}>
                The target's current trading valuation represents an attractive entry point relative to peer leaders, supported by premium margins.
              </p>
              <div style={{...styles.badgeContainer, marginTop: 12}}>
                <span className="tag tag-success">Target EV: ${(company.price * company.shares / 1000 + company.netDebt / 1000).toFixed(1)}B</span>
                <span className="tag tag-info">Peers: {company.comps.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 4: Football Field Valuation Summary
    {
      title: "Methodology Valuation Summary (Football Field)",
      subtitle: "Implied share price ranges based on multiple financial methodologies",
      content: (
        <div style={styles.footballFieldContainer}>
          <div style={styles.leadParagraph}>
            Valuation ranges support an implied intrinsic value per share of **${dcfVal.impliedPerShare}** based on DCF models.
          </div>
          
          <div style={styles.footballFieldChart}>
            {/* Methodology 1: Comps */}
            <div style={styles.footballFieldRow}>
              <div style={styles.rowLabel}>52-Week Range</div>
              <div style={styles.rowBarArea}>
                <div style={getFFBarStyles(ffRange52wk[0], ffRange52wk[1], 'rgba(255,255,255,0.15)')}>
                  <span style={styles.barRangeLabel}>${ffRange52wk[0].toFixed(0)} - ${ffRange52wk[1].toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Methodology 2: Public Comps */}
            <div style={styles.footballFieldRow}>
              <div style={styles.rowLabel}>Trading Comps</div>
              <div style={styles.rowBarArea}>
                <div style={getFFBarStyles(ffTradingComps[0], ffTradingComps[1], '#0891b2')}>
                  <span style={styles.barRangeLabel}>${ffTradingComps[0].toFixed(0)} - ${ffTradingComps[1].toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Methodology 3: DCF */}
            <div style={styles.footballFieldRow}>
              <div style={styles.rowLabel}>DCF Valuation</div>
              <div style={styles.rowBarArea}>
                <div style={getFFBarStyles(ffDcf[0], ffDcf[1], '#6366f1')}>
                  <span style={styles.barRangeLabel}>${ffDcf[0].toFixed(0)} - ${ffDcf[1].toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Methodology 4: LBO Return */}
            <div style={styles.footballFieldRow}>
              <div style={styles.rowLabel}>Illustrative LBO</div>
              <div style={styles.rowBarArea}>
                <div style={getFFBarStyles(ffLbo[0], ffLbo[1], '#10b981')}>
                  <span style={styles.barRangeLabel}>${ffLbo[0].toFixed(0)} - ${ffLbo[1].toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Current Price Reference Line */}
            <div style={{...styles.refLine, left: refLineLeft}}>
              <div style={styles.refLineText}>Current Price: ${ffCurrent.toFixed(2)}</div>
            </div>

            {/* Grid Scale Markers */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0 0 0',
              margin: '8px 16px 0 136px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              color: '#64748b',
              fontSize: '9px'
            }}>
              <span>${ffMin.toFixed(0)}</span>
              <span>${(ffMin + ffDiff * 0.25).toFixed(0)}</span>
              <span>${(ffMin + ffDiff * 0.5).toFixed(0)}</span>
              <span>${(ffMin + ffDiff * 0.75).toFixed(0)}</span>
              <span>${ffMax.toFixed(0)}</span>
            </div>
          </div>

          <div style={styles.footballFooter}>
            * Ranges denote 25th to 75th percentiles. DCF range utilizes {(company.wacc * 100).toFixed(1)}% WACC with a +/- 1.0% sensitivity.
          </div>
        </div>
      ),
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div style={styles.container} className="glass-panel animate-fade">
      
      {/* Slide Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.leftLabel}>
          <Presentation size={16} color="#6366f1" />
          <span style={styles.pptName}>PowerPoint: {company.ticker}_Pitch_Book.pptx</span>
        </div>
        <div style={styles.badge}>Slide {currentSlide + 1} of {slides.length}</div>
      </div>

      {/* Slide Area */}
      <div style={styles.slideArea} className="slide-container">
        <div style={styles.slideContent}>
          {/* Default slide header for inside slides */}
          {currentSlide > 0 && (
            <div style={styles.slideHeader}>
              <h2 style={styles.slideTitle}>{slides[currentSlide].title}</h2>
              <span style={styles.slideSubtitle}>{slides[currentSlide].subtitle}</span>
              <div style={styles.slideHeaderDivider}></div>
            </div>
          )}
          
          {slides[currentSlide].content}
          
          {/* Footer branding */}
          {currentSlide > 0 && (
            <div style={styles.slideBrandingFooter}>
              <span>STRICTLY PRIVATE & CONFIDENTIAL</span>
              <span>MERGERS & ACQUISITIONS ADVISORY GROUP</span>
            </div>
          )}
        </div>
      </div>

      {/* Slide Controls Toolbar */}
      <div style={styles.controlsBar}>
        <button onClick={() => setCurrentSlide(0)} style={styles.iconBtn} title="First Slide">
          <MonitorPlay size={16} />
        </button>
        
        <div style={styles.navBtns}>
          <button 
            onClick={handlePrev} 
            disabled={currentSlide === 0} 
            style={{...styles.navBtn, ...(currentSlide === 0 ? styles.disabledBtn : {})}}
          >
            <ChevronLeft size={16} /> Back
          </button>
          
          <span style={styles.counter}>{currentSlide + 1} / {slides.length}</span>
          
          <button 
            onClick={handleNext} 
            disabled={currentSlide === slides.length - 1} 
            style={{...styles.navBtn, ...(currentSlide === slides.length - 1 ? styles.disabledBtn : {})}}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>

        <button style={styles.downloadBtn} className="btn btn-secondary">
          <Download size={14} /> Download Presentation
        </button>
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
  topBar: {
    background: '#0f172a',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '12px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  pptName: {
    fontFamily: 'var(--font-display)',
    fontWeight: '500',
    fontSize: '13px',
    color: '#e2e8f0',
  },
  badge: {
    fontSize: '11px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    color: '#c7d2fe',
    padding: '3px 8px',
    borderRadius: '12px',
    fontFamily: 'var(--font-display)',
  },
  slideArea: {
    padding: '0',
    borderRadius: '0',
    border: 'none',
  },
  slideHeader: {
    marginBottom: '20px',
  },
  slideTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'left',
  },
  slideSubtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    textAlign: 'left',
    display: 'block',
    marginTop: 4,
  },
  slideHeaderDivider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
    marginTop: '10px',
  },
  slideBrandingFooter: {
    position: 'absolute',
    bottom: '15px',
    left: '5%',
    right: '5%',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: '#475569',
    borderTop: '1px solid rgba(255,255,255,0.03)',
    paddingTop: '6px',
    fontFamily: 'var(--font-display)',
    fontWeight: '500',
  },
  controlsBar: {
    background: '#0f172a',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '12px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#94a3b8',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  navBtn: {
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    color: '#c7d2fe',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: '13px',
    fontFamily: 'var(--font-display)',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  disabledBtn: {
    opacity: 0.3,
    cursor: 'not-allowed',
    background: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
    color: '#475569',
  },
  counter: {
    fontSize: '13px',
    color: '#94a3b8',
    fontFamily: 'var(--font-mono)',
  },
  downloadBtn: {
    padding: '6px 12px',
    fontSize: '13px',
  },
  
  // Title Slide Styling
  titleSlideContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'left',
    color: '#ffffff',
  },
  brandingHeader: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: '2px',
    marginBottom: '10px',
  },
  largeTicker: {
    fontSize: '64px',
    fontWeight: '800',
    lineHeight: '1',
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-2px',
  },
  divider: {
    height: '4px',
    width: '80px',
    background: '#6366f1',
    margin: '24px 0',
  },
  presentationDetails: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.8',
  },

  // Slide grid
  grid2x2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    height: '100%',
    overflow: 'hidden',
  },
  slideCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'left',
  },
  cardHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#38bdf8',
    marginBottom: '8px',
  },
  cardText: {
    fontSize: '11px',
    color: '#cbd5e1',
    lineHeight: '1.5',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
  },
  statBox: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '6px',
    padding: '10px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '9px',
    color: '#94a3b8',
  },
  statVal: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  slideList: {
    paddingLeft: '18px',
    fontSize: '11px',
    color: '#cbd5e1',
    lineHeight: '1.8',
  },

  // Chart slide
  chartSlide: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  leadParagraph: {
    fontSize: '13px',
    color: '#e2e8f0',
    marginBottom: '16px',
  },
  compsChartRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
    flex: 1,
    minHeight: 0,
  },
  barChartContainer: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  chartTitle: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: '16px',
    textAlign: 'center',
  },
  chartBars: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: '20px',
    minHeight: '120px',
  },
  chartBarWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '60px',
  },
  chartBar: {
    width: '32px',
    background: '#38bdf8',
    borderRadius: '4px 4px 0 0',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    transition: 'height 0.5s ease',
  },
  barVal: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#ffffff',
    position: 'absolute',
    top: '-16px',
  },
  barLabel: {
    fontSize: '9px',
    color: '#94a3b8',
    marginTop: '8px',
    whiteSpace: 'nowrap',
  },
  chartNotes: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  badgeContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },

  // Football Field Valuation Summary Slide
  footballFieldContainer: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  footballFieldChart: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '8px',
    padding: '24px 16px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    margin: '12px 0',
    minHeight: '160px',
  },
  footballFieldRow: {
    display: 'flex',
    alignItems: 'center',
    height: '24px',
    position: 'relative',
    zIndex: 2,
  },
  rowLabel: {
    width: '120px',
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  rowBarArea: {
    flex: 1,
    height: '100%',
    position: 'relative',
    background: 'rgba(255,255,255,0.01)',
    borderRadius: '4px',
  },
  footballBar: {
    position: 'absolute',
    height: '100%',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  barRangeLabel: {
    fontSize: '9px',
    color: '#ffffff',
    fontWeight: '700',
  },
  refLine: {
    position: 'absolute',
    top: '10px',
    bottom: '10px',
    width: '2px',
    background: '#f43f5e',
    zIndex: 5,
    boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)',
  },
  refLineText: {
    position: 'absolute',
    top: '-18px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#f43f5e',
    color: '#ffffff',
    fontSize: '8px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  footballFooter: {
    fontSize: '9px',
    color: '#475569',
  },
};
