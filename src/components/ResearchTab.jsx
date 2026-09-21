import { useMemo, useRef, useState } from 'react';
import { RAW_90D, LOW_52W, HIGH_52W, NUMEROLOGY_BIRTH, PLANET_POSITIONS } from '../lib/staticData';
import { Ticker, Chip } from './Bars';

const MONTHS_PL = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

function Line90DChart() {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const W = 920, H = 340, padL = 54, padR = 14, padT = 16, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const geo = useMemo(() => {
    const vals = RAW_90D.map((r) => r[1]);
    let minV = Math.min(...vals), maxV = Math.max(...vals);
    const pad = (maxV - minV) * 0.08;
    minV -= pad; maxV += pad;
    const xFor = (i) => padL + (i / (RAW_90D.length - 1)) * plotW;
    const yFor = (v) => padT + (1 - (v - minV) / (maxV - minV)) * plotH;
    const lineD = 'M ' + RAW_90D.map((r, i) => `${xFor(i)},${yFor(r[1])}`).join(' L ');
    const areaD = `${lineD} L ${xFor(RAW_90D.length - 1)},${padT + plotH} L ${xFor(0)},${padT + plotH} Z`;
    const gridLines = [];
    for (let s = 0; s <= 4; s++) {
      const v = minV + (maxV - minV) * (s / 4);
      gridLines.push({ y: yFor(v), label: '$' + v.toFixed(0) });
    }
    const xLabels = [];
    for (let i = 0; i < RAW_90D.length; i += 15) xLabels.push({ x: xFor(i), text: RAW_90D[i][0].slice(5).replace('-', '.') });
    return { xFor, yFor, lineD, areaD, gridLines, xLabels };
  }, []);

  function handleMove(clientX) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const localX = (clientX - rect.left) * scaleX;
    let idx = Math.round(((localX - padL) / plotW) * (RAW_90D.length - 1));
    idx = Math.max(0, Math.min(RAW_90D.length - 1, idx));
    setHoverIdx(idx);
  }

  const hover = hoverIdx != null ? RAW_90D[hoverIdx] : null;
  const hx = hoverIdx != null ? geo.xFor(hoverIdx) : null;
  const hy = hoverIdx != null ? geo.yFor(RAW_90D[hoverIdx][1]) : null;

  return (
    <div className="chart-box">
      <svg
        ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        onMouseMove={(e) => handleMove(e.clientX)} onMouseLeave={() => setHoverIdx(null)}
        onTouchMove={(e) => { handleMove(e.touches[0].clientX); e.preventDefault(); }} onTouchEnd={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {geo.gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={g.y} y2={g.y} className="grid-line" />
            <text x={8} y={g.y + 4} className="axis-label">{g.label}</text>
          </g>
        ))}
        {geo.xLabels.map((l, i) => <text key={i} x={l.x} y={H - 8} className="axis-label" textAnchor="middle">{l.text}</text>)}
        <path className="price-area" d={geo.areaD} fill="url(#areaFill)" />
        <path className="price-line" d={geo.lineD} />
        {hx != null && <line className="hover-line" x1={hx} x2={hx} y1={padT} y2={padT + plotH} style={{ opacity: 1 }} />}
        {hy != null && <circle className="hover-dot" cx={hx} cy={hy} r={4.5} style={{ opacity: 1 }} />}
      </svg>
      {hover && (
        <div className="tooltip" style={{ opacity: 1, left: `${(hx / W) * 100}%`, top: `${(hy / H) * 100}%` }}>
          <div className="tt-date">{(() => { const d = new Date(hover[0] + 'T00:00:00Z'); return `${d.getUTCDate()} ${MONTHS_PL[d.getUTCMonth()]} ${d.getUTCFullYear()}`; })()}</div>
          <div className="tt-price">${hover[1].toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}

function useNumerology() {
  return useMemo(() => {
    const digitSum = (n) => String(Math.abs(n)).split('').reduce((a, c) => a + parseInt(c, 10), 0);
    const reduceNum = (n) => { while (n > 9) n = digitSum(n); return n; };
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
    const personalYear = reduceNum(NUMEROLOGY_BIRTH.daySum + NUMEROLOGY_BIRTH.monthSum + digitSum(y));
    const personalMonth = reduceNum(personalYear + m);
    const personalDay = reduceNum(personalMonth + d);
    const lifePathDay = reduceNum(digitSum(d) + digitSum(m) + digitSum(y));
    const dayNamesShortPl = ['nd', 'pn', 'wt', 'śr', 'czw', 'pt', 'sb'];
    const dateLabel = `${d} ${MONTHS_PL[now.getMonth()]}, ${dayNamesShortPl[now.getDay()]}`;
    return { personalYear, personalMonth, personalDay, lifePathDay, dateLabel };
  }, []);
}

const STEM_HANZI = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const STEM_ELEMENT = ['Drewno', 'Drewno', 'Ogień', 'Ogień', 'Ziemia', 'Ziemia', 'Metal', 'Metal', 'Woda', 'Woda'];
const STEM_POLARITY = ['Yang', 'Yin', 'Yang', 'Yin', 'Yang', 'Yin', 'Yang', 'Yin', 'Yang', 'Yin'];
const BRANCH_HANZI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const BRANCH_ANIMAL = ['Szczur', 'Wół', 'Tygrys', 'Królik', 'Smok', 'Wąż', 'Koń', 'Koza', 'Małpa', 'Kogut', 'Pies', 'Świnia'];
const mod = (n, m) => ((n % m) + m) % m;
const pillarLabel = (s, b) => `${STEM_POLARITY[s]} ${STEM_ELEMENT[s]} — ${BRANCH_ANIMAL[b]} (${STEM_HANZI[s]}${BRANCH_HANZI[b]})`;

function gregorianToJDN(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

function useChineseAstrology() {
  return useMemo(() => {
    const now = new Date();
    const y = now.getFullYear(), gm = now.getMonth() + 1, d = now.getDate();
    const baziYear = gm < 2 || (gm === 2 && d < 4) ? y - 1 : y;
    const yearStem = mod(baziYear + 6, 10), yearBranch = mod(baziYear + 8, 12);
    const monthAnchorMonth = d < 4 ? (gm === 1 ? 12 : gm - 1) : gm;
    const monthOrder = mod(monthAnchorMonth - 2, 12);
    const tigerMonthStem = mod(2 * yearStem + 2, 10);
    const monthStem = mod(tigerMonthStem + monthOrder, 10), monthBranch = mod(monthOrder + 2, 12);
    const jdn = gregorianToJDN(y, gm, d);
    const daySexIdx = mod(jdn - 11, 60);
    const dayStem = mod(daySexIdx, 10), dayBranch = mod(daySexIdx, 12);
    return {
      year: pillarLabel(yearStem, yearBranch),
      month: pillarLabel(monthStem, monthBranch),
      day: pillarLabel(dayStem, dayBranch),
    };
  }, []);
}

export default function ResearchTab() {
  const np = useNumerology();
  const cn = useChineseAstrology();
  const last = RAW_90D[RAW_90D.length - 1][1];
  const prev = RAW_90D[RAW_90D.length - 2][1];
  const chg = last - prev;
  const chgPct = (chg / prev) * 100;
  const lo90 = Math.min(...RAW_90D.map((r) => r[1]));
  const hi90 = Math.max(...RAW_90D.map((r) => r[1]));

  return (
    <section className="tabpanel readable" data-tab="research">
      <p className="research-note">
        <b>Warstwa badawcza / eksperymentalna.</b> Numerologia, astrologia i metoda Ganna są tu jako warstwa opisowa i symboliczna, bez potwierdzonej wartości predykcyjnej (patrz „Pozycje planet"). Nic z tej zakładki nie wchodzi do silnika sygnałowego.
      </p>

      <section className="card">
        <h2>Kurs złota — 90 dni</h2>
        <p className="card-sub">Dane dzienne (close), XAU/USD, spot. Najedź na wykres, aby zobaczyć wartość z danego dnia.</p>
        <Line90DChart />
        <Ticker>
          <Chip k="Ostatni kurs (publikacja)" v={'$' + last.toFixed(2)} />
          <Chip k="Zmiana dzienna (publikacja)" v={`${chg >= 0 ? '+' : ''}${chg.toFixed(2)} (${chgPct >= 0 ? '+' : ''}${chgPct.toFixed(2)}%)`} cls={chg >= 0 ? 'up' : 'down'} />
          <Chip k="Zakres 90D" v={`$${lo90.toFixed(0)} – $${hi90.toFixed(0)}`} />
          <Chip k="Zakres 52-tyg." v={`$${LOW_52W.toFixed(0)} – $${HIGH_52W.toFixed(0)}`} />
        </Ticker>
      </section>

      <section className="card">
        <h2>Twoja numerologia</h2>
        <p className="card-sub">Droga Życia jest stała (z daty urodzenia); rok, miesiąc i dzień osobisty przeliczają się z aktualnej daty.</p>
        <div className="np-panel" style={{ maxWidth: 420 }}>
          <p className="np-label">Twoja numerologia</p>
          <div className="np-row"><span className="k">Droga Życia</span> <span className="v">11</span></div>
          <div className="np-row"><span className="k">Rok osobisty</span> <span className="v">{np.personalYear}</span></div>
          <div className="np-row"><span className="k">Miesiąc osobisty</span> <span className="v">{np.personalMonth}</span></div>
          <div className="np-row"><span className="k">Dzień osobisty</span> <span className="v">{np.personalDay}</span></div>
          <p className="np-label" style={{ margin: '13px 0 10px', paddingTop: 12, borderTop: '1px solid var(--border)' }}>Uniwersalne (dla każdego)</p>
          <div className="np-row"><span className="k">Life Path dnia</span> <span className="v">{np.lifePathDay}</span></div>
          <div className="np-row"><span className="k">Dzień dnia</span> <span className="v" style={{ fontSize: 12 }}>{np.dateLabel}</span></div>
        </div>
      </section>

      <section className="card">
        <h2>Pozycje planet</h2>
        <p className="card-sub">Warstwa opisowa, bez mapowania na cenę — po dwóch rundach backtestu żadna testowana hipoteza planetarna nie przeszła progu istotności statystycznej.</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="levels">
            <thead><tr><th>Planeta</th><th>Długość (8.09.2026)</th><th>Znak</th></tr></thead>
            <tbody>
              {PLANET_POSITIONS.map((p) => <tr key={p.planet}><td>{p.planet}</td><td>{p.longitude}</td><td>{p.sign}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <p className="np-label" style={{ margin: '0 0 4px' }}>Astrologia chińska (dziś)</p>
          <p className="card-sub" style={{ margin: '0 0 12px' }}>Prawdziwe filary (干支/ganzhi) liczone z daty, z przybliżeniem granic solarnych na 4. dzień miesiąca.</p>
          <Ticker>
            <Chip k="Rok chiński" v={cn.year} />
            <Chip k="Miesiąc chiński" v={cn.month} />
            <Chip k="Dzień chiński" v={cn.day} />
          </Ticker>
        </div>
        <p className="bg-para" style={{ marginTop: 14, fontSize: 12.5 }}>
          Co sprawdziliśmy: dwie rundy backtestu (JPL/Standish 1992) wobec 19 zweryfikowanych szczytów/dołków złota 1974–2024, z kontrolą losową 2000 dat. Runda 1 (Słońce-Wenus-Jowisz): najlepsze (Słońce-Jowisz) p≈0,055 — nie przechodzi progu. Runda 2: Mars retro p≈0,26; koniunkcja Jowisz-Saturn — zero sygnału. Wniosek: żadna hipoteza nie broni się statystycznie na tej próbie.
        </p>
      </section>
    </section>
  );
}
