import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  // Stress Test: Push the system beyond normal limits to find the breaking point.
  // Previous test showed 1500 VUs with ~22ms p(95), so we need significantly higher load.
  stages: [
    { duration: "30s", target: 500 },  // Fast Warm up
    { duration: "1m",  target: 2000 }, // Ramp to heavier load
    { duration: "2m",  target: 4000 }, // Push typically hard
    { duration: "2m",  target: 6000 }, // Push to potential breaking point
    { duration: "1m",  target: 0 },    // Cooldown
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],      // <1% errors
    http_req_duration: ["p(95)<1000"],   // Relaxed threshold for stress testing (1s)
  },
};

const BASE_URL = "http://localhost:3000";

export function setup() {
  const ids = [];
  const count = 50; // Increased pool for higher concurrency

  for (let i = 0; i < count; i++) {
    const payload = JSON.stringify({
      email: `k6_stress_${Date.now()}_${i}@example.com`,
      username: `k6-stress-${i}`,
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
        console.error(`Failed to parse JSON for status ${res.status}`);
      }
    }
  }

  if (ids.length === 0) {
    throw new Error("No account IDs were created in setup().");
  }

  return { ids };
}

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
