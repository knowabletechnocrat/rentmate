# RentMate Local Starter — Phase 1

## Prerequisites
- Node.js 20.19+ (or Node 22+)
- Docker Desktop running (WSL2 engine on Windows)
- MySQL CLI or MySQL Workbench

## Run
1. Copy `.env.example` to `.env` in project root.
2. Run `docker compose up -d` from root. Wait for MySQL to become healthy.
3. Import `database/schema.sql` using MySQL Workbench against localhost port 3307 (user rentmate / password from root .env), OR run:
   `docker compose exec -T mysql mysql -urentmate -prentmate123 rentmate < database/schema.sql`
   (The redirection command works in Git Bash; in PowerShell use MySQL Workbench or `Get-Content database/schema.sql | docker compose exec -T mysql mysql -urentmate -prentmate123 rentmate`.)
4. Copy `backend/.env.example` to `backend/.env`, replace JWT_SECRET with a long random value, and ensure DB_PASSWORD matches root `.env`.
5. In a new terminal: `cd backend && npm install && npm run dev`.
6. In another terminal: `cd frontend && npm install && npm run dev`.
7. Open http://localhost:5173 . API health: http://localhost:5000/api/health .

## Local service URLs
- MySQL: localhost:3307
- MinIO: http://localhost:9001 (minioadmin / minioadmin123)
- Mailpit: http://localhost:8025

## Current scope
Working registration, login, property creation, property listing. MinIO and Mailpit are provisioned but **not yet integrated**. The database includes placeholder tables for image uploads and inquiries; endpoints for these will be built in Phase 2. JWT stored in localStorage is a starter convenience, not production security. Do not deploy these sample credentials publicly.
