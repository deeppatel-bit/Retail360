# Retail360 UI

Frontend for a small inventory/point-of-sale UI built with React, Tailwind CSS and Vite.

Repository: https://github.com/deeppatel-bit/SmartStore.git

Quick description
- Simple single-page app that manages products, purchases, and sales.
- Uses browser `localStorage` for persistence (no backend required).

Getting started (local)

1. Install dependencies

```powershell
npm install
```

2. Start dev server

```powershell
npm run dev
```

3. Build for production

```powershell
npm run build
```

Git / GitHub notes
- Make sure `node_modules` is ignored by Git (this repo includes a root `.gitignore`).
- If `node_modules` was already committed, remove it from the index:

```powershell
git rm -r --cached node_modules
git commit -m "Remove node_modules from repository"
git push origin main
```

- To add the remote and push for the first time (replace `main` with your branch if different):

```powershell
git remote add origin https://github.com/deeppatel-bit/SmartStore.git
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

If you accidentally committed large files in history and need to remove them completely, consider using the [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) or `git filter-branch` (advanced; make a backup first).

Issues & contributions
- Open issues or PRs on GitHub. If you want me to help add CI, tests, or move state into a backend, tell me which feature to add.

License
- Add license text here if you want to publish the repo publicly.

# SmartStore UI ()

This package contains a ready Vite + React + Tailwind setup **without App.jsx**.
Drop your `App.jsx` (the full UI file you have) into `src/` and then run these commands:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Open the URL shown by Vite (usually http://localhost:5000 or next port).

Notes:
- `src/index.css` already includes Tailwind directives and a couple of small helper utilities.
- `tailwind.config.js` and `postcss.config.js` are pre-configured for Tailwind v4 usage with Vite.
- If you get "tailwindcss PostCSS plugin" errors, run:
  ```bash
  npm install @tailwindcss/postcss --save-dev
  ```
- If you paste your App.jsx file, ensure it imports Tailwind classes and the file path is `src/App.jsx`.
