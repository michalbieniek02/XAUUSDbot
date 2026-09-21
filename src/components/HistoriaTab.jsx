import { useMemo, useState } from 'react';
import { fmtOpenTime, fmtPnl, computePnl } from '../lib/engine';
import { Ticker, Chip } from './Bars';

function signalStatusLabel(s) {
  switch (s.status) {
    case 'open': return { text: '⏳ w trakcie (do TP1/SL)', cls: '' };
    case 'tp1': return { text: '✅ WIN — TP1', cls: 'up' };
    case 'tp2': return { text: '✅ WIN — TP2 (stara reguła)', cls: 'up' };
    case 'be': return { text: '➖ BE (TP1, potem wyjście na wejściu)', cls: '' };
    case 'sl': return { text: '❌ LOSS — SL', cls: 'down' };
    case 'tp': return { text: '✅ WIN — TP (1:1)', cls: 'up' };
    case 'manual_close': return { text: s.pnl >= 0 ? '➖ zamknięty ręcznie na plusie' : '➖ zamknięty ręcznie na minusie', cls: s.pnl >= 0 ? 'up' : 'down' };
    default: return { text: s.status, cls: '' };
  }
}

function rowSymbol(s) { return s?.symbol || 'XAUUSD'; }

export default function HistoriaTab({ activeSymbol, signalHistory, manualTrade, lastMidPrice, onOpenManual, onCloseManual, onClearHistory, backendStatus }) {
  const [histFrom, setHistFrom] = useState('');
  const [histTo, setHistTo] = useState('');

  const range = useMemo(() => {
    const from = histFrom ? Date.parse(histFrom + 'T00:00:00Z') : null;
    const to = histTo ? Date.parse(histTo + 'T23:59:59.999Z') : null;
    return { from, to, active: !!(histFrom || histTo) };
  }, [histFrom, histTo]);

  function inRange(s) {
    if (!range.active) return true;
    const t = Date.parse(s?.ts);
    if (!isFinite(t)) return true;
    if (range.from != null && t < range.from) return false;
    if (range.to != null && t > range.to) return false;
    return true;
  }

  const forSymbol = signalHistory.filter((s) => rowSymbol(s) === activeSymbol && inRange(s));
  const engineRows = forSymbol.filter((s) => s.source !== 'manual');
  const manualRows = forSymbol.filter((s) => s.source === 'manual');

  const wins = engineRows.filter((s) => s.status === 'tp1' || s.status === 'tp2').length;
  const losses = engineRows.filter((s) => s.status === 'sl').length;
  const breakEven = engineRows.filter((s) => s.status === 'be').length;
  const pending = engineRows.filter((s) => s.status === 'open').length;
  const closedCount = wins + losses + breakEven;
  const winRate = closedCount ? Math.round((wins / closedCount) * 100) : null;
  const engineClosedPnl = engineRows.reduce((a, s) => a + (s.status !== 'open' && s.pnl != null ? s.pnl : 0), 0);

  const manualClosed = manualRows.filter((s) => s.pnl != null);
  const manualPnlSum = manualClosed.reduce((a, s) => a + s.pnl, 0);
  const manualWins = manualClosed.filter((s) => s.pnl > 0).length;

  const mid = lastMidPrice;

  return (
    <section className="tabpanel readable" data-tab="historia">
      <section className="card">
        <h2>Historia sygnałów i trejdów</h2>
        <p className="card-sub">Każdy sygnał VALID (ocena ≥7/10) trafia tu razem z Entry/SL/TP1, a potem jest sprawdzany względem ceny. Wiersze pochodzą z backendu (cron co 5 min) — to nie jest księgowość realnych transakcji z MT5.</p>
        <p className="card-sub" style={{ fontSize: 11.5, marginTop: -10 }}>
          Backend: {backendStatus ? `sprawdzono o ${fmtOpenTime(backendStatus.checkedAt)} UTC+2` : 'jeszcze się nie odezwał'}
        </p>

        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
          {!manualTrade ? (
            <>
              <p className="card-sub" style={{ margin: '0 0 10px' }}>Ręczny trejd testowy: 0.05 lota, SL i TP po $10 ceny (1:1 RR). Wejście po aktualnym mid-price.</p>
              <Ticker>
                <div className="chip"><button type="button" onClick={() => onOpenManual('BUY')} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--good)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '2px 0' }}>▲ Otwórz BUY</button></div>
                <div className="chip"><button type="button" onClick={() => onOpenManual('SELL')} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--bad)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '2px 0' }}>▼ Otwórz SELL</button></div>
              </Ticker>
            </>
          ) : (
            <>
              <Ticker>
                <Chip k="Kierunek" v={manualTrade.dir} />
                <Chip k="Wejście" v={'$' + manualTrade.entry.toFixed(2)} />
                <Chip k="SL" v={'$' + manualTrade.sl.toFixed(2)} cls="down" />
                <Chip k="TP" v={'$' + manualTrade.tp.toFixed(2)} cls="up" />
                <Chip k="P/L teraz" v={fmtPnl(mid != null ? computePnl(manualTrade.dir, manualTrade.entry, mid, manualTrade.lot, rowSymbol(manualTrade)) : null)} />
              </Ticker>
              <button type="button" onClick={onCloseManual} style={{ marginTop: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Zamknij teraz po cenie rynkowej</button>
            </>
          )}
        </div>

        <div style={{ marginBottom: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 }}>
          <label className="card-sub" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>Od (włącznie)
            <input type="date" value={histFrom} onChange={(e) => setHistFrom(e.target.value)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit' }} />
          </label>
          <label className="card-sub" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>Do (włącznie)
            <input type="date" value={histTo} onChange={(e) => setHistTo(e.target.value)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit' }} />
          </label>
          <button type="button" onClick={() => { setHistFrom(''); setHistTo(''); }} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cały czas</button>
          <span className="card-sub" style={{ fontSize: 11.5 }}>
            {range.active ? `Filtr aktywny — ${forSymbol.length} poz.` : 'Bez filtra — liczby poniżej obejmują całą historię.'}
          </span>
        </div>

        {!signalHistory.length ? (
          <p className="card-sub">Jeszcze żaden sygnał/trejd nie trafił do historii.</p>
        ) : range.active && !forSymbol.length ? (
          <p className="card-sub">Brak sygnałów i trejdów w wybranym zakresie dat dla {activeSymbol}.</p>
        ) : (
          <>
            <Ticker>
              <Chip k="Sygnały silnika" v={String(engineRows.length)} />
              <Chip k="Trafność (zamknięte)" v={winRate == null ? '—' : winRate + '%'} cls={winRate == null ? null : winRate >= 50 ? 'up' : 'down'} />
              <Chip k="Wygrane (TP1)" v={String(wins)} cls={wins ? 'up' : null} />
              <Chip k="Strata (SL)" v={String(losses)} cls={losses ? 'down' : null} />
              {breakEven > 0 && <Chip k="Bez zmian (BE)" v={String(breakEven)} />}
              <Chip k="W trakcie" v={String(pending)} />
              <Chip k="Suma P/L (zamknięte)" v={closedCount ? fmtPnl(engineClosedPnl) : '—'} cls={closedCount ? (engineClosedPnl >= 0 ? 'up' : 'down') : null} />
            </Ticker>
            {manualRows.length > 0 && (
              <Ticker>
                <Chip k="Ręczne trejdy testowe" v={String(manualRows.length)} />
                <Chip k="W tym wygrane" v={String(manualWins)} cls={manualWins ? 'up' : null} />
                <Chip k="Suma P/L (ręczne)" v={fmtPnl(manualPnlSum)} cls={manualPnlSum >= 0 ? 'up' : 'down'} />
              </Ticker>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table className="levels">
                <thead><tr><th>Data (UTC+2)</th><th>Źródło</th><th>Kier.</th><th>Wejście</th><th>SL</th><th>TP1</th><th>Ocena</th><th>Status</th><th>P/L $</th></tr></thead>
                <tbody>
                  {forSymbol.slice(0, 30).map((s) => {
                    const st = signalStatusLabel(s);
                    const srcLabel = s.source === 'manual' ? 'ręczny test' : s.source === 'engine-backend' ? 'silnik (serwer 24/7)' : 'silnik (przeglądarka)';
                    const isLive = s.status === 'open' && s.source !== 'manual' && mid != null && rowSymbol(s) === activeSymbol;
                    const displayPnl = isLive ? computePnl(s.dir, s.entry, mid, s.lot, rowSymbol(s)) : s.pnl;
                    return (
                      <tr key={s.id}>
                        <td>{fmtOpenTime(s.ts)}</td>
                        <td>{srcLabel}</td>
                        <td className="price">{s.dir}</td>
                        <td className="price">${s.entry.toFixed(2)}</td>
                        <td>${s.sl.toFixed(2)}</td>
                        <td>${s.tp1.toFixed(2)}</td>
                        <td>{s.score != null ? `${s.score}/${s.maxScore || 11}` : '—'}</td>
                        <td className={st.cls}>{st.text}</td>
                        <td className={displayPnl > 0 ? 'tf-up' : displayPnl < 0 ? 'tf-down' : ''}>
                          {fmtPnl(displayPnl)}{isLive && <span className="card-sub" style={{ fontSize: 10 }}> na żywo</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {forSymbol.length > 30 && <p className="card-sub" style={{ marginTop: 10 }}>Pokazuję ostatnie 30 z {forSymbol.length}.</p>}
            <button type="button" onClick={onClearHistory} style={{ marginTop: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Wyczyść historię</button>
          </>
        )}
      </section>
    </section>
  );
}
