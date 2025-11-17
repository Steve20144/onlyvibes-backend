# OnlyVibes API

Production-ready Node.js/Express REST API for the OnlyVibes platform. The service exposes account, verification, event, review, notification, reminder, and search capabilities with basic authentication, role-based authorization, and graceful fallback to in-memory mock data when MongoDB isn’t configured.

## Features
- OpenAPI-aligned endpoints for accounts, events, reviews, notifications, reminders, likes, follows, and search
- Basic auth with role enforcement via `x-user-role` header for non-production testing
- Async/await controllers with centralized error handling and consistent response envelopes `{ success, data, message, error }`
- Toggle between MongoDB Atlas (or any Mongo instance) and mock data automatically by omitting `MONGO_URI`
- Express validation middleware powered by `express-validator`
- Helmet, CORS, and logging middleware for production readiness

## Getting Started

### Requirements
- Node.js 18+
- npm 9+
- (Optional) MongoDB connection string

### Installation
```bash
npm install
```

### Environment Variables
Copy `.env.example` to `.env` and adjust as needed.

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | API port | `4000` |
| `MONGO_URI` | Mongo connection string | _empty => mock mode_ |
| `BASIC_AUTH_USER` | Basic auth username | `onlyvibes` |
| `BASIC_AUTH_PASS` | Basic auth password | `supersecret` |
| `RECOMMENDATION_LIMIT` | Max recommendations returned | `5` |

### Running the API
```bash
npm run dev
```
The server logs whether it’s connected to MongoDB or running with mock data.

### Authentication & Roles
All endpoints require Basic Auth. Provide the acting role via the optional `x-user-role` header (`user`, `verified_user`, `venue`, `admin`). Example header:
```
Authorization: Basic b25seXZpYmVzOnN1cGVyc2VjcmV0
x-user-role: verified_user
```

### Testing
```bash
npm test
```

### Key Endpoints
- `POST /api/accounts` – Create account
- `GET /api/accounts/:userId` – View account profile
- `POST /api/accounts/:userId/verification-request` – Submit verification request
- `GET /api/accounts/:userId/recommendations` – Personalized recommendations
- `POST /api/accounts/:userId/follow` – Follow another user/venue
- `GET /api/events` – Browse events with filters
- `POST /api/events` – Create event (verified/venue/admin)
- `POST /api/events/:eventId/like` – Like an event
- `POST /api/events/:eventId/reviews` – Submit a review
- `GET /api/search` – Search events, venues, or users

## Development Notes
- Services abstract all data access and gracefully toggle between MongoDB and mock arrays.
- Controllers include exhaustive try/catch blocks and JSDoc comments per requirement.
- Middleware folder houses logging, auth, validation, not-found, and error handling utilities.

Enjoy building with OnlyVibes! 🎶
