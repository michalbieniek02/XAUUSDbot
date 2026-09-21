import { useEffect, useMemo, useState } from 'react';
import { fmtPnl, ftmoDayKey, ftmoResetInfo } from '../lib/engine';
import { GuardMeter } from './Bars';

const JOURNAL_KEY = 'xauusd_trade_journal_v1';
const FTMO_KEY = 'xauusd_ftmo_guard_v1';
const JR_MONTH_NAMES = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const JR_MONTH_GEN = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

function pad2(n) { return (n < 10 ? '0' : '') + n; }
function jrKeyOf(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }
function jrTodayKey() { const n = new Date(); return jrKeyOf(n.getFullYear(), n.getMonth(), n.getDate()); }
function jrPrettyDate(key) { const [y, m, d] = key.split('-'); return `${parseInt(d, 10)} ${JR_MONTH_GEN[parseInt(m, 10) - 1]} ${y}`; }
function jrParseAmount(raw) {
  const t = String(raw).replace(/\s/g, '').replace(',', '.').replace('−', '-');
  if (t === '') return null;
  const v = parseFloat(t);
  return isNaN(v) ? undefined : v;
}
function loadJson(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
}

export default function DziennikTab({ riskBalance, riskPercent }) {
  const [journal, setJournal] = useState(() => loadJson(JOURNAL_KEY, {}));
  const [ftmoCfg, setFtmoCfg] = useState(() => loadJson(FTMO_KEY, { initial: 10000, dailyPct: 5, totalPct: 10, softPct: 80 }));
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [selected, setSelected] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [amountErr, setAmountErr] = useState(false);

  useEffect(() => { try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal)); } catch (e) { /* noop */ } }, [journal]);
  useEffect(() => { try { localStorage.setItem(FTMO_KEY, JSON.stringify(ftmoCfg)); } catch (e) { /* noop */ } }, [ftmoCfg]);

  useEffect(() => {
    if (!selected) { setAmountInput(''); setNoteInput(''); return; }
    const entry = journal[selected];
    setAmountInput(entry ? String(entry.pnl) : '');
    setNoteInput(entry?.note || '');
    setAmountErr(false);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  function saveDay() {
    if (!selected) return;
    const parsed = jrParseAmount(amountInput);
    if (parsed === undefined) { setAmountErr(true); return; }
    setJournal((prev) => {
      const next = { ...prev };
      if (parsed === null) delete next[selected];
      else next[selected] = { pnl: parsed, note: noteInput.trim() };
      return next;
    });
  }
  function deleteDay() {
    if (!selected) return;
    setJournal((prev) => { const next = { ...prev }; delete next[selected]; return next; });
  }

  const y = cursor.getFullYear(), m = cursor.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = jrTodayKey();
  const monthPrefix = `${y}-${pad2(m + 1)}`;

  const summary = useMemo(() => {
    const keys = Object.keys(journal);
    const monthKeys = keys.filter((k) => k.indexOf(monthPrefix) === 0);
    const sum = (ks) => ks.reduce((a, k) => a + (journal[k].pnl || 0), 0);
    const monthSum = sum(monthKeys), allSum = sum(keys);
    const wins = monthKeys.filter((k) => journal[k].pnl > 0).length;
    const losses = monthKeys.filter((k) => journal[k].pnl < 0).length;
    let best = null, worst = null;
    monthKeys.forEach((k) => {
      if (best === null || journal[k].pnl > journal[best].pnl) best = k;
      if (worst === null || journal[k].pnl < journal[worst].pnl) worst = k;
    });
    return { monthKeys, monthSum, allSum, wins, losses, best, worst, keys };
  }, [journal, monthPrefix]);

  const ftmo = useMemo(() => {
    const initial = ftmoCfg.initial > 0 ? ftmoCfg.initial : 10000;
    const dailyLimit = (initial * ftmoCfg.dailyPct) / 100;
    const totalLimit = (initial * ftmoCfg.totalPct) / 100;
    const dayKey = ftmoDayKey();
    const todayEntry = journal[dayKey];
    const todayPnl = todayEntry ? todayEntry.pnl : null;
    const dailyUsed = todayPnl != null && todayPnl < 0 ? -todayPnl : 0;
    const cumulative = Object.keys(journal).reduce((a, k) => a + (journal[k].pnl || 0), 0);
    const totalUsed = cumulative < 0 ? -cumulative : 0;
    return {
      initial, dayKey, hasTodayEntry: !!todayEntry, todayPnl, cumulative,
      dailyLimit, dailyUsed, dailyLeft: dailyLimit - dailyUsed,
      totalLimit, totalUsed, totalLeft: totalLimit - totalUsed,
      entryCount: Object.keys(journal).length,
    };
  }, [journal, ftmoCfg]);

  const nextRisk = riskBalance * (riskPercent / 100);
  const afterDaily = ftmo.dailyLeft - nextRisk;
  const afterTotal = ftmo.totalLeft - nextRisk;
  const reset = ftmoResetInfo();
  const pctOf = (used, limit) => (limit > 0 ? Math.min(100, (used / limit) * 100) : 0);

  let scenarioCls, scenarioText;
  if (ftmo.dailyLeft <= 0 || ftmo.totalLeft <= 0) {
    scenarioCls = 'bad';
    scenarioText = 'Limit już wyczerpany wg Twoich wpisów. Kolejny trejd nie ma z czego być pokryty — sprawdź panel FTMO.';
  } else if (afterDaily < 0 || afterTotal < 0) {
    scenarioCls = 'bad';
    scenarioText = `Trejd na obecnym ryzyku ($${nextRisk.toFixed(2)}) przekroczyłby limit, gdyby poszedł na SL. Zmniejsz ryzyko albo odpuść dzisiaj.`;
  } else if (afterDaily < nextRisk) {
    scenarioCls = 'warn';
    scenarioText = `Po tym trejdzie zostałoby $${afterDaily.toFixed(2)} dziennego bufora. Jeśli pójdzie na SL, na dziś koniec.`;
  } else {
    scenarioCls = 'ok';
    scenarioText = `Trejd na obecnym ryzyku ($${nextRisk.toFixed(2)}) mieści się w buforze: po ewentualnym SL zostałoby $${afterDaily.toFixed(2)}.`;
  }

  const dow = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(jrKeyOf(y, m, d));

  return (
    <section className="tabpanel readable" data-tab="dziennik">
      <section className="card">
        <h2>Limity FTMO — ile bufora Ci zostało</h2>
        <p className="card-sub">Liczone wyłącznie z Twoich wpisów w dzienniku niżej — nie z symulacji silnika. Dashboard nie ma dostępu do Twojego konta FTMO. Zawsze sprawdzaj panel FTMO.</p>
        <div className="guard-cfg">
          {[['initial', 'Kapitał startowy ($)'], ['dailyPct', 'Limit dzienny (%)'], ['totalPct', 'Limit całkowity (%)'], ['softPct', 'Ostrzeżenie przy (% limitu)']].map(([key, label]) => (
            <div className="jr-field" key={key}>
              <label>{label}</label>
              <input
                type="text" inputMode="decimal" value={ftmoCfg[key]}
                onChange={(e) => {
                  const v = jrParseAmount(e.target.value);
                  if (v == null || v === undefined || v <= 0) return;
                  setFtmoCfg((prev) => ({ ...prev, [key]: v }));
                }}
              />
            </div>
          ))}
        </div>
        <GuardMeter
          label={`Limit dzienny (${ftmoCfg.dailyPct}% z $${ftmo.initial.toFixed(0)})`}
          pct={pctOf(ftmo.dailyUsed, ftmo.dailyLimit)} left={ftmo.dailyLeft} softPct={ftmoCfg.softPct}
          note={ftmo.hasTodayEntry
            ? `Dziś w dzienniku: <b>${fmtPnl(ftmo.todayPnl)}</b>. Zużyte z limitu: $${ftmo.dailyUsed.toFixed(2)} z $${ftmo.dailyLimit.toFixed(2)}.`
            : `Na dziś (${ftmo.dayKey}, doba FTMO wg czasu środkowoeuropejskiego) nie ma jeszcze wpisu — licznik pokazuje pełny bufor.`}
        />
        <GuardMeter
          label={`Limit całkowity (${ftmoCfg.totalPct}% z $${ftmo.initial.toFixed(0)})`}
          pct={pctOf(ftmo.totalUsed, ftmo.totalLimit)} left={ftmo.totalLeft} softPct={ftmoCfg.softPct}
          note={ftmo.entryCount
            ? `Suma ${ftmo.entryCount} dni w dzienniku: <b>${fmtPnl(ftmo.cumulative)}</b>. Liczone od kapitału startowego, nie od szczytu.`
            : 'Dziennik jest pusty, więc ten licznik pokazuje pełny bufor.'}
        />
        <div className={'guard-scenario ' + scenarioCls}>
          <h4>Następny trejd — scenariusz</h4>
          <p>{scenarioText}</p>
        </div>
        {reset && <p className="gm-note" style={{ marginTop: 14 }}>Doba FTMO resetuje się o północy czasu środkowoeuropejskiego (Praga) — za {reset.hoursLeft} h {reset.minsLeft} min.</p>}
        <p className="gm-note">Panel FTMO zawsze wygrywa z tym licznikiem.</p>
      </section>

      <section className="card">
        <h2>Dziennik traderski</h2>
        <p className="card-sub">Kliknij dzień i wpisz, ile wyszedłeś na plus albo na minus. Minus ze znakiem „−". Zapisuje się lokalnie w tej przeglądarce.</p>
        <div className="ticker" style={{ marginTop: 16 }}>
          <div className="chip"><div className="k">Wynik miesiąca</div><div className={'v num' + (summary.monthKeys.length ? (summary.monthSum >= 0 ? ' up' : ' down') : '')}>{summary.monthKeys.length ? fmtPnl(summary.monthSum) : '—'}</div></div>
          <div className="chip"><div className="k">Dni zapisane</div><div className="v num">{summary.monthKeys.length}</div></div>
          <div className="chip"><div className="k">Na plusie</div><div className={'v num' + (summary.wins ? ' up' : '')}>{summary.wins}</div></div>
          <div className="chip"><div className="k">Na minusie</div><div className={'v num' + (summary.losses ? ' down' : '')}>{summary.losses}</div></div>
          <div className="chip"><div className="k">Najlepszy dzień</div><div className="v num">{summary.best ? fmtPnl(journal[summary.best].pnl) : '—'}</div></div>
          <div className="chip"><div className="k">Najgorszy dzień</div><div className="v num">{summary.worst ? fmtPnl(journal[summary.worst].pnl) : '—'}</div></div>
          <div className="chip"><div className="k">Suma wszystkich dni</div><div className="v num">{summary.keys.length ? fmtPnl(summary.allSum) : '—'}</div></div>
        </div>
        <div className="jr-bar">
          <button type="button" onClick={() => setCursor(new Date(y, m - 1, 1))} aria-label="Poprzedni miesiąc">‹</button>
          <span className="jr-month">{JR_MONTH_NAMES[m]} {y}</span>
          <button type="button" onClick={() => setCursor(new Date(y, m + 1, 1))} aria-label="Następny miesiąc">›</button>
          <button type="button" onClick={() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); setSelected(jrTodayKey()); }}>Dziś</button>
        </div>
        <div className="jr-dows">{dow.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="jr-grid">
          {cells.map((key, i) => {
            if (!key) return <div className="jr-day empty" key={i} />;
            const entry = journal[key];
            const cls = 'jr-day' + (entry ? (entry.pnl > 0 ? ' win' : entry.pnl < 0 ? ' loss' : '') : '') + (key === today ? ' today' : '');
            return (
              <button type="button" className={cls} key={key} aria-pressed={key === selected} onClick={() => setSelected(selected === key ? null : key)}>
                <span className="d">{parseInt(key.split('-')[2], 10)}</span>
                <span className="p">{entry ? fmtPnl(entry.pnl) : ''}</span>
                {entry?.note && <span className="n">{entry.note}</span>}
              </button>
            );
          })}
        </div>
        {!selected ? (
          <p className="card-sub" style={{ marginTop: 16 }}>Kliknij dzień w kalendarzu, żeby wpisać wynik.</p>
        ) : (
          <div className="jr-editor">
            <h3>{jrPrettyDate(selected)}</h3>
            <div className="jr-fields">
              <div className="jr-field">
                <label>Wynik dnia ($)</label>
                <input
                  type="text" inputMode="decimal" autoComplete="off" placeholder="np. -120.50"
                  value={amountInput} style={amountErr ? { borderColor: 'var(--bad)' } : undefined}
                  onChange={(e) => { setAmountInput(e.target.value); setAmountErr(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveDay(); }}
                />
              </div>
              <div className="jr-field grow">
                <label>Notatka (opcjonalnie)</label>
                <input
                  type="text" maxLength={140} autoComplete="off" placeholder="co poszło dobrze, co źle"
                  value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveDay(); }}
                />
              </div>
            </div>
            <div className="jr-actions">
              <button type="button" className="jr-save" onClick={saveDay}>Zapisz</button>
              {journal[selected] && <button type="button" className="jr-del" onClick={deleteDay}>Usuń wpis</button>}
            </div>
            <p className="card-sub" style={{ margin: '10px 0 0', fontSize: 11 }}>Strata ze znakiem minus. Pusta kwota = wpis skasowany.</p>
          </div>
        )}
        <p className="card-sub" style={{ marginTop: 16, fontSize: 11.5 }}>To Twój ręczny zapis realnych wyników z MT5 — nie miesza się z tabelą „Historia sygnałów", która jest symulacją silnika.</p>
      </section>
    </section>
  );
}
