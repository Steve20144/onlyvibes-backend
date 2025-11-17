import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

// Use credentials from .env.example: onlyvibes:supersecret
const authUser = 'onlyvibes';
const authPass = 'supersecret';
const headers = { 'x-user-role': 'user' };

test('Review endpoints: create, list, get, update, delete (e2e)', async (t) => {
  let newReviewId;
  const eventId = 'evt-001'; // exists in mock data

  // 1) Create a review
  const createRes = await request(app)
    .post(`/api/events/${eventId}/reviews`)
    .auth(authUser, authPass)
    .set(headers)
    .send({ userId: 'acct-001', rating: 5, comment: 'Awesome event!', mediaUrls: [] });

  assert.equal(createRes.status, 201, 'Expected status 201 for review creation');
  assert.equal(createRes.body.success, true);
  assert.ok(createRes.body.data.id, 'Created review should have an id');
  newReviewId = createRes.body.data.id;

  // 2) List reviews for event and confirm the new review is present
  const listRes = await request(app)
    .get(`/api/events/${eventId}/reviews`)
    .auth(authUser, authPass)
    .set(headers);

  assert.equal(listRes.status, 200);
  assert.equal(listRes.body.success, true);
  assert.ok(Array.isArray(listRes.body.data));
  assert.ok(listRes.body.data.some((r) => r.id === newReviewId), 'New review is included in list');

  // 3) Get specific review
  const getRes = await request(app)
    .get(`/api/events/${eventId}/reviews/${newReviewId}`)
    .auth(authUser, authPass)
    .set(headers);

  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.success, true);
  assert.equal(getRes.body.data.id, newReviewId);
  assert.equal(getRes.body.data.rating, 5);

  // 4) Update the review
  const updateRes = await request(app)
    .put(`/api/events/${eventId}/reviews/${newReviewId}`)
    .auth(authUser, authPass)
    .set(headers)
    .send({ rating: 4, comment: 'Edited: still good' });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);
  assert.equal(updateRes.body.data.rating, 4);
  assert.equal(updateRes.body.data.comment, 'Edited: still good');

  // 5) Delete the review
  const deleteRes = await request(app)
    .delete(`/api/events/${eventId}/reviews/${newReviewId}`)
    .auth(authUser, authPass)
    .set(headers);

  assert.ok([200, 204].includes(deleteRes.status), 'Delete should return 200 or 204');

  // 6) Confirm deletion returns 404
  const missingRes = await request(app)
    .get(`/api/events/${eventId}/reviews/${newReviewId}`)
    .auth(authUser, authPass)
    .set(headers);

  assert.equal(missingRes.status, 404);
  assert.equal(missingRes.body.success, true);
  assert.equal(missingRes.body.data, null);
});
