Primary Tests
Accounts API
✓ POST /accounts creates a new user account (213 ms)
✓ POST /accounts fails with invalid email (10 ms)
✓ POST /accounts fails with missing name (8 ms)
✓ POST /accounts fails when password is shorter than 4 chars (9 ms)
✓ POST /accounts fails with missing or invalid role (10 ms)
✓ POST /accounts creates a venue account with venue details (13 ms)
✓ POST /accounts rejects duplicate emails (11 ms)
✓ GET /accounts/:id returns an existing account (10 ms)
✓ GET /accounts/:id returns 404 for unknown id (8 ms)
✓ PUT /accounts/:id updates an account (12 ms)
✓ DELETE /accounts/:id removes an account (12 ms)
✓ PUT /accounts/:id returns 404 when account is missing (8 ms)
✓ PUT /accounts/:id fails with empty body (7 ms)
✓ PUT /accounts/:id rejects unknown fields (7 ms)
✓ PUT /accounts/:id enforces username length (5 ms)
✓ PUT /accounts/:id validates preferences array (6 ms)
✓ PUT /accounts/:id validates venueDetails object (6 ms)
✓ PUT /accounts/:id validates isVerified type (6 ms)
✓ PUT /accounts/:id rejects non-object payloads (6 ms)
✓ PUT /accounts/:id rejects invalid role updates (6 ms)
✓ DELETE /accounts/:id returns 404 when account is missing (6 ms)
✓ POST /accounts returns 503 when database is unavailable (7 ms)
✓ updateAccountService surfaces database errors (5 ms)
✓ updateAccountService normalizes the updated document on success (4 ms)
✓ deleteAccountService surfaces database errors (4 ms)
✓ deleteAccountService returns true when a document is deleted and false otherwise (4 ms)

App infrastructure endpoints
✓ GET /health returns service heartbeat payload (24 ms)
✓ request logging middleware masks sensitive fields before logging (19 ms)
✓ unknown routes trigger the JSON 404 handler (3 ms)
✓ centralized error handler surfaces status, message, and details (22 ms)

Auth API
✓ POST /auth/signup fails with missing fields (33 ms)
✓ POST /auth/signup persists user and returns JWT (95 ms)
✓ POST /auth/signup rejects duplicate emails (92 ms)
✓ POST /auth/login authenticates valid credentials (147 ms)
✓ POST /auth/login rejects invalid credentials (119 ms)

authenticate middleware
✓ returns 401 when Authorization header is missing (11 ms)
✓ returns 401 when Authorization header format is invalid (2 ms)
✓ returns 401 when token is invalid (17 ms)
✓ calls next and attaches user when token is valid (16 ms)

connectDB
✓ exits immediately when MONGO_URI is missing (5 ms)
✓ connects and logs success when MONGO_URI is present (2 ms)
✓ logs the error and exits when mongoose.connect rejects (2 ms)

dbHealth.isDbConnected
✓ returns true only when readyState equals 1 (3 ms)

Events API
✓ GET /events returns persisted events (211 ms)
✓ GET /events filters by category (16 ms)
✓ GET /events filters by location substring (case-insensitive) (14 ms)
✓ GET /events filters by category and location simultaneously (17 ms)
✓ GET /events with filters that match nothing returns friendly message (13 ms)
✓ GET /events with location filter and no results uses friendly message (13 ms)
✓ GET /events/:id returns the requested event (14 ms)
✓ GET /events returns "No events found." when there are no events (13 ms)
✓ GET /events/:id with invalid id format returns 400 (33 ms)
✓ GET /events/:id with missing event returns 404 (16 ms)
✓ POST /events requires a valid creatorId (32 ms)
✓ POST /events persists a new event when payload is valid (15 ms)
✓ POST /events defaults missing description to empty string (14 ms)
✓ POST /events rejects missing title (21 ms)
✓ POST /events rejects empty categories array (17 ms)
✓ POST /events normalizes category string input (14 ms)
✓ PUT /events/:id updates editable fields (15 ms)
✓ PUT /events/:id validates malformed dateTime (17 ms)
✓ PUT /events/:id rejects empty payloads (14 ms)
✓ PUT /events/:id allows null description by storing empty string (13 ms)
✓ PUT /events/:id rejects non-string description values (14 ms)
✓ PUT /events/:id accepts comma-separated category strings (12 ms)
✓ PUT /events/:id rejects invalid imageUrl types (16 ms)
✓ PUT /events/:id updates dateTime when provided a valid ISO string (13 ms)
✓ PUT /events/:id rejects unknown fields (14 ms)
✓ PUT /events/:id enforces trimmed title length (14 ms)
✓ PUT /events/:id rejects category arrays with non-string entries (13 ms)
✓ PUT /events/:id enforces location length requirements (15 ms)
✓ PUT /events/:id returns 404 for missing event (12 ms)
✓ PUT /events/:id with invalid id returns 400 (12 ms)
✓ DELETE /events/:id removes an existing event (12 ms)
✓ DELETE /events/:id with invalid id returns 400 (16 ms)
✓ DELETE /events/:id returns 404 for missing event (12 ms)
✓ GET /events/liked/:userId returns placeholder data set (9 ms)

Reviews API
✓ GET /events/:eventId/reviews returns reviews for event (217 ms)
✓ GET /events/:eventId/reviews returns friendly message when no reviews exist (20 ms)
✓ GET /events/:eventId/reviews validates the event id parameter (14 ms)
✓ GET /events/:eventId/reviews returns 404 when the event does not exist (13 ms)
✓ POST /events/:eventId/reviews creates a review (26 ms)
✓ POST /events/:eventId/reviews rejects duplicates (15 ms)
✓ POST /events/:eventId/reviews requires a valid accountId (12 ms)
✓ POST /events/:eventId/reviews enforces rating boundaries (12 ms)
✓ POST /events/:eventId/reviews returns 404 when event is missing (14 ms)
✓ GET /events/:eventId/reviews/:reviewId returns single review (16 ms)
✓ GET /events/:eventId/reviews/:reviewId validates the review id parameter (10 ms)
✓ GET /events/:eventId/reviews/:reviewId returns 404 when review is missing (12 ms)
✓ PUT /events/:eventId/reviews/:reviewId updates rating (18 ms)
✓ PUT /events/:eventId/reviews/:reviewId enforces rating boundaries (12 ms)
✓ PUT /events/:eventId/reviews/:reviewId returns 404 when review is missing (15 ms)
✓ PUT /events/:eventId/reviews/:reviewId replaces mediaUrls when provided as an array (17 ms)
✓ DELETE /events/:eventId/reviews/:reviewId removes review (20 ms)
✓ DELETE /events/:eventId/reviews/:reviewId returns 404 when review is missing (13 ms)
✓ GET /accounts/:accountId/reviewed-events returns summary (18 ms)
✓ GET /accounts/:accountId/reviewed-events returns friendly message when no reviews exist (13 ms)
✓ listReviewedEventsForAccount requires the accountId parameter (10 ms)

server bootstrap
✓ connects to the database and listens on the default port (12 ms)
✓ honors the PORT environment variable (4 ms)







---------------------------------------------------------------------------------------------------

Secondary Tests
createTestDb helper
✓ connect only spins up the MongoMemoryServer once (4 ms)
✓ clearDatabase exits early when mongoose is disconnected (1 ms)

eventController validation helpers
✓ listLikedEvents rejects missing userId parameters (4 ms)
✓ updateEvent rejects non-object payloads before hitting service (2 ms)

Event model hooks
✓ save hook logs only when debug flags are enabled and always includes metadata (4 ms)
✓ save hook tolerates missing IDs when logging (2 ms)
✓ findOneAndUpdate hook guards against missing docs and logs payload metadata (1 ms)
✓ findOneAndDelete hook only logs when a doc exists and uses safe id access (1 ms)
✓ save error hook logs failures and forwards the error (1 ms)

eventService when MongoDB is disconnected
✓ listEventsService returns an empty array (4 ms)
✓ getEventByIdService returns null (1 ms)
✓ updateEventService returns null (1 ms)
✓ deleteEventService returns false (0 ms)
✓ createEventService rejects with a database error (19 ms)

eventService when MongoDB is connected
✓ listEventsService applies filters and normalizes results (2 ms)
✓ listEventsService assigns "id" and removes __v from normalized docs (1 ms)
✓ getEventByIdService returns a normalized document (1 ms)
✓ getEventByIdService returns null when document is missing (7 ms)
✓ getEventByIdService normalizes plain objects without toObject() (1 ms)
✓ createEventService normalizes payload before persisting (1 ms)
✓ createEventService trims category strings, filters blanks, and omits empty image URLs (0 ms)
✓ createEventService trims category arrays and keeps non-string values intact (0 ms)
✓ updateEventService normalizes category payloads and returns the updated event (0 ms)
✓ updateEventService removes legacy categories field and filters entries (0 ms)
✓ updateEventService returns null when no document matches the id (0 ms)
✓ deleteEventService returns true when a document is removed (1 ms)
✓ deleteEventService returns false when no document is removed (1 ms)
✓ getLikedEventsByUserService returns empty array for missing or unknown user id (0 ms)
✓ getLikedEventsByUserService only logs when a user id is provided (0 ms)

reviewService edge cases
✓ createReviewService throws when the database is unavailable (9 ms)

deleteReviewService
✓ returns false when the database is unavailable (3 ms)
✓ returns true only when a document is deleted (1 ms)

getReviewedEventsByAccountService
✓ database guard clauses {
  name: 'ensureEventExistsService',
  fn: [Function: fn],
  expected: null,
  spyFactory: [Function: spyFactory]
} returns a fallback when Mongo is disconnected (1 ms)
✓ database guard clauses {
  name: 'getReviewsByEventIdService',
  fn: [Function: fn],
  expected: [],
  spyFactory: [Function: spyFactory]
} returns a fallback when Mongo is disconnected (1 ms)
✓ database guard clauses {
  name: 'getReviewByIdService',
  fn: [Function: fn],
  expected: null,
  spyFactory: [Function: spyFactory]
} returns a fallback when Mongo is disconnected (1 ms)
✓ database guard clauses {
  name: 'getReviewByEventAndAccountService',
  fn: [Function: fn],
  expected: null,
  spyFactory: [Function: spyFactory]
} returns a fallback when Mongo is disconnected (0 ms)
✓ database guard clauses {
  name: 'updateReviewService',
  fn: [Function: fn],
  expected: null,
  spyFactory: [Function: spyFactory]
} returns a fallback when Mongo is disconnected (1 ms)
✓ getReviewByEventAndAccountService normalizes plain objects without mongoose helpers (1 ms)
✓ createReviewService fills in optional fields when missing (2 ms)
✓ returns empty array when the database is unavailable (1 ms)
✓ returns empty array when no reviews exist for the account (0 ms)
✓ summarizes reviews even when event metadata is missing (1 ms)
