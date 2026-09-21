import { MAX_SCORE, VALID_SCORE, MIN_LOT, stopDistanceFor, spreadLimitFor, entryDriftCheck, fmtOpenTime } from './engine';

function condRow(key, val, cls) { return { key, val, cls }; }

// ctx: {
//   h1State, m15State, m15DirState, m5State, m5Last,
//   lastVwap, lastPdhPdl, lastAsianRange, lastAtrH1,
//   lastH1Structure, lastH1Choch, regime,
//   nextNewsInfo, newsFeedUsable, overallFreshness,
//   bidAsk, price, riskBalance, riskPercent, cfg,
// }
// Returns the shape <SignalCard> expects: { state, dir, score, sub, conditions, levels, waiting }
export function evaluateSignal(ctx) {
  const {
    h1State, m15State, m15DirState, m5State, m5Last,
    lastVwap, lastPdhPdl, lastAsianRange, lastAtrH1,
    lastH1Structure, lastH1Choch, regime,
    nextNewsInfo, newsFeedUsable, overallFreshness,
    bidAsk, price, riskBalance, riskPercent, cfg,
  } = ctx;

  if (!h1State || !m15State) {
    return { state: 'LOADING', sub: 'Zbieram świece H1 i M15 z biquote.io…', conditions: [] };
  }

  const reasons = [];
  if (overallFreshness !== 'live') reasons.push('dane opóźnione — sygnał wstrzymany do ustabilizowania feedu');
  if (!bidAsk) reasons.push('brak danych o spreadzie (tick niedostępny) — wstrzymane');
  else if (bidAsk.spread > spreadLimitFor(cfg, price)) reasons.push(`spread zbyt duży ($${bidAsk.spread.toFixed(2)} > $${spreadLimitFor(cfg, price).toFixed(2)})`);
  if (!newsFeedUsable) reasons.push('brak danych z kalendarza makro — wstrzymane');
  else if (nextNewsInfo && Math.abs(nextNewsInfo.minutesAway) <= 5) reasons.push(`blokada wokół newsu wysokiego wpływu: ${nextNewsInfo.name} (±5 min)`);

  const dir = h1State.rising ? 'BUY' : h1State.falling ? 'SELL' : null;
  if (!dir) reasons.push('brak wyraźnego trendu H1 (EMA20 płaski)');

  const riskRows = [
    condRow('Dane', overallFreshness === 'live' ? 'na żywo' : 'brak', overallFreshness === 'live' ? 'ok' : 'block'),
    condRow('Spread', bidAsk ? '$' + bidAsk.spread.toFixed(2) : 'brak ticku', !bidAsk ? 'block' : bidAsk.spread > spreadLimitFor(cfg, price) ? 'block' : 'ok'),
    condRow(
      'News',
      !newsFeedUsable ? 'brak danych' : nextNewsInfo && Math.abs(nextNewsInfo.minutesAway) <= 5 ? 'blokada ±5 min' : nextNewsInfo && Math.abs(nextNewsInfo.minutesAway) <= 30 ? 'blisko (<30 min)' : 'czysto',
      !newsFeedUsable ? 'block' : nextNewsInfo && Math.abs(nextNewsInfo.minutesAway) <= 5 ? 'block' : nextNewsInfo && Math.abs(nextNewsInfo.minutesAway) <= 30 ? 'warn' : 'ok',
    ),
  ];

  const chochAgainst = dir && lastH1Choch && ((dir === 'BUY' && lastH1Choch === 'bearish') || (dir === 'SELL' && lastH1Choch === 'bullish'));
  const trendRows = [
    condRow('Trend H1', dir ? (dir === 'BUY' ? 'rosnący' : 'spadkowy') : 'płaski', dir ? 'ok' : 'block'),
    condRow(
      'Struktura H1',
      chochAgainst ? 'CHOCH przeciw' : lastH1Structure?.highLabel ? `${lastH1Structure.highLabel}+${lastH1Structure.lowLabel}` : 'za mało swingów',
      chochAgainst ? 'block' : lastH1Structure && dir && lastH1Structure.bias === (dir === 'BUY' ? 'bullish' : 'bearish') ? 'ok' : 'no',
    ),
    condRow('Reżim dnia', regime ? regime.label.split(' (')[0].toLowerCase() : 'liczę…', regime ? (regime.key === 'trend' ? 'ok' : regime.key === 'range' ? 'warn' : 'no') : 'no'),
  ];
  if (chochAgainst) reasons.push('Change of Character na H1 przeciwko kierunkowi — wstrzymuję do wyjaśnienia');

  if (reasons.length) {
    return { state: 'NO_TRADE', dir, conditions: trendRows.concat(riskRows), sub: 'Powody: ' + reasons.join('; ') + '.' };
  }

  let score = 2; // H1 bias zgodny
  if (lastH1Structure && lastH1Structure.bias === (dir === 'BUY' ? 'bullish' : 'bearish')) score += 1;
  const m15TrendOk = dir === 'BUY' ? m15DirState?.rising : m15DirState?.falling;
  if (m15TrendOk) score += 1;
  const m15SetupOk = dir === 'BUY' ? m15State.rejectUp : m15State.rejectDown;
  if (m15SetupOk) score += 2;
  const price5 = m5Last ? m5Last.close : m15State.last.close;
  const vwapSide = lastVwap == null ? null : dir === 'BUY' ? price5 > lastVwap : price5 < lastVwap;
  if (vwapSide) score += 1;
  const liqSide = lastPdhPdl && lastAsianRange
    ? (dir === 'BUY' ? price5 > Math.max(lastPdhPdl.pdh, lastAsianRange.hi) : price5 < Math.min(lastPdhPdl.pdl, lastAsianRange.lo))
    : null;
  if (liqSide) score += 1;
  if (newsFeedUsable && (!nextNewsInfo || Math.abs(nextNewsInfo.minutesAway) > 30)) score += 1;
  const atrPct = lastAtrH1 != null && price5 ? (lastAtrH1 / price5) * 100 : null;
  if (atrPct != null && atrPct >= 0.03) score += 1;

  const setupRows = [
    condRow('Trend M15', m15TrendOk ? 'zgodny' : 'niezgodny', m15TrendOk ? 'ok' : 'no'),
    condRow('Pullback M15', m15State.touched ? 'dotknięty' : 'brak', m15State.touched ? 'ok' : 'no'),
    condRow('Setup M15', m15SetupOk ? 'odrzucenie od EMA20' : 'brak odrzucenia', m15SetupOk ? 'ok' : 'no'),
    condRow('Lokalizacja', liqSide == null ? 'brak danych' : liqSide ? 'poza PDH/PDL + Asia' : 'wewnątrz zakresu', liqSide == null ? 'no' : liqSide ? 'ok' : 'no'),
    condRow('VWAP (tick-volume)', vwapSide == null ? 'brak danych' : vwapSide ? 'po właściwej stronie' : 'po przeciwnej', vwapSide == null ? 'no' : vwapSide ? 'ok' : 'no'),
    condRow('ATR H1', atrPct == null ? '—' : atrPct.toFixed(3) + '%', atrPct != null && atrPct >= 0.03 ? 'ok' : 'no'),
  ];

  if (!m15SetupOk) {
    return {
      state: 'FORMING', dir, score, conditions: trendRows.concat(setupRows, riskRows),
      sub: `Bias H1 to <b>${dir === 'BUY' ? 'LONG' : 'SHORT'}</b>, ale setupu jeszcze nie ma.`,
      waiting: ['pullback do EMA20 na M15', `zamknięcie świecy M15 z powrotem ${dir === 'BUY' ? 'nad' : 'pod'} EMA20`],
    };
  }

  const m5TriggerOk = m5State && (dir === 'BUY' ? m5State.rejectUp : m5State.rejectDown);
  if (!m5TriggerOk) {
    const m5Status = !m5State
      ? 'zbieram dane M5…'
      : !m5State.touched
      ? 'M5 jeszcze nie zrobiło pullbacku do własnej EMA20'
      : `M5 dotknęło EMA20, czekam na zamknięcie z powrotem ${dir === 'BUY' ? 'nad' : 'pod'} EMA20`;
    return {
      state: 'READY', dir, score,
      conditions: trendRows.concat(setupRows, [condRow('Trigger M5', m5State ? (m5State.touched ? 'dotknięcie, brak zamknięcia' : 'brak pullbacku') : 'zbieram dane', 'no')], riskRows),
      sub: `Setup M15 gotowy w kierunku <b>${dir === 'BUY' ? 'LONG' : 'SHORT'}</b>. Brakuje ostatniego ogniwa.`,
      waiting: [m5Status],
    };
  }

  const valid = score >= VALID_SCORE;
  const slDist = stopDistanceFor(cfg, price5);
  if (slDist == null || !(slDist > 0)) {
    return { state: 'NO_TRADE', dir, conditions: trendRows.concat(riskRows), sub: `Nie umiem policzyć dystansu do stopa dla ${cfg.label}.` };
  }
  const sl = dir === 'BUY' ? price5 - slDist : price5 + slDist;
  const tp1 = dir === 'BUY' ? price5 + slDist : price5 - slDist;
  const drift = entryDriftCheck(price5, price != null && isFinite(price) ? price : null, slDist);
  const riskDollars = riskBalance * (riskPercent / 100);

  let lot;
  if (cfg.fixedLot != null) lot = cfg.fixedLot;
  else {
    const lotRaw = cfg.contractValuePerLot > 0 ? riskDollars / (slDist * cfg.contractValuePerLot) : null;
    lot = lotRaw == null || lotRaw < MIN_LOT ? null : Math.round(lotRaw * 100) / 100;
  }
  const expiryTime = new Date(new Date(m5State.last.openTime).getTime() + 10 * 60000);

  const fullRows = trendRows.concat(setupRows, [
    condRow('Trigger M5', 'zamknięcie za EMA20', 'ok'),
    condRow('Lot', lot != null ? lot.toFixed(2) + ' lota' : 'poniżej minimum brokera', lot != null ? 'ok' : 'warn'),
    condRow('Odjazd od wejścia', drift.drift == null ? 'brak ticku' : `$${drift.drift.toFixed(2)} / $${drift.max.toFixed(2)}`, drift.blocked ? 'block' : 'ok'),
  ], riskRows);

  const actionable = valid && !drift.blocked;
  return {
    state: valid ? (drift.blocked ? 'READY' : 'CONFIRMED') : 'READY',
    dir, score, conditions: fullRows,
    levels: actionable ? { entry: price5, sl, tp1, lot } : null,
    sub: valid && drift.blocked
      ? `Łańcuch H1 → M15 → M5 się zgadza (ocena ${score}/${MAX_SCORE}), ale cena zdążyła odjechać od wejścia. Poczekaj na kolejną świecę.`
      : valid
      ? `Cały łańcuch H1 → M15 → M5 się zgadza, ocena ${score}/${MAX_SCORE} przekracza próg. Wejście z zamkniętej świecy M5 ${fmtOpenTime(m5State.last.openTime)} UTC, ważne do ${expiryTime.toISOString().slice(11, 16)} UTC.`
      : `Łańcuch H1 → M15 → M5 jest kompletny w kierunku <b>${dir === 'BUY' ? 'LONG' : 'SHORT'}</b>, ale ocena ${score}/${MAX_SCORE} nie sięga progu ${VALID_SCORE}/${MAX_SCORE}.`,
    waiting: valid ? null : [`wyższej zgodności warunków (brakuje ${VALID_SCORE - score} pkt do progu)`],
  };
}
