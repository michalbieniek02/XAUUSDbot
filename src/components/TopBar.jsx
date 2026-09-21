import { SYMBOL_CONFIG, currentSessionLabel } from '../lib/engine';

export default function TopBar({ activeSymbol, onSymbolChange, symLabel, price, changeLabel, bidAsk, dataLabel }) {
  return (
    <div className="term-top">
      <div className="term-top-in">
        <h1 className="sr-only">{symLabel} — terminal decyzyjny</h1>
        <div className="sym-switch" role="tablist" aria-label="Instrument">
          {Object.keys(SYMBOL_CONFIG).map((sym) => (
            <button
              key={sym} type="button" role="tab" aria-selected={activeSymbol === sym}
              className={'sym-btn' + (activeSymbol === sym ? ' is-on' : '')}
              onClick={() => onSymbolChange(sym)}
            >
              {SYMBOL_CONFIG[sym].label}
            </button>
          ))}
        </div>
        <span className="tt-price num">{price != null ? '$' + price.toFixed(2) : '—'}</span>
        <span className={'tt-change num' + (changeLabel ? ' ' + changeLabel.cls : '')}>{changeLabel ? changeLabel.text : '—'}</span>
        <div className="tt-metrics">
          <div className="tt-metric"><span className="k">Bid</span><span className="v num">{bidAsk ? '$' + bidAsk.bid.toFixed(2) : '—'}</span></div>
          <div className="tt-metric"><span className="k">Ask</span><span className="v num">{bidAsk ? '$' + bidAsk.ask.toFixed(2) : '—'}</span></div>
          <div className="tt-metric"><span className="k">Spread</span><span className="v num">{bidAsk ? '$' + bidAsk.spread.toFixed(2) : '—'}</span></div>
          <div className="tt-metric"><span className="k">Sesja</span><span className="v">{currentSessionLabel()}</span></div>
          <div className="tt-metric"><span className="k">Dane</span><span className="v">{dataLabel}</span></div>
        </div>
      </div>
    </div>
  );
}
