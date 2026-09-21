import { TIMELINE_EVENTS, X_POSTS, FUNDAMENTAL_BACKGROUND, ASTRO_BACKGROUND } from '../lib/staticData';

function fmtCalVal(v, unit, digits) {
  if (v == null || isNaN(v)) return null;
  if (unit === 'percent') return (v > 0 ? '+' : '') + v.toFixed(digits || 1) + '%';
  if (unit === 'job') return Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + ' tys.' : v.toFixed(0);
  return v.toFixed(digits || 1);
}

function calendarLine(rows) {
  return rows.map((e) => {
    const f = fmtCalVal(e.forecast, e.unit, e.digits);
    const p = fmtCalVal(e.previous, e.unit, e.digits);
    const a = fmtCalVal(e.actual, e.unit, e.digits);
    const label = rows.length > 1 ? e.name + ': ' : '';
    return label + (a != null ? `<b>wynik ${a}</b>` : 'oczekuje na wynik') + (f != null ? ` (prognoza ${f})` : '') + (p != null ? ` · poprzednio ${p}` : '');
  }).join(' &nbsp;|&nbsp; ');
}

// calendarRows: { [calId]: matchedEconEvents[] } — filled by the App-level
// macro-calendar poller from biquote.io's economic calendar feed.
export default function KalendarzTab({ calendarRows }) {
  return (
    <section className="tabpanel readable" data-tab="kalendarz">
      <section className="card">
        <h2>Harmonogram: 2–30 września 2026</h2>
        <p className="card-sub">Aspekty Księżyca, sygnały z metody Ganna i najważniejsze dane makro — godziny dla Warszawy (UTC+2). Wyniki publikacji makro uzupełniają się automatycznie — źródło: kalendarz ekonomiczny biquote.io.</p>
        <div className="legend">
          <span><i style={{ background: 'var(--violet)' }} />Aspekt astrologiczny</span>
          <span><i style={{ background: 'var(--blue)' }} />Publikacja / wydarzenie rynkowe</span>
          <span><i style={{ background: 'var(--gold)' }} />Głos z X (Twitter)</span>
          <span><i style={{ background: 'var(--teal)' }} />Metoda Ganna (ingres / deklinacja)</span>
        </div>
        <ul className="tl">
          {TIMELINE_EVENTS.map((ev, i) => (
            <li className={'tl-item' + (ev.major ? ' major' : '')} key={i}>
              <div className="tl-when"><div className="day">{ev.date}</div>{ev.day} · {ev.time}</div>
              <div className="tl-body">
                <div className="tl-top"><span className={'badge ' + ev.badge}>{{ astro: 'Aspekt', news: 'News', gann: 'Gann' }[ev.badge] || ev.badge}</span></div>
                <div className={'tl-title' + (ev.major ? ' highlight' : '')}>
                  {ev.badge === 'news' && ev.sourceUrl ? (
                    <a className="news-source-btn" href={ev.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {ev.title}<span aria-hidden="true">↗</span>
                    </a>
                  ) : ev.title}
                </div>
                <div className="tl-note" dangerouslySetInnerHTML={{ __html: ev.note }} />
                {ev.calId && (
                  <div className="tl-note cal-live">
                    {calendarRows?.[ev.calId]?.length
                      ? <span dangerouslySetInnerHTML={{ __html: calendarLine(calendarRows[ev.calId]) }} />
                      : '⏳ sprawdzam wynik na żywo (biquote.io)…'}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2>Tło fundamentalne</h2>
        <p className="card-sub">Co realnie napędza cenę złota teraz</p>
        {FUNDAMENTAL_BACKGROUND.map((b, i) => (
          <p className="bg-para" key={i}><b>{b.title}</b> {b.text}</p>
        ))}
      </section>
      <section className="card">
        <h2>Z X (Twitter)</h2>
        <p className="card-sub">Wątki i nagłówki dotyczące złota widoczne ostatnio na X — banki, agencje, konta tradingowe.</p>
        <p className="update-stamp">Ostatnia aktualizacja tej sekcji: 8.09.2026 (ręczne odświeżenie)</p>
        <ul className="tl" style={{ marginTop: 10 }}>
          {X_POSTS.map((p, i) => (
            <li className="tl-item" key={i}>
              <div className="tl-when">{p.handle}</div>
              <div className="tl-body">
                <div className="tl-top"><span className="badge x">X</span></div>
                <div className="tl-title"><a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dashed var(--border)' }}>{p.title}</a></div>
                <div className="tl-note">{p.note}</div>
              </div>
            </li>
          ))}
        </ul>
        <p className="bg-para" style={{ marginTop: 14, fontSize: 12.5 }}>
          Ta sekcja nie odświeża się sama w przeglądarce — opublikowana strona z przyczyn bezpieczeństwa (CSP) nie może pobierać danych z x.com bezpośrednio. To, co widzisz, jest ręcznie odświeżaną migawką.
        </p>
      </section>
      <section className="card">
        <h2>Tło astrologiczne</h2>
        <p className="card-sub">Wolniejsze aspekty aktywne w tle (poza Księżycem)</p>
        {ASTRO_BACKGROUND.map((a, i) => (
          <p className="bg-para" key={i}><b>{a.title}</b> {a.sub} — {a.text}</p>
        ))}
      </section>
    </section>
  );
}
