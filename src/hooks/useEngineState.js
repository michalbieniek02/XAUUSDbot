import { useMemo } from 'react';
import { EMA20_MIN_BARS, ema20Direction, ema20Pullback } from '../lib/engine';

export function useEngineState(h1BarsRaw, m15BarsRaw, m5BarsRaw) {
  const h1State = useMemo(() => (h1BarsRaw.length >= EMA20_MIN_BARS ? ema20Direction(h1BarsRaw) : null), [h1BarsRaw]);
  const m15State = useMemo(() => (m15BarsRaw.length >= EMA20_MIN_BARS ? ema20Pullback(m15BarsRaw) : null), [m15BarsRaw]);
  const m15DirState = useMemo(() => (m15BarsRaw.length >= EMA20_MIN_BARS ? ema20Direction(m15BarsRaw) : null), [m15BarsRaw]);
  const m5State = useMemo(() => (m5BarsRaw.length >= EMA20_MIN_BARS ? ema20Pullback(m5BarsRaw) : null), [m5BarsRaw]);
  const m5Last = m5BarsRaw.length ? m5BarsRaw[m5BarsRaw.length - 1] : null;

  return { h1State, m15State, m15DirState, m5State, m5Last };
}
