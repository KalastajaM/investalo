export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  sections: {
    heading: string;
    items: string[];
  }[];
}

export const releases: ReleaseNote[] = [
  {
    version: "1.3.0",
    date: "2026-03-10",
    title: "Claude Feature Flag & Dev Environment Protection",
    sections: [
      {
        heading: "New Features",
        items: [
          "CLAUDE_FEATURES=false environment variable: disables the 'Import from listing URL' and 'AI Investment Analysis' features for deployments without Claude API access — both buttons are hidden from the UI when the flag is off",
          "Dev environment password gate: when running with DEV_MODE=true, set DEV_PASSWORD to protect the staging environment with a password prompt; the password is hashed and stored in the database so it can be changed from Settings without redeploying",
        ],
      },
      {
        heading: "Infrastructure",
        items: [
          "Removed Replit-specific files (.replit, replit.md, Replit Vite plugins, unused attached_assets folder) — project is fully self-contained on Railway",
        ],
      },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-03-09",
    title: "Dashboard UX & Project Detail Page",
    sections: [
      {
        heading: "New Features",
        items: [
          "Project Detail page (/projects/:id) — manage and view all property cards for an individual project in one place; cards are expanded by default for immediate visibility",
          "Dashboard 'Projects' section renamed to 'Property Cards' for clearer terminology",
          "Properties in the dashboard are now grouped by project in a flat, scannable layout",
          "Best Property by Scenario table in Sensitivity Analysis is now collapsible (collapsed by default to reduce visual clutter)",
          "Updated default dashboard section order for a more logical flow",
        ],
      },
      {
        heading: "Bug Fixes",
        items: [
          "Rental loss carry-forward now correctly deducted from the capital gains tax base on property sale, resulting in more accurate tax calculations",
        ],
      },
    ],
  },
  {
    version: "1.1.1",
    date: "2026-03-08",
    title: "Simulation Accuracy Fixes",
    sections: [
      {
        heading: "Bug Fixes",
        items: [
          "Water fee double-counting removed — water was incorrectly added as extra income on top of rent while also being charged as an expense in maintenance, inflating cash flow by ~€287/yr",
          "Monthly Cash Flow card now shows vacancy-adjusted rental income instead of gross potential rent",
          "Capital gains tax now correctly applied when cashing out the stock market alternative investment at end of simulation",
          "Stock market comparison: corrected initial capital (down payment + transfer tax + renovation) and monthly top-up timing",
          "7 further simulation discrepancies corrected following Excel model validation (interest, principal, loan fee, and tax calculations)",
        ],
      },
      {
        heading: "Improvements",
        items: [
          "Principal repayment column added to the yearly breakdown table",
        ],
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-08",
    title: "Multi-Market Support, URL Import & Calculation Fixes",
    sections: [
      {
        heading: "New Features",
        items: [
          "Multi-market support: Finland (FI), United States (US), United Kingdom (UK), Germany (DE), Australia (AU) — each with market-specific tax rules and defaults",
          "URL import: paste any oikotie.fi or etuovi.com listing link to auto-fill the property form (name, price, debt-free price, fees, size, rooms, build year, address)",
          "Rooms field added to property details (e.g. '2h+k+s') — shown on dashboard cards, property header, and inputs tab",
          "Optional tax deduction toggles for non-Finnish markets: mortgage interest deduction and annual building depreciation",
          "Configurable depreciation rate and depreciable portion of property value",
          "Import/export: download all properties and projects as JSON; restore from backup",
          "Projects page for grouping and comparing multiple properties",
        ],
      },
      {
        heading: "Bug Fixes",
        items: [
          "Transfer tax now correctly applied to the debt-free price (velaton hinta), not just the selling price — aligns with Finnish law (varainsiirtoverolaki §20)",
          "Finance fee (pääomavastike) now correctly included in the yearly maintenance total in simulation breakdowns",
          "URL import: fixed exact key matching in JSON extraction — previously 'debtFreePurchasePrice' was incorrectly matched when searching for 'price'",
          "URL import: pääomavastike now extracted correctly from oikotie.fi listings (was missing before)",
          "URL import: Finnish number format (space thousands separator, comma decimal) now parsed correctly",
        ],
      },
      {
        heading: "Infrastructure",
        items: [
          "Migrated from Replit to Railway with Docker-based deployment",
          "Google OAuth authentication",
          "Versioned database migrations (Drizzle ORM)",
          "Health check endpoint at /api/health",
        ],
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-03-07",
    title: "Initial Release",
    sections: [
      {
        heading: "Features",
        items: [
          "Property investment simulator with annuity loan calculations",
          "Finnish market support: varainsiirtovero, yhtiölaina, rahoitusvastike, hankintameno-olettama",
          "Tiered Finnish capital gains tax (30% / 34%)",
          "Alternative investment comparison (ETF/index fund)",
          "Multi-year cash flow and equity projections",
          "Sale scenario analysis with broker fees and capital gains tax",
          "Global simulation settings",
        ],
      },
    ],
  },
];
