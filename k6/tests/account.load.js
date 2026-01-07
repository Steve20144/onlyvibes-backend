// import http from "k6/http";
// import { check, sleep } from "k6";

// export const options = {
//   // Replace fixed 'vus' and 'duration' with stages
//   stages: [
//     { duration: "30s", target: 200 },  // Warm up to normal load
//     { duration: "1m",  target: 500 },  // Ramp to heavy load
//     { duration: "1m",  target: 1000 }, // Stress test
//     { duration: "1m",  target: 1500 }, // Breaking point search
//     { duration: "30s", target: 0 },    // Cooldown
//   ],
//   thresholds: {
//     http_req_failed: ["rate<0.01"],      // <1% errors
//     http_req_duration: ["p(95)<800"],    // 95% under 800ms
//   },
// };

// const BASE_URL = "http://localhost:3000";

// export function setup() {
//   const ids = [];
//   const count = 20; // small pool for CI

//   for (let i = 0; i < count; i++) {
//     // Create an account so we can GET it by Mongo _id
//     const payload = JSON.stringify({
//       email: `k6_${Date.now()}_${i}@example.com`,
//       username: `k6-user-${i}`,
//       password: "P@ssw0rd123!",
//       role: "user",
//     });

//     const res = http.post(
//       `${BASE_URL}/auth/signup`,
//       payload,
//       { headers: { "Content-Type": "application/json" } }
//     );

//     check(res, { "account created": (r) => r.status === 201 || r.status === 200 });

//     if (res.status === 201 || res.status === 200) {
//       try {
//         const body = res.json();
//         const id = body.user && body.user.id;
//         if (id) {
//           ids.push(String(id));
//         } else {
//           console.error(`Status ${res.status} but no user.id found in body: ${res.body}`);
//         }
//       } catch (e) {
//         console.error(`Failed to parse JSON for status ${res.status}: ${res.body}`);
//       }
//     } else {
//       console.error(`Failed to create account: ${res.status} ${res.body}`);
//     }
//   }

//   // If we failed to create any IDs, fail fast (better than silently testing 404s)
//   if (ids.length === 0) {
//     throw new Error("No account IDs were created in setup(). Check POST /auth/signup response/body.");
//   }

//   return { ids };
// }

// export default function (data) {
//   const ids = data.ids;
//   const id = ids[Math.floor(Math.random() * ids.length)];

//   const res = http.get(`${BASE_URL}/accounts/${id}`);

//   check(res, {
//     "GET /accounts/:id is 200": (r) => r.status === 200,
//     "has account data": (r) => r.json("data") !== undefined,
//   });

//   sleep(1);
// }
