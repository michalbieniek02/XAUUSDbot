# XAU/USD Terminal — wersja React

Konwersja oryginalnego pojedynczego pliku HTML (vanilla JS + ręczne
manipulacje DOM) na aplikację React (Vite). Struktura:

```
src/
  App.jsx                 – stan globalny, wszystkie pollery (biquote.io,
                             kalendarz, backend), silnik sygnału H1→M15→M5
  index.css                – PUSTE — tu wklej swój CSS (patrz komentarz w pliku)
  lib/
    engine.js              – czyste funkcje: EMA, ATR, struktura HH/HL/LH/LL,
                              CHOCH, scoring, PnL, FTMO — bez zależności od React
    api.js                 – fetch do biquote.io / backendu
    staticData.js           – dane statyczne z oryginału (90-dniowa historia,
                              kalendarz, X posty, pozycje planet)
  components/
    CandleChart.jsx         – wykres świecowy SVG (zastępuje drawCandles())
    SignalCard.jsx           – karta sygnału (Poziom 1 decyzji)
    Bars.jsx                 – Chip/Ticker/CtxCell/GuardMeter (drobne elementy)
    EngineDetails.jsx        – boksy H1/M15/M5, reżim dnia, siatka MTF
    MiniChartGrid.jsx        – siatka 6 interwałów (Poziomy + Terminal)
    HistoriaTab.jsx, PoziomyTab.jsx, KalendarzTab.jsx, ResearchTab.jsx,
    DziennikTab.jsx          – zakładki
```

Wszystkie `className`/`id` są 1:1 z oryginałem, więc Twój CSS powinien
zadziałać bez zmian selektorów — patrz `src/index.css`.

## Uruchomienie

```
npm install
npm run dev
```

## Co jest uproszczone względem oryginału (celowo, żeby nie rozdmuchać pliku)

- **Throttling przy ukrytej karcie** (`document.hidden`, spowalnianie pollingu
  gdy karta w tle) — pominięte. Można dodać `document.visibilitychange` +
  licznik w `App.jsx`, analogicznie do `skipWhileHidden()` z oryginału.
- **Świeżość feedu per-źródło** (`freshness.tick/h1/m15/m5` z osobnymi
  znacznikami czasu i progami 45s/180s) — zredukowana do jednego
  `overallFreshness` opartego o to, czy `price` jest ustawione. Jeśli
  zależy Ci na dokładnym odwzorowaniu logiki fail-closed z oryginału,
  dodaj `useRef` ze znacznikami czasu per-feed i policz `overallFreshness`
  tak jak w starym `feedAge()/overallFreshness()`.
- **Epoch/race-guard przy przełączaniu symbolu** — uproszczone do
  `symbolRef.current !== sym` (sprawdzenie po każdym fetchu), zamiast
  osobnego licznika `symbolEpoch` z oryginału. Efekt end-user jest ten sam:
  odpowiedzi z poprzedniego instrumentu są odrzucane.
- **X (Twitter) feed** i **kalendarz wydarzeń astro/Gann** — dane statyczne
  jak w oryginale (nie były tam "żywe" — ręcznie aktualizowana migawka).
- **Backend history sync** (`/api/history`) — wywoływany tak jak w oryginale;
  jeśli backend nie jest wdrożony pod tym samym originem, po prostu cicho
  się nie powiedzie (fetch do relative URL `/api/history`), dokładnie jak
  w oryginale.

## Do zrobienia po Twojej stronie

1. Wklej CSS do `src/index.css` (masz tam dokładny opis co sprawdzić:
   zmienne `--good`/`--bad`/`--violet` itd. używane też bezpośrednio w JS
   przy liniach poziomów na wykresie).
2. Jeśli backend `/api/history` żyje pod innym originem niż front — zmień
   URL w `src/lib/api.js` → `fetchBackendHistory()`.
