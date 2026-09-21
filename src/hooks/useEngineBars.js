import { useEffect, useState } from 'react';
import { fetchOhlc, barsToAscending } from '../lib/api';
import { closedBars } from '../lib/engine';

function bar(b) { return { open: b.open, high: b.high, low: b.low, close: b.close, openTime: b.openTime, isOpen: b.isOpen }; }

// Raw, closed-only OHLC bars for H1/M15/M5 — the only inputs the H1→M15→M5
// engine needs. Reset to empty on symbol switch so stale-symbol bars never
// briefly render as the new symbol's state.
export function useEngineBars(activeSymbol, symbolRef) {
  const [h1BarsRaw, setH1BarsRaw] = useState([]);
  const [m15BarsRaw, setM15BarsRaw] = useState([]);
  const [m5BarsRaw, setM5BarsRaw] = useState([]);

  useEffect(() => {
    setH1BarsRaw([]); setM15BarsRaw([]); setM5BarsRaw([]);
  }, [activeSymbol]);

  useEffect(() => {
    let stopped = false;
    async function poll() {
      const sym = activeSymbol;
      try {
        const [jh1, jm15, jm5] = await Promise.all([
          fetchOhlc(sym, '1h', 100), fetchOhlc(sym, '15m', 100), fetchOhlc(sym, '5m', 288),
        ]);
        if (stopped || symbolRef.current !== sym) return;
        if (jh1.bars?.length) setH1BarsRaw(closedBars(barsToAscending(jh1.bars).map(bar), '1h'));
        if (jm15.bars?.length) setM15BarsRaw(closedBars(barsToAscending(jm15.bars).map(bar), '15m'));
        if (jm5.bars?.length) setM5BarsRaw(closedBars(barsToAscending(jm5.bars).map(bar), '5m'));
      } catch (e) { /* keep last known state, retry next poll */ }
    }
    poll();
    const id = setInterval(poll, 20000);
    return () => { stopped = true; clearInterval(id); };
  }, [activeSymbol, symbolRef]);

  return { h1BarsRaw, m15BarsRaw, m5BarsRaw };
}
