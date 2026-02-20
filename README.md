# Assessment App — Monorepo

A Yarn Classic (v1) workspaces monorepo with:

- **apps/web** — React + Vite + TypeScript + TailwindCSS (shadcn-ready)
- **apps/api** — FastAPI (Python)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| Yarn | 1.x (`npm i -g yarn`) |
| Python | ≥ 3.11 |

---

## Initial Setup

```bash
# 1. Clone + install JS deps
git clone <repo-url> && cd library
yarn install

# 2. Web env
cp apps/web/.env.example apps/web/.env

# 3. API env + venv
cp apps/api/.env.example apps/api/.env
cd apps/api
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

---

## Running Locally (two terminals)

### Terminal 1 — Web

```bash
yarn dev:web
```

Starts Vite dev server at **http://localhost:5173**

### Terminal 2 — API

```bash
cd apps/api
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Starts FastAPI at **http://localhost:8000**

---

## Verification

| Check | URL |
|-------|-----|
| Web UI | http://localhost:5173 |
| API health | http://localhost:8000/health |
| API ping | http://localhost:8000/v1/ping |
| API docs (Swagger) | http://localhost:8000/docs |

The web page fetches `/health` on load and displays **"API: ok"** when the API is running.

---

## Monorepo Scripts (from repo root)

| Script | Description |
|--------|-------------|
| `yarn dev:web` | Start Vite dev server |
| `yarn dev:api` | Prints API start instructions |
| `yarn lint` | Prettier check on web source |
| `yarn format` | Prettier auto-format on web source |

---

## Project Structure

```
library/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # FastAPI backend
├── packages/         # Shared packages (future)
├── package.json      # Yarn workspaces root
├── .prettierrc
├── .editorconfig
└── .gitignore
```
