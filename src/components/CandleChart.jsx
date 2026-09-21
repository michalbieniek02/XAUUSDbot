import { useMemo, useRef, useState } from 'react';
import { calcEMA } from '../lib/engine';

// rows: array of [label, open, high, low, close], oldest first (ascending).
// levels: [{ v, label, color, dash, strong }]
export default function CandleChart({ id, rows, width = 460, height = 260, ema = false, levels = [], legendTarget }) {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [hoverY, setHoverY] = useState(null);

  const geo = useMemo(() => {
    if (!rows || !rows.length) return null;
    const W = width, H = height, padL = 52, padR = 52, padT = 14, padB = 26;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const hi = Math.max(...rows.map((r) => r[2]));
    const lo = Math.min(...rows.map((r) => r[3]));
    const pad = (hi - lo) * 0.12 || 1;
    const maxV = hi + pad, minV = lo - pad;
    const y = (v) => padT + (1 - (v - minV) / (maxV - minV)) * plotH;
    const n = rows.length;
    const slot = plotW / n;
    const bodyW = Math.max(4, slot * 0.62);

    const gridLines = [];
    for (let s = 0; s <= 4; s++) {
      const v = minV + (maxV - minV) * (s / 4);
      gridLines.push({ y: y(v), label: v.toFixed(0) });
    }
    const vGrid = [1, 2, 3].map((g) => padL + plotW * (g / 4));

    const candles = rows.map((r, i) => {
      const cx = padL + slot * i + slot / 2;
      const up = r[4] >= r[1];
      return {
        cx, up,
        wickY1: y(r[2]), wickY2: y(r[3]),
        bodyTop: y(Math.max(r[1], r[4])), bodyBot: y(Math.min(r[1], r[4])),
        bodyW,
      };
    });

    const xLabels = [0, Math.floor((n - 1) / 2), n - 1].map((i) => ({
      x: Math.min(Math.max(padL + slot * i + slot / 2, padL + 16), W - padR - 16),
      text: rows[i][0],
    }));

    const lastRow = rows[n - 1];
    const lastUp = lastRow[4] >= lastRow[1];
    const lastY = y(lastRow[4]);

    let emaPoints = null;
    if (ema && rows.length >= 20) {
      const vals = calcEMA(rows.map((r) => r[4]), 20);
      const pts = [];
      vals.forEach((v, i) => { if (v != null) pts.push(`${(padL + slot * i + slot / 2).toFixed(1)},${y(v).toFixed(1)}`); });
      if (pts.length > 1) emaPoints = pts.join(' ');
    }

    const labelRows = [];
    const drawnLevels = [];
    levels.forEach((L) => {
      if (L.v == null || L.v < minV || L.v > maxV) return;
      const ly = y(L.v);
      let col = 0;
      while (labelRows.some((r) => r.col === col && Math.abs(r.y - ly) < 11)) col++;
      labelRows.push({ col, y: ly });
      drawnLevels.push({ ...L, y: ly, labelX: padL + 5 + col * 58 });
    });

    return { W, H, padL, padR, padT, plotW, plotH, minV, maxV, y, slot, n, gridLines, vGrid, candles, xLabels, lastY, lastUp, lastRow, emaPoints, drawnLevels };
  }, [rows, width, height, ema, levels]);

  if (!geo) return <svg id={id} className="candles" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" />;

  const { W, H, padL, padR, padT, plotW, plotH, minV, maxV, slot, n, gridLines, vGrid, candles, xLabels, lastY, lastUp, lastRow, emaPoints, drawnLevels } = geo;

  function handleMove(clientX, clientY) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const localX = (clientX - rect.left) * scaleX;
    const localY = Math.max(padT, Math.min(padT + plotH, (clientY - rect.top) * scaleY));
    let idx = Math.round((localX - padL - slot / 2) / slot);
    idx = Math.max(0, Math.min(n - 1, idx));
    setHoverIdx(idx);
    setHoverY(localY);
  }

  const hoverRow = hoverIdx != null ? rows[hoverIdx] : null;
  const hoverX = hoverIdx != null ? padL + slot * hoverIdx + slot / 2 : null;
  const hoverPrice = hoverY != null ? maxV - ((hoverY - padT) / plotH) * (maxV - minV) : null;

  return (
    <div className="tf-chart-wrap">
      <svg
        ref={svgRef}
        id={id}
        className="candles"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseLeave={() => { setHoverIdx(null); setHoverY(null); }}
        onTouchMove={(e) => { handleMove(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }}
        onTouchEnd={() => { setHoverIdx(null); setHoverY(null); }}
      >
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={g.y} y2={g.y} className="candle-grid" />
            <text x={4} y={g.y + 4} className="candle-axis">{g.label}</text>
          </g>
        ))}
        {vGrid.map((vx, i) => (
          <line key={i} x1={vx} x2={vx} y1={padT} y2={padT + plotH} className="candle-grid" opacity="0.5" />
        ))}

        {candles.map((c, i) => (
          <g key={i}>
            <line x1={c.cx} x2={c.cx} y1={c.wickY1} y2={c.wickY2} className={c.up ? 'cd-up' : 'cd-down'} strokeWidth="1.6" />
            <rect x={c.cx - c.bodyW / 2} y={c.bodyTop} width={c.bodyW} height={Math.max(1, c.bodyBot - c.bodyTop)} className={c.up ? 'cd-up' : 'cd-down'} />
          </g>
        ))}

        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={H - 6} textAnchor="middle" className="candle-axis-x">{l.text}</text>
        ))}

        <line x1={padL} x2={W - padR } y1={lastY} y2={lastY} className="last-price-line" />
        <polygon points={`${W - padR},${lastY} ${W - padR + 5},${lastY - 3} ${W - padR + 5},${lastY + 3}`} className={(lastUp ? 'cd-up' : 'cd-down') + ' price-tag-bg'} />
        <rect x={W - padR + 5} y={lastY - 10} width={52} height={20} rx="3.5" className={(lastUp ? 'cd-up' : 'cd-down') + ' price-tag-bg'} />
        <text x={W - padR + 30.7} y={lastY + 3.2} textAnchor="middle" className="price-tag-text">{lastRow[4].toFixed(2)}$</text>

        {emaPoints && <polyline points={emaPoints} fill="none" stroke="var(--violet)" strokeWidth="1.4" opacity="0.9" />}

        {drawnLevels.map((L, i) => (
          <g key={i} opacity={L.opacity ?? 1}>
            <line x1={padL} x2={W - padR} y1={L.y} y2={L.y} stroke={L.color} strokeWidth={L.strong ? 1.5 : 1} opacity={L.strong ? 0.95 : 0.6} strokeDasharray={L.dash || undefined} />
            {hoverY != null && Math.abs(hoverY - L.y) <= 8 && (
              <text x={L.labelX} y={L.y - 4} className="candle-axis" fill={L.color}>{L.label}</text>
            )}
          </g>
        ))}

        {hoverX != null && <line x1={hoverX} x2={hoverX} y1={padT} y2={padT + plotH} className="cd-crosshair-v" style={{ opacity: 1 }} />}
        {hoverY != null && <line x1={padL} x2={W - padR} y1={hoverY} y2={hoverY} className="cd-crosshair-v" style={{ opacity: 1 }} />}
        <rect x={padL} y={padT} width={plotW} height={plotH} className="cd-hit" fill="transparent" />
      </svg>
      {hoverRow && (
        <div className="tf-tooltip" id={`tt-${id}`} style={{ opacity: 1, left: `${(hoverX / W) * 100}%`, top: `${(hoverY / H) * 100}%` }}>
          <div className="ttf-time" id={`tt-${id}-time`}>{hoverRow[0]}</div>
          <div className="ttf-row" id={`tt-${id}-row`}>
            <span>ꗃ <b>{hoverRow[1].toFixed(2)}</b></span>
            <span>↗ <b>{hoverRow[2].toFixed(2)}</b></span>
            <span>↘ <b>{hoverRow[3].toFixed(2)}</b></span>
            <span style={{ color: hoverRow[4] >= hoverRow[1] ? 'var(--good)' : 'var(--bad)' }}>🔒︎ <b>{hoverRow[4].toFixed(2)}</b></span>
            <span style={{ color: 'var(--gold)' }}>⊹ <b>{hoverPrice.toFixed(2)}</b></span>
          </div>
        </div>
      )}
    </div>
  );
}

export function candleStats(rows) {
  if (!rows || !rows.length) return null;
  const hi = Math.max(...rows.map((r) => r[2]));
  const lo = Math.min(...rows.map((r) => r[3]));
  const chg = rows[rows.length - 1][4] - rows[0][4];
  const last = rows[rows.length - 1][4];
  return { hi, lo, chg, last };
}
