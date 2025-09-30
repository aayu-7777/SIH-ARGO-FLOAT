# ARGO Float Dashboard & RAG Chat Assistant

A full‑stack application to explore ARGO float data with beautiful visualizations and an AI chat assistant backed by a Retrieval‑Augmented Generation (RAG) service.

## Features
- Modern React UI (Vite) with a minimalistic ocean theme
- Interactive visualizations: map, time‑series, profiles, exports
- RAG Chat Assistant (Node.js) that:
  - Generates SQL from natural language using Gemini
  - Executes safe SELECT queries on Postgres
  - Explains results in plain language
- Upload/Export helpers (NetCDF, CSV, JSON)

## Tech Stack
- Frontend: React (Vite), CSS
- Backend: Node.js/Express, PostgreSQL (pg)
- AI: Google Gemini (generate SQL + explanations)
- Misc: Python helpers (optional), NetCDF samples for testing

## Project Structure
```
argo-float/
  client/                 # React app (Vite)
  server/                 # RAG service (Express + Postgres + Gemini)
  analyzer/               # (optional) Python analysis helpers
  python/                 # (optional) sample NetCDF tests
  uploads/                # local large files (gitignored)
  README.md
  .gitignore
```

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- pnpm/yarn/npm
- Google Gemini API key (environment variable)

## Environment Variables
Create a `.env` file for each service you run (do NOT commit real keys). Example values:

server/.env
```
DB_USER=ayush
DB_HOST=localhost
DB_NAME=postgres
DB_PASS=secret123
DB_PORT=5432

# Required – never hardcode in code
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL_ID=gemini-1.5-flash
```

Tip: Keep a `.env.example` (without secrets) in git to document variables.

## Database
The RAG service expects a `floats` table roughly like:
```
platform_id TEXT,
measurement_date TIMESTAMP,
latitude DOUBLE PRECISION,
longitude DOUBLE PRECISION,
pressure_dbar DOUBLE PRECISION,
temperature_celsius DOUBLE PRECISION,
salinity_psu DOUBLE PRECISION
```
Load your ARGO data accordingly. Indexes on `(platform_id)`, `(measurement_date)` are recommended.

## Install & Run (Development)
In one terminal (server):
```
cd server
npm install
# Ensure server/.env is set with DB and GEMINI_API_KEY then
node rag-service.js
# Service on http://localhost:5002
```

In another terminal (client):
```
cd client
npm install
npm run dev
# App on http://localhost:3000
```

## API (Server)
- Health check: `GET /api/health`
- Sample queries: `GET /api/sample-queries`
- Schema info: `GET /api/schema`
- Chat (RAG): `POST /api/chat`
  - body: `{ "message": string, "conversationHistory": Array }`
  - returns: `{ response, sqlQuery, resultsCount, data, conversationHistory }`

Notes:
- Only SELECT queries are allowed. The service sanitizes outputs.
- The chat will attempt SQL generation first; if it fails, it falls back to a helpful text response.

## Frontend Commands
```
cd client
npm run dev        # start dev server
npm run build      # production build
npm run preview    # preview prod build
```

## Export NetCDF / Readable
The UI supports exporting filtered data to NetCDF/CSV/JSON via the server endpoints. Provide filename or filters (variable, date range, month/year) and format.

## Security & Secrets
- Secrets must live in environment variables only.
- `.gitignore` excludes `.env`, `uploads/`, caches, and build artifacts.
- If you add credentials accidentally, rotate them and clean history before pushing.

## Troubleshooting
- Chat push blocked on GitHub (Push Protection): clean git history with `git filter-repo` to remove leaked files/keys, then force‑push.
- `ENOTFOUND generativelanguage.googleapis.com`: ensure internet connectivity and `GEMINI_API_KEY` validity.
- DB errors: verify server `.env` connection values and that the `floats` table exists.
- CORS/localhost: client fetches server at `http://localhost:5002`. Update if you proxy or deploy.

## Deployment Notes
- Serve `client` build via your static host or reverse proxy.
- Deploy `server` to a secure environment (Docker/VM) with environment variables set.
- Configure Postgres networking/firewall and credentials appropriately.

## Sample Queries (2025 dataset)
- "Show me all available floats"
- "What's the latest location of float 1901740?"
- "What's the average temperature for float 1901740?"
- "Show me all measurements from 2025"
- "Which float has the highest salinity measurements?"

## License
MIT (or your preferred license).
