import { MAX_SCORE, VALID_SCORE } from '../lib/engine';

const SIG_STATES = {
  LOADING: { tag: 'ŁADUJĘ', verdict: '…', vcls: 'none' },
  NO_TRADE: { tag: 'NO TRADE', verdict: 'NO TRADE', vcls: 'none' },
  FORMING: { tag: 'SETUP SIĘ TWORZY', verdict: 'CZEKAM', vcls: 'none' },
  READY: { tag: 'SETUP GOTOWY', verdict: 'CZEKAM', vcls: 'none' },
  CONFIRMED: { tag: 'SYGNAŁ POTWIERDZONY', verdict: '', vcls: '' },
};

function sigGrade(score) {
  if (score >= MAX_SCORE - 1) return { letter: 'A', cls: 'g-a' };
  if (score >= MAX_SCORE - 2) return { letter: 'B', cls: 'g-b' };
  return { letter: 'C', cls: 'g-c' };
}

// st: { state, dir, score, sub, conditions:[{key,val,cls}], levels:{entry,sl,tp1,lot}, waiting:[] }
export default function SignalCard({ st }) {
  const meta = SIG_STATES[st.state] || SIG_STATES.LOADING;
  const confirmed = st.state === 'CONFIRMED';
  const dirWord = st.dir === 'BUY' ? 'LONG' : st.dir === 'SELL' ? 'SHORT' : null;
  const cardCls = 'panel sigcard' + (confirmed ? (st.dir === 'BUY' ? ' is-long' : ' is-short') : '');
  const verdictCls = 'sig-verdict ' + (confirmed ? (st.dir === 'BUY' ? 'long' : 'short') : meta.vcls);

  let quality = null;
  if (st.score != null) {
    const g = sigGrade(st.score);
    const pct = Math.round((st.score / MAX_SCORE) * 100);
    quality = { g, pct };
  }

  return (
    <aside className={cardCls} id="signalCard">
      <div className="panel-head">
        <p className="panel-title">Sygnał</p>
        <span className="sig-state" data-state={confirmed ? 'CONFIRMED' : st.state}>{meta.tag}</span>
      </div>
      <div className={verdictCls} id="sigVerdict">{confirmed ? dirWord : meta.verdict}</div>
      <p className="sig-sub" id="sigSub" dangerouslySetInnerHTML={{ __html: st.sub || '' }} />

      {quality && (
        <>
          <div className="sig-quality" id="sigQuality">
            {confirmed && <span className={'sig-grade ' + quality.g.cls}>{quality.g.letter}</span>}
            <span className="sig-score">zgodność warunków {st.score}/{MAX_SCORE} ({quality.pct}%) &nbsp;·&nbsp; próg VALID: {VALID_SCORE}/{MAX_SCORE}</span>
          </div>
          <div className="sig-meter" id="sigMeter"><i style={{ width: quality.pct + '%' }} className={confirmed ? 'ok' : ''} /></div>
        </>
      )}

      <ul className="sig-cond" id="sigConditions">
        {(st.conditions || []).map((c, i) => {
          const mark = c.cls === 'ok' ? '✓' : c.cls === 'block' ? '✕' : c.cls === 'warn' ? '!' : '·';
          return (
            <li key={i} className={c.cls}>
              <span className="c-mark">{mark}</span>
              <span className="c-key">{c.key}</span>
              <span className="c-val">{c.val}</span>
            </li>
          );
        })}
      </ul>

      {st.levels && (
        <div className="sig-levels" id="sigLevels">
          <div className="sig-lvl entry"><span className="k">Wejście</span><span className="v">{st.levels.entry.toFixed(2)}</span></div>
          <div className="sig-lvl sl"><span className="k">Stop loss</span><span className="v">{st.levels.sl.toFixed(2)}</span></div>
          <div className="sig-lvl tp"><span className="k">Take profit (TP1)</span><span className="v">{st.levels.tp1.toFixed(2)}</span></div>
          <div className="sig-lvl"><span className="k">R:R</span><span className="v">1 : 1</span></div>
          <div className="sig-lvl"><span className="k">Lot (z Twojego ryzyka)</span><span className="v">{st.levels.lot != null ? st.levels.lot.toFixed(2) : 'poniżej min.'}</span></div>
          <p className="sig-foot" style={{ border: 'none', padding: '8px 0 0' }}>
            Pozycja zamyka się w całości na TP1 albo na SL. SL i TP1 to stałe $10 od wejścia, czyli RR 1:1.
          </p>
        </div>
      )}
<footer>
      {st.waiting && st.waiting.length > 0 && (
        <ul className="sig-wait" id="sigWaiting">
          <li style={{ listStyle: 'none', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 4 }}>Czekam na</li>
          {st.waiting.map((w, i) => <li key={i}>→ {w}</li>)}
        </ul>
      )}

</footer>

      
    </aside>
  );
}
