# SkillBook

A tutoring marketplace built with Spring Boot and React. Students discover tutors, save learning goals, message before booking, book lessons, and chat privately with their tutor.

## Documentation

- [How to run, stop, and restart](HOW-TO-RUN.md)
- [How it works](HOW-IT-WORKS.md)
- [Demo credentials and walkthrough](DEMO-CREDENTIALS.md)
- [API endpoints](api-endpoints.txt)
- [Project operating rules](rules.md)

## Local URLs

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5191 |
| Login | http://localhost:5191/login |
| Backend | http://localhost:8081/api |
| Health | http://localhost:8081/api/actuator/health |

These are the ports used by this project's current local run. Framework defaults remain 5173/8080; the run commands explicitly select 5191/8081.

## Implemented features

- Student/tutor signup, password login, HttpOnly browser session cookies, and optional Google sign-in/account linking.
- Public tutor profiles and discovery with subjects, price/rating filters, sorting, and pagination.
- Saved student learning goals and ranked tutor matches from shared skills.
- Account photo uploads and tutor introduction videos via public video URLs.
- Tutor weekly availability, generated slots, and one-off slots.
- Booking with slot locking, cancellation policy, and session completion/reminders.
- Pre-booking inbox, persistent booking chat, and WebSocket change notifications.
- Tutor-provided Zoom/Google Meet lesson links, visible to booking participants.
- Reviews after completed lessons and tutor booking/payment summaries.
- Stripe Checkout, signed webhook handling, and refund integration.
- In-app notifications; optional Brevo transactional email or SMTP.

Video lessons open external meeting links. There is no native WebRTC calling or automatic Zoom meeting creation. Public registration supports students and tutors; existing admins can log in, but full admin management screens are not implemented.

## Stack and structure

| Layer | Technology |
| --- | --- |
| Backend | Java 21, Spring Boot 3.3.5, Maven |
| Data | PostgreSQL, Spring Data JPA/Hibernate, Flyway V1–V8 |
| Security | Spring Security, BCrypt, JWT |
| Frontend | React 18, TypeScript, React Router 7, Vite 7, Tailwind |
| Testing | JUnit, Mockito, MockMvc, H2, Playwright, JaCoCo |
| Deployment | Optional Docker Compose app profile; nginx web/API proxy |

Backend domains live under `backend/src/main/java/com/skillbook/`: `auth`, `user`, `tutor`, `skill`, `availability`, `booking`, `payment`, `chat`, `review`, and `notification`. Frontend pages, components, and API services live in `frontend/src/`.

## Start an already-configured checkout

Keep the PostgreSQL instance referenced by the root `.env` running. Start each app in a separate terminal, initially at the repository root:

```bash
cd backend
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
SERVER_PORT=8081 mvn spring-boot:run '-Dspring-boot.run.arguments=--spring.config.import=file:../.env[.properties]'
```

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:8081/api npm run dev -- --port 5191 --strictPort
```

For first-time environment setup, dependencies, database options, shutdown, and troubleshooting, use [HOW-TO-RUN.md](HOW-TO-RUN.md).

## Verification

Verified on **2026-11-22**: frontend production build and **141 tests passed**, including the enabled Chrome connected-lesson browser suite.

```bash
cd frontend
npm run build
```

From a separate terminal at the repository root:

```bash
cd backend
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
SKILLBOOK_BROWSER_TEST=1 SKILLBOOK_BROWSER=chrome mvn verify
```

Tests use disposable H2 and mocked payment integrations. The browser suite uses port 5199 and a random backend port, and verifies public profiles, saved matches, photo/video presentation, inbox, booking, live chat, and lesson links. No live emails or charges are made. JaCoCo output is in `backend/target/site/jacoco/`.

## Remaining work

- Cancellation frees a slot, but the unique booking-per-slot constraint currently prevents rebooking it. A migration and regression coverage are needed.
- Live Google and Brevo verification requires configured credentials.
- Live Stripe charges/webhooks, payment reconciliation, and refund retries still require release work.
- Docker deployment files exist; container builds have not been verified locally.
- Full admin tools and rescheduling are not implemented.

Earlier phase plans and test reports describe historical milestones; they are not proof that all phases are complete.
