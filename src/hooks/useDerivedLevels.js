import { useMemo } from 'react';
import { calcATR, findSwings, classifyStructure, detectCHOCH, SWING_LOOKBACK, computeRangeInfo, classifyDayRegime } from '../lib/engine';
import { computeVwap, computePdhPdl, computeAsianRange, computeLondonRange, computeOrb } from '../lib/levels';

// Pulls together everything the Signal Card's evidence rows and the context
// bar need, derived purely from the bars useEngineBars/useReferenceLevels
// already fetched — no network calls here.
export function useDerivedLevels({ h1BarsRaw, dailyBarsRaw, levels15mRaw, h1State }) {
  const lastAtrH1 = useMemo(() => (h1BarsRaw.length ? calcATR(h1BarsRaw, 14) : null), [h1BarsRaw]);
  const lastH1Structure = useMemo(() => (h1BarsRaw.length ? classifyStructure(findSwings(h1BarsRaw, SWING_LOOKBACK)) : null), [h1BarsRaw]);
  const lastH1Choch = useMemo(() => (lastH1Structure && h1BarsRaw.length ? detectCHOCH(h1BarsRaw, lastH1Structure) : null), [h1BarsRaw, lastH1Structure]);

  const lastVwap = useMemo(() => computeVwap(levels15mRaw), [levels15mRaw]);
  const lastPdhPdl = useMemo(() => computePdhPdl(dailyBarsRaw), [dailyBarsRaw]);
  const lastAsianRange = useMemo(() => computeAsianRange(levels15mRaw), [levels15mRaw]);
  const lastLondonRange = useMemo(() => computeLondonRange(levels15mRaw), [levels15mRaw]);
  const lastOrb = useMemo(() => computeOrb(levels15mRaw), [levels15mRaw]);

  const lastDailyRangeInfo = useMemo(() => (dailyBarsRaw.length ? computeRangeInfo(dailyBarsRaw) : null), [dailyBarsRaw]);
  const regime = useMemo(() => classifyDayRegime(lastDailyRangeInfo, h1State), [lastDailyRangeInfo, h1State]);

  return { lastAtrH1, lastH1Structure, lastH1Choch, lastVwap, lastPdhPdl, lastAsianRange, lastLondonRange, lastOrb, lastDailyRangeInfo, regime };
}
