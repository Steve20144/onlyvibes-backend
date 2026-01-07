import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const EVENTS_PATH = '/events/';

const P95_MS = Number(__ENV.P95_MS || 500);
const TARGET_VUS = Number(__ENV.TARGET_VUS || 10);
const SLEEP_SECONDS = Number(__ENV.SLEEP_SECONDS || 1);

const WARMUP_VUS = Math.max(1, Math.ceil(TARGET_VUS * 0.2));

export const options = {
	stages: [
		{ duration: '10s', target: WARMUP_VUS },
		{ duration: '30s', target: TARGET_VUS },
		{ duration: '30s', target: TARGET_VUS },
		{ duration: '10s', target: 0 },
	],
	thresholds: {
		'http_req_failed{endpoint:get_events}': ['rate<0.01'],
		'http_req_duration{endpoint:get_events}': [`p(95)<${P95_MS}`],
		'checks{endpoint:get_events}': ['rate>0.99'],
	},
};

export default function () {
	const url = `${BASE_URL}${EVENTS_PATH}`;
	const res = http.get(url, {
		tags: { endpoint: 'get_events' },
	});

	const ok = check(
		res,
		{
			'status is 200': (r) => r.status === 200,
			'content-type is json': (r) => (r.headers['Content-Type'] || '').includes('application/json'),
			'response has success=true': (r) => r.json('success') === true,
			'response has data array': (r) => Array.isArray(r.json('data')),
			'response has message string': (r) => typeof r.json('message') === 'string',
			'response has error=null': (r) => r.json('error') === null,
		},
		{ endpoint: 'get_events' }
	);

	if (!ok) {
		// Still let the test continue; thresholds on checks decide pass/fail.
	}

	sleep(SLEEP_SECONDS);
}