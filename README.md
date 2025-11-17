## OnlyVibes Backend – Reviews Feature Branch

The **OnlyVibes** backend is a lightweight Express.js application that mirrors the provided Swagger specification using an in-memory store. This branch focuses on the **Review** entity while keeping the Accounts and Events flows from the main branch so that every route keeps functioning during feature development.

---

## 🚀 Features Implemented

### ✅ Accounts (Mock Auth)

| Endpoint | Description |
| --- | --- |
| `GET /accounts` | List mock accounts (admin preview) |
| `POST /accounts` | Create a new account (user / verified user / venue) |
| `POST /accounts/login` | Returns a mock token for demo flows |
| `GET /accounts/:userId` | Retrieve profile info |
| `PUT /accounts/:userId` | Update profile/preferences |
| `DELETE /accounts/:userId` | Remove an account |

### ✅ Events (Manage Events)

| Endpoint | Description |
| --- | --- |
| `GET /events` | List events with filters (`category`, `location`, `fromDate`, `toDate`, `sort`) |
| `POST /events` | Create event (verified users, venues, admins only) |
| `GET /events/:eventId` | Fetch single event |
| `PUT /events/:eventId` | Update event details |
| `DELETE /events/:eventId` | Delete event |

### ✅ Reviews (New Feature)

The Reviews module implements the user stories **S-11** and requirements **R-21** from the provided documents. It enforces “rating is mandatory”, ownership checks, and ensures only registered active users can contribute.

| Endpoint | Description |
| --- | --- |
| `GET /events/:eventId/reviews` | List all reviews for an event with total count |
| `POST /events/:eventId/reviews` | Create a review (requires `userId` + `rating`) |
| `GET /events/:eventId/reviews/:reviewId` | Fetch a single review |
| `PUT /events/:eventId/reviews/:reviewId` | Update rating/comment/media (requires owning `userId`) |
| `DELETE /events/:eventId/reviews/:reviewId` | Remove a review (requires owning `userId`) |

> **Business Rules encoded**
> * Users must exist and be `active`.
> * Rating must be between **1–5** and is mandatory on create.
> * Users can only update/delete their own reviews.

---

## 📁 Project Structure

```
src/
├── app.js                 # Express app + middleware registration
├── server.js              # Bootstraps HTTP server
├── controllers/
│   ├── accountController.js
│   ├── eventController.js
│   └── reviewController.js
├── routes/
│   ├── accountRoutes.js
│   ├── eventRoutes.js
│   └── reviewRoutes.js
├── services/
│   ├── accountServices.js
│   ├── eventServices.js
│   └── reviewServices.js  # Business rules for S-11 / R-21
├── models/
│   ├── account.js
│   ├── event.js
│   └── review.js          # Validation + normalization helpers
└── data/
        ├── accounts.js        # Mock users / venues / verified users
        ├── events.js          # Mock events aligned with swagger entities
        └── reviews.js         # In-memory storage for review flows
```

---

## 🧪 Running the Backend

```bash
npm install
npm start
```

The server listens on **http://localhost:3000** and exposes `/` as a health endpoint returning `{ name, status }`.

For live reload while developing:

```bash
npm run dev
```

---

## 🔍 Testing Review Scenarios Quickly

1. **List reviews**
     ```bash
     curl http://localhost:3000/events/event-1/reviews
     ```
2. **Create a review**
     ```bash
     curl -X POST http://localhost:3000/events/event-1/reviews \
         -H 'Content-Type: application/json' \
         -d '{"userId":"user-2","rating":5,"comment":"Loved it"}'
     ```
3. **Update/delete** include `userId` in the JSON body so the controller can enforce ownership.

---

## 📚 Swagger + Requirements Alignment

* Every route name and payload fields come from **swagger-onlyvibes.json**.
* Validation/authorization logic reflects **requirements-onlyvibes.json** and user stories (e.g., blocking review submissions without ratings, preventing anonymous edits, ensuring verified organizers for events).
* The in-memory data set mirrors the schemas (`Account`, `Event`, `Review`) so the frontend can integrate without additional mapping.

---

## ⚠️ Notes & Limitations

* Data resets on each restart; persistence/IDs are purely in-memory.
* Authentication is mock-only; include `userId` in review payloads to simulate logged-in actions.
* Passwords are stored in plain text because this is an MVP scaffold.
* Add your preferred DB / auth provider when moving beyond the prototype.

---

Happy building and keep the vibes high! ✨
