// Ported 1:1 from the original vanilla-JS terminal. Kept framework-free so it
// can be unit tested and so App.jsx / CandleChart.jsx can both import it
// without creating a dependency on React.

export const SYMBOL_CONFIG = {
  XAUUSD: {
    symbol: 'XAUUSD', label: 'XAU/USD', short: 'Złoto', decimals: 2,
    stopModel: 'fixed', fixedStopDollars: 10, stopPct: null,
    maxSpreadDollars: 0.50, maxSpreadPct: null, contractValuePerLot: 100,
    fixedLot: null, lotModel: 'risk-pct',
    slModel: 'fixed-10usd-1to1', executable: true,
  },
  ETHUSD: {
    symbol: 'ETHUSD', label: 'ETH/USD', short: 'Ethereum', decimals: 2,
    stopModel: 'fixed', fixedStopDollars: 10, stopPct: null,
    maxSpreadDollars: null, maxSpreadPct: 0.05,
    contractValuePerLot: 10, fixedLot: 0.5, lotModel: 'fixed-0.5',
    slModel: 'fixed-10usd-1to1', executable: false,
  },
};

export const MAX_SCORE = 10;
export const VALID_SCORE = 7;
export const MIN_LOT = 0.01;
export const MAX_ENTRY_DRIFT_FRACTION = 0.2;
export const EMA20_MIN_BARS = 25;
export const SWING_LOOKBACK = 2;
export const PULLBACK_TOUCH_WINDOW = 6;
export const NEWS_FEED_MAX_AGE = 10 * 60000;
export const M5_MS = 300000;
export const MAX_MISSED_BARS = 3;
export const INTERVAL_MS = { '1m': 60000, '5m': 300000, '15m': 900000, '30m': 1800000, '1h': 3600000, '4h': 14400000, '1d': 86400000 };

export function isUsablePrice(v) {
  return typeof v === 'number' && isFinite(v) && v > 0;
}

export function symCfg(activeSymbol) {
  return SYMBOL_CONFIG[activeSymbol];
}

export function stopDistanceFor(cfg, price) {
  if (cfg.stopModel === 'fixed') return cfg.fixedStopDollars;
  if (cfg.stopModel === 'pct') return price > 0 ? (price * cfg.stopPct) / 100 : null;
  return null;
}

export function spreadLimitFor(cfg, price) {
  if (cfg.maxSpreadDollars != null) return cfg.maxSpreadDollars;
  if (cfg.maxSpreadPct != null && price > 0) return (price * cfg.maxSpreadPct) / 100;
  return null;
}

export function calcEMA(values, period) {
  const out = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let prev = sum / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function calcATR(bars, period) {
  if (!bars || bars.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < bars.length; i++) {
    trs.push(Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - bars[i - 1].close),
      Math.abs(bars[i].low - bars[i - 1].close),
    ));
  }
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) atr = (atr * (period - 1) + trs[i]) / period;
  return atr;
}

// bars here are objects {high,low,close,openTime}; findSwings needs high/low.
export function findSwings(bars, lookback) {
  const swings = [];
  for (let i = lookback; i < bars.length - lookback; i++) {
    let isHigh = true, isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (bars[i].high <= bars[i - j].high || bars[i].high <= bars[i + j].high) isHigh = false;
      if (bars[i].low >= bars[i - j].low || bars[i].low >= bars[i + j].low) isLow = false;
    }
    if (isHigh) swings.push({ index: i, type: 'high', price: bars[i].high, time: bars[i].openTime });
    if (isLow) swings.push({ index: i, type: 'low', price: bars[i].low, time: bars[i].openTime });
  }
  return swings;
}

export function classifyStructure(swings) {
  const cleaned = [];
  swings.forEach((s) => {
    const prev = cleaned[cleaned.length - 1];
    if (prev && prev.type === s.type) {
      if (s.type === 'high' && s.price > prev.price) cleaned[cleaned.length - 1] = s;
      if (s.type === 'low' && s.price < prev.price) cleaned[cleaned.length - 1] = s;
    } else {
      cleaned.push(s);
    }
  });
  const highs = cleaned.filter((s) => s.type === 'high');
  const lows = cleaned.filter((s) => s.type === 'low');
  const lastHigh = highs[highs.length - 1], prevHigh = highs[highs.length - 2];
  const lastLow = lows[lows.length - 1], prevLow = lows[lows.length - 2];
  const highLabel = lastHigh && prevHigh ? (lastHigh.price > prevHigh.price ? 'HH' : 'LH') : null;
  const lowLabel = lastLow && prevLow ? (lastLow.price > prevLow.price ? 'HL' : 'LL') : null;
  let bias = null;
  if (highLabel === 'HH' && lowLabel === 'HL') bias = 'bullish';
  if (highLabel === 'LH' && lowLabel === 'LL') bias = 'bearish';
  return { highLabel, lowLabel, bias, lastHigh, lastLow };
}

export function detectCHOCH(bars, structure) {
  const lastClose = bars[bars.length - 1].close;
  if (structure.bias === 'bullish' && structure.lastLow && lastClose < structure.lastLow.price) return 'bearish';
  if (structure.bias === 'bearish' && structure.lastHigh && lastClose > structure.lastHigh.price) return 'bullish';
  return null;
}

export function ema20Direction(bars, period = 20, slopeBack = 5) {
  const closes = bars.map((b) => b.close);
  const e20 = calcEMA(closes, period);
  const n = bars.length - 1;
  const priorIdx = n - slopeBack;
  return {
    rising: e20[priorIdx] != null && e20[n] > e20[priorIdx],
    falling: e20[priorIdx] != null && e20[n] < e20[priorIdx],
    e20: e20[n],
    last: bars[n],
  };
}

export function ema20Pullback(bars) {
  const closes = bars.map((b) => b.close);
  const e20 = calcEMA(closes, 20);
  const n = bars.length - 1;
  const last = bars[n];
  let touched = false;
  for (let i = Math.max(19, n - (PULLBACK_TOUCH_WINDOW - 1)); i <= n; i++) {
    if (e20[i] == null) continue;
    if (bars[i].low <= e20[i] && bars[i].high >= e20[i]) touched = true;
  }
  return {
    touched,
    rejectUp: touched && last.close > e20[n] && last.close > last.open,
    rejectDown: touched && last.close < e20[n] && last.close < last.open,
    e20: e20[n],
    last,
  };
}

// Drops the still-forming (unclosed) candle from the end of an ascending bar
// array. Mirrors closedBars() in the original page / backend engine.
export function closedBars(barsAsc, interval) {
  if (!barsAsc || !barsAsc.length) return [];
  const ms = INTERVAL_MS[interval];
  const now = Date.now();
  const out = barsAsc.slice();
  while (out.length) {
    const b = out[out.length - 1];
    const forming = b.isOpen === true || (ms != null && new Date(b.openTime).getTime() + ms > now);
    if (!forming) break;
    out.pop();
  }
  return out;
}

export function computePnl(dir, entry, exitPrice, lot, sym) {
  if (lot == null || isNaN(lot)) return null;
  const cfg = SYMBOL_CONFIG[sym || 'XAUUSD'];
  if (!cfg || !(cfg.contractValuePerLot > 0)) return null;
  const dist = dir === 'BUY' ? exitPrice - entry : entry - exitPrice;
  return dist * cfg.contractValuePerLot * lot;
}

export function entryDriftCheck(entry, livePrice, slDist) {
  const max = slDist > 0 ? slDist * MAX_ENTRY_DRIFT_FRACTION : null;
  if (max == null) return { blocked: false, drift: null, max: null };
  if (livePrice == null || !isFinite(livePrice)) return { blocked: true, drift: null, max };
  const drift = Math.abs(livePrice - entry);
  return { blocked: drift > max, drift, max };
}

// Replays closed M5 candles after entry against SL/TP1 — used to settle a
// position that was left open while nobody was watching (tab closed/reopened).
export function resolveSignalAgainstBars(sig, barsAsc) {
  if (!sig || sig.status !== 'open' || !barsAsc || !barsAsc.length) return null;
  const entryBarTime = sig.entryBarTime || (typeof sig.id === 'string' && sig.id.includes('_') ? sig.id.slice(sig.id.indexOf('_') + 1) : sig.ts);
  const after = new Date(entryBarTime).getTime();
  if (isNaN(after)) return null;
  for (const b of barsAsc) {
    if (new Date(b.openTime).getTime() <= after) continue;
    const hitSl = sig.dir === 'BUY' ? b.low <= sig.sl : b.high >= sig.sl;
    const hitTp = sig.dir === 'BUY' ? b.high >= sig.tp1 : b.low <= sig.tp1;
    if (hitSl) return { status: 'sl', price: sig.sl, ts: b.openTime };
    if (hitTp) return { status: 'tp1', price: sig.tp1, ts: b.openTime };
  }
  return null;
}

export function currentSessionLabel() {
  const h = new Date().getUTCHours();
  if (h >= 0 && h < 8) return 'Azja';
  if (h >= 8 && h < 13) return 'Londyn';
  if (h >= 13 && h < 17) return 'Londyn + NY (overlap)';
  if (h >= 17 && h < 21) return 'Nowy Jork';
  return 'poza głównymi sesjami';
}

const DISPLAY_TIME_OFFSET_MS = 2 * 60 * 60 * 1000;
const pad2 = (value) => String(value).padStart(2, '0');

export function fmtClockTime(iso) {
  const date = new Date(new Date(iso).getTime() + DISPLAY_TIME_OFFSET_MS);
  return `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`;
}

export function fmtOpenTime(iso) {
  const date = new Date(new Date(iso).getTime() + DISPLAY_TIME_OFFSET_MS);
  return `${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())} ${fmtClockTime(iso)}`;
}

export function fmtPnl(v) {
  if (v == null || isNaN(v)) return '—';
  return (v >= 0 ? '+' : '-') + '$' + Math.abs(v).toFixed(2);
}

// Ratio of today's daily range to the average of the last N closed days,
// combined elsewhere with H1 EMA20 slope to classify trend/range day.
export function computeRangeInfo(dailyBarsAsc) {
  const closed = dailyBarsAsc.filter((b) => b.isOpen === false);
  if (closed.length < 3) return null;
  const recent = closed.slice(-5);
  const avgRange = recent.reduce((s, b) => s + (b.high - b.low), 0) / recent.length;
  const today = dailyBarsAsc[dailyBarsAsc.length - 1];
  const todayRange = today.high - today.low;
  return { avgRange, todayRange, ratio: avgRange > 0 ? todayRange / avgRange : null, sampleDays: recent.length };
}

export function classifyDayRegime(rangeInfo, h1State) {
  if (!rangeInfo || rangeInfo.ratio == null || !h1State) return null;
  const ratio = rangeInfo.ratio;
  const trending = h1State.rising || h1State.falling;
  if (ratio >= 1.15 && trending) return { key: 'trend', label: 'DZIEŃ TRENDOWY', cls: h1State.rising ? ' up' : ' down' };
  if (ratio <= 0.8 && !trending) return { key: 'range', label: 'DZIEŃ RANGE (konsolidacja)', cls: '' };
  return { key: 'mixed', label: 'NIEJEDNOZNACZNY', cls: '' };
}

export function weekKeyMonday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  return monday.toISOString().slice(0, 10);
}

export function aggregateByKey(dailyBarsAsc, keyFn) {
  const groups = {}, order = [];
  dailyBarsAsc.forEach((b) => {
    const key = keyFn(b);
    if (!groups[key]) { groups[key] = []; order.push(key); }
    groups[key].push(b);
  });
  return order.map((key) => {
    const g = groups[key];
    return {
      openTime: key + 'T00:00:00Z',
      open: g[0].open,
      high: Math.max(...g.map((x) => x.high)),
      low: Math.min(...g.map((x) => x.low)),
      close: g[g.length - 1].close,
    };
  });
}

export const aggregateWeekly = (dailyBarsAsc) => aggregateByKey(dailyBarsAsc, (b) => weekKeyMonday(b.openTime.slice(0, 10)));
export const aggregateMonthly = (dailyBarsAsc) => aggregateByKey(dailyBarsAsc, (b) => b.openTime.slice(0, 7) + '-01');

export function utcDateStr(iso) { return iso.slice(0, 10); }
export function utcHM(iso) { return iso.slice(11, 16); }
export function prevUtcDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// FTMO's trading day rolls over at midnight Central European (Prague) time.
export function ftmoDayKey(now = new Date()) {
  let prague;
  try { prague = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' })); }
  catch (e) { prague = now; }
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  return `${prague.getFullYear()}-${pad2(prague.getMonth() + 1)}-${pad2(prague.getDate())}`;
}

export function ftmoResetInfo(now = new Date()) {
  let prague;
  try { prague = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' })); }
  catch (e) { return null; }
  const msIntoDay = ((prague.getHours() * 60 + prague.getMinutes()) * 60 + prague.getSeconds()) * 1000;
  const msLeft = 86400000 - msIntoDay;
  return { hoursLeft: Math.floor(msLeft / 3600000), minsLeft: Math.floor((msLeft % 3600000) / 60000) };
}
