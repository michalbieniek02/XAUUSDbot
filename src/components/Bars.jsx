export function Chip({ k, v, cls, title }) {
  return (
    <div className="chip" title={title}>
      <div className="k">{k}</div>
      <div className={'v num' + (cls ? ' ' + cls : '')}>{v}</div>
    </div>
  );
}

export function Ticker({ children }) {
  return <div className="ticker">{children}</div>;
}

export function CtxCell({ k, v, cls }) {
  return (
    <div className="ctx-cell">
      <span className="k">{k}</span>
      <span className={'v' + (cls ? ' ' + cls : '')}>{v}</span>
    </div>
  );
}

export function GuardMeter({ label, pct, left, softPct, note }) {
  const cls = pct >= 100 ? 'bad' : pct >= softPct ? 'warn' : '';
  const color = pct >= 100 ? 'var(--bad)' : pct >= softPct ? 'var(--warn)' : 'var(--good)';
  return (
    <div className="guard-meter">
      <div className="gm-top">
        <span className="gm-label">{label}</span>
        <span className="gm-left" style={{ color }}>
          {left >= 0 ? `$${left.toFixed(2)} zostało` : `przekroczone o $${Math.abs(left).toFixed(2)}`}
        </span>
      </div>
      <div className="gm-bar"><i className={cls} style={{ width: pct.toFixed(1) + '%' }} /></div>
      <p className="gm-note" dangerouslySetInnerHTML={{ __html: note }} />
    </div>
  );
}
