# Battle Rap MVP API

Battle Rap MVP API implements the domain model for tournaments, qualifiers, judges, and listener interactions described in the product brief. The service is built on Express, PostgreSQL, and Zod-based validation.

## Local Setup
- Install PostgreSQL 13+ with the `pgcrypto` extension enabled (`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`).
- Copy `.env.example` to `.env` and adjust `DATABASE_URL`, `JWT_SECRET`, and other secrets.
- Install dependencies: `npm install`
- Run the initial schema: `npm run migrate`
- Start the API: `npm run dev` (hot reload) or `npm start`.

## Key Scripts
- `npm run dev` – nodemon watcher for local development.
- `npm run start` – production-style start using the compiled JS in-place.
- `npm run build` – produces a deployable `dist/` with compiled sources, SQL migrations, and a trimmed `package.json`.
- `npm run migrate` – executes all SQL files in `/sql` against the configured database.
- `npm run lint` / `npm test` – static analysis and Jest test runner.

## Deploying the Build Artifact
1. Run `npm run build` locally. The command compiles TypeScript with production defaults and stages runtime assets under `dist/`.
2. Copy the `dist/` directory to your VPS (e.g., via `scp -r dist user@server:/var/www/battle-rap`).
3. On the VPS run `npm ci --omit=dev` inside the copied `dist/` directory to install only production dependencies.
4. Configure environment variables (`cp .env.example .env` and adjust values, or inject via the process manager).
5. Apply migrations with `npm run migrate`, then start the API with `npm run start`.

## Quick Seed
- Register an admin to bootstrap permissions:
  ```bash
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"ChangeMe123!","displayName":"Super Admin","roles":["admin"]}'
  ```
- Capture the returned JWT and authenticate subsequent requests with `Authorization: Bearer <token>`.
- Seed artists by registering them with `roles: ["artist"]`, then attach tournament participations through `/api/tournaments/:tournamentId/participants`.

## API Overview
- **Auth**: `POST /api/auth/register` and `POST /api/auth/login` issue JWTs. Registration supports optional `roles` (`artist`, `judge`, `listener`).
- **Users**: `GET /api/users/me`, `GET /api/users/:userId`, role management endpoints (admin only), and artist profile CRUD at `/api/users/:userId/artist-profile`.
- **Admin**: `/api/admin/dashboard`, `/api/admin/users`, and `/api/admin/submissions/:id/moderation` provide metrics, user inventory, and submission locking. `/api/admin/media-assets` manages storage metadata.
- **Tournaments**: Admin/moderator create tournaments, manage status, assign participants (`POST /api/tournaments/:id/participants`) and judges, and configure rounds.
- **Rounds & Submissions**: Artists manage qualifier submissions at `/api/rounds/:roundId/submissions/*`. Admins build bracket matches via `/api/rounds/:roundId/matches`.
- **Matches & Evaluation**: Judges submit scores with `/api/evaluations/*`; listener engagement (likes/comments) shares the underlying schema for future iterations.

Refer to `sql/001_init.sql` for the authoritative database definition, including enums, views, and indexes.
For copy-pasteable Postman requests, see `docs/postman-requests.md`.
