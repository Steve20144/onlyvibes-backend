import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const EVENTS_PATH = '/events/';

// Spike test specific parameters
const SPIKE_VUS     = Number(__ENV.SPIKE_VUS    || 100);
const P95_MS_SPIKE  = Number(__ENV.P95_MS_SPIKE || 5000);
const SLEEP_SECONDS = Number(__ENV.SLEEP_SECONDS || 0.5);

// A small number of VUs for pre/post spike traffic
const NORMAL_VUS = Math.max(1, Math.ceil(SPIKE_VUS * 0.1));

export const options = {
    stages: [
        // Ramp up to a normal traffic level
        { duration: '5s', target: NORMAL_VUS },
        // Spike to a high number of VUs in a short time
        { duration: '2s', target: SPIKE_VUS },
        // Stay at peak load for a short duration
        { duration: '10s', target: SPIKE_VUS },
        // Ramp down to normal traffic to check recovery
        { duration: '5s', target: NORMAL_VUS },
        // Ramp down to 0
        { duration: '5s', target: 0 },
    ],
    thresholds: {
        'http_req_failed{endpoint:get_events_spike}': ['rate<0.05'], // Allow a slightly higher failure rate during spike
        'http_req_duration{endpoint:get_events_spike}': [`p(95)<${P95_MS_SPIKE}`],
        'checks{endpoint:get_events_spike}': ['rate>0.95'], // Checks should still be high
    },
};

export default function () {
	const url = `${BASE_URL}${EVENTS_PATH}`;
	const res = http.get(url, {
		tags: { endpoint: 'get_events_spike' },
	});

	const ok = check(
		res,
		{
			'status is 200': (r) => r.status === 200,
			'content-type is json': (r) => (r.headers['Content-Type'] || '').includes('application/json'),
			'response has success=true': (r) => r.json('success') === true,
			'response has data array': (r) => Array.isArray(r.json('data')),
		},
		{ endpoint: 'get_events_spike' }
	);

	sleep(SLEEP_SECONDS);
}
