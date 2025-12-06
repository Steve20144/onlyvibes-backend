# OnlyVibes Backend

Express 5 + MongoDB implementation that powers the OnlyVibes MVP. The codebase currently ships four functional areas (accounts, events, reviews, auth) with full request validation, structured responses, and Jest coverage backed by `mongodb-memory-server`.

---

## Stack & Tooling
- **Runtime:** Node.js 18+ with native ES modules
- **Web:** Express 5, CORS, custom logging middleware via `debug`
- **Database:** MongoDB (Atlas or local) on top of Mongoose 8
- **Auth:** JWT (HS256) + bcrypt hashing, optional bearer middleware
- **Tests:** Jest 30, Supertest, mongodb-memory-server for isolated DBs, Stryker

---

## Quick Start
1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables** (use `.env` or shell exports)

   | Variable    | Required | Description |
   | ----------- | -------- | ----------- |
   | `MONGO_URI` | ✅       | Mongo connection string used by `config/database.js`. The server will exit if this is missing. |
   | `JWT_SECRET` | ✅       | Shared secret for signing `/auth/signup` and `/auth/login` tokens as well as `authenticate` middleware. |
   | `PORT`      | ❌       | HTTP port (defaults to `3000`). |
   | `DEBUG`, `DEBUG_EVENTS` | ❌ | Set to `onlyvibes:req,onlyvibes:error` or `true` to see structured logs. |

3. **Run the API**
   ```bash
   npm run dev   # nodemon + hot reload
   npm start     # plain node src/server.js
   ```

4. **Run the automated tests**
   ```bash
   npm test
   ```
   The suites spin up their own in-memory MongoDB instances; no extra services are needed.

---

## Request Flow
1. `src/server.js` loads env vars with `dotenv`, calls `connectDB()` (fails fast when `MONGO_URI` is absent), and boots the Express app.
2. `src/app.js` applies CORS + body parsers, a password-safe logging middleware, the `/health` probe, and finally mounts feature routers.
3. Each router delegates to its controller. Controllers validate payloads/object IDs, then call the corresponding service.
4. Services are thin wrappers around the Mongoose models. They normalize `_id` → `id` and surface database errors so the controllers can format responses.
5. Any unhandled error flows into the centralized error handler, which always responds with `{ success, data, error, message }` for the resource APIs. Auth routes intentionally return a simpler `{ message, token, user }` payload.

---

## API Surface

### Accounts (`/accounts`)
| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/accounts` | Validates email, name, password ≥4 chars, and role (`user`/`venue`). Enforces unique email and auto-verifies venues. |
| GET | `/accounts/:id` | Retrieves account by Mongo `_id`; returns 404 if missing. |
| PUT | `/accounts/:id` | Allows username, email, password, role, preferences, venueDetails, isVerified updates with strict validation. |
| DELETE | `/accounts/:id` | Removes account; response is `{ success: true, data: null }`. |

### Events (`/events`)
| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/events` | Supports `?category` and `?location` filters; friendly message when empty. |
| GET | `/events/:id` | Validates ObjectId and surfaces 404 when missing. |
| POST | `/events` | Requires `creatorId` (normally injected by auth middleware), title, location, categories, ISO `dateTime`. |
| PUT | `/events/:id` | Sanitizes editable fields, normalizes category arrays/strings, and rejects invalid date or unknown keys. |
| DELETE | `/events/:id` | Deletes an event by id. |
| GET | `/events/liked/:userId` | Placeholder that currently returns an empty list until likes are modeled. |

### Reviews (mounted without a base path)
| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/events/:eventId/reviews` | Ensures the parent event exists, then lists reviews newest-first. |
| GET | `/events/:eventId/reviews/:reviewId` | Fetches a review scoped to its event. |
| POST | `/events/:eventId/reviews` | Requires `accountId`, rating 1‑5, comment/media. Rejects duplicate reviews per account/event pair. |
| PUT | `/events/:eventId/reviews/:reviewId` | Allows rating/comment/media updates with validation. |
| DELETE | `/events/:eventId/reviews/:reviewId` | Removes the review. |
| GET | `/accounts/:accountId/reviewed-events` | Returns aggregated stats (count, avg rating, last comment) per event reviewed by the user. |

### Auth (`/auth`)
| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/auth/signup` | Creates a user role account, hashes the password with bcrypt, and returns `{ message, token, user }`. |
| POST | `/auth/login` | Verifies credentials and returns a fresh JWT + user shape. |

> Use `src/middleware/auth.js` to protect future routes. It expects an `Authorization: Bearer <token>` header and populates `req.user` when verification succeeds.

## Status Code Semantics
| Status | What it represents | Representative tests & endpoints |
| --- | --- | --- |
| 200 OK | Successful reads/updates/deletes, even when the payload is empty but the request was valid. Used for health checks, log masking middleware, login success, listing resources, fetching details, friendly “no data” responses, successful updates/deletes. | `src/tests/appMisc.test.js` (`GET /health`, unknown route handler), `src/tests/auth.test.js` (`POST /auth/login`), `src/tests/accounts.test.js` (`GET/PUT/DELETE /accounts/:id`), `src/tests/events.test.js` (various `GET/PUT/DELETE /events...`), `src/tests/review.test.js` (most `GET/PUT/DELETE` combos) |
| 201 Created | Resource persisted successfully: accounts, auth signup, events, reviews. Responses include `success: true`, the created entity, and a success message. | `src/tests/accounts.test.js`, `src/tests/auth.test.js`, `src/tests/events.test.js`, `src/tests/review.test.js` (all `POST` cases) |
| 400 Bad Request | Client input/shape errors: invalid/missing fields, malformed IDs, empty payloads, wrong data types, out-of-range values, non-object bodies. Middleware also raises 400 before services run. | Validation suites across `accounts.test.js`, `auth.test.js`, `events.test.js`, `review.test.js`, plus controller helpers such as `eventController.unit.test.js` |
| 401 Unauthorized | Authentication failures: missing/incorrect Authorization headers or invalid credentials. Bodies explain the auth issue and prevent downstream logic. | `auth.test.js` (bad login), `authMiddleware.test.js` (missing header, wrong scheme, bad token) |
| 404 Not Found | Route or resource absent: unknown account/event/review IDs, deleted resources, unmatched routes. Responses keep `success: false`, `data: null`, and an explanatory message. | `accounts.test.js`, `events.test.js`, `review.test.js`, `appMisc.test.js` |
| 409 Conflict | Unique constraint violations (e.g., duplicate emails or duplicate reviews per account/event). Signals callers to resolve the conflict before retrying. | `accounts.test.js`, `auth.test.js`, `review.test.js` |
| 418 Custom error passthrough | Controllers/services can throw errors with custom `statusCode`; the centralized handler returns them unchanged, preserving details. | `appMisc.test.js` (mocked service failure returned as 418) |
| 503 Service Unavailable | Database connectivity problems detected via `dbHealth`. Requests short-circuit with “Database not available.” | `accounts.test.js` (`POST /accounts` when DB is down); similar guards in `eventService.test.js`, `reviewService.test.js` |

---

## Logging & Debugging
- Incoming requests go through a custom middleware that times the response and masks `password` before logging via `debug` (`onlyvibes:req`).
- Controllers and services log verbose traces when `DEBUG_EVENTS=true` or `DEBUG=true`.
- Unhandled errors bubble into the error handler in `app.js`, ensuring consistent JSON responses even for unexpected failures.

Enable logs per namespace:
```bash
DEBUG=onlyvibes:req,onlyvibes:error npm run dev
DEBUG_EVENTS=true npm run dev
```

## Project Structure
```
config/
└── database.js          # Mongo connection helper (uses MONGO_URI)

src/
├── app.js               # Express instance, middleware, health probe, routers
├── server.js            # Entry point: dotenv + DB connect + app.listen
├── controllers/         # Request validation + orchestration per feature
├── middleware/          # JWT auth helper (optional), legacy error helpers
├── models/              # Account, Event, Review mongoose schemas
├── routes/              # Feature routers (accounts, events, reviews, auth)
├── services/            # DB-facing helpers called by controllers
├── tests/               # Jest suites (accounts/events/reviews/auth + utils)
└── utils/               # debug-based logger utilities

docs/
└── swaggerfile.json     # Source Swagger/OpenAPI document for the course
```

## Testing & Coverage
- **Tooling:** Jest 30 drives the suites with `supertest` for HTTP assertions and `mongodb-memory-server` for fully isolated databases per file. Everything runs in native ESM mode (`node --experimental-vm-modules`).
- **Running locally:** `npm test` executes the full matrix; append `-- --coverage` to refresh Istanbul output in `coverage/`. No external Mongo instance is required.
- **Coverage expectations:** All feature areas maintain ≥80% statements/branches/functions/lines. Services normalize Mongoose documents (`_id` → `id`) and log guarded errors so regressions surface quickly.
- **Continuous integration:** The GitHub workflow runs the same command plus linting, blocking merges if any suite fails or coverage regresses.
- **Deep-dive report:** [`Coverage.txt`](docs/Coverage.md) summarizes the 140+ Jest scenarios with notes per suite so reviewers can trace every assertion.

### CI Test Matrix
| Suite | What it covers | Representative specs |
| --- | --- | --- |
| Accounts API | Happy-path CRUD plus validation, duplicate protection, and DB outage handling. | `src/tests/accounts.test.js` |
| Events API | Filters, payload normalization, controller guards, model hooks, and service fallbacks. | `src/tests/events.test.js`, `eventController.unit.test.js`, `eventModelHooks.test.js`, `eventService.test.js` |
| Reviews API | Endpoint flows, duplicate review prevention, aggregation helpers, and service edge cases. | `src/tests/review.test.js`, `reviewService.test.js` |
| Auth & Infrastructure | Signup/login flows, JWT middleware, health/404/error handlers, server bootstrap. | `src/tests/auth.test.js`, `authMiddleware.test.js`, `appMisc.test.js`, `server.bootstrap.test.js` |
| Platform Utilities | Database helpers, health probes, and in-memory Mongo scaffolding used by every suite. | `src/tests/database.test.js`, `dbHealth.test.js`, `createTestDb.test.js` |

Each suite seeds its own fixtures, masks secrets in logs, and leaves the database state isolated so tests can be run in parallel without interference.

---

### Test Suite Types
- **Supertest integration suites** (`accounts.test.js`, `appMisc.test.js`, `auth.test.js`, `events.test.js`, `review.test.js`): import `supertest`, boot the real Express app, and issue HTTP requests against the in-memory MongoDB to verify controllers, services, and models end-to-end.
- **Unit-style suites** (`authMiddleware.test.js`, `createTestDb.test.js`, `database.test.js`, `dbHealth.test.js`, `eventController.unit.test.js`, `eventModelHooks.test.js`, `eventService.test.js`, `reviewService.test.js`, `server.bootstrap.test.js`): mock dependencies and validate individual modules (middleware, helpers, services, bootstrap) without exercising the HTTP layer.

---

## Swagger & Status
- The endpoints above match the Παροδοτέο 1 Swagger located at `docs/swaggerfile.json` for Accounts, Events, and Reviews. Auth was added to unblock the frontend even though it is outside the original spec.
- Features still pending from the specification (verification requests, reminders, follows, recommendations, global search) remain backlog items and are not exposed by the current code.
- Keep the spec in sync with future changes so graders can diff the API surface.

---

## Known Gaps / Next Steps
1. Implement a real "liked events" model so `GET /events/liked/:userId` returns data instead of an empty array.
2. Extend auth-protected routes to actually use `authenticate` and gate event creation/update/deletion by role.
3. Add email & password hashing to account creation (currently handled only via `auth/signup`).
4. Publish an updated Swagger export whenever new endpoints land to avoid drift.

