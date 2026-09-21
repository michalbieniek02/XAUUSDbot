import { useMemo } from 'react';

// Reads the journal/FTMO config DziennikTab writes to localStorage. Recomputed
// whenever risk inputs change or signalHistory changes (used as a light
// "something happened, worth re-reading localStorage" trigger — the journal
// itself doesn't live in React state at the App level).
export function useFtmoStrip(riskBalance, riskPercent, refreshTrigger) {
  return useMemo(() => {
    try {
      const cfgFtmo = JSON.parse(localStorage.getItem('xauusd_ftmo_guard_v1') || '{}');
      const journal = JSON.parse(localStorage.getItem('xauusd_trade_journal_v1') || '{}');
      const initial = cfgFtmo.initial > 0 ? cfgFtmo.initial : 10000;
      const dailyPct = cfgFtmo.dailyPct || 5, totalPct = cfgFtmo.totalPct || 10;
      const dailyLimit = (initial * dailyPct) / 100, totalLimit = (initial * totalPct) / 100;
      const now = new Date();
      const pad2 = (n) => (n < 10 ? '0' : '') + n;
      const dayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
      const todayEntry = journal[dayKey];
      const dailyUsed = todayEntry && todayEntry.pnl < 0 ? -todayEntry.pnl : 0;
      const cumulative = Object.keys(journal).reduce((a, k) => a + (journal[k].pnl || 0), 0);
      const totalUsed = cumulative < 0 ? -cumulative : 0;
      const dailyLeft = dailyLimit - dailyUsed, totalLeft = totalLimit - totalUsed;
      const nextRisk = riskBalance * (riskPercent / 100);
      return { dailyLeft, dailyLimit, totalLeft, totalLimit, nextRisk, afterDaily: dailyLeft - nextRisk, hasTodayEntry: !!todayEntry, todayPnl: todayEntry?.pnl };
    } catch (e) { return null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskBalance, riskPercent, refreshTrigger]);
}
