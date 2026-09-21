import { fmtOpenTime } from '../lib/engine';

function fmtEmaPrice(v) { return v == null ? '—' : '$' + v.toFixed(2); }

export function H1Box({ h1State, lastAtrH1, lastH1Structure, lastH1Choch, minBars }) {
  if (!h1State) {
    return <p className="card-sub">Zbieram dane H1 (mam 0/{minBars} świec)…</p>;
  }
  const label = h1State.rising ? 'rosnący ▲' : h1State.falling ? 'spadkowy ▼' : 'brak wyraźnego kierunku';
  const cls = h1State.rising ? ' up' : h1State.falling ? ' down' : '';
  const structLabel = lastH1Structure?.highLabel && lastH1Structure?.lowLabel
    ? `${lastH1Structure.highLabel} + ${lastH1Structure.lowLabel} (${lastH1Structure.bias === 'bullish' ? 'bullish' : lastH1Structure.bias === 'bearish' ? 'bearish' : 'mieszana'})`
    : 'za mało potwierdzonych swingów';
  return (
    <>
      <div className="chip" style={{ minWidth: '100%' }}><div className="k">Kierunek H1 (EMA20)</div><div className={'v' + cls}>{label}</div></div>
      <p className="card-sub" style={{ marginTop: 12 }}>
        EMA20 H1: {fmtEmaPrice(h1State.e20)} &nbsp;·&nbsp; ATR(14) H1: {lastAtrH1 != null ? '$' + lastAtrH1.toFixed(2) : '—'} &nbsp;·&nbsp; ostatnia zamknięta świeca H1: {fmtOpenTime(h1State.last.openTime)} UTC
      </p>
      <p className="card-sub" style={{ marginTop: 6 }}>Struktura (swing HH/HL/LH/LL): <b>{structLabel}</b></p>
      {lastH1Choch && (
        <p className="card-sub" style={{ marginTop: 6, color: lastH1Choch === 'bullish' ? 'var(--good)' : 'var(--bad)' }}>
          ⚠ Change of Character: cena złamała ostatni {lastH1Choch === 'bullish' ? 'swing low (potencjalne odwrócenie w górę)' : 'swing high (potencjalne odwrócenie w dół)'}
        </p>
      )}
    </>
  );
}

export function M15Box({ m15State, minBars }) {
  if (!m15State) return <p className="card-sub">Zbieram dane M15 (mam 0/{minBars} świec)…</p>;
  const status = !m15State.touched ? 'brak pullbacku do EMA20'
    : m15State.rejectUp ? 'odrzucenie w górę od EMA20'
    : m15State.rejectDown ? 'odrzucenie w dół od EMA20'
    : 'dotknięcie EMA20, jeszcze bez odrzucenia';
  return (
    <>
      <div className="chip" style={{ minWidth: '100%' }}><div className="k">M15</div><div className="v">{status}</div></div>
      <p className="card-sub" style={{ marginTop: 12 }}>EMA20 M15: {fmtEmaPrice(m15State.e20)} &nbsp;·&nbsp; ostatnia zamknięta świeca M15: {fmtOpenTime(m15State.last.openTime)} UTC</p>
    </>
  );
}

export function M5Box({ m5State, minBars }) {
  if (!m5State) return <p className="card-sub">Zbieram dane M5 (mam 0/{minBars} świec)…</p>;
  const status = !m5State.touched ? 'brak pullbacku do własnej EMA20'
    : m5State.rejectUp ? 'zamknięcie z powrotem NAD EMA20 — trigger BUY'
    : m5State.rejectDown ? 'zamknięcie z powrotem POD EMA20 — trigger SELL'
    : 'dotknięcie EMA20, jeszcze bez zamknięcia';
  return (
    <>
      <div className="chip" style={{ minWidth: '100%' }}><div className="k">M5</div><div className="v">{status}</div></div>
      <p className="card-sub" style={{ marginTop: 12 }}>EMA20 M5: {fmtEmaPrice(m5State.e20)} &nbsp;·&nbsp; ostatnia zamknięta świeca M5: {fmtOpenTime(m5State.last.openTime)} UTC</p>
    </>
  );
}

export function DayTypeBox({ rangeInfo, h1State, regime }) {
  if (!rangeInfo || rangeInfo.ratio == null) return <p className="card-sub">Zbieram dane zakresu dziennego (biquote.io)…</p>;
  if (!h1State) return <p className="card-sub">Mam zakres dzienny, czekam na kierunek H1 z panelu EMA20 wyżej…</p>;
  const ratio = rangeInfo.ratio;
  let note;
  if (regime.key === 'trend') {
    note = `Dzisiejszy zakres ($${rangeInfo.todayRange.toFixed(2)}) to ${ratio.toFixed(2)}× średniej z ostatnich ${rangeInfo.sampleDays} dni ($${rangeInfo.avgRange.toFixed(2)}), a H1 EMA20 ma wyraźny kierunek (${h1State.rising ? 'rosnący' : 'spadkowy'}). Warunki bardziej sprzyjają podążaniu za trendem niż grze pod powrót do zakresu.`;
  } else if (regime.key === 'range') {
    note = `Dzisiejszy zakres jest węższy niż zwykle (${ratio.toFixed(2)}× średniej z ${rangeInfo.sampleDays} dni), a H1 EMA20 jest płaski. Ostrożnie z sygnałami trend-following.`;
  } else {
    note = 'Zakres dzienny i kierunek H1 EMA20 nie dają spójnego obrazu — brak wyraźnej przewagi w tej chwili.';
  }
  return (
    <>
      <div className="chip" style={{ minWidth: '100%' }}><div className="k">Reżim dnia</div><div className={'v' + (regime.cls || '')}>{regime.label}</div></div>
      <p className="card-sub" style={{ marginTop: 12 }}>{note}</p>
    </>
  );
}

const MTF_CONFIG = [
  { key: '1M', label: 'Monthly' }, { key: 'w1', label: 'Weekly' }, { key: '1d', label: 'Daily' },
  { key: '4h', label: 'H4' }, { key: '1h', label: 'H1' }, { key: '30m', label: 'M30' },
  { key: '15m', label: 'M15' }, { key: '5m', label: 'M5' }, { key: '1m', label: 'M1' },
];

export function MtfGrid({ mtfState }) {
  return (
    <div className="mtf-grid">
      {MTF_CONFIG.map((cfg) => {
        const st = mtfState[cfg.key];
        if (!st) return <div className="mtf-tile" key={cfg.key}><div className="mtf-tf">{cfg.label}</div><div className="mtf-detail">ładowanie…</div></div>;
        const dirLabel = st.rising ? '▲' : st.falling ? '▼' : '—';
        const dirCls = st.rising ? 'up' : st.falling ? 'down' : 'flat';
        const pctDiff = st.e20 ? ((st.last.close - st.e20) / st.e20) * 100 : 0;
        const period = cfg.key === '1M' ? 10 : 20;
        return (
          <div className="mtf-tile" key={cfg.key}>
            <div className="mtf-tf">{cfg.label}</div>
            <div className={'mtf-dir ' + dirCls}>{dirLabel}</div>
            <div className="mtf-detail">EMA{period} ${st.e20.toFixed(2)}<br />cena ${st.last.close.toFixed(2)}<br />{(pctDiff >= 0 ? '+' : '') + pctDiff.toFixed(2)}% vs EMA</div>
          </div>
        );
      })}
    </div>
  );
}
