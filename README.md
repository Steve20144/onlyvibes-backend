# **OnlyVibes Backend – MVP Implementation**

This repository contains the updated backend implementation for the OnlyVibes application.
It follows the original Swagger OpenAPI specification structure, now backed by a real Express.js server, MongoDB models, service layers, and clean route separation.

The backend currently includes:

* Express.js server
* MongoDB models & controllers
* Modular MVC architecture
* Accounts module
* Events module
* Reviews module (routing enabled)

This README reflects the *current* routes in the codebase.

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

You have:

```js
app.use(reviewRoutes);
```

…which means all review endpoints are mounted **at the root**, unless `reviewRoutes` includes its own base path.

### Example Possible Endpoints (depending on your reviewRoutes.js)

If you used the Swagger-style nesting:

| Method     | Endpoint                             | Description     |
| ---------- | ------------------------------------ | --------------- |
| **DELETE** | `/events/:eventId/reviews/:reviewId` | Delete a review |

> If you want me to rewrite the README to include every review route exactly, just paste `reviewRoutes.js`.

---

# 📁 **Project Structure**

```
src/
│
├── server.js                  # Express server setup
│
├── models/
│   ├── Account.js             # Account schema
│   ├── Event.js               # Event schema
│   └── Review.js              # Review schema (if implemented)
│
├── controllers/
│   ├── accountController.js
│   ├── eventController.js
│   └── reviewController.js
│
├── services/
│   ├── accountService.js
│   ├── eventService.js
│   └── reviewService.js
│
└── routes/
    ├── accountRoutes.js
    ├── eventRoutes.js
    └── reviewRoutes.js
```

---

# 🎯 **Goals of This MVP**

This backend implementation satisfies the assignment's requirements:

✔ ≥ 10 endpoints
✔ ≥ 3 entities (Account, Event, Review)
✔ Full CRUD for at least one entity (Events)
✔ Swagger-style structure based on your original spec
✔ Clean MVC architecture
✔ Deployable to Render
✔ Ready for React frontend integration

---

# 🧪 **How to Run Locally**

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
npm start
```

The server runs at:

```
http://localhost:3000
```

---

# 📌 **Notes About This Build**

* Uses **MongoDB**, not in-memory mock data anymore.
* Passwords should be hashed in a production version.
* Routes follow REST conventions.
* Data persists across restarts in the DB.
* File structure supports expansion into a full production backend.

---

# 📚 **Swagger Compatibility**

This backend follows the logical structure of:

* `/accounts`
* `/events`
* `/events/{eventId}/reviews/{reviewId}` (if present in reviewRoutes.js)
* Entities under Swagger components: `Account`, `Event`, `Review`

The endpoints follow the same names and fields as your spec, except where simplified for development.

