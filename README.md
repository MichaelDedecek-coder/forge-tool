# DataWizard AI

**8 hours in Excel. Done in 30 seconds.**

DataWizard turns messy spreadsheets into clear insights using AI-powered statistical analysis.

## Architecture

- **Frontend**: Next.js (React) with Tailwind CSS, Recharts for visualization
- **AI Engine**: Google Gemini Flash (narration) — Claude Sonnet 4.5 migration planned
- **Compute**: E2B Sandbox (Python/Pandas for statistical pre-aggregation)
- **Hosting**: Vercel
- **Export**: Playwright-based PDF generation

## Getting Started

```bash
cp .env.example .env.local
# Fill in your API keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see DataWizard.

## Environment Variables

See `.env.example` for required configuration.

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/datawizard` | Main analysis interface |
| `/api/datawizard` | Core analysis API (E2B + Gemini) |
| `/api/export-pdf` | PDF report generation |

## License

Proprietary — FORGE CREATIVE | AgentForge
