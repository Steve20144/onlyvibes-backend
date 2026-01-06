import http from 'k6/http';
import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';

// 1. Configuration / Options
export const options = {
  scenarios: {
    // Load Test: Steady ramp up to moderate load
    load_test: {
      executor: 'ramping-vus',
      startTime: '0s',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30 }, // Ramp to 30 VUs over 30s
        { duration: '60s', target: 30 }, // Hold at 30 VUs for 60s
        { duration: '30s', target: 0 },  // Ramp down
      ],
      gracefulStop: '10s',
    },
    // Spike Test: Sudden burst of traffic
    spike_test: {
      executor: 'ramping-vus',
      startTime: '2m10s', // Start after load test finishes (roughly)
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },  // Warm up slightly
        { duration: '10s', target: 80 },  // Spike to 80 VUs extremely fast
        { duration: '30s', target: 80 },  // Hold the spike
        { duration: '10s', target: 0 },   // Cool down
      ],
      gracefulStop: '10s',
    },
  },
  thresholds: {
    // Global thresholds
    http_req_failed: ['rate<0.01'], // Failure rate must be less than 1%
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

// 2. Data Generation (Shared Array for efficiency)
// We generate regular user data objects to be used during setup
const users = new SharedArray('users', function () {
  const userList = [];
  for (let i = 0; i < 200; i++) {
    // Generate enough users to pick from randomly
    userList.push({
      name: `Test User ${i}`,
      email: `testuser-${i}-${Date.now()}@example.com`,
      password: 'password123',
      role: 'user',
    });
  }
  return userList;
});

const BASE_URL = 'http://localhost:3000';

// 3. Setup: Create users in the DB via API
export function setup() {
  const createdIds = [];
  console.log('Setup: seeding users...');

  users.forEach((user) => {
    const res = http.post(
      `${BASE_URL}/accounts`,
      JSON.stringify(user),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 201) {
      const body = JSON.parse(res.body);
      // Assuming response structure: { data: { _id: "..." } } based on typical express patterns
      if (body.data && body.data._id) {
        createdIds.push(body.data._id);
      }
    } else {
      console.error(`Setup failed for user ${user.email}: ${res.status} ${res.body}`);
    }
  });

  console.log(`Setup finished. Created ${createdIds.length} users.`);
  return { createdIds };
}

// 4. Test Logic: Hit the endpoint
export default function (data) {
  // Pick a random user ID from the seeded list
  if (!data.createdIds || data.createdIds.length === 0) {
    // Fallback if setup failed entirely
    console.warn('No users created in setup phase!');
    sleep(1);
    return;
  }

  const randomId = data.createdIds[Math.floor(Math.random() * data.createdIds.length)];

  const res = http.get(`${BASE_URL}/accounts/${randomId}`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'content type is json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].indexOf('application/json') !== -1,
  });

  sleep(1);
}

// 5. Teardown: Clean up created users
export function teardown(data) {
  if (!data.createdIds || data.createdIds.length === 0) return;

  console.log(`Teardown: deleting ${data.createdIds.length} users...`);
  
  // We can process these in batches or parallelized if k6 supports it contextually,
  // but a simple loop works for functional cleanup.
  for (const id of data.createdIds) {
    const res = http.del(`${BASE_URL}/accounts/${id}`);
    if (res.status !== 200 && res.status !== 204) {
      console.error(`Failed to delete account ${id}: ${res.status}`);
    }
  }
}
