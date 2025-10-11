# Repository Guidelines

## Project Structure & Module Organization
Keep the Express API under `src/`: routes in `src/routes/`, controllers in `src/controllers/`, shared business logic in `src/services/`, and persistence helpers in `src/db/`. Middleware that applies app-wide belongs in `src/middleware/`, while cross-cutting utilities live in `src/utils/`. Mirror that layout in `tests/unit/` and `tests/integration/` so every module has a partner spec. Stash onboarding notes or endpoint contracts in `docs/` for quick reference.

## Build, Test, and Development Commands
Install dependencies with `npm install`. Use `npm run dev` (nodemon wired to `src/index.js`) for a hot-reloading server, `npm run migrate` to apply SQL migrations, and `npm run build` to stage the deployable `dist/`. Validate the codebase with `npm run lint` and `npm test` before opening a pull request. Update this section whenever new scripts land so contributors never guess.

## Coding Style & Naming Conventions
Favor modern JavaScript with async/await, CommonJS modules, and explicit error handling. Stick to 2-space indentation, trailing commas, and single quotes to align with the ESLint + Prettier defaults. Files use kebab-case (`battle-service.js`), controllers end with `Controller.js`, and middleware with `Middleware.js`. Functions and variables are camelCase, classes PascalCase, and constants UPPER_SNAKE_CASE. Keep route paths descriptive (`/battles/:battleId/rounds`) and export a single responsibility per module.

## Testing Guidelines
Author unit tests with Jest in `tests/unit/` and integration flows in `tests/integration/` using Supertest against the Express app. Name specs `*.spec.js` so Jest discovers them automatically. Target meaningful coverage across controllers and services; battle resolution logic should stay near 90% line coverage. Add regression tests alongside bug fixes and run `npm test` (or `npm test -- --watch` while iterating) before requesting review.

## Commit & Pull Request Guidelines
Adopt Conventional Commits (`feat: add battle scoring API`) to keep history searchable and changelogs automated. Each commit should address a single concern and include tests or docs when relevant. Pull requests need a clear problem statement, a brief solution outline, and verification steps; link issues with `#123` and attach curl or Postman snippets for new endpoints. Merge only after CI passes and conflicts are resolved.

## Security & Configuration Tips
Never commit secrets; store them in `.env` and document required keys in `.env.example`. Validate payloads with a schema layer (Zod or Joi) before controller logic and sanitize anything persisted. Run `npm audit` when adding dependencies and note follow-up actions in the PR description so the team can track remediation.
