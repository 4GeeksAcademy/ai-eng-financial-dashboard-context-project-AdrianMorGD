# Project Memory

## Product

Financial metrics dashboard with KPI cards for income, outcome, profit, and profit margin, plus monthly charts. It currently uses generated sample data, not a database or external financial source.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Vitest.
- Backend: FastAPI, Pydantic, Uvicorn, pytest.
- Local orchestration: Docker Compose; frontend port 5173, backend port 8000.

## Current Status

- FastAPI generates 360 seeded movements. Values and categories are reproducible, but assigned years depend on the current date.
- The frontend currently consumes `GET /api/metrics`; analysis endpoints also exist but are not wired into the dashboard.
- The dashboard header now derives its displayed range from the first and last monthly data points; Vitest covers year-boundary and empty-data cases.
- `AGENTS.md` asks agents to inspect `.agents/rules`, `.agents/skills`, and `memory-bank`; only `.agents/rules` and `memory-bank` are established by this change. No project-specific skills are currently present.

## Useful Commands

- Start services: `docker compose up --build`.
- Frontend tests, lint, and build: run `npm test`, `npm run lint`, and `npm run build` from `frontend/`.
- Backend tests: run `pytest` from `backend/`.