import { useEffect, useState } from 'react';
import { fetchOhlc, barsToAscending } from '../lib/api';
import { fmtOpenTime } from '../lib/engine';
import { TF_DAILY_SEED } from '../lib/staticData';

function toRows(barsAsc) { return barsAsc.map((b) => [fmtOpenTime(b.openTime), b.open, b.high, b.low, b.close]); }

const SEED_DAILY = toRows(TF_DAILY_SEED.map((r) => ({ openTime: '2026-' + r[0] + 'T00:00:00Z', open: r[1], high: r[2], low: r[3], close: r[4] })));

const WATCHERS = [
  { tile: '1m', interval: '1m', limit: 14, refetch: 8000 },
  { tile: '5m', interval: '5m', limit: 14, refetch: 15000 },
  { tile: '15m', interval: '15m', limit: 14, refetch: 20000 },
  { tile: '1h', interval: '1h', limit: 12, refetch: 30000 },
  { tile: '4h', interval: '4h', limit: 12, refetch: 60000 },
  { tile: 'daily', interval: '1d', limit: 12, refetch: 120000 },
];

export function useMiniCharts(activeSymbol, symbolRef) {
  const [tileRows, setTileRows] = useState({ '1m': null, '5m': null, '15m': null, '1h': null, '4h': null, daily: SEED_DAILY });

  useEffect(() => {
    let stopped = false;
    const ids = WATCHERS.map((w) => {
      async function poll() {
        const sym = activeSymbol;
        try {
          const j = await fetchOhlc(sym, w.interval, w.limit);
          if (stopped || symbolRef.current !== sym || !j.bars?.length) return;
          setTileRows((prev) => ({ ...prev, [w.tile]: toRows(barsToAscending(j.bars)) }));
        } catch (e) { /* noop */ }
      }
      poll();
      return setInterval(poll, w.refetch);
    });
    return () => { stopped = true; ids.forEach(clearInterval); };
  }, [activeSymbol, symbolRef]);

  return tileRows;
}
