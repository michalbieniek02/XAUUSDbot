import { useEffect, useState } from 'react';
import { fetchBackendHistory } from '../lib/api';
import { computePnl, isUsablePrice, resolveSignalAgainstBars } from '../lib/engine';

function loadJson(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
}

// activeSymbol/symbolRef: which instrument's history rows this hook resolves.
// m5BarsRaw: closed M5 bars from useEngineBars — authoritative resolution path.
// price/overallFreshness/marketDataLooksLive: fast-path live-tick resolution.
export function useSignalHistory({ activeSymbol, symbolRef, m5BarsRaw, price, overallFreshness, marketDataLooksLive }) {
  const [signalHistory, setSignalHistory] = useState(() => loadJson('xauusd_signal_history_v1', []));
  const [manualTrade, setManualTrade] = useState(() => loadJson('xauusd_manual_test_trade_v1', null));
  const [backendStatus, setBackendStatus] = useState(null);

  useEffect(() => { try { localStorage.setItem('xauusd_signal_history_v1', JSON.stringify(signalHistory)); } catch (e) { /* noop */ } }, [signalHistory]);
  useEffect(() => {
    try {
      if (manualTrade) localStorage.setItem('xauusd_manual_test_trade_v1', JSON.stringify(manualTrade));
      else localStorage.removeItem('xauusd_manual_test_trade_v1');
    } catch (e) { /* noop */ }
  }, [manualTrade]);

  useEffect(() => {
    if (!isUsablePrice(price)) return;
    const seedKey = `xauusd_live_test_trades_seeded_v1_${activeSymbol}`;
    try { if (localStorage.getItem(seedKey)) return; } catch (e) { /* noop */ }
    const now = Date.now();
    const configs = [
      ['BUY', price - 2.4, 12],
      ['SELL', price + 1.7, 8],
      ['BUY', price + 0.9, 4],
    ];
    const testTrades = configs.map(([dir, entry, minutesAgo], index) => ({
      id: `test_live_${activeSymbol}_${index + 1}`,
      ts: new Date(now - minutesAgo * 60000).toISOString(),
      entryBarTime: new Date(now - minutesAgo * 60000).toISOString(),
      dir,
      source: 'test',
      symbol: activeSymbol,
      entry: Number(entry.toFixed(2)),
      sl: Number((dir === 'BUY' ? entry - 100 : entry + 100).toFixed(2)),
      tp1: Number((dir === 'BUY' ? entry + 100 : entry - 100).toFixed(2)),
      score: null,
      lot: 0.05,
      status: 'open',
    }));
    setSignalHistory((prev) => [...testTrades, ...prev.filter((row) => !testTrades.some((trade) => trade.id === row.id))].slice(0, 200));
    try { localStorage.setItem(seedKey, '1'); } catch (e) { /* noop */ }
  }, [activeSymbol, price]);

  function openManualTrade(dir) {
    if (manualTrade || price == null) return;
    const sl = dir === 'BUY' ? price - 10 : price + 10;
    const tp = dir === 'BUY' ? price + 10 : price - 10;
    setManualTrade({ dir, symbol: activeSymbol, entry: price, sl, tp, lot: 0.05, openTs: new Date().toISOString() });
  }

  function closeManualTrade(status, closePrice) {
    setManualTrade((mt) => {
      if (!mt) return mt;
      const pnl = computePnl(mt.dir, mt.entry, closePrice, mt.lot, mt.symbol || 'XAUUSD');
      setSignalHistory((prev) => [{
        id: 'manual_' + mt.openTs, ts: mt.openTs, dir: mt.dir, source: 'manual', symbol: mt.symbol,
        entry: mt.entry, sl: mt.sl, tp1: mt.tp, score: null, lot: mt.lot,
        status, closedTs: new Date().toISOString(), closedPrice: closePrice, pnl,
      }, ...prev].slice(0, 200));
      return null;
    });
  }

  function checkManualTrade(mid) {
    setManualTrade((mt) => {
      if (!mt || !isUsablePrice(mid) || (mt.symbol || 'XAUUSD') !== activeSymbol) return mt;
      if (mt.dir === 'BUY') {
        if (mid >= mt.tp) { closeManualTrade('tp', mid); return mt; }
        if (mid <= mt.sl) { closeManualTrade('sl', mid); return mt; }
      } else {
        if (mid <= mt.tp) { closeManualTrade('tp', mid); return mt; }
        if (mid >= mt.sl) { closeManualTrade('sl', mid); return mt; }
      }
      return mt;
    });
  }

  function clearHistory() {
    if (window.confirm('Wyczyścić historię w TEJ przeglądarce?\n\nKopia na serwerze zostaje nietknięta.')) setSignalHistory([]);
  }

  // Authoritative resolution: replay closed M5 bars whenever a fresh batch
  // arrives (also catches positions left open while the tab was closed).
  useEffect(() => {
    if (!m5BarsRaw.length) return;
    setSignalHistory((prev) => {
      let changed = false;
      const next = prev.map((s) => {
        if (s.source === 'manual' || s.status !== 'open') return s;
        if ((s.symbol || 'XAUUSD') !== activeSymbol) return s;
        const hit = resolveSignalAgainstBars(s, m5BarsRaw);
        if (!hit) return s;
        changed = true;
        return { ...s, status: hit.status, closedTs: hit.ts, closedPrice: hit.price, pnl: computePnl(s.dir, s.entry, hit.price, s.lot, s.symbol || 'XAUUSD') };
      });
      return changed ? next : prev;
    });
    if (manualTrade && (manualTrade.symbol || 'XAUUSD') === activeSymbol) {
      const hit = resolveSignalAgainstBars({ status: 'open', dir: manualTrade.dir, sl: manualTrade.sl, tp1: manualTrade.tp, entryBarTime: manualTrade.openTs }, m5BarsRaw);
      if (hit) closeManualTrade(hit.status === 'sl' ? 'sl' : 'tp', hit.price);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m5BarsRaw]);

  // Fast path: resolve against the live tick between bar-replay passes.
  useEffect(() => {
    if (price == null || overallFreshness !== 'live' || !marketDataLooksLive) return;
    setSignalHistory((prev) => {
      let changed = false;
      const next = prev.map((s) => {
        if (s.source === 'manual' || s.status !== 'open' || (s.symbol || 'XAUUSD') !== activeSymbol) return s;
        const hitSl = s.dir === 'BUY' ? price <= s.sl : price >= s.sl;
        const hitTp = s.dir === 'BUY' ? price >= s.tp1 : price <= s.tp1;
        if (!hitSl && !hitTp) return s;
        changed = true;
        const lvl = hitSl ? s.sl : s.tp1;
        return { ...s, status: hitSl ? 'sl' : 'tp1', closedTs: new Date().toISOString(), closedPrice: lvl, pnl: computePnl(s.dir, s.entry, lvl, s.lot, s.symbol || 'XAUUSD') };
      });
      return changed ? next : prev;
    });
    checkManualTrade(price);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  // Backend cron sync (best-effort; fine if no backend is deployed).
  useEffect(() => {
    let stopped = false;
    async function poll() {
      const sym = activeSymbol;
      try {
        const data = await fetchBackendHistory(sym);
        if (stopped || symbolRef.current !== sym) return;
        if (data?.status) setBackendStatus(data.status);
        if (data?.history?.length) {
          setSignalHistory((prev) => {
            const next = [...prev];
            let changed = false;
            data.history.forEach((b) => {
              const idx = next.findIndex((r) => r.id === b.id);
              if (idx === -1) { next.unshift({ source: 'engine-backend', ...b }); changed = true; }
              else if (next[idx].source !== 'manual' && b.status !== 'open' && next[idx].status !== b.status) { next[idx] = { ...next[idx], ...b }; changed = true; }
            });
            if (!changed) return prev;
            next.sort((a, b2) => new Date(b2.ts) - new Date(a.ts));
            return next.slice(0, 200);
          });
        }
      } catch (e) { /* backend not reachable — page still works on the client-only engine */ }
    }
    poll();
    const id = setInterval(poll, 60000);
    return () => { stopped = true; clearInterval(id); };
  }, [activeSymbol, symbolRef]);

  return { signalHistory, manualTrade, backendStatus, openManualTrade, closeManualTrade, clearHistory };
}
