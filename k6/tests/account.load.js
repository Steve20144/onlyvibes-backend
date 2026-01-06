import http from 'k6/http';
import { sleep } from 'k6';
import { SharedArray } from 'k6/data';

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

  users.forEach((user) => {
    const res = http.post(
      'http://localhost:3000/accounts',
      JSON.stringify(user),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 201) {
      const data = JSON.parse(res.body);
      accountIds.push(data.data._id);
    }
  });

  return { accountIds };
}

export default function (data) {
  const randomId =
    data.accountIds[Math.floor(Math.random() * data.accountIds.length)];

  http.get(`http://localhost:3000/accounts/${randomId}`);
  sleep(1);
}

export function teardown(data) {
  if (!data || !data.accountIds) return;

  data.accountIds.forEach((id) => {
    const res = http.del(`http://localhost:3000/accounts/${id}`);
    if (res.status !== 204 && res.status !== 200) {
      console.error(`Failed to delete account ${id}, status: ${res.status}`);
    }
  });
}
