# Al Falah District Dashboard

Resident survey dashboard for the Al Falah district (Abu Dhabi), comparing **2024** and **2025** data across nine pillars.

## Features

- **Overview tab** — overall satisfaction, pillar comparison, trends, and sentiment
- **Nine pillar tabs** — Income & Living, Work, Education, Security & Safety, Health, Environment, Infrastructure, Demographics, Housing
- **Universal view toggle** — switch every tab between **Current Year (2025)** and **YoY Change (2024→2025)**
- **Design** — matches the Foreign Trade Dashboard reference (KPI cards, charts, insights panel)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Data pipeline

Survey data is loaded from `public/data/survey-data.json`, built from the Excel CUBE file:

```bash
# Activate Python venv and rebuild data
python3 -m venv .venv
source .venv/bin/activate
pip install pandas openpyxl
npm run data:build
```

Set a custom Excel path:

```bash
AL_FALAH_EXCEL="/path/to/Al Falah_CUBE_Final.xlsx" npm run data:build
```

> **Note:** The attached demo Excel file contains the full survey structure but no numeric values yet. The dashboard uses deterministic demo values until real data is populated in the Excel file.

## Build for production

```bash
npm run build
npm run preview
```

## GitHub Pages

This project is configured to deploy automatically to GitHub Pages when changes are pushed to `main`.

**Live site:** [https://fatimasalem.github.io/Al-Falah-District-Dashboard/](https://fatimasalem.github.io/Al-Falah-District-Dashboard/)

### One-time GitHub setup

1. Open the repository on GitHub: [Al-Falah-District-Dashboard](https://github.com/fatimasalem/Al-Falah-District-Dashboard)
2. Go to **Settings → Pages**
3. Under **Build and deployment**, set **Source** to **GitHub Actions**

After the first successful workflow run on `main`, the site will be published at the URL above.

### How it works

- `vite.config.ts` sets the production base path to `/Al-Falah-District-Dashboard/` so assets load correctly on GitHub Pages
- `.github/workflows/deploy.yml` builds the app and publishes the `dist` folder on every push to `main`

## Project structure

```
src/
  components/     # Header, KPI cards, charts, tabs
  types.ts        # TypeScript interfaces
  utils.ts        # Data helpers & insights
scripts/
  build-data.py   # Excel → JSON converter
public/data/
  survey-data.json
```
