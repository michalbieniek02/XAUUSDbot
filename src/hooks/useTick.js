import { useEffect, useRef, useState } from 'react';
import { fetchTick } from '../lib/api';
import { isUsablePrice } from '../lib/engine';

// Polls biquote.io every 3s for the active symbol. symbolRef guards against
// applying a response that arrived after the user already switched symbols.
export function useTick(activeSymbol, symbolRef) {
  const [price, setPrice] = useState(null);
  const [changeLabel, setChangeLabel] = useState(null);
  const [bidAsk, setBidAsk] = useState(null); // {bid, ask, spread}
  const [marketClosed, setMarketClosed] = useState(null);
  const [connState, setConnState] = useState('connecting'); // connecting|live|closed|error

  // reset when the symbol changes
  useEffect(() => {
    setPrice(null); setChangeLabel(null); setBidAsk(null); setMarketClosed(null);
  }, [activeSymbol]);

  useEffect(() => {
    let stopped = false;
    async function poll() {
      const sym = activeSymbol;
      try {
        const q = await fetchTick(sym);
        if (stopped || symbolRef.current !== sym) return;
        if (q && (q.marketState != null || q.stale != null)) setMarketClosed(q.marketState === 'closed' || q.stale === true);
        const p = parseFloat(q.mid);
        if (!isUsablePrice(p)) { if (q.marketState === 'closed') setConnState('closed'); return; }
        setPrice(p);
        const pct = parseFloat(q.dayDiffPercent);
        if (!isNaN(pct)) {
          const prevClose = p / (1 + pct / 100);
          const chg = p - prevClose;
          setChangeLabel({ text: `${chg >= 0 ? '+' : ''}${chg.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`, cls: chg >= 0 ? 'up' : 'down' });
        }
        const b = parseFloat(q.bid), a = parseFloat(q.ask);
        if (!isNaN(b) && !isNaN(a)) setBidAsk({ bid: b, ask: a, spread: a - b });
        setConnState(q.marketState === 'closed' ? 'closed' : 'live');
      } catch (e) {
        if (!stopped && symbolRef.current === sym) setConnState((s) => (s === 'live' ? s : 'error'));
      }
    }
    poll();
    const id = setInterval(poll, 3000);
    return () => { stopped = true; clearInterval(id); };
  }, [activeSymbol, symbolRef]);

  return { price, changeLabel, bidAsk, marketClosed, connState };
}
