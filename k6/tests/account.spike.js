import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  // Spike Test: Assess system recovery after a sudden burst of activity
  stages: [
    { duration: "10s", target: 100 },  // Low level start
    { duration: "30s", target: 6000 }, // Massive spike!
    { duration: "1m",  target: 6000 }, // Stay at peak to test endurance under distress
    { duration: "30s", target: 100 },  // Quick scale down
    { duration: "20s", target: 0 },    // Stop
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],      // Allow slightly higher error rate (<5%) during spike
    http_req_duration: ["p(95)<2000"],   // Relaxed threshold during spike (2s)
  },
};

const BASE_URL = "http://localhost:3000";

export function setup() {
  const ids = [];
  const count = 50; 

  for (let i = 0; i < count; i++) {
    const payload = JSON.stringify({
      email: `k6_spike_${Date.now()}_${i}@example.com`,
      username: `k6-spike-${i}`,
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
         // ignore setup errors
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
  });

  sleep(1);
}
