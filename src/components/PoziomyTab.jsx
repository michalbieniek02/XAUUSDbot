import MiniChartGrid from './MiniChartGrid';
import { Ticker, Chip } from './Bars';

function priceVsLevel(price, level) {
  const d = price - level;
  return (d >= 0 ? '+' : '') + d.toFixed(2) + '$ (' + (d >= 0 ? 'powyżej' : 'poniżej') + ')';
}

export default function PoziomyTab({ lastPdhPdl, lastAsianRange, lastVwap, lastOrb, lastMidPrice, seriesRows }) {
  const price = lastMidPrice;
  return (
    <section className="tabpanel" data-tab="poziomy">
      <section className="card">
        <h2>Poziomy referencyjne — PDH/PDL, Asian Range, VWAP, NY Opening Range</h2>
        <p className="card-sub">Godziny w UTC: sesja azjatycka 00:00–09:00, otwarcie NY 13:30–13:45. Wyłącznie informacyjne.</p>
        <div className="tf-grid">
          <div className="tf-card">
            <h3>PDH / PDL</h3>
            {lastPdhPdl && price != null ? (
              <>
                <Ticker>
                  <Chip k="PDH" v={'$' + lastPdhPdl.pdh.toFixed(2)} />
                  <Chip k="PDL" v={'$' + lastPdhPdl.pdl.toFixed(2)} />
                </Ticker>
                <p className="card-sub" style={{ marginTop: 12 }}>
                  Cena: ${price.toFixed(2)} &nbsp;·&nbsp; do PDH: {priceVsLevel(price, lastPdhPdl.pdh)} &nbsp;·&nbsp; do PDL: {priceVsLevel(price, lastPdhPdl.pdl)}
                </p>
              </>
            ) : <p className="card-sub">Liczę z danych dziennych (biquote.io)…</p>}
          </div>
          <div className="tf-card">
            <h3>Asian Range{lastAsianRange?.isLive ? ' — na żywo' : ''}</h3>
            {lastAsianRange && price != null ? (
              <>
                <Ticker>
                  <Chip k="Asian High" v={'$' + lastAsianRange.hi.toFixed(2)} />
                  <Chip k="Asian Low" v={'$' + lastAsianRange.lo.toFixed(2)} />
                </Ticker>
                <p className="card-sub" style={{ marginTop: 12 }}>
                  Cena: ${price.toFixed(2)} &nbsp;·&nbsp; do High: {priceVsLevel(price, lastAsianRange.hi)} &nbsp;·&nbsp; do Low: {priceVsLevel(price, lastAsianRange.lo)}
                </p>
              </>
            ) : <p className="card-sub">Sesja azjatycka jeszcze się nie otworzyła (start 00:00 UTC).</p>}
          </div>
          <div className="tf-card">
            <h3>VWAP (dziś, tick-volume)</h3>
            {lastVwap != null && price != null ? (
              <>
                <Ticker><Chip k="VWAP (od 00:00 UTC, tick-volume)" v={'$' + lastVwap.toFixed(2)} /></Ticker>
                <p className="card-sub" style={{ marginTop: 12 }}>Cena: ${price.toFixed(2)} &nbsp;·&nbsp; {priceVsLevel(price, lastVwap)} względem VWAP</p>
                <p className="card-sub" style={{ marginTop: 6, fontSize: 11.5 }}>Liczony z tick-volume świec M15 — XAUUSD u brokera detalicznego nie ma realnego wolumenu giełdowego. Przyzwoity proxy aktywności, ale to nie jest VWAP z wolumenu obrotu.</p>
              </>
            ) : <p className="card-sub">Liczę z danych M15 (biquote.io)…</p>}
          </div>
          <div className="tf-card">
            <h3>NY Opening Range</h3>
            {lastOrb && price != null ? (
              <>
                <Ticker>
                  <Chip k="NY ORB High" v={'$' + lastOrb.hi.toFixed(2)} />
                  <Chip k="NY ORB Low" v={'$' + lastOrb.lo.toFixed(2)} />
                </Ticker>
                <p className="card-sub" style={{ marginTop: 12 }}>
                  Cena: ${price.toFixed(2)} &nbsp;·&nbsp; do High: {priceVsLevel(price, lastOrb.hi)} &nbsp;·&nbsp; do Low: {priceVsLevel(price, lastOrb.lo)}
                </p>
              </>
            ) : <p className="card-sub">Liczę z danych M15 (biquote.io)…</p>}
          </div>
        </div>
      </section>
      <section className="card">
        <h2>Struktura ceny w interwałach</h2>
        <p className="card-sub">Ostatnie odczyty — dane biquote.io (feed MetaTrader 5), świece OHLC aktualizowane na żywo.</p>
        <MiniChartGrid seriesRows={seriesRows} />
      </section>
    </section>
  );
}
