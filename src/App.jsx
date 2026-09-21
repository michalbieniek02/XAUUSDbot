import { useMemo, useRef, useState } from 'react';
import { symCfg, M5_MS, MAX_MISSED_BARS } from './lib/engine';
import { evaluateSignal } from './lib/signalEngine';

import { useTick } from './hooks/useTick';
import { useEngineBars } from './hooks/useEngineBars';
import { useEngineState } from './hooks/useEngineState';
import { useReferenceLevels } from './hooks/useReferenceLevels';
import { useDerivedLevels } from './hooks/useDerivedLevels';
import { useMainChart } from './hooks/useMainChart';
import { useMiniCharts } from './hooks/useMiniCharts';
import { useMtfGrid } from './hooks/useMtfGrid';
import { useMacroCalendar } from './hooks/useMacroCalendar';
import { useSignalHistory } from './hooks/useSignalHistory';
import { useFtmoStrip } from './hooks/useFtmoStrip';

import TopBar from './components/TopBar';
import { TermTabs, MobileNav } from './components/TabsNav';
import TerminalTab from './components/TerminalTab';
import HistoriaTab from './components/HistoriaTab';
import PoziomyTab from './components/PoziomyTab';
import KalendarzTab from './components/KalendarzTab';
import ResearchTab from './components/ResearchTab';
import DziennikTab from './components/DziennikTab';

function usePersistedState(key, fallback) {
  const [value, setValue] = useState(() => { try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; } });
  function set(v) { setValue(v); try { localStorage.setItem(key, v); } catch (e) { /* noop */ } }
  return [value, set];
}

export default function App() {
  // ---- symbol / tab ----
  const [activeSymbol, setActiveSymbol] = usePersistedState('xauusd_active_symbol', 'XAUUSD');
  const [activeTab, setActiveTab] = usePersistedState('xauusd_active_tab_v1', 'terminal');
  const symbolRef = useRef(activeSymbol);
  symbolRef.current = activeSymbol;

  // ---- risk calculator (shared between Terminal's signal levels and Dziennik's scenario) ----
  const [riskBalance, setRiskBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(0.5);

  // ---- market data ----
  const { price, changeLabel, bidAsk, connState } = useTick(activeSymbol, symbolRef);
  const { h1BarsRaw, m15BarsRaw, m5BarsRaw } = useEngineBars(activeSymbol, symbolRef);
  const { h1State, m15State, m15DirState, m5State, m5Last } = useEngineState(h1BarsRaw, m15BarsRaw, m5BarsRaw);
  const { dailyBarsRaw, levels15mRaw } = useReferenceLevels(activeSymbol, symbolRef);
  const { lastAtrH1, lastH1Structure, lastH1Choch, lastVwap, lastPdhPdl, lastAsianRange, lastLondonRange, lastOrb, lastDailyRangeInfo, regime } =
    useDerivedLevels({ h1BarsRaw, dailyBarsRaw, levels15mRaw, h1State });

  // ---- charts ----
  const [mainTf, setMainTf] = useState('15m');
  const mainChartRows = useMainChart(activeSymbol, symbolRef, mainTf);
  const tileRows = useMiniCharts(activeSymbol, symbolRef);
  const mtfState = useMtfGrid(activeSymbol, symbolRef);

  // ---- macro calendar / news gate ----
  const { calendarRows, nextNewsInfo, newsFeedUsable } = useMacroCalendar();

  // ---- freshness (simplified vs. the original's per-feed timestamps — see README) ----
  const overallFreshness = price != null ? 'live' : 'offline';
  const marketDataLooksLive = m5Last ? Date.now() - (new Date(m5Last.openTime).getTime() + M5_MS) <= M5_MS * MAX_MISSED_BARS : false;

  // ---- history / manual trade ----
  const { signalHistory, manualTrade, backendStatus, openManualTrade, closeManualTrade, clearHistory } =
    useSignalHistory({ activeSymbol, symbolRef, m5BarsRaw, price, overallFreshness, marketDataLooksLive });

  const ftmoStrip = useFtmoStrip(riskBalance, riskPercent, signalHistory);

  // ---- the decision itself ----
  const cfg = symCfg(activeSymbol);
  const signalState = useMemo(
    () => evaluateSignal({
      h1State, m15State, m15DirState, m5State, m5Last,
      lastVwap, lastPdhPdl, lastAsianRange, lastAtrH1,
      lastH1Structure, lastH1Choch, regime,
      nextNewsInfo, newsFeedUsable, overallFreshness,
      bidAsk, price, riskBalance, riskPercent, cfg,
    }),
    [h1State, m15State, m15DirState, m5State, m5Last, lastVwap, lastPdhPdl, lastAsianRange, lastAtrH1,
      lastH1Structure, lastH1Choch, regime, nextNewsInfo, newsFeedUsable, overallFreshness, bidAsk, price, riskBalance, riskPercent, cfg],
  );

  const mainChartLevels = useMemo(() => {
    const L = [];
    if (lastVwap != null) L.push({ v: lastVwap, label: 'VWAP', color: 'var(--blue)', dash: '4 3' });
    if (lastPdhPdl) { L.push({ v: lastPdhPdl.pdh, label: 'PDH', color: 'var(--text-muted)', dash: '2 4' }); L.push({ v: lastPdhPdl.pdl, label: 'PDL', color: 'var(--text-muted)', dash: '2 4' }); }
    [[lastAsianRange, 'Asia'], [lastLondonRange, 'London'], [lastOrb, 'NY']].forEach(([range, label]) => {
      if (range) {
        const opacity = label === 'Asia' && lastLondonRange ? 0.5 : 1;
        L.push({ v: range.hi, label: `${label} H`, color: '#15803d', dash: '1 4', opacity });
        L.push({ v: range.lo, label: `${label} L`, color: '#b91c1c', dash: '1 4', opacity });
      }
    });
    if (signalState.levels) {
      L.push({ v: signalState.levels.entry, label: 'WEJŚCIE', color: 'var(--text-primary)', strong: true });
      L.push({ v: signalState.levels.sl, label: 'SL', color: 'var(--bad)', strong: true });
      L.push({ v: signalState.levels.tp1, label: 'TP1', color: 'var(--good)', strong: true });
    }
    return L;
  }, [lastVwap, lastPdhPdl, lastAsianRange, lastLondonRange, lastOrb, signalState.levels]);

  const dataLabel = connState === 'live' ? '🟢 na żywo' : connState === 'closed' ? '🔴 rynek zamknięty' : connState === 'connecting' ? '🟡 łączę…' : '🔴 brak danych';

  return (
    <div className="wrap">
      <TopBar
        activeSymbol={activeSymbol} onSymbolChange={setActiveSymbol} symLabel={cfg.label}
        price={price} changeLabel={changeLabel} bidAsk={bidAsk} dataLabel={dataLabel}
      />
      <TermTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'terminal' && (
        <TerminalTab
          mainTf={mainTf} onMainTfChange={setMainTf} mainChartRows={mainChartRows} mainChartLevels={mainChartLevels}
          signalState={signalState}
          lastVwap={lastVwap} lastPdhPdl={lastPdhPdl} lastAsianRange={lastAsianRange} lastOrb={lastOrb}
          lastAtrH1={lastAtrH1} lastDailyRangeInfo={lastDailyRangeInfo} regime={regime}
          newsFeedUsable={newsFeedUsable} nextNewsInfo={nextNewsInfo} price={price}
          ftmoStrip={ftmoStrip}
          riskBalance={riskBalance} onRiskBalanceChange={setRiskBalance}
          riskPercent={riskPercent} onRiskPercentChange={setRiskPercent}
          h1State={h1State} m15State={m15State} m5State={m5State}
          lastH1Structure={lastH1Structure} lastH1Choch={lastH1Choch} mtfState={mtfState}
        />
      )}

      {activeTab === 'historia' && (
        <HistoriaTab
          activeSymbol={activeSymbol} signalHistory={signalHistory} manualTrade={manualTrade} lastMidPrice={price}
          onOpenManual={openManualTrade} onCloseManual={() => price != null && closeManualTrade('manual_close', price)}
          onClearHistory={clearHistory} backendStatus={backendStatus}
        />
      )}

      {activeTab === 'poziomy' && (
        <PoziomyTab lastPdhPdl={lastPdhPdl} lastAsianRange={lastAsianRange} lastVwap={lastVwap} lastOrb={lastOrb} lastMidPrice={price} seriesRows={tileRows} />
      )}

      {activeTab === 'kalendarz' && <KalendarzTab calendarRows={calendarRows} />}

      {activeTab === 'research' && <ResearchTab />}

      {activeTab === 'dziennik' && <DziennikTab riskBalance={riskBalance} riskPercent={riskPercent} />}

      <footer>
        Wyłącznie kontekst informacyjny i symboliczny. Interpretacje astrologiczne nie mają potwierdzonej wartości predykcyjnej. Dane cenowe: biquote.io (feed MetaTrader 5). To nie jest porada inwestycyjna.
      </footer>

      <MobileNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
