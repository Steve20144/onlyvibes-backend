import http from 'k6/http';
import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';

// 1. Configuration / Options
export const options = {
  scenarios: {
    // Breakpoint Test: Ramp up until failure
    breakpoint_test: {
      executor: 'ramping-vus',
      startTime: '0s',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },   // Warm up
        { duration: '2m', target: 500 },  // High Load
        { duration: '2m', target: 1000 }, // Stress Zone (Likely 4-core limit for Node/Mongo)
        { duration: '2m', target: 2000 }, // Breakpoint Zone
      ],
      gracefulStop: '30s',
    },
  },
  thresholds: {
    // We don't want to fail early, we want to see how high we get.
    // However, we track these metrics to see when they cross acceptable lines.
    http_req_failed: ['rate<0.01'], 
    http_req_duration: ['p(95)<5000'], // 5 seconds latency is the "unusable" line
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

  // Limit setup to fewer users to save time/resources in CI
  const setupUsers = users.slice(0, 50); 

  setupUsers.forEach((user) => {
    const res = http.post(
      `${BASE_URL}/auth/signup`, // CHANGED: typically users are created via signup, or adjust if accounts/ is correct
      JSON.stringify(user),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 201 || res.status === 200) {
      const body = JSON.parse(res.body);
      // Adjust based on your actual API response for signup/create
      const id = body.data?.user?._id || body.data?._id; 
      if (id) {
        createdIds.push(id);
      }
    } else {
       // Optional: ignore 409 conflict if user already exists
       if(res.status !== 409) {
          console.error(`Setup failed for user ${user.email}: ${res.status}`);
       }
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
  
  for (const id of data.createdIds) {
    const res = http.del(`${BASE_URL}/accounts/${id}`);
    if (res.status !== 200 && res.status !== 204) {
      console.error(`Failed to delete account ${id}: ${res.status}`);
    }
  }
}

