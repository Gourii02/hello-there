# Hello, There

A small full-stack app that greets a visitor by name. The React frontend sends the name to an Express API; the API validates it and returns a greeting.

## Stack

- React, TypeScript, and Vite for the frontend
- Node.js, TypeScript, and Express for the API
- PostgreSQL for saved greeting submissions
- Wikimedia Commons API for bouquet photos with source and license credits
- npm workspaces for the monorepo
- GitHub Actions for continuous integration

## Run locally

Requirements: Node.js 20.19+ or 22.12+, npm, and a running PostgreSQL server.

```sh
npm install
```

Create a database named `hello_there` in PostgreSQL, then copy `backend/.env.example` to `backend/.env` and replace `replace_me` with your PostgreSQL password. Keep the real `.env` file private.

```sh
npm run db:migrate
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`. Vite forwards `/api` requests to the API on port 3001.

## Run the development stack with Docker Compose

Start Docker Desktop, then run:

```sh
docker compose up --build
```

Open `http://localhost:5175`. Compose starts Vite, the API, and a separate PostgreSQL container. The API waits for PostgreSQL, applies the migration, then starts. The container database is published on port 5433 so it does not replace or conflict with your local PostgreSQL on port 5432. Its data persists in a Docker volume when you stop the services with Ctrl+C or `docker compose down`.

The default Compose password is only for local development. To change it, set `DOCKER_POSTGRES_PASSWORD` in a root `.env` file, which is ignored by Git and Docker. Do not use the default credentials in a deployed environment.

## Build the production image

The production image builds the frontend, installs only runtime dependencies, and serves the built site and API from one Express process. It requires `DATABASE_URL`, applies the database migration at startup, and listens on `PORT` (default 3001).

```sh
docker build --tag hello-there:production .
```

For deployment, provide a managed PostgreSQL connection through the host's private `DATABASE_URL` setting. Do not use the local Compose credentials or expose `.env` in the image.

## Checks

```sh
npm test
npm run test:integration
npm run lint
npm run build
```

`npm run test:integration` uses a separate PostgreSQL database ending in `_test` and resets only its greeting table. If `TEST_DATABASE_URL` is not set, it derives a `_test` database name from `DATABASE_URL` and creates that database if needed. GitHub Actions uses its own temporary PostgreSQL service. The bouquet route is mocked in this test, so it does not depend on Wikimedia being available.

## API

- `GET /api/health` returns `{ "status": "ok" }`.
- `GET /api/stats` returns the total number of saved greetings.
- `GET /api/bouquet` returns a bouquet image and its Commons attribution details.
- `POST /api/greet` accepts `{ "name": "Ada" }`, saves the submission, and returns the greeting and updated total.
- Names are trimmed and must contain 1 to 60 characters. Invalid input returns HTTP 400 with an error message.

This counts greeting submissions, not unique people or authenticated logins. The app does not have user accounts.

## Architecture

```text
Browser -> React/Vite -> /api proxy -> Express -> validation -> PostgreSQL
```

The GitHub Actions workflow runs unit and database integration tests, lint, production builds, then starts the Docker Compose stack and smoke-tests a greeting through its web proxy on pushes and pull requests.
