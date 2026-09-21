import CandleChart from './CandleChart';
import SignalCard from './SignalCard';
import { Ticker, CtxCell } from './Bars';
import { H1Box, M15Box, M5Box, DayTypeBox, MtfGrid } from './EngineDetails';
import { MAX_SCORE, EMA20_MIN_BARS, fmtPnl } from '../lib/engine';

const MAIN_TF_OPTIONS = [
  ['5m', 'M5'], ['15m', 'M15'], ['1h', 'H1'], ['4h', 'H4'], ['1d', 'D1'],
];

function legendDescription(label) {
  if (label === 'EMA20') return 'Średnia wykładnicza z 20 ostatnich świec — pokazuje krótkoterminowy kierunek ceny.';
  if (label === 'VWAP') return 'Średnia cena bieżącego dnia ważona tick-volume, liczona od 00:00 UTC.';
  if (label === 'PDH') return 'Previous Day High — najwyższa cena poprzedniego zamkniętego dnia.';
  if (label === 'PDL') return 'Previous Day Low — najniższa cena poprzedniego zamkniętego dnia.';
  if (label.endsWith(' H')) return `Najwyższa cena zakresu sesji ${label.startsWith('NY') ? 'nowojorskiej' : label.startsWith('London') ? 'londyńskiej' : 'azjatyckiej'}.`;
  if (label.endsWith(' L')) return `Najniższa cena zakresu sesji ${label.startsWith('NY') ? 'nowojorskiej' : label.startsWith('London') ? 'londyńskiej' : 'azjatyckiej'}.`;
  if (label === 'WEJŚCIE') return 'Poziom planowanego wejścia wynikający z aktualnego sygnału.';
  if (label === 'SL') return 'Stop Loss — poziom automatycznego ograniczenia straty.';
  if (label === 'TP1') return 'Take Profit 1 — pierwszy poziom realizacji zysku.';
  return label;
}

export default function TerminalTab({
  mainTf, onMainTfChange, mainChartRows, mainChartLevels,
  signalState,
  lastVwap, lastPdhPdl, lastAsianRange, lastOrb, lastAtrH1, lastDailyRangeInfo, regime,
  newsFeedUsable, nextNewsInfo, price,
  ftmoStrip,
  riskBalance, onRiskBalanceChange, riskPercent, onRiskPercentChange,
  h1State, m15State, m5State, lastH1Structure, lastH1Choch, mtfState,
}) {
  const newsLabel = !newsFeedUsable ? '⚠ brak danych kalendarza'
    : nextNewsInfo
    ? Math.abs(nextNewsInfo.minutesAway) <= 60
      ? `${nextNewsInfo.name} (${nextNewsInfo.minutesAway >= 0 ? 'za ' + Math.round(nextNewsInfo.minutesAway) + ' min' : Math.round(-nextNewsInfo.minutesAway) + ' min temu'})`
      : 'brak w najbliższą godzinę'
    : '—';

  return (
    <section className="tabpanel" data-tab="terminal">
      <div className="term-grid">
        <div className="panel">
          <div className="panel-head">
            <p className="panel-title">Wykres</p>
            <div className="tf-switch">
              {MAIN_TF_OPTIONS.map(([tf, label]) => (
                <button key={tf} type="button" aria-pressed={mainTf === tf} onClick={() => onMainTfChange(tf)}>{label}</button>
              ))}
            </div>
          </div>
          <CandleChart id="cvMain" rows={mainChartRows} width={920} height={400} ema levels={mainChartLevels} />
          <div className="chart-legend">
            <span className="legend-item" tabIndex="0" data-description={legendDescription('EMA20')} style={{ color: 'var(--violet)' }}><i /><span style={{ color: 'var(--text-muted)' }}>EMA20</span></span>
            {mainChartLevels.map((l, i) => (
              <span className="legend-item" tabIndex="0" data-description={legendDescription(l.label)} key={i} style={{ color: l.color, opacity: l.opacity ?? 1 }}><i /><span style={{ color: 'var(--text-muted)' }}>{l.label}</span></span>
            ))}
          </div>
        </div>

        <SignalCard st={signalState} />
      </div>

      <div className="ctx-bar">
        <CtxCell k="VWAP (tick-vol)" v={lastVwap == null ? '—' : lastVwap.toFixed(2)} cls={lastVwap == null ? 'muted' : price > lastVwap ? 'up' : 'down'} />
        <CtxCell k="PDH" v={lastPdhPdl ? lastPdhPdl.pdh.toFixed(2) : '—'} cls={lastPdhPdl ? '' : 'muted'} />
        <CtxCell k="PDL" v={lastPdhPdl ? lastPdhPdl.pdl.toFixed(2) : '—'} cls={lastPdhPdl ? '' : 'muted'} />
        <CtxCell k="Asia H/L" v={lastAsianRange ? `${lastAsianRange.hi.toFixed(0)} / ${lastAsianRange.lo.toFixed(0)}` : '—'} cls={lastAsianRange ? '' : 'muted'} />
        <CtxCell k="NY ORB" v={lastOrb ? `${lastOrb.hi.toFixed(0)} / ${lastOrb.lo.toFixed(0)}` : '—'} cls={lastOrb ? '' : 'muted'} />
        <CtxCell k="ATR H1" v={lastAtrH1 == null ? '—' : '$' + lastAtrH1.toFixed(2)} cls={lastAtrH1 == null ? 'muted' : ''} />
        <CtxCell k="Zakres dnia" v={lastDailyRangeInfo?.ratio != null ? lastDailyRangeInfo.ratio.toFixed(2) + '× śr.' : '—'} cls={lastDailyRangeInfo?.ratio != null ? '' : 'muted'} />
        <CtxCell k="Reżim" v={regime ? regime.label.split(' (')[0] : '—'} cls={regime ? (regime.key === 'trend' ? 'up' : '') : 'muted'} />
        <CtxCell k="Najbliższy news" v={newsLabel} cls={!newsFeedUsable ? 'down' : nextNewsInfo && Math.abs(nextNewsInfo.minutesAway) <= 30 ? 'down' : 'muted'} />
      </div>

      {ftmoStrip && (
        <div className="guard-strip">
          <CtxCell k="Bufor dzienny" v={`$${ftmoStrip.dailyLeft.toFixed(0)} / ${ftmoStrip.dailyLimit.toFixed(0)}`} cls={ftmoStrip.dailyLeft <= 0 ? 'down' : 'up'} />
          <CtxCell k="Bufor całkowity" v={`$${ftmoStrip.totalLeft.toFixed(0)} / ${ftmoStrip.totalLimit.toFixed(0)}`} cls={ftmoStrip.totalLeft <= 0 ? 'down' : 'up'} />
          <CtxCell k="Ryzyko nast. trejdu" v={'$' + ftmoStrip.nextRisk.toFixed(0)} cls="muted" />
          <CtxCell k="Bufor po nim" v={'$' + ftmoStrip.afterDaily.toFixed(0)} cls={ftmoStrip.afterDaily < 0 ? 'down' : 'up'} />
          <CtxCell k="Dziś w dzienniku" v={ftmoStrip.hasTodayEntry ? fmtPnl(ftmoStrip.todayPnl) : 'brak wpisu'} cls={ftmoStrip.hasTodayEntry ? (ftmoStrip.todayPnl >= 0 ? 'up' : 'down') : 'muted'} />
        </div>
      )}

      <details className="term-more">
        <summary>Szczegóły silnika — H1 / M15 / M5, punktacja, kalkulator ryzyka</summary>
        <div className="term-more-body">
          <Ticker>
            <div className="chip">
              <div className="k">Kapitał konta ($)</div>
              <input
                type="number" value={riskBalance} min={100} step={100}
                onChange={(e) => onRiskBalanceChange(parseFloat(e.target.value) || 10000)}
                className="num" style={{ width: '100%', border: 'none', background: 'transparent', color: 'inherit', fontSize: 17, fontWeight: 600, fontFamily: 'inherit', padding: 0, outline: 'none' }}
              />
            </div>
            <div className="chip">
              <div className="k">Ryzyko na trade (%)</div>
              <input
                type="number" value={riskPercent} min={0.1} max={5} step={0.1}
                onChange={(e) => onRiskPercentChange(parseFloat(e.target.value) || 0.5)}
                className="num" style={{ width: '100%', border: 'none', background: 'transparent', color: 'inherit', fontSize: 17, fontWeight: 600, fontFamily: 'inherit', padding: 0, outline: 'none' }}
              />
            </div>
          </Ticker>
          <div className="tf-grid">
            <div className="tf-card"><h3>H1 — bias</h3><H1Box h1State={h1State} lastAtrH1={lastAtrH1} lastH1Structure={lastH1Structure} lastH1Choch={lastH1Choch} minBars={EMA20_MIN_BARS} /></div>
            <div className="tf-card"><h3>M15 — setup</h3><M15Box m15State={m15State} minBars={EMA20_MIN_BARS} /></div>
            <div className="tf-card"><h3>M5 — trigger egzekucji</h3><M5Box m5State={m5State} minBars={EMA20_MIN_BARS} /></div>
          </div>
          <p className="card-sub" style={{ marginTop: 16 }}>
            H1 EMA20 to bias, M15 EMA20 to setup (pullback + odrzucenie), M5 EMA20 to trigger egzekucji — sygnał dopiero gdy wszystkie trzy się zgadzają, plus punktacja 0–{MAX_SCORE} i twarde NO TRADE (dane nieaktualne, spread za duży, news ±5 min). Wyłącznie informacyjne.
          </p>
        </div>
      </details>

      <details className="term-more">
        <summary>Reżim dnia i trend wielointerwałowy</summary>
        <div className="term-more-body">
          <h3 style={{ margin: '0 0 6px', fontSize: 14 }}>Filtr: dzień trendowy czy dzień range?</h3>
          <DayTypeBox rangeInfo={lastDailyRangeInfo} h1State={h1State} regime={regime} />
          <h3 style={{ margin: '22px 0 6px', fontSize: 14 }}>Trend wielointerwałowy (EMA20)</h3>
          <p className="card-sub">Kierunek EMA20 naraz na dziewięciu interwałach — od Monthly po M1. Wyłącznie informacyjne.</p>
          <MtfGrid mtfState={mtfState} />
        </div>
      </details>
    </section>
  );
}
