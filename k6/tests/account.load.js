import http from "k6/http";
import { check, sleep } from "k6";

/**
 * k6 Options
 *
 * @property {object[]} stages - An array of objects that specify the virtual user (VU) load progression.
 * @property {string} stages[].duration - The duration for which the VUs will be active.
 * @property {number} stages[].target - The number of VUs to ramp up or down to.
 * @property {object} thresholds - An object that defines the pass/fail criteria for the test.
 * @property {string[]} http_req_failed - An array with the failure rate threshold for HTTP requests.
 * @property {string[]} http_req_duration - An array with the duration threshold for HTTP requests.
 */
export const options = {
  // Load Test: Simulate a typical heavy usage scenario (500 users)
  stages: [
    { duration: "30s", target: 50 },   // Warm up
    { duration: "1m",  target: 500 },  // Ramp to full load
    { duration: "3m",  target: 500 },  // Stay at peak load
    { duration: "30s", target: 0 },    // Cooldown
  ],
  thresholds: {
    "http_req_failed": ["rate<0.01"],      // <1% errors
    "http_req_duration": ["p(95)<500"],    // 95% of requests should be under 500ms
  },
};

const BASE_URL = "http://localhost:3000";

/**
 * Sets up the test by creating a specified number of user accounts.
 *
 * @returns {object} An object containing an array of created account IDs.
 * @throws {Error} If no account IDs were created during setup.
 */
export function setup() {
  const ids = [];
  const count = 50; 

  for (let i = 0; i < count; i++) {
    const payload = JSON.stringify({
      email: `k6_load_${Date.now()}_${i}@example.com`,
      username: `k6-load-${i}`,
      password: "P@ssw0rd123!",
      role: "user",
    });

    const res = http.post(
      `${BASE_URL}/auth/signup`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    if (res.status === 201 || res.status === 200) {
      try {
        const body = res.json();
        const id = body.user && body.user.id;
        if (id) {
          ids.push(String(id));
        }
      } catch (e) {
          // ignore setup details
      }
    }
  }

  if (ids.length === 0) {
    throw new Error("No account IDs were created in setup().");
  }

  return { ids };
}

/**
 * The main test function that is executed by each VU.
 *
 * @param {object} data - The data returned from the setup function.
 */
export default function (data) {
  const ids = data.ids;
  const id = ids[Math.floor(Math.random() * ids.length)];

  const res = http.get(`${BASE_URL}/accounts/${id}`);

  check(res, {
    "GET /accounts/:id is 200": (r) => r.status === 200,
    "has account data": (r) => r.json("data") !== undefined,
  });

  sleep(1);
}
