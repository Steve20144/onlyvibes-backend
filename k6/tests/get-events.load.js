import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const EVENTS_PATH = '/events/';

// CI Regression Test Configuration (VU-driven; aligned with assignment wording)
// Calibrate these values after 5-6 runs on GitHub Actions runners.
const TARGET_VUS = Number(__ENV.TARGET_VUS || 160);
const SLEEP_SECONDS = Number(__ENV.SLEEP_SECONDS || 0);

const P95_MS = Number(__ENV.P95_MS || 1500);
const P99_MS = Number(__ENV.P99_MS || 2500);
const MAX_FAILURE_RATE = Number(__ENV.MAX_FAILURE_RATE || 0.02);
const REQUEST_TIMEOUT = String(__ENV.REQUEST_TIMEOUT || '10s'); // Fail fast on hangs/timeouts (k6 default is ~60s)

// "CI realistic" guardrails: prevent false-greens caused by an empty/tiny dataset in CI.
const REQUIRE_MIN_EVENTS = String(__ENV.REQUIRE_MIN_EVENTS || '1') === '1';
const MIN_EVENTS = Number(__ENV.MIN_EVENTS || 20);

const WARMUP_VUS = Math.max(1, Math.ceil(TARGET_VUS * 0.1));

export const options = {
	stages: [
		{ duration: '30s', target: WARMUP_VUS }, // Warm up
		{ duration: '1m', target: TARGET_VUS },  // Ramp to full load
		{ duration: '5m', target: TARGET_VUS },  // Stay at peak load
		{ duration: '30s', target: 0 },          // Cooldown
	],
	thresholds: {
		'http_req_failed{endpoint:get_events}': [`rate<${MAX_FAILURE_RATE}`],
		'http_req_duration{endpoint:get_events}': [
			`p(95)<${P95_MS}`,
			`p(99)<${P99_MS}`,
		],
		'checks{endpoint:get_events}': ['rate>0.99'],
	},
};

export default function () {
	const url = `${BASE_URL}${EVENTS_PATH}`;
	const res = http.get(url, {
		tags: { endpoint: 'get_events' },
		timeout: REQUEST_TIMEOUT,
	});

	const ok = check(
		res,
		{
			'status is 200': (r) => r.status === 200,
			'content-type is json': (r) => r.status === 200 && (r.headers['Content-Type'] || '').includes('application/json'),
			'response has success=true': (r) => r.status === 200 && r.json('success') === true,
			'response has data array': (r) => r.status === 200 && Array.isArray(r.json('data')),
			'response has >= MIN_EVENTS events': (r) => {
				if (!REQUIRE_MIN_EVENTS) return true;
				if (r.status !== 200) return false;
				const count = r.json('data.#');
				return typeof count === 'number' && count >= MIN_EVENTS;
			},
			'response has message string': (r) => r.status === 200 && typeof r.json('message') === 'string',
			'response has error=null': (r) => r.status === 200 && r.json('error') === null,
		},
		{ endpoint: 'get_events' }
	);

	sleep(SLEEP_SECONDS);
}