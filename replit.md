# مُركب (Murakkab) — Arabic Investment Simulator

An interactive Arabic-language investment simulator built with **React + Vite**.

## How to run

```bash
cd murakkab && npm run dev   # dev server on port 5000
cd murakkab && npm run build # production build → murakkab/dist/
```

The workflow "Start application" runs `cd murakkab && npm run dev` automatically.

## Project layout

```
murakkab/           ← React + Vite app
  src/
    shared/
      data/         chapters.js  spData.js
      utils/        simulate.js  format.js
    features/
      home/         HomeScreen  ProgressRing
      intro/        IntroScreen
      predict/      PredictScreen
      play/         PlayScreen  Chart  GoalBar  usePlayEngine
      review/       ReviewScreen  ReviewChart
      coach/        CoachScreen  coachData
      sandbox/      SandboxScreen  SandboxChart
    App.jsx         root state + navigation
    main.jsx
    index.css
  index.html
  vite.config.js
index.html          ← original single-file version (reference)
murakkab-index.html ← original upload
README.md           ← full technical documentation
```

## Architecture

- **Feature-first** folder structure under `src/features/`
- **No router** — screen is a state string; all screens mount simultaneously, toggled by CSS `opacity`
- **Pure simulation** — `shared/utils/simulate.js` has zero side-effects; same input → same output
- **App.jsx** owns game session (scen, m, actions) and memoises `sim` with `useMemo`
- **Canvas charts** drawn imperatively on every render (no effect deps)

## Deployment

Configured as a **static** deployment:
- Build: `cd murakkab && npm run build`
- Public dir: `murakkab/dist`

## User preferences

_None recorded yet._
