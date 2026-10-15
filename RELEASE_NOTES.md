# Release Notes — v0.1.0-alpha.1 (2026-10-15)

First public pre-release from the GitHub repository. Version numbering restarts at 0.1.0; the v1.x entries further down are the private pre-GitHub history and are kept for reference. Expect breaking changes before 1.0.

## Changes

### Claude Haiku 5.5
- All Claude features (listing import, investment analysis, market analysis) now default to `claude-haiku-5-5`. `CLAUDE_MODEL` still overrides it, and must name a model that supports the effort parameter.
- Responses are read by content type, so a leading thinking block no longer parses as an empty answer.
- A safety refusal from the model now returns a clear 422 error instead of a JSON parse error, and truncated responses are detected on every Claude route.

### Tailwind CSS 4
- The frontend moved to Tailwind CSS 4 with the `@tailwindcss/vite` plugin. The look is unchanged apart from small spacing differences in forms; `npm audit` reports no advisories.

### Local development
- `.env` is now loaded by the server, the database scripts and `drizzle.config.ts`. Real environment variables keep precedence.

## Bug Fixes

- `npm run dev` no longer exits at startup when resolving the migrations folder.
- The server now starts on macOS (removed the Linux-only `reusePort` listen option).

---

# Pre-release history (private, before the public repository)

# Release Notes — v1.4.0 (2026-03-15)

## New Features

### AI Market Analysis — Dedicated Tab
- Market analysis has been moved from a collapsible panel below the form into its own **Market** tab in the property form, alongside Basic Info, Purchase & Loan, Income & Costs, and Details.
- For new (unsaved) properties, the tab shows a prompt to save first before running analysis.
- The legacy market comparison panel (non-Claude deployments) is also housed in this tab, removing the separate show/hide toggle.

### AI Market Analysis — Rental Price Assessment
- The AI market analysis now includes a **rent analysis paragraph** alongside the existing asking price assessment.
- The paragraph evaluates whether the listed/target monthly rent is achievable and competitive, referencing typical rent per m² for the property's city and district.

### AI Market Analysis — Richer Prompt & Listing Scraping
- Redesigned AI prompt with a more detailed property context, recommended offer range (low/mid/high), and optional scraping of the listing page URL for additional context.

### Stock Market Comparison
- Added a stock market comparison panel to the sensitivity analysis, benchmarking property returns against index fund alternatives.

### Two-Parameter Sensitivity Analysis
- Added a two-parameter sensitivity heatmap to the property details tab, showing return outcomes across combinations of two variables simultaneously.

### Clickable Property Names on Dashboard
- Property names on the dashboard are now clickable and open directly to the property's analysis view.

## Bug Fixes

### Rent Import Error
- Fixed missing `rentPerMonth` and `downPayment` fields that caused an error when importing a property from a listing URL.

### Market Analysis Column Reliability
- Guaranteed the `market_analysis` database column is created on every startup, preventing missing-column errors after fresh deploys.

---

# Release Notes — v1.3.0 (2026-03-10)

## New Features

### CLAUDE_FEATURES Flag
- Set `CLAUDE_FEATURES=false` to disable the **Import from listing URL** and **AI Investment Analysis** features for deployments without Claude API access.
- When the flag is off, both buttons are hidden from the UI entirely — no error messages shown to users.

### Dev Environment Password Gate
- When running with `DEV_MODE=true`, set `DEV_PASSWORD` to protect the staging environment with a password prompt before granting access.
- The password is hashed (scrypt) and stored in the database — it can be changed from **Settings → Dev Environment Password** without redeploying.
- On first startup, the env var seeds the database; after that the env var can be removed.

## Infrastructure

### Replit Migration Complete
- Removed all Replit-specific files (`.replit`, `replit.md`, Replit Vite plugins, `attached_assets/`).
- Project is now fully self-contained on Railway.

---

# Release Notes — v1.2.0 (2026-03-09)

## Dashboard UX Improvements

### New: Property Cards Section
- Renamed the "Projects" section in the dashboard to **"Property Cards"** for clearer terminology.

### New: Project Detail Page
- Added a dedicated `/projects/:id` page with full property card management for individual projects.
- Property cards are expanded by default on the detail page for immediate visibility.

### Dashboard Layout Reorganization
- Updated the default section order in the dashboard for a more logical flow.
- The "Property Cards" section now groups properties by project in a flat, scannable layout.

### Collapsible "Best Property by Scenario" Card
- The **Best Property by Scenario** table in the Sensitivity Analysis section is now collapsible.
- It starts **collapsed by default** to reduce visual clutter — click the header to expand.

## Bug Fixes & Calculation Improvements

### Rental Loss Carry-Forward Applied to Capital Gains Tax
- Accumulated rental losses are now correctly carried forward and deducted from the capital gains tax base on property sale, resulting in more accurate tax calculations.
