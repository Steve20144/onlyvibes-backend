import http from 'k6/http';
import { sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 15 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },

    spike_test: {
      executor: 'ramping-vus',
      startTime: '90s',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '5s', target: 50 },
        { duration: '15s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const users = new SharedArray('users', function () {
  const userList = [];
  for (let i = 0; i < 200; i++) {
    userList.push({
      name: `k6-user-${i}`,
      email: `k6user${i}@test.com`,
      password: `password${i}`,
      role: 'user',
    });
  }
  return userList;
});

export function setup() {
  const accountIds = [];

  for (const user of users) {
    const res = http.post(`${BASE_URL}/accounts`, JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'POST /accounts' },
    });

    if (res.status === 201) {
      try {
        const body = JSON.parse(res.body);
        // expecting: { data: { _id: "..." } }
        const id = body?.data?._id;
        if (id) accountIds.push(id);
      } catch (_) {
        // ignore JSON parse errors; will just reduce the available IDs
      }
    }
  }

  return { accountIds };
}

export default function (data) {
  if (!data?.accountIds?.length) {
    // If setup failed to create users, avoid spamming bad requests
    sleep(1);
    return;
  }

  const randomId =
    data.accountIds[Math.floor(Math.random() * data.accountIds.length)];

  http.get(`${BASE_URL}/accounts/${randomId}`, {
    tags: { name: 'GET /accounts/:id' },
  });

  sleep(1);
}

export function teardown(data) {
  if (!data?.accountIds?.length) return;

  for (const id of data.accountIds) {
    const res = http.del(`${BASE_URL}/accounts/${id}`, null, {
      tags: { name: 'DELETE /accounts/:id' },
    });

    if (res.status !== 204 && res.status !== 200) {
      console.error(`Failed to delete account ${id}, status: ${res.status}`);
    }
  }
}
