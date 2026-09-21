// Everything here was hardcoded in the original HTML too (a snapshot taken
// 8.09.2026) — it is not live data. Swap for a real feed/CMS when you have
// one; until then this keeps the Research tab and the 52-week ticker working.

export const RAW_90D = [["2026-06-11",4211.07514],["2026-06-12",4217.96336],["2026-06-13",4215.38604],["2026-06-14",4215.36946],["2026-06-15",4309.42435],["2026-06-16",4331.36946],["2026-06-17",4258.07298],["2026-06-18",4209.12291],["2026-06-19",4156.6112],["2026-06-20",4156.51085],["2026-06-21",4156.5162],["2026-06-22",4191.78368],["2026-06-23",4110.44546],["2026-06-24",4001.11524],["2026-06-25",4026.44634],["2026-06-26",4088.92554],["2026-06-27",4080.81341],["2026-06-28",4080.80878],["2026-06-29",4016.52691],["2026-06-30",4007.70422],["2026-07-01",4031.56804],["2026-07-02",4123.87904],["2026-07-03",4174.93638],["2026-07-04",4174.94111],["2026-07-05",4175.01112],["2026-07-06",4165.12051],["2026-07-07",4106.14352],["2026-07-08",4077.27796],["2026-07-09",4123.6425],["2026-07-10",4119.32483],["2026-07-11",4111.53243],["2026-07-12",4111.53882],["2026-07-13",4001.23284],["2026-07-14",4052.83213],["2026-07-15",4060.42611],["2026-07-16",3976.78276],["2026-07-17",4016.97584],["2026-07-18",4010.60888],["2026-07-19",4010.6058],["2026-07-20",4008.3034],["2026-07-21",4077.82773],["2026-07-22",4130.28998],["2026-07-23",4049.51576],["2026-07-24",4053.47211],["2026-07-25",4056.01128],["2026-07-26",4056.01212],["2026-07-27",4076.96247],["2026-07-28",4028.58082],["2026-07-29",4066.93415],["2026-07-30",4103.49754],["2026-07-31",4045.25141],["2026-08-01",4042.74098],["2026-08-02",4042.7451],["2026-08-03",4055.3131],["2026-08-04",4077.39577],["2026-08-05",4246.99711],["2026-08-06",4240.8196],["2026-08-07",4342.63347],["2026-08-08",4342.23668],["2026-08-09",4342.18657],["2026-08-10",4389.993],["2026-08-11",4367.71611],["2026-08-12",4409.04752],["2026-08-13",4351.17522],["2026-08-14",4376.56187],["2026-08-15",4375.58712],["2026-08-16",4375.54686],["2026-08-17",4416.62725],["2026-08-18",4335.67938],["2026-08-19",4523.24519],["2026-08-20",4519.34377],["2026-08-21",4603.92129],["2026-08-22",4608.1496],["2026-08-23",4603.69568],["2026-08-24",4652.16852],["2026-08-25",4658.63733],["2026-08-26",4594.48089],["2026-08-27",4601.5152],["2026-08-28",4456.44061],["2026-08-29",4458.88083],["2026-08-30",4456.19301],["2026-08-31",4448.80126],["2026-09-01",4328.57714],["2026-09-02",4387.76527],["2026-09-03",4473.78645],["2026-09-04",4430.05647],["2026-09-05",4429.02694],["2026-09-06",4429.01202],["2026-09-07",4405.18434],["2026-09-08",4405.1561]];

export const LOW_52W = 3588.12;
export const HIGH_52W = 5597.23;

// Fallback OHLC (ascending) shown before the first live fetch resolves.
export const TF_DAILY_SEED = [
  ["08-28",4601.25,4637.17,4444.64,4456.44],["08-29",4456.35,4459.02,4453.52,4458.88],
  ["08-30",4458.78,4459.54,4455.53,4456.19],["08-31",4456.16,4470.87,4400.10,4448.80],
  ["09-01",4448.66,4462.06,4323.34,4328.58],["09-02",4328.63,4396.18,4283.21,4387.77],
  ["09-03",4388.00,4510.60,4381.93,4473.79],["09-04",4473.54,4514.11,4368.53,4430.06],
  ["09-05",4430.11,4430.40,4428.87,4429.03],["09-06",4428.95,4430.07,4428.81,4429.01],
  ["09-07",4428.94,4434.89,4382.51,4405.18],["09-08",4405.05,4405.35,4405.02,4405.16],
];

// Birth-date digit sums used by the numerology card (11 June).
export const NUMEROLOGY_BIRTH = { daySum: 2, monthSum: 6, lifePathFixed: 11 };

export const PLANET_POSITIONS = [
  { planet: 'Neptun', longitude: '3°', sign: 'Baran' },
  { planet: 'Saturn', longitude: '13°', sign: 'Baran' },
  { planet: 'Uran', longitude: '5°', sign: 'Bliźnięta' },
  { planet: 'Mars', longitude: '17°', sign: 'Rak' },
  { planet: 'Jowisz', longitude: '15°', sign: 'Lew' },
  { planet: 'Słońce', longitude: '15°', sign: 'Panna' },
  { planet: 'Merkury', longitude: '25°', sign: 'Panna' },
  { planet: 'Wenus', longitude: '28°', sign: 'Waga' },
  { planet: 'Pluton', longitude: '3°', sign: 'Wodnik' },
];

export const CALENDAR_MATCHES = {
  ppi: { names: ['PPI m/m'] },
  cpi: { names: ['CPI m/m', 'CPI y/y'] },
  retail: { names: ['Retail Sales m/m'] },
  fomc: { names: ['Fed Interest Rate Decision'] },
  jolts: { names: ['JOLTS Job Openings'] },
  pce: { names: ['Core PCE Price Index m/m'] },
  gdp: { names: ['GDP q/q'] },
};

export const TIMELINE_EVENTS = [
  { date: '2 wrz', day: 'Śr', badge: 'news', title: 'ADP — zmiana zatrudnienia (sie.)', time: '14:15', note: 'Wynik: +38 tys. (prognoza: +48 tys.) — wyraźny niedobitek prognozy przed CPI i FOMC.', major: true },
  { date: '8 wrz', day: 'Wt', badge: 'astro', title: 'Księżyc koniunkcja Jowisz (Lew)', time: '~21:00–22:00', note: 'Główny aspekt dnia: skok optymizmu i podatność na przesadzone ruchy ceny.', major: true },
  { date: '9 wrz', day: 'Śr', badge: 'astro', title: 'Księżyc sekstyl Wenus, wejście w Pannę', time: '20:57 / 21:35', note: 'Nastrój się uspokaja, bardziej analityczna faza Księżyca.' },
  { date: '10 wrz', day: 'Czw', badge: 'gann', title: 'Ingres: Merkury → Waga i Wenus → Skorpion', time: '~10:06 / 18:20', note: 'Dwie planety zmieniają znak tego samego dnia — najsilniejszy typ sygnału w tej metodzie.', major: true },
  { date: '10 wrz', day: 'Czw', badge: 'news', title: 'PPI — inflacja producencka (sie.)', time: '~14:30', note: 'Wczesny sygnał presji cenowej przed CPI.', calId: 'ppi' },
  { date: '11 wrz', day: 'Pt', badge: 'astro', title: 'Księżyc sekstyl Mars (Panna)', time: '07:52', note: 'Sprzyja zdecydowanym, kontrolowanym ruchom.' },
  { date: '11 wrz', day: 'Pt', badge: 'gann', title: 'Księżyc przecina 0° deklinacji', time: '~14:00', note: 'Razem z wczorajszym ingresem najgęstszy sygnałowo klaster miesiąca.', major: true },
  { date: '11 wrz', day: 'Pt', badge: 'news', title: 'CPI — inflacja konsumencka (sie.)', time: '~14:30', note: 'Duży potencjał zmienności na złocie.', major: true, calId: 'cpi' },
  { date: '16 wrz', day: 'Śr', badge: 'news', title: 'Decyzja FOMC w sprawie stóp procentowych', time: '~20:00', note: 'Najważniejsze wydarzenie miesiąca dla złota.', major: true, calId: 'fomc' },
  { date: '23 wrz', day: 'Śr', badge: 'gann', title: 'Ingres: Słońce → Waga (równonoc jesienna)', time: '~02:05', note: 'Równonoce to jedne z częściej cytowanych dat zwrotnych u Ganna.' },
  { date: '29 wrz', day: 'Wt', badge: 'news', title: 'JOLTS — oferty pracy (sie.)', time: '~16:00', note: 'Kolejny odczyt rynku pracy przed PCE.', calId: 'jolts' },
  { date: '30 wrz', day: 'Śr', badge: 'gann', title: 'Ingres: Merkury → Skorpion', time: '~13:44', note: 'Zbiega się z PCE i PKB tego samego dnia.', major: true },
  { date: '30 wrz', day: 'Śr', badge: 'news', title: 'PCE — preferowana miara inflacji Fed', time: '~14:30', note: 'Ostatni duży odczyt inflacyjny miesiąca.', major: true, calId: 'pce' },
  { date: '30 wrz', day: 'Śr', badge: 'news', title: 'PKB USA — trzeci odczyt (Q2)', time: '~14:30', note: 'Zwykle mniejszy wpływ niż PCE.', calId: 'gdp' },
];

export const X_POSTS = [
  { handle: '@ReutersBiz', title: 'BofA podnosi prognozę złota na koniec 2026 do $5000/oz, srebra do $65', note: 'Kolejny duży bank podbija długoterminowy target — wspiera narrację strukturalnej hossy.', url: 'https://x.com/ReutersBiz/status/1977698394081464646' },
  { handle: '@ReutersBiz', title: 'Goldman Sachs podnosi prognozę złota na koniec 2026', note: 'GS dołącza do grona banków rewidujących cele w górę.', url: 'https://x.com/ReutersBiz/status/2014273151538954270' },
  { handle: '@Reuters', title: 'Złoto zmierza do tygodniowej straty — presja inflacyjna napędzana ropą', note: 'Geopolityka (USA–Chiny) i ceny ropy jako aktualny czynnik ryzyka.', url: 'https://x.com/Reuters/status/2055166440915767635' },
  { handle: '@FXStreetNews', title: 'Kluczowe poziomy na dziś FOMC: dovish hold → $4 250, jastrzębi Fed → $3 950', note: 'Konkretne poziomy techniczne powiązane ze scenariuszami decyzji Fed.', url: 'https://x.com/FXStreetNews/status/2082392666357063860' },
];

export const FUNDAMENTAL_BACKGROUND = [
  { title: 'Jastrzębi Fed.', text: 'Prezes Warsh sygnalizuje, że „jest jeszcze robota do zrobienia" przy inflacji — rynek wycenia rosnące szanse na podwyżkę stóp, co działa na złoto jako przeciwwaga.' },
  { title: 'Napięcia na Bliskim Wschodzie.', text: 'Eskalacja konfliktu z udziałem Iranu podbija ceny energii i oczekiwania inflacyjne — wspiera popyt na złoto jako zabezpieczenie.' },
  { title: 'Popyt banków centralnych.', text: 'Banki centralne Azji i Bliskiego Wschodu kontynuują dywersyfikację rezerw w stronę fizycznego złota.' },
  { title: 'Krzywa rentowności i dolar.', text: 'Dynamika rentowności długoterminowych obligacji USA sygnalizuje ryzyko osłabienia dolara w dłuższym terminie.' },
];

export const ASTRO_BACKGROUND = [
  { title: 'Jowisz trygon Saturn', sub: '(Lew–Baran, orb ~2°)', text: 'ekspansja wspierana strukturą; sprzyja stabilnemu budowaniu wartości niż spekulacyjnym skokom.' },
  { title: 'Mars kwadratura Saturn', sub: '(Rak–Baran)', text: 'aspekt opadający, szczyt napięcia minął; echo oporu przy próbach kontynuacji ruchu wciąż odczuwalne.' },
  { title: 'Saturn koniunkcja Neptun', sub: '(Baran, orb szeroki)', text: 'napięcie dyscyplina/rzeczywistość vs. iluzja; w astrologii mundialnej łączone z niepewnością monetarną.' },
  { title: 'Wenus kwadratura Pluton', sub: '(Waga–Wodnik)', text: 'napięcie wokół wyceny i wartości, możliwe gwałtowne przewartościowania.' },
];
