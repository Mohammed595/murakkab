# مُركب (Murakkab) — Arabic Investment Simulator

A self-contained, single-page Arabic-language interactive finance app that simulates real investment scenarios (S&P 500 total-return history, DCA strategies, dividends) through a mobile-style UI.

## How to run

The app is a single HTML file served by Python's built-in HTTP server:

```
python3 -m http.server 5000
```

Open the preview at port 5000. No build step, no dependencies, no backend required.

## File structure

- `index.html` — the entire app (HTML + CSS + JS, self-contained)
- `murakkab-index.html` — original uploaded file (same content)
- `zipFile.zip` — original zip upload

## Stack

- Pure HTML/CSS/JavaScript — no frameworks, no npm
- Arabic RTL layout with Google Fonts (Noto Kufi Arabic, Readex Pro)
- All data and logic embedded inline

## User preferences

_None recorded yet._
