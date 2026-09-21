import CandleChart, { candleStats } from './CandleChart';

const TILES = [
  { id: 'cvDaily', key: 'daily', title: 'Dzienny' },
  { id: 'cv4h', key: '4h', title: '4H' },
  { id: 'cv1h', key: '1h', title: '1H' },
  { id: 'cv15', key: '15m', title: '15M' },
  { id: 'cv5', key: '5m', title: '5M' },
  { id: 'cv1', key: '1m', title: '1M' },
];

// seriesRows: { daily: rows, '4h': rows, ... } each ascending [label,o,h,l,c]
export default function MiniChartGrid({ seriesRows }) {
  return (
    <div className="tf-grid">
      {TILES.map((t) => {
        const rows = seriesRows[t.key];
        const stats = candleStats(rows);
        return (
          <div className="tf-card" key={t.id}>
            <h3>{t.title}</h3>
            {stats && (
              <div className="tf-stats">
                <span>Ostatnia: <b className="num">{stats.last.toFixed(2)}</b></span>
                <span>Zakres: <b className="num">{stats.lo.toFixed(0)}–{stats.hi.toFixed(0)}</b></span>
                <span>Δ: <b className={'num ' + (stats.chg >= 0 ? 'tf-up' : 'tf-down')}>{(stats.chg >= 0 ? '+' : '') + stats.chg.toFixed(2)}</b></span>
              </div>
            )}
            <CandleChart id={t.id} rows={rows} width={460} height={260} />
          </div>
        );
      })}
    </div>
  );
}
