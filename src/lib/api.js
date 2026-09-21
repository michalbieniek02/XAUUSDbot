// All network access in one place. bqUrl/fetchJson mirror the original
// page's fetch(..., {cache:'no-store'}) calls against biquote.io.

export function bqUrl(path, params) {
  const u = new URL('https://biquote.io/api/' + path);
  if (params) Object.keys(params).forEach((k) => u.searchParams.set(k, params[k]));
  return u.toString();
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('http ' + r.status);
  return r.json();
}

export function fetchTick(symbol) {
  return fetchJson(bqUrl(symbol));
}

export function fetchOhlc(symbol, interval, limit) {
  return fetchJson(bqUrl(symbol + '/ohlc', { interval, limit }));
}

export function fetchMacroCalendar() {
  const u = new URL('https://biquote.io/api/calendar/upcoming');
  u.searchParams.set('limit', '500');
  u.searchParams.set('importance', 'high');
  return fetchJson(u.toString());
}

export function fetchBackendHistory(symbol) {
  return fetchJson('/api/history?symbol=' + symbol);
}

// openTime like "2026-09-08T14:00:00Z" -> ascending [openTimeLabel, o, h, l, c]
// rows the CandleChart component expects, plus keeps the raw bar for engine
// math (open/high/low/close/openTime/isOpen).
export function barsToAscending(bars) {
  return (bars || []).slice().reverse();
}
