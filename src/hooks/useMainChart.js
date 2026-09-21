import { useEffect, useState } from 'react';
import { fetchOhlc, barsToAscending } from '../lib/api';
import { fmtOpenTime } from '../lib/engine';

const MAIN_TF_LIMIT = { '5m': 96, '15m': 96, '1h': 96, '4h': 72, '1d': 60 };

function toRows(barsAsc) { return barsAsc.map((b) => [fmtOpenTime(b.openTime), b.open, b.high, b.low, b.close]); }

export function useMainChart(activeSymbol, symbolRef, mainTf) {
  const [mainChartRows, setMainChartRows] = useState(null);

  useEffect(() => { setMainChartRows(null); }, [activeSymbol]);

  useEffect(() => {
    let stopped = false;
    async function poll() {
      const sym = activeSymbol;
      try {
        const j = await fetchOhlc(sym, mainTf, MAIN_TF_LIMIT[mainTf] || 96);
        if (stopped || symbolRef.current !== sym || !j.bars?.length) return;
        setMainChartRows(toRows(barsToAscending(j.bars)));
      } catch (e) { /* keep last drawing */ }
    }
    poll();
    const id = setInterval(poll, 20000);
    return () => { stopped = true; clearInterval(id); };
  }, [activeSymbol, mainTf, symbolRef]);

  return mainChartRows;
}
