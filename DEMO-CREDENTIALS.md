# SkillBook — Demo Credentials

These three accounts were successfully checked against the current local backend on **2026-11-22**. They exist in the database configured by this checkout's root `.env`; a fresh database will not automatically contain them.

Login: **http://localhost:5191/login**

| Role | Email | Password |
| --- | --- | --- |
| Tutor | `tutor@skillbook.demo` | `TutorDemo123!` |
| Student | `student@skillbook.demo` | `StudentDemo123!` |
| Admin | `admin@skillbook.demo` | `AdminDemo123!` |

These are local demo accounts, not production credentials. `FACULTY` is not a role; use Tutor for a teaching account. Admin can sign in, but full admin management screens are not implemented.

## Two-user demonstration

Use separate browser profiles or a normal window plus an incognito window. Two tabs in the same browser profile share the login cookie.

1. **Tutor:** sign in, open tutor setup, save bio/rate/subjects, and add a future availability slot.
2. **Tutor:** open Account, upload a photo, and optionally save a public YouTube/direct-video URL.
3. **Student:** sign in, open Find a Tutor, and save matching subjects under learning goals.
4. **Student:** open the tutor profile and select Message tutor. Send a pre-booking question.
5. **Tutor:** open Messages and reply.
6. **Student:** return to the profile, book the future slot, and open My Bookings.
7. **Both:** open Chat on the same booking and exchange messages.
8. **Tutor:** choose Add lesson link and share a valid Zoom or Google Meet URL.
9. **Student:** refresh My Bookings if needed and select Join video lesson.
10. Reviews become available only after a lesson is completed. Payment checkout requires working Stripe configuration.

## Creating accounts in a fresh local database

Only run these when you intend to create demo data. Start the backend first using [HOW-TO-RUN.md](HOW-TO-RUN.md).

```bash
curl -sS -X POST http://localhost:8081/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo Tutor","email":"tutor@skillbook.demo","password":"TutorDemo123!","role":"TUTOR"}'
```

```bash
curl -sS -X POST http://localhost:8081/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo Student","email":"student@skillbook.demo","password":"StudentDemo123!","role":"STUDENT"}'
```

Public registration cannot create an admin. An existing admin is provisioned separately by the database operator. An “email already exists” response confirms the email is registered, not that its password matches this document.

Application restarts preserve accounts. Switching databases or deleting a database volume does not. For stop/restart commands, see [HOW-TO-RUN.md](HOW-TO-RUN.md#stop-and-restart).
