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

This project deploys automatically when changes are pushed to `main`.

**Live site:** [https://fatimasalem.github.io/Al-Falah-District-Dashboard/](https://fatimasalem.github.io/Al-Falah-District-Dashboard/)

### One-time GitHub setup (required)

The site will stay blank until Pages is pointed at the **built** output, not the raw source on `main`.

1. Open the repository on GitHub: [Al-Falah-District-Dashboard](https://github.com/fatimasalem/Al-Falah-District-Dashboard)
2. Go to **Settings → Pages**
3. Under **Build and deployment → Source**, choose **Deploy from a branch**
4. Set **Branch** to **`gh-pages`** and folder to **`/ (root)`**, then click **Save**
5. Push to `main` (or re-run **Deploy to GitHub Pages** under **Actions**) and wait for the workflow to finish

After the first successful deploy, the `gh-pages` branch will contain the production build and the live URL above should load correctly.

### How it works

- `vite.config.ts` sets the production base path to `/Al-Falah-District-Dashboard/` so assets load correctly on GitHub Pages
- `.github/workflows/deploy.yml` runs `npm run build` and publishes the `dist` folder to the `gh-pages` branch on every push to `main`

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
