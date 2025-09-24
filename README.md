# NextApp

[![GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-Enabled-24292F?style=plastic&logo=github&logoColor=white)](https://github.com/features/copilot)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=plastic&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=plastic&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-18-149ECA?style=plastic&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=plastic&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=plastic&logo=node.js&logoColor=white)](https://nodejs.org)
[![Chart.js](https://img.shields.io/badge/Chart.js-4-FF6384?style=plastic&logo=chart.js&logoColor=white)](https://www.chartjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=plastic&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Jest](https://img.shields.io/badge/Tests-Jest-C21325?style=plastic&logo=jest&logoColor=white)](https://jestjs.io)
[![SWR](https://img.shields.io/badge/SWR-2.3-black?style=plastic&logo=vercel&logoColor=white)](https://swr.vercel.app)
[![ESLint](https://img.shields.io/badge/ESLint-8-4B32C3?style=plastic&logo=eslint&logoColor=white)](https://eslint.org)
[![Prettier](https://img.shields.io/badge/Prettier-3-F7B93E?style=plastic&logo=prettier&logoColor=white)](https://prettier.io)
[![ts-jest](https://img.shields.io/badge/ts--jest-29-3178C6?style=plastic&logo=jest&logoColor=white)](https://kulshekhar.github.io/ts-jest)

A minimal Next.js + React + TypeScript example application demonstrating a simple data API and a chart visualization.

Features

- Next.js (App Router) with TypeScript
- Chart.js (via react-chartjs-2) for visualizations
- Dual-mode data storage:
  - Development: In-memory store for quick local development
  - Production: Postgres-backed API with paginated GET and POST endpoints
- Client-side SWR for data fetching with optimistic updates and rollback
- Global toast notifications (`components/Toast.tsx`)
- Simple in-memory per-IP rate limiter on the POST endpoint (demo-only)
- Jest + Testing Library tests (unit + component-like tests)

Quick start

1. Install dependencies:

   npm install

2. Run the dev server (uses in-memory store):

   npm run dev

3. For production mode with Postgres:

   ```env
   # .env.local
   NODE_ENV=production
   DATABASE_URL=postgres://user:pass@localhost:5432/dbname
   ```

4. Run tests:

   npm test -- --runInBand

5. Open http://localhost:3000

Notes

- The project was originally scaffolded with an in-memory dataset; it now uses a small Postgres helper. Tests mock the DB layer and do not require a live Postgres instance.
- The rate limiter is an in-memory demo implementation. For production use a distributed store (Redis) or an API gateway.
- API error responses follow the shape: `{ error: string }` for easy client handling.

Project structure

- `app/` — Next.js app router pages
- `components/` — Reusable React components (Chart, Toast, etc.)
- `lib/` — Utilities (fetcher, data types)
- `server/` — Server helpers (DB, rate limiter)
- `tests/` — Jest + Testing Library tests

License

MIT
