# OnlyVibes Backend

Express 5 + MongoDB implementation that powers the OnlyVibes MVP. The codebase currently ships four functional areas (accounts, events, reviews, auth) with full request validation, structured responses, and Jest coverage backed by `mongodb-memory-server`.

---

## Stack & Tooling
- **Runtime:** Node.js 18+ with native ES modules
- **Web:** Express 5, CORS, custom logging middleware via `debug`
- **Database:** MongoDB (Atlas or local) on top of Mongoose 8
- **Auth:** JWT (HS256) + bcrypt hashing, optional bearer middleware
- **Tests:** Jest 30, Supertest, mongodb-memory-server for isolated DBs

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

---

## Testing
- `npm test` runs Jest in ESM mode (`node --experimental-vm-modules`).
- Each suite provisions its own in-memory Mongo via `mongodb-memory-server`, so there is no dependency on an external database.
- Supertest exercises the Express app end-to-end (controllers ↔ services ↔ models), while unit-level tests validate service error paths.

---

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

## Tests in the CI

### Primary Tests

#### Accounts API
- [x] POST /accounts creates a new user account (213 ms)
- [x] POST /accounts fails with invalid email (10 ms)
- [x] POST /accounts fails with missing name (8 ms)
- [x] POST /accounts fails when password is shorter than 4 chars (9 ms)
- [x] POST /accounts fails with missing or invalid role (10 ms)
- [x] POST /accounts creates a venue account with venue details (13 ms)
- [x] POST /accounts rejects duplicate emails (11 ms)
- [x] GET /accounts/:id returns an existing account (10 ms)
- [x] GET /accounts/:id returns 404 for unknown id (8 ms)
- [x] PUT /accounts/:id updates an account (12 ms)
- [x] DELETE /accounts/:id removes an account (12 ms)
- [x] PUT /accounts/:id returns 404 when account is missing (8 ms)
- [x] PUT /accounts/:id fails with empty body (7 ms)
- [x] PUT /accounts/:id rejects unknown fields (7 ms)
- [x] PUT /accounts/:id enforces username length (5 ms)
- [x] PUT /accounts/:id validates preferences array (6 ms)
- [x] PUT /accounts/:id validates venueDetails object (6 ms)
- [x] PUT /accounts/:id validates isVerified type (6 ms)
- [x] PUT /accounts/:id rejects non-object payloads (6 ms)
- [x] PUT /accounts/:id rejects invalid role updates (6 ms)
- [x] DELETE /accounts/:id returns 404 when account is missing (6 ms)
- [x] POST /accounts returns 503 when database is unavailable (7 ms)
- [x] updateAccountService surfaces database errors (5 ms)
- [x] updateAccountService normalizes the updated document on success (4 ms)
- [x] deleteAccountService surfaces database errors (4 ms)
- [x] deleteAccountService returns true when a document is deleted and false otherwise (4 ms)

#### App Infrastructure Endpoints
- [x] GET /health returns service heartbeat payload (24 ms)
- [x] request logging middleware masks sensitive fields before logging (19 ms)
- [x] unknown routes trigger the JSON 404 handler (3 ms)
- [x] centralized error handler surfaces status, message, and details (22 ms)

#### Auth API
- [x] POST /auth/signup fails with missing fields (33 ms)
- [x] POST /auth/signup persists user and returns JWT (95 ms)
- [x] POST /auth/signup rejects duplicate emails (92 ms)
- [x] POST /auth/login authenticates valid credentials (147 ms)
- [x] POST /auth/login rejects invalid credentials (119 ms)

#### authenticate middleware
- [x] returns 401 when Authorization header is missing (11 ms)
- [x] returns 401 when Authorization header format is invalid (2 ms)
- [x] returns 401 when token is invalid (17 ms)
- [x] calls next and attaches user when token is valid (16 ms)

#### connectDB
- [x] exits immediately when MONGO_URI is missing (5 ms)
- [x] connects and logs success when MONGO_URI is present (2 ms)
- [x] logs the error and exits when mongoose.connect rejects (2 ms)

#### dbHealth.isDbConnected
- [x] returns true only when readyState equals 1 (3 ms)

#### Events API
- [x] GET /events returns persisted events (211 ms)
- [x] GET /events filters by category (16 ms)
- [x] GET /events filters by location substring (case-insensitive) (14 ms)
- [x] GET /events filters by category and location simultaneously (17 ms)
- [x] GET /events with filters that match nothing returns friendly message (13 ms)
- [x] GET /events with location filter and no results uses friendly message (13 ms)
- [x] GET /events/:id returns the requested event (14 ms)
- [x] GET /events returns "No events found." when there are no events (13 ms)
- [x] GET /events/:id with invalid id format returns 400 (33 ms)
- [x] GET /events/:id with missing event returns 404 (16 ms)
- [x] POST /events requires a valid creatorId (32 ms)
- [x] POST /events persists a new event when payload is valid (15 ms)
- [x] POST /events defaults missing description to empty string (14 ms)
- [x] POST /events rejects missing title (21 ms)
- [x] POST /events rejects empty categories array (17 ms)
- [x] POST /events normalizes category string input (14 ms)
- [x] PUT /events/:id updates editable fields (15 ms)
- [x] PUT /events/:id validates malformed dateTime (17 ms)
- [x] PUT /events/:id rejects empty payloads (14 ms)
- [x] PUT /events/:id allows null description by storing empty string (13 ms)
- [x] PUT /events/:id rejects non-string description values (14 ms)
- [x] PUT /events/:id accepts comma-separated category strings (12 ms)
- [x] PUT /events/:id rejects invalid imageUrl types (16 ms)
- [x] PUT /events/:id updates dateTime when provided a valid ISO string (13 ms)
- [x] PUT /events/:id rejects unknown fields (14 ms)
- [x] PUT /events/:id enforces trimmed title length (14 ms)
- [x] PUT /events/:id rejects category arrays with non-string entries (13 ms)
- [x] PUT /events/:id enforces location length requirements (15 ms)
- [x] PUT /events/:id returns 404 for missing event (12 ms)
- [x] PUT /events/:id with invalid id returns 400 (12 ms)
- [x] DELETE /events/:id removes an existing event (12 ms)
- [x] DELETE /events/:id with invalid id returns 400 (16 ms)
- [x] DELETE /events/:id returns 404 for missing event (12 ms)
- [x] GET /events/liked/:userId returns placeholder data set (9 ms)

#### Reviews API
- [x] GET /events/:eventId/reviews returns reviews for event (217 ms)
- [x] GET /events/:eventId/reviews returns friendly message when no reviews exist (20 ms)
- [x] GET /events/:eventId/reviews validates the event id parameter (14 ms)
- [x] GET /events/:eventId/reviews returns 404 when the event does not exist (13 ms)
- [x] POST /events/:eventId/reviews creates a review (26 ms)
- [x] POST /events/:eventId/reviews rejects duplicates (15 ms)
- [x] POST /events/:eventId/reviews requires a valid accountId (12 ms)
- [x] POST /events/:eventId/reviews enforces rating boundaries (12 ms)
- [x] POST /events/:eventId/reviews returns 404 when event is missing (14 ms)
- [x] GET /events/:eventId/reviews/:reviewId returns single review (16 ms)
- [x] GET /events/:eventId/reviews/:reviewId validates the review id parameter (10 ms)
- [x] GET /events/:eventId/reviews/:reviewId returns 404 when review is missing (12 ms)
- [x] PUT /events/:eventId/reviews/:reviewId updates rating (18 ms)
- [x] PUT /events/:eventId/reviews/:reviewId enforces rating boundaries (12 ms)
- [x] PUT /events/:eventId/reviews/:reviewId returns 404 when review is missing (15 ms)
- [x] PUT /events/:eventId/reviews/:reviewId replaces mediaUrls when provided as an array (17 ms)
- [x] DELETE /events/:eventId/reviews/:reviewId removes review (20 ms)
- [x] DELETE /events/:eventId/reviews/:reviewId returns 404 when review is missing (13 ms)
- [x] GET /accounts/:accountId/reviewed-events returns summary (18 ms)
- [x] GET /accounts/:accountId/reviewed-events returns friendly message when no reviews exist (13 ms)
- [x] listReviewedEventsForAccount requires the accountId parameter (10 ms)

#### server bootstrap
- [x] connects to the database and listens on the default port (12 ms)
- [x] honors the PORT environment variable (4 ms)

### Secondary Tests

#### createTestDb helper
- [x] connect only spins up the MongoMemoryServer once (4 ms)
- [x] clearDatabase exits early when mongoose is disconnected (1 ms)

#### eventController validation helpers
- [x] listLikedEvents rejects missing userId parameters (4 ms)
- [x] updateEvent rejects non-object payloads before hitting service (2 ms)

#### Event model hooks
- [x] save hook logs only when debug flags are enabled and always includes metadata (4 ms)
- [x] save hook tolerates missing IDs when logging (2 ms)
- [x] findOneAndUpdate hook guards against missing docs and logs payload metadata (1 ms)
- [x] findOneAndDelete hook only logs when a doc exists and uses safe id access (1 ms)
- [x] save error hook logs failures and forwards the error (1 ms)

#### eventService when MongoDB is disconnected
- [x] listEventsService returns an empty array (4 ms)
- [x] getEventByIdService returns null (1 ms)
- [x] updateEventService returns null (1 ms)
- [x] deleteEventService returns false (0 ms)
- [x] createEventService rejects with a database error (19 ms)

#### eventService when MongoDB is connected
- [x] listEventsService applies filters and normalizes results (2 ms)
- [x] listEventsService assigns "id" and removes __v from normalized docs (1 ms)
- [x] getEventByIdService returns a normalized document (1 ms)
- [x] getEventByIdService returns null when document is missing (7 ms)
- [x] getEventByIdService normalizes plain objects without toObject() (1 ms)
- [x] createEventService normalizes payload before persisting (1 ms)
- [x] createEventService trims category strings, filters blanks, and omits empty image URLs (0 ms)
- [x] createEventService trims category arrays and keeps non-string values intact (0 ms)
- [x] updateEventService normalizes category payloads and returns the updated event (0 ms)
- [x] updateEventService removes legacy categories field and filters entries (0 ms)
- [x] updateEventService returns null when no document matches the id (0 ms)
- [x] deleteEventService returns true when a document is removed (1 ms)
- [x] deleteEventService returns false when no document is removed (1 ms)
- [x] getLikedEventsByUserService returns empty array for missing or unknown user id (0 ms)
- [x] getLikedEventsByUserService only logs when a user id is provided (0 ms)

#### reviewService edge cases
- [x] createReviewService throws when the database is unavailable (9 ms)

#### deleteReviewService
- [x] returns false when the database is unavailable (3 ms)
- [x] returns true only when a document is deleted (1 ms)

#### getReviewedEventsByAccountService
- [x] database guard clauses { name: 'ensureEventExistsService', fn: [Function: fn], expected: null, spyFactory: [Function: spyFactory] } returns a fallback when Mongo is disconnected (1 ms)
- [x] database guard clauses { name: 'getReviewsByEventIdService', fn: [Function: fn], expected: [], spyFactory: [Function: spyFactory] } returns a fallback when Mongo is disconnected (1 ms)
- [x] database guard clauses { name: 'getReviewByIdService', fn: [Function: fn], expected: null, spyFactory: [Function: spyFactory] } returns a fallback when Mongo is disconnected (1 ms)
- [x] database guard clauses { name: 'getReviewByEventAndAccountService', fn: [Function: fn], expected: null, spyFactory: [Function: spyFactory] } returns a fallback when Mongo is disconnected (0 ms)
- [x] database guard clauses { name: 'updateReviewService', fn: [Function: fn], expected: null, spyFactory: [Function: spyFactory] } returns a fallback when Mongo is disconnected (1 ms)
- [x] getReviewByEventAndAccountService normalizes plain objects without mongoose helpers (1 ms)
- [x] createReviewService fills in optional fields when missing (2 ms)
- [x] returns empty array when the database is unavailable (1 ms)
- [x] returns empty array when no reviews exist for the account (0 ms)
- [x] summarizes reviews even when event metadata is missing (1 ms)

---

## Swagger & Status
- The endpoints above match the 1st Deliverable Swagger located at `docs/swaggerfile.json` for Accounts, Events, and Reviews. Auth was added to unblock the frontend even though it is outside the original spec.
- Features still pending from the specification (verification requests, reminders, follows, recommendations, global search) remain backlog items and are not exposed by the current code.
- Keep the spec in sync with future changes so graders can diff the API surface.

---

## Known Gaps / Next Steps
1. Implement a real "liked events" model so `GET /events/liked/:userId` returns data instead of an empty array.
2. Extend auth-protected routes to actually use `authenticate` and gate event creation/update/deletion by role.
3. Add email & password hashing to account creation (currently handled only via `auth/signup`).
4. Publish an updated Swagger export whenever new endpoints land to avoid drift.

