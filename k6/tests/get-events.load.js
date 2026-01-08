import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const EVENTS_PATH = '/events/';

// CI Regression Test Configuration
// Calibrate these values after 5-6 runs on GitHub Actions runners
const TARGET_RPS = Number(__ENV.TARGET_RPS || 100);               // Target: 100 requests/sec at peak
const P95_MS = Number(__ENV.P95_MS || 1500);                      // Initial p95 threshold (relax for calibration)
const P99_MS = Number(__ENV.P99_MS || 2500);                      // Initial p99 threshold
const MAX_FAILURE_RATE = Number(__ENV.MAX_FAILURE_RATE || 0.02);  // Allow 2% failures initially (tighten after calibration)
const REQUEST_TIMEOUT = String(__ENV.REQUEST_TIMEOUT || '10s');    // Fail fast on hangs/timeouts (k6 default is ~60s)

// "CI realistic" guardrails: prevent false-greens caused by an empty/tiny dataset in CI.
const REQUIRE_MIN_EVENTS = String(__ENV.REQUIRE_MIN_EVENTS || '1') === '1';
const MIN_EVENTS = Number(__ENV.MIN_EVENTS || 20);

const WARMUP_RPS = Math.max(1, Math.ceil(TARGET_RPS * 0.1)); // 10% of peak for warmup (10 RPS)

export const options = {
	scenarios: {
		load_test: {
			executor: 'ramping-arrival-rate',
			startRate: WARMUP_RPS,
			timeUnit: '1s',
			preAllocatedVUs: 30,   // Pre-allocate to avoid init lag
			maxVUs: 300,           // Upper limit; k6 scales VUs to hit RPS target
			stages: [
				{ duration: '30s', target: WARMUP_RPS }, // Warm up at 10 RPS
				{ duration: '1m',  target: TARGET_RPS }, // Ramp to 100 RPS
				{ duration: '5m',  target: TARGET_RPS }, // Hold at 100 RPS (sustained load)
				{ duration: '30s', target: 0 },          // Cooldown
			],
		},
	},
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

	// No sleep() needed: ramping-arrival-rate paces requests automatically to hit target RPS
}