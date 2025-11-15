## OnlyVibes Backend – MVP Implementation

This repository contains the **MVP backend** for the *OnlyVibes* application.
It is designed according to the **Swagger OpenAPI specification** provided in the assignment and includes:

* Minimal Express.js server
* In-memory mock database (no real DB)
* Accounts module (Sign Up + Login)
* Events module (Create, List, Edit, Delete)
* Reviews module (Delete review)
* Fully structured MVC file tree

This backend is intentionally lightweight and mock-based to satisfy the requirements of the first deliverable.

---

## 🚀 Features Implemented (MVP)

### ✅ Authentication / Accounts

Implemented using mock data (no hashing, no tokens):

| Endpoint               | Description                         |
| ---------------------- | ----------------------------------- |
| `POST /accounts`       | Create a new user account (Sign Up) |
| `POST /accounts/login` | Mock login (email + password)       |
| `GET /accounts/:id`    | Get account by ID                   |
| `PUT /accounts/:id`    | Update account fields               |
| `DELETE /accounts/:id` | Delete account                      |

**Entities covered:** `Account`, `NewAccount`, `UpdateAccount`

---

### ✅ Events (Main MVP feature)

Endpoints fully aligned with Swagger:

| Endpoint                  | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `GET /events`             | Get all events (with filters) — used for the Main Screen |
| `POST /events`            | Create an event — used for Create Event page             |
| `GET /events/:eventId`    | Get event by ID — used before editing                    |
| `PUT /events/:eventId`    | Edit event details — used for Verified User Edit page    |
| `DELETE /events/:eventId` | Delete an event                                          |

**Entities covered:** `Event`, `EventCreate`

Filtering is supported for:
`category`, `location`, `fromDate`, `toDate`, `sort`.

---

### ✅ Reviews (MVP action)


**TBD**

---

## 📁 Project Structure

```
src/
│
├── app.js                 # Express server setup
├── data/
│   ├── accounts.js        # Mock user data
│   └── events.js          # Mock event data
│
├── models/
│   ├── account.js         # Account model + validators
│   └── event.js           # Event model + validators
│
├── controllers/
│   ├── accountController.js
│   └── eventController.js
│
└── routes/
    ├── accountRoutes.js
    └── eventRoutes.js
```

---

## 🎯 Goals of This MVP

This implementation satisfies the requirements of the assignment:

### ✔ ≥ 10 routes

### ✔ ≥ 3 different entities

### ✔ Full CRUD for at least one entity (“events”)

### ✔ Swagger-based structure

### ✔ Clean router–controller–model architecture

### ✔ Ready for frontend integration (React or other)

---

## 🧪 How to Run the Backend

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
npm start
```

The server runs on:

```
http://localhost:3000
```

---

## 📌 Notes About This MVP

* No database is used — all data is in-memory.
* Passwords are stored in plain text **only for mock/demo purposes**.
* Login returns a *mock token* for frontend convenience.
* When the server restarts, all data resets.
* The directory structure is built to support easy expansion for the full project.

---

## 📚 Swagger Compatibility

This backend is written directly from your **Swagger JSON spec**, particularly the sections for:

* `/accounts`
* `/events`
* `/events/{eventId}/reviews/{reviewId}`
* Entities under `components.schemas` (Account, Event, Review, EventCreate, etc.)

Endpoints follow the same naming, fields, and expected responses (except where simplifications were required for an MVP mock backend).

---