import { useEffect, useState } from 'react';
import { fetchOhlc, barsToAscending } from '../lib/api';
import { EMA20_MIN_BARS, ema20Direction, aggregateWeekly, aggregateMonthly } from '../lib/engine';

function bar(b) { return { open: b.open, high: b.high, low: b.low, close: b.close, openTime: b.openTime, isOpen: b.isOpen }; }

const MTF_INTERVALS = [
  { key: '4h', limit: 60 }, { key: '1h', limit: 100 }, { key: '30m', limit: 60 },
  { key: '15m', limit: 60 }, { key: '5m', limit: 60 }, { key: '1m', limit: 60 },
];

export function useMtfGrid(activeSymbol, symbolRef) {
  const [mtfState, setMtfState] = useState({});

  useEffect(() => {
    let stopped = false;
    async function poll() {
      const sym = activeSymbol;
      // Monthly/Weekly/Daily are aggregated from one daily fetch (biquote.io
      // has no native w1/1M interval).
      try {
        const jd = await fetchOhlc(sym, '1d', 500);
        if (!stopped && symbolRef.current === sym && jd.bars?.length) {
          const dailyAsc = barsToAscending(jd.bars).map(bar);
          const next = {};
          if (dailyAsc.length >= 13) next['1d'] = ema20Direction(dailyAsc.slice(-60));
          const weekly = aggregateWeekly(dailyAsc);
          if (weekly.length >= EMA20_MIN_BARS) next.w1 = ema20Direction(weekly);
          const monthly = aggregateMonthly(dailyAsc);
          if (monthly.length >= 13) next['1M'] = ema20Direction(monthly, 10, 3);
          setMtfState((prev) => ({ ...prev, ...next }));
        }
      } catch (e) { /* noop */ }

      for (const cfg of MTF_INTERVALS) {
        try {
          const j = await fetchOhlc(sym, cfg.key, cfg.limit);
          if (stopped || symbolRef.current !== sym || !j.bars || j.bars.length < EMA20_MIN_BARS) continue;
          const asc = barsToAscending(j.bars).map(bar);
          setMtfState((prev) => ({ ...prev, [cfg.key]: ema20Direction(asc) }));
        } catch (e) { /* noop */ }
      }
    }
    poll();
    const id = setInterval(poll, 30000);
    return () => { stopped = true; clearInterval(id); };
  }, [activeSymbol, symbolRef]);

  return mtfState;
}
