
# **OnlyVibes Backend – MVP Implementation**


## Backend Workflow in Brief
1. `server.js` loads environment variables, opens the MongoDB connection defined in `config/database.js`, and starts the Express app.
2. `app.js` wires global middleware (CORS, JSON parsing, structured logging), health checks, and mounts feature routers (`/accounts`, `/events`, `/auth`, review routes with their own prefixes).
3. Each router calls its controller, which validates input, applies business rules, and delegates to a service.
4. Services encapsulate persistence: they call the Mongoose models (or fall back to mock data for accounts) and normalize `_id` ➜ `id` before returning to controllers.
5. Responses flow back through the controllers; any errors bubble into the shared error middleware, which formats consistent JSON payloads for clients.

This structure keeps HTTP concerns, business logic, and data access cleanly separated while matching the Swagger-first specification we used during Software Engineering I.

## Alignment with Course Instructions (Παραδοτέο 1)
The PDF requirements for the first deliverable (≥10 routes, CRUD coverage, ≥3 entities, mock data or DB, frontend-ready endpoints) map directly to our current backend:

- **≥10 routes with mixed verbs** – Implemented via the endpoints below (15 total):
    - Accounts: `POST /accounts`, `GET /accounts/:id`, `PUT /accounts/:id`, `DELETE /accounts/:id`
    - Events: `GET /events`, `GET /events/:id`, `POST /events`, `PUT /events/:id`, `DELETE /events/:id`, `GET /events/liked/:userId`
    - Reviews: `GET /events/:eventId/reviews`, `GET /events/:eventId/reviews/:reviewId`, `POST /events/:eventId/reviews`, `PUT /events/:eventId/reviews/:reviewId`, `DELETE /events/:eventId/reviews/:reviewId`, `GET /accounts/:accountId/reviewed-events`
    - Auth: `POST /auth/signup`, `POST /auth/login`
- **Full CRUD on a resource** – Accounts, Events and Reviews expose RESTful POST/GET/PUT/DELETE pairs, satisfying the “one resource fully testable” rule.
- **At least three interacting entities** – `Account`, `Event`, and `Review` schemas live in `src/models/` and are linked (e.g., `Review` references `eventId` and `accountId`, events store `creatorId`).
- **Mock data or MongoDB** – The project connects to MongoDB Atlas via Mongoose. For resilience, `accountService` falls back to the hardcoded `src/data/accounts.js`, letting the frontend fetch stable data even without a live database.
- **Frontend-ready endpoints** – Every required URI returns JSON with `{ success, data, message, error }` so the React client can consume the routes directly, covering the “frontend must call ≥5 endpoints” guideline.

---

# 🚀 **Features Implemented**

## ✅ **Accounts Module**

Supports full CRUD on accounts.

### **Endpoints**

| Method     | Endpoint        | Description               |
| ---------- | --------------- | ------------------------- |
| **POST**   | `/accounts`     | Create a new user account |
| **GET**    | `/accounts/:id` | Get account by ID         |
| **PUT**    | `/accounts/:id` | Update account            |
| **DELETE** | `/accounts/:id` | Delete account            |

> **Note:** Login route is not shown in the routes you sent. If you want it included, just tell me.

### **Entities Covered**

* `Account`
* `NewAccount`
* `UpdateAccount`

---

## ✅ **Events Module**

Full CRUD support + additional "liked events" endpoint.

### **Endpoints**

| Method     | Endpoint                | Description                         |
| ---------- | ----------------------- | ----------------------------------- |
| **GET**    | `/events`               | List all events (filters supported) |
| **GET**    | `/events/:id`           | Get event by ID                     |
| **POST**   | `/events`               | Create a new event                  |
| **PUT**    | `/events/:id`           | Update event details                |
| **DELETE** | `/events/:id`           | Delete an event                     |
| **GET**    | `/events/liked/:userId` | List events liked by a given user   |

### **Entities Covered**

* `Event`
* `EventCreate`
* `EventUpdate`

---

## ✅ **Reviews Module**

Mounted with `app.use(reviewRoutes);`, so the router defines its full paths.

### **Endpoints**

| Method     | Endpoint                                  | Description                                   |
| ---------- | ----------------------------------------- | --------------------------------------------- |
| **GET**    | `/events/:eventId/reviews`                 | List all reviews for a specific event         |
| **GET**    | `/events/:eventId/reviews/:reviewId`       | Get a single review for an event              |
| **POST**   | `/events/:eventId/reviews`                 | Create/submit a new review for an event       |
| **PUT**    | `/events/:eventId/reviews/:reviewId`       | Update an existing review                     |
| **DELETE** | `/events/:eventId/reviews/:reviewId`       | Delete a review                               |
| **GET**    | `/accounts/:accountId/reviewed-events`     | List all events that a specific user reviewed |

### **Entities Covered**

* `Review`
* `ReviewCreate`
* `ReviewUpdate`
* `ReviewedEventSummary`

---

# 📁 **Project Structure**

```
config/
└── database.js                # Single place that opens the Mongo connection

logs/
└── server.log                 # Output of the winston-style logger (rotated via utils/logger)

src/
├── app.js                     # Express app wiring middleware, health checks, routers
├── server.js                  # Entry point (dotenv + DB connection + app.listen)
├── controllers/
│   ├── accountController.js   # Accounts CRUD validation + service orchestration
│   ├── authController.js      # Signup/Login with bcrypt + JWT issuance
│   ├── eventController.js     # Event validation, ObjectId guards, liked-events placeholder
│   └── reviewController.js    # Review CRUD + event existence enforcement
├── data/
│   ├── accounts.js            # Hardcoded accounts array used when Mongo is unavailable
│   ├── events.js              # Legacy seed data (reference for frontend mocks)
│   ├── eventLikes.js          # Placeholder structure for liked events
│   └── reviews.js             # Legacy reviews seed data
├── middleware/
│   ├── auth.js                # Bearer-token guard that populates req.user
│   └── error.js               # Optional 404/error helpers (inline versions exist in app.js)
├── models/
│   ├── account.js             # Account schema with venue details & timestamps
│   ├── event.js               # Event schema + lifecycle debug hooks
│   └── review.js              # Review schema exposing reviewId/id
├── routes/
│   ├── accountRoutes.js       # Mounted on /accounts
│   ├── authRoutes.js          # Defines /auth/signup and /auth/login
│   ├── eventRoutes.js         # Mounted on /events (CRUD + liked)
│   └── reviewRoutes.js        # Full prefixed paths (/events/:eventId/...)
├── services/
│   ├── accountService.js      # Mongo-first CRUD with mock fallback
│   ├── eventService.js        # Mongo-only event persistence helpers
│   └── reviewService.js       # Mongo-only review persistence + aggregation
├── tests/
│   ├── accounts.test.js
│   ├── auth.test.js
│   ├── authMiddleware.test.js
│   ├── events.test.js
│   └── review.test.js         # Jest suites hitting controllers/services
└── utils/
    └── logger.js             # Shared logger used by middleware + services
```

---

# 🧪 **How to Run Locally**

1. **Install dependencies**

    ```bash
    npm install
    ```

2. **Configure environment variables**

    Create a `.env` file (or edit the existing one) with at least:

    ```bash
    PORT=3000
    MONGODB_URI=<your Mongo connection string>
    JWT_SECRET=<any strong secret>
    ```

    The server also respects optional flags like `DEBUG=true` or `DEBUG_EVENTS=true` for verbose logging. If you are running Mongo locally, set `MONGODB_URI=mongodb://127.0.0.1:27017/onlyvibes` (or your preferred database name).

3. **Run the API**

    ```bash
    npm start        # one-off run
    npm run dev      # auto-reload with nodemon
    ```

    The default base URL is `http://localhost:${PORT}` (3000 unless overridden).

4. **(Optional) Run the automated tests**

    ```bash
    npm test
    ```

    The Jest suites spin up an in-memory MongoDB instance, so no additional setup is needed.

---

# 📌 **Notes About This Build**

* Primary persistence is **MongoDB Atlas/local Mongo**, while `accountService` gracefully falls back to the mock dataset if the DB is offline (keeping endpoints responsive for the frontend demo).
* Authentication is handled with **JWTs** (`/auth/signup`, `/auth/login`) and protected routes can reuse `src/middleware/auth.js` to inspect `req.user`.
* Password hashing uses **bcrypt**; secrets (JWT, Mongo URI) must be provided through the `.env` file described above.
* Structured request logging lives in `utils/logger.js`, piping to `logs/server.log` plus console output for quick debugging.
* The Jest suites (`src/tests`) rely on `mongodb-memory-server`, so CI can run without provisioning Mongo manually.

---

# 📚 **Swagger Compatibility**

*Source:* `swagger-onlyvibes.json` (ΟpenAPI 3.0) from Παροδοτέο 1.

| Swagger area                                    | Current backend status |
| ----------------------------------------------- | ---------------------- |
| `/accounts` CRUD (`GET/PUT/DELETE /{userId}`, `POST /accounts`) | **Implemented** via `accountRoutes.js` (IDs map to Mongo `_id`). |
| `/events` CRUD + `/events/{eventId}/reviews`     | **Implemented** through `eventRoutes.js` and `reviewRoutes.js`, matching payload fields (`title`, `category`, `rating`, etc.). |
| `/auth` (not in Swagger 1.0)                     | **Added** to support JWT-based signup/login so the frontend can obtain tokens. |
| Verification requests, preferences, notifications, reminders, follow/follower, recommendations, search endpoints | **Not yet implemented**; backlog items for future sprints. Spec schemas (`VerificationRequestUpdate`, `Preferences`, `Reminder`, etc.) are preserved in the Swagger file for traceability. |

Key schema parity:

- `Account`, `NewAccount`, `UpdateAccount` map 1:1 to `src/models/account.js` (with extra `isVerified`, `venueDetails`).
- `Event`, `EventCreate`, `EventUpdate` map to `src/models/event.js`, with `category` normalized into arrays.
- `Review` & `ReviewCreate` match `src/models/review.js`, and we expose `reviewId` for backward compatibility as the spec expects.

When exporting an updated Swagger document, keep it in `/docs/swagger-onlyvibes.json` so CI and the graders can diff the API surface against the course specification.

