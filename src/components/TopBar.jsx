import { SYMBOL_CONFIG, computePnl, currentSessionLabel, fmtPnl } from '../lib/engine';

export default function TopBar({ activeSymbol, onSymbolChange, symLabel, price, changeLabel, bidAsk, dataLabel, liveTrades = [] }) {
  return (
    <div className="term-top">
      <svg className="liquid-glass-defs" width="0" height="0" aria-hidden="true">
        <filter id="liquid-glass-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.4" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="16" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
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
          <div className="tt-live-trades" tabIndex="0">
            <div className="tt-metric"><span className="k">Live trade</span><span className="v num">{liveTrades.length}</span></div>
            {liveTrades.length > 0 && (
              <div className="tt-live-menu">
                {liveTrades.map((trade) => {
                  const pnl = price == null ? null : computePnl(trade.dir, trade.entry, price, trade.lot, trade.symbol || activeSymbol);
                  return (
                    <div className="tt-live-row" key={trade.id}>
                      <span className={'tt-live-dir ' + (trade.dir === 'BUY' ? 'buy' : 'sell')}>{trade.dir}</span>
                      <span><small>Wejście</small>${trade.entry.toFixed(2)}</span>
                      <span className={pnl > 0 ? 'up' : pnl < 0 ? 'down' : ''}><small>Live P/L</small>{fmtPnl(pnl)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
