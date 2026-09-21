import { useEffect, useState } from 'react';
import { fetchOhlc, barsToAscending } from '../lib/api';

function bar(b) { return { open: b.open, high: b.high, low: b.low, close: b.close, openTime: b.openTime, isOpen: b.isOpen, tickVolume: b.tickVolume }; }

// dailyBarsRaw feeds PDH/PDL + day-range regime; levels15mRaw feeds VWAP,
// Asian range and NY ORB (needs a wider window than the engine's own M15 feed).
export function useReferenceLevels(activeSymbol, symbolRef) {
  const [dailyBarsRaw, setDailyBarsRaw] = useState([]);
  const [levels15mRaw, setLevels15mRaw] = useState([]);

  useEffect(() => {
    let stopped = false;
    async function poll() {
      const sym = activeSymbol;
      try {
        const jd = await fetchOhlc(sym, '1d', 8);
        if (!stopped && symbolRef.current === sym && jd.bars?.length) setDailyBarsRaw(barsToAscending(jd.bars).map(bar));
      } catch (e) { /* noop */ }
      try {
        const j15 = await fetchOhlc(sym, '15m', 190);
        if (!stopped && symbolRef.current === sym && j15.bars?.length) setLevels15mRaw(barsToAscending(j15.bars).map(bar));
      } catch (e) { /* noop */ }
    }
    poll();
    const id = setInterval(poll, 60000);
    return () => { stopped = true; clearInterval(id); };
  }, [activeSymbol, symbolRef]);

  return { dailyBarsRaw, levels15mRaw };
}
