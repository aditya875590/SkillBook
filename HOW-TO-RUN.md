# SkillBook — Run, Stop, and Restart

Updated **2026-11-22**. Run each terminal's instructions from the repository root unless stated otherwise.

## Current local addresses

- App: **http://localhost:5191**
- Login: **http://localhost:5191/login**
- API: **http://localhost:8081/api**
- Health: **http://localhost:8081/api/actuator/health**

The commands override default ports 5173/8080. Keep using `localhost` consistently for browser sessions.

## Prerequisites

- Java **21** and Maven 3.9+.
- Node **22.12+** recommended (Vite 7 also supports Node 20.19+).
- PostgreSQL reachable using the root `.env` database settings.
- Google Chrome for the optional browser suite, or installed Playwright Chromium.

Docker is optional for local development. Do not start a second database if the existing configured database is already running.

## First-time setup

If `.env` already exists, preserve it. Otherwise:

```bash
cp .env.example .env
openssl rand -base64 48
```

Edit `.env` and set `JWT_SECRET` to the generated value. Set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` for your PostgreSQL instance. Keep the JWT secret stable across restarts. Use unquoted Java-properties-style values because the backend command imports this file as properties.

The standard Compose database is `skillbook` on port 5433, user `postgres`, password `password`. If you choose that database for a new setup:

```bash
docker compose up -d postgres
```

An existing native PostgreSQL can be used instead; set its actual host/port and credentials in `.env`. Spring Boot does not automatically read the repository `.env` without the import argument below. Startup validates and applies pending Flyway migrations (currently V1–V8).

Install frontend dependencies once, and again after lockfile changes:

```bash
cd frontend
npm ci
```

## Start backend — terminal 1

```bash
cd backend
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
SERVER_PORT=8081 mvn spring-boot:run '-Dspring-boot.run.arguments=--spring.config.import=file:../.env[.properties]'
```

The Java path above is for the current macOS installation. On another machine, set `JAVA_HOME` to its Java 21 installation.

## Start frontend — terminal 2

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:8081/api npm run dev -- --port 5191 --strictPort
```

This explicitly sets the API URL; root `.env` is not automatically loaded by Vite running from `frontend/`.

## Confirm it is running

```bash
curl --fail http://localhost:8081/api/actuator/health
curl --fail -I http://localhost:5191
```

Expected: backend `{"status":"UP"}` and frontend HTTP 200. Open the app and use [DEMO-CREDENTIALS.md](DEMO-CREDENTIALS.md).

## Stop and restart

### Apps started in terminals

Press **Ctrl+C** in both app terminals. PostgreSQL stays running. Restart using the two start commands above.

### Apps running in the background

Find the exact app processes:

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN
lsof -nP -iTCP:5191 -sTCP:LISTEN
```

Stop the `java` and `node` listener PIDs shown for these ports:

```bash
kill <backend-java-pid> <frontend-node-pid>
```

Replace the placeholders with actual numbers. Then rerun the backend and frontend start commands. Avoid stopping unrelated services on 8080 or other ports.

Stopping/restarting apps preserves accounts, bookings, and messages. It does not require deleting tables, resetting Git, or removing database volumes.

The current agent-started background run writes logs here:

```bash
tail -n 80 "$TMPDIR/skillbook-backend.log"
tail -n 80 "$TMPDIR/skillbook-frontend.log"
```

If you start the apps in your own terminals using the commands above, logs appear in those terminals instead.

### Optional Compose deployment

For the full container stack, configure `.env`, set `STRIPE_RETURN_URL=http://localhost:5080/bookings`, then:

```bash
docker compose --profile app up --build -d
```

Open http://localhost:5080. nginx proxies API and WebSocket traffic.

To stop only containerized apps and leave PostgreSQL running:

```bash
docker compose --profile app stop web backend
```

To start those existing app containers again:

```bash
docker compose --profile app start backend web
```

Container builds have not been verified locally. The local Maven/Vite workflow above is the verified development path.

## Optional integrations

| Setting | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google Web application OAuth client ID; authorize `http://localhost:5191` in Google Cloud |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` | Brevo API key and verified sender |
| `MAIL_ENABLED=true` | Enable outgoing mail |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP fallback when Brevo is not configured |
| `MAIL_HEALTH_ENABLED` | Optional SMTP health probe; keep false for Brevo-only setups |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe test checkout and webhook signature validation |
| `STRIPE_RETURN_URL` | Use `http://localhost:5191/bookings` for this local run |
| `SESSION_COOKIE_SECURE` | Set true for HTTPS deployment; false for local HTTP |
| `SCHEDULER_ENABLED` | Completion/reminder jobs; defaults true |

Restart the backend after changing integration configuration. No Google client secret or Zoom API key is needed for the current Google ID-token and meeting-link flows. Live Google, Brevo, and Stripe verification remains separate from automated tests.

## Tests and production build

Frontend:

```bash
cd frontend
npm run build
```

Backend, in another terminal from the repository root:

```bash
cd backend
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
mvn verify
```

The browser suite is opt-in; the command above skips it. To include it with installed Chrome:

```bash
SKILLBOOK_BROWSER_TEST=1 SKILLBOOK_BROWSER=chrome mvn verify
```

For Playwright Chromium, first run `npx playwright install chromium` from `frontend/`, then use `SKILLBOOK_BROWSER=chromium` in the backend verification command.

Tests use disposable H2, no real mail/charges, port 5199 for Vite, and a random backend port. Do not run multiple Maven test commands against the same `target/` directory concurrently. JaCoCo reports: `backend/target/site/jacoco/index.html`.

Latest full verification: **141 tests passed, zero failures/errors/skips**, with the browser suite enabled, on 2026-11-22.

## Troubleshooting

- **Port already in use:** inspect the exact port with `lsof` and stop only the intended app, then rerun.
- **JWT startup failure:** check `.env` contains a secret of at least 32 characters and the import argument is present.
- **Database connection failure:** check the configured PostgreSQL service, port, and credentials.
- **Lombok/compiler errors:** confirm `mvn -version` reports Java 21. Use `mvn clean verify` if stale compiled output is suspected.
- **Frontend cannot reach API:** use the explicit `VITE_API_BASE_URL` start command and check backend health.
- **Sessions behave unexpectedly:** sign out and back in; use separate browser profiles for student/tutor demos.
- **Flyway checksum mismatch:** restore the original applied migration rather than editing migration history; new schema changes need a new migration.
- **Cancelled slot cannot be booked again:** known constraint issue; use a new slot for demos until the migration fix is implemented.
