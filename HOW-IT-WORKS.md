# SkillBook — How It Works

Updated **2026-11-22**. See [HOW-TO-RUN.md](HOW-TO-RUN.md) for operations and [api-endpoints.txt](api-endpoints.txt) for routes.

## 1. Architecture

```text
Browser: React + TypeScript, localhost:5191
  | Axios JSON requests with browser session cookie
  | WebSocket notifications for booking chat
  v
Spring Boot /api, localhost:8081
  | Spring Security -> controllers -> services/repositories
  v
PostgreSQL configured by root .env
  Flyway migrations V1 through V8
```

The backend is a modular monolith: one application organized by domain. Most business operations use transactional services and JPA repositories. Matching uses a JDBC query over saved skill relationships. The optional Docker app profile serves the frontend on port 5080 with nginx proxying `/api` and WebSocket upgrades to the backend.

## 2. Authentication and access

- Public registration accepts `STUDENT` and `TUTOR`. `ADMIN` is an existing-account/operator role, not a public signup option.
- Passwords are BCrypt-hashed. Signed JWTs identify the user by email.
- The browser sends `X-SkillBook-Session: cookie`; login/register issue an HttpOnly, SameSite=Strict cookie instead of returning a token to JavaScript.
- The browser stores current-user display metadata locally. New browser sessions do not store the JWT in localStorage; the API client retains legacy bearer-token compatibility.
- Cookie-authenticated writes require the custom session header. Logout clears the cookie and browser session metadata.
- CLI clients without the cookie opt-in receive a bearer token and can use `Authorization: Bearer <token>`.
- Role checks and ownership checks protect private records. Public browsing includes tutor profiles, skills, availability, photos, and reviews.
- Development CORS permits localhost/127.0.0.1 origins. Deployment uses the same-origin nginx proxy. Enable `SESSION_COOKIE_SECURE=true` with HTTPS.

Optional Google Identity Services verifies ID tokens server-side. New users can register with Google; an existing password user first signs in and links the matching Google email in Account. Configuration requires `GOOGLE_CLIENT_ID` and the exact frontend origin authorized in Google Cloud.

## 3. Profiles, photos, discovery, and matches

Tutors save their bio, hourly rate, experience, and offered skills. Students save wanted skills. Discovery supports text/skill/rate/rating filters and paginated sorting.

`GET /students/matches` compares the authenticated student's `skill_wanted` rows with tutors' `skill_offered` rows. It returns up to five tutors, ordered by matched-skill count, rating, name, and ID. Each result includes matched and total wanted counts. No cached `tutor_matches` table is used.

Account converts uploaded images to square JPEGs in the browser; the backend validates and stores the photo in `users.photo`. Public photo requests return image bytes. Tutors save a public introduction-video URL in `users.intro_video`; the UI displays supported YouTube/direct-video content. This is URL-based presentation, not a hosted video-upload service.

## 4. Availability and booking

1. A tutor creates recurring availability rules with a timezone or adds a one-off slot.
2. Slot generation produces concrete UTC-based start/end times.
3. A student chooses an available future slot.
4. Booking locks the slot row, checks availability, snapshots the price from rate × duration, creates a `CONFIRMED` booking, and marks the slot `BOOKED`.
5. Both parties receive in-app notifications. Both roles can list their own lessons in My Bookings.

The database also enforces a unique booking per slot. **Known limitation:** cancellation marks the slot available, but that uniqueness constraint prevents a new booking on the same slot. This remains pending release work.

Students can cancel confirmed lessons before they start. More than 24 hours before the lesson, the policy calculates a full refund; within 24 hours, it retains a 50% fee. Paid bookings invoke the refund integration. There is no implemented rescheduling flow.

The scheduler marks ended confirmed lessons `COMPLETED` and sends reminders for upcoming lessons. Scheduler and mail delivery are disabled in tests.

## 5. Contact and lesson communication

### Before booking

The public tutor profile's **Message tutor** link opens `/inbox?to=<tutorId>&name=<name>`. Signed-in students can start a conversation with a tutor; tutors reply through Messages. `direct_messages` persists the conversation. Inbox updates are polled.

### After booking

My Bookings exposes private chat for the booking's student and tutor. Messages are saved through REST and loaded from `chat_messages`; the WebSocket at `/live/bookings/{id}` signals committed changes so the browser reloads messages. Access is checked for both REST and the WebSocket handshake. This live notification mechanism is for a single backend instance.

Tutors can share a Zoom or Google Meet HTTPS URL on their own scheduled booking. The URL is stored in `bookings.meeting_url` and returned to booking participants. **Join video lesson** opens the external meeting. No native WebRTC or Zoom API credentials are required for this link-sharing implementation.

## 6. Reviews and summaries

Only the booking's student can review a completed lesson, once per booking. Reviews are stored in `lesson_reviews`, exposed on the public tutor profile, and used to update the tutor rating.

The tutor's My Bookings page derives session/payment summaries from returned booking data. These are basic summaries, not a separate analytics platform.

## 7. Payments and notifications

Stripe Checkout runs behind `StripeGateway`, which tests can mock. Checkout returns a hosted URL; signed Stripe webhooks, rather than the frontend redirect, update payment status. Free lessons bypass Stripe. Cancellation can initiate a full or partial refund according to policy.

Notifications are persisted per recipient for booking, payment, reminder, and completion events. The notification bell polls for updates. Email delivery is optional:

- `MAIL_ENABLED=false`: no outgoing email.
- With a Brevo API key: transactional email through Brevo.
- Otherwise: configured SMTP through Spring Mail.

Delivery failures are logged without failing the lesson operation. Delivery tracking, reconciliation, and refund-retry infrastructure remain incomplete. Live provider behavior is not established by mocked tests.

## 8. Database map

| Tables / columns | Purpose |
| --- | --- |
| `users`, `student_profiles`, `tutor_profiles` | Accounts and role-specific profiles |
| `skills`, `skill_offered`, `skill_wanted` | Skills and matching relationships |
| `availability_rules`, `availability_slots` | Recurring windows and concrete slots |
| `bookings` | Student, slot, status, price, cancellation/completion/reminder details, meeting URL |
| `payments` | Booking payment state and Stripe identifiers |
| `notifications` | Recipient, message, type, read state |
| `chat_messages` | Booking-scoped chat, added in V7 |
| `direct_messages` | Pre-booking inbox, added in V8 |
| `lesson_reviews` | Completed-lesson reviews, added in V8 |
| `users.photo`, `intro_video`, `google_subject` | Media and linked Google identity, added in V8 |

Flyway validates/applies migrations on application startup. Preserve applied migrations; future schema changes belong in new versions. Local PostgreSQL persists across application restarts. Test H2 data is disposable.

## 9. Frontend routes

| Route | Purpose |
| --- | --- |
| `/` | Home |
| `/login`, `/register` | Password and optional Google authentication |
| `/discover` | Public tutor search; signed-in students also see learning goals |
| `/tutors/:userId` | Public profile, video, reviews, contact, availability |
| `/account` | Photo, tutor video URL, Google linking |
| `/inbox` | Pre-booking messages |
| `/tutor/setup` | Tutor profile and subjects |
| `/tutor/availability` | Tutor schedule |
| `/bookings` | Lessons, payments, cancellation, chat, meeting links, reviews |

`frontend/src/services/api.ts` controls the API base URL and browser credentials. `VITE_API_BASE_URL=http://localhost:8081/api` selects the current local backend.

## 10. Request lifecycle and verification

A request passes through CORS and `JwtAuthenticationFilter`, route/method authorization, validation, and business logic. Most JSON responses use `ApiResponse`; photos return binary data and WebSockets use their own protocol. `GlobalExceptionHandler` maps application errors to HTTP responses.

Verification on **2026-11-22**: frontend production build and **141 tests passed**, including the enabled Chrome browser suite. The browser suite uses two isolated user sessions, disposable H2, and a dedicated Vite instance on port 5199.

Remaining work: cancelled-slot rebooking, live Google/Brevo/Stripe verification, payment reconciliation/refund retries, full admin tools, rescheduling, and container deployment validation. See README for current status; earlier phase notes remain historical.
