import { utcDateStr, utcHM } from './engine';

// bars15m: ascending array of {open,high,low,close,openTime,tickVolume?}
export function computeVwap(bars15m) {
  if (!bars15m.length) return null;
  const last = bars15m[bars15m.length - 1];
  const today = utcDateStr(last.openTime);
  const todayBars = bars15m.filter((b) => utcDateStr(b.openTime) === today);
  if (!todayBars.length) return null;
  let sumPV = 0, sumV = 0;
  todayBars.forEach((b) => {
    const typical = (b.high + b.low + b.close) / 3;
    const vol = b.tickVolume || 1;
    sumPV += typical * vol;
    sumV += vol;
  });
  return sumV > 0 ? sumPV / sumV : null;
}

// dailyBarsAsc: ascending array of {high,low,isOpen}
export function computePdhPdl(dailyBarsAsc) {
  const closed = dailyBarsAsc.filter((b) => b.isOpen === false);
  if (!closed.length) return null;
  const prev = closed[closed.length - 1];
  return { pdh: prev.high, pdl: prev.low };
}

// Asian session: 00:00–09:00 UTC
export function computeAsianRange(bars15m, now = new Date()) {
  if (!bars15m.length) return null;
  const nowIso = typeof now === 'string' ? now : now.toISOString();
  const target = utcDateStr(nowIso);
  const win = bars15m.filter((b) => utcDateStr(b.openTime) === target && utcHM(b.openTime) >= '00:00' && utcHM(b.openTime) < '09:00');
  if (!win.length) return null;
  return {
    hi: Math.max(...win.map((b) => b.high)),
    lo: Math.min(...win.map((b) => b.low)),
    isLive: utcHM(nowIso) < '09:00',
  };
}

// London session: 08:00–16:00 UTC
export function computeLondonRange(bars15m, now = new Date()) {
  if (!bars15m.length) return null;
  const nowIso = typeof now === 'string' ? now : now.toISOString();
  const target = utcDateStr(nowIso);
  const win = bars15m.filter((b) => utcDateStr(b.openTime) === target && utcHM(b.openTime) >= '08:00' && utcHM(b.openTime) < '16:00');
  if (!win.length) return null;
  return {
    hi: Math.max(...win.map((b) => b.high)),
    lo: Math.min(...win.map((b) => b.low)),
    isLive: utcHM(nowIso) >= '08:00' && utcHM(nowIso) < '16:00',
  };
}

// NY opening range: 13:30–13:45 UTC
export function computeOrb(bars15m, now = new Date()) {
  if (!bars15m.length) return null;
  const nowIso = typeof now === 'string' ? now : now.toISOString();
  const target = utcDateStr(nowIso);
  const win = bars15m.filter((b) => utcDateStr(b.openTime) === target && utcHM(b.openTime) >= '13:30' && utcHM(b.openTime) < '13:45');
  if (!win.length) return null;
  return {
    hi: Math.max(...win.map((b) => b.high)),
    lo: Math.min(...win.map((b) => b.low)),
    isLive: utcHM(nowIso) >= '13:30' && utcHM(nowIso) < '13:45',
  };
}
