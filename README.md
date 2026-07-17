# مُركب (Murakkab) — تعلّم الاستثمار بالتجربة

**🔗 Try it live → [murakkab.replit.app](https://murakkab.replit.app/)**

> An interactive Arabic-language investment simulator built with React. Live historical Saudi market scenarios, a DCA bot named Salem, and a personalised AI coach — all in a mobile-first phone frame.

---

## What is this?

مُركب is a financial literacy game disguised as a mobile app. Players relive real Saudi market events (the COVID-19 crash, the 2006 bubble), make buy/sell decisions under pressure, then compare results against **Salem** — a disciplined DCA bot who never sells.

The goal is not to win. It's to *feel* loss-aversion, panic selling, and the quiet power of doing nothing — then discuss it with an in-app coach.

---

## Features

| Feature | Description |
|---|---|
| 📈 Accurate simulation | Month-by-month TASI price data with dividend reinvestment |
| 🤖 Salem bot | Buy-and-hold benchmark that automatically DCA-invests every month |
| 🎯 Goal tracking | Personal goals (wedding fund, house deposit) with pace indicators |
| 💬 Event system | Real news flash at key market moments with forced decision points |
| 🎲 Hidden window | Mystery 18-month period — play it, then guess the era |
| 🧠 Coach (AI-style) | Classifies your play style and streams personalised feedback |
| 🎬 Review screen | Counterfactual replay of your 3 key decisions |
| 📊 Sandbox calculator | "What if I'd invested since graduation?" — S&P 500 real returns |
| ⭐ Stars + unlock system | Discipline scoring unlocks advanced features (partial sells, DCA control) |
| 🏆 Confetti | Fired when you beat Salem or earn 3 stars |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | **React 18** via Vite |
| Language | JavaScript (JSX) |
| Styling | Plain CSS custom properties — no UI library |
| Charts | HTML5 Canvas (hand-drawn, no chart library) |
| State | `useState` + `useMemo` in App.jsx — no external state manager |
| Persistence | `localStorage` for progress + unlocks |
| Fonts | Google Fonts — Noto Kufi Arabic, Readex Pro |

---

## Architecture — feature-first

```
src/
├── shared/
│   ├── data/
│   │   ├── chapters.js        # TASI scenario data (prices, events, Salem dialogue)
│   │   └── spData.js          # S&P 500 annual returns 1995–2025
│   └── utils/
│       ├── simulate.js        # Pure simulation engine (no side-effects)
│       └── format.js          # fmt(), AR_MONTHS, monthLabel()
│
├── features/
│   ├── home/
│   │   ├── HomeScreen.jsx     # Chapter list, progress ring, sandbox entry
│   │   └── ProgressRing.jsx   # SVG ring showing completed chapters
│   ├── intro/
│   │   └── IntroScreen.jsx    # Persona card before each chapter
│   ├── predict/
│   │   └── PredictScreen.jsx  # Slider: guess your final portfolio value
│   ├── play/
│   │   ├── PlayScreen.jsx     # Main game screen — HUD, overlays, sheets
│   │   ├── Chart.jsx          # Canvas chart (you vs Salem, fork ghosts)
│   │   ├── GoalBar.jsx        # Progress bar toward personal goal
│   │   └── usePlayEngine.js   # Timer hook — drives the simulation tick loop
│   ├── review/
│   │   ├── ReviewScreen.jsx   # Post-game decision replay with counterfactuals
│   │   └── ReviewChart.jsx    # Mini canvas chart with action pins
│   ├── coach/
│   │   ├── CoachScreen.jsx    # Streaming chat coach with reply buttons
│   │   └── coachData.js       # Classifier + all coach dialogue trees
│   └── sandbox/
│       ├── SandboxScreen.jsx  # "What if" S&P 500 calculator
│       └── SandboxChart.jsx   # Canvas chart: portfolio growth vs deposits
│
├── App.jsx                    # Root: game state, navigation, sim memoisation
├── main.jsx                   # React entry point
└── index.css                  # All styles — CSS custom properties, RTL
```

### Key design rules

- **Shared = pure.** `shared/utils/simulate.js` has zero side-effects. Given the same inputs it always returns the same output — easy to test, easy to reason about.
- **Features own their UI state.** `PlayScreen` owns overlays, sheets, speed, and paused state. `App.jsx` owns the session (scen, m, actions) and re-computes `sim` with `useMemo`.
- **No router.** Screen changes are state (`screen` string). All screens mount simultaneously — only the active one has `opacity:1 / pointer-events:auto`. This mirrors the original CSS transition behaviour.
- **Canvas is imperative.** `Chart.jsx`, `ReviewChart.jsx`, and `SandboxChart.jsx` call `draw()` on every render (no `useEffect` with deps). The canvas is inherently imperative; fighting it with deps arrays causes flicker.

---

## Simulation engine

`shared/utils/simulate(scen, actions, upto)` runs a month-by-month loop:

```
for each month i (1 → upto):
  1. Apply dividend reinvestment (units × (1 + divM))
  2. Salem always DCA-buys (salary / price units)
  3. Player DCA-buys if autoD = true
  4. Apply any player actions at month i (sell, invest, dcaOff, dcaOn)
  5. Record hist[i] = { total, salem, invVal, cash, units, avgCost }
```

Returns `{ hist, receipts, outMonths, dcaOff, final, salemFinal, autoD }`.

---

## Running locally

```bash
cd murakkab
npm install
npm run dev        # dev server on :5000
npm run build      # production build → dist/
```

---

## Data sources

- **TASI prices** — anchored to real historical values (peak 20,635 Feb-06; COVID low ~6,505 Mar-20). Monthly interpolated — swap with Tadawul export for exact values.
- **Dividends** — ~3.3%/yr overlay (divM = 0.0027/month), reinvested as additional units.
- **S&P 500** — approximate annual total-return data 1995–2025.

---

## Disclaimer

للتوعية فقط — مو نصيحة استثمارية. كل الأرصدة افتراضية.  
*For financial literacy only — not investment advice. All balances are virtual.*
