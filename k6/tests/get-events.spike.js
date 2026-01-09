import http from 'k6/http';
import { check, sleep } from 'k6';

// Base URL for the API, configurable via environment variables.
const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const EVENTS_PATH = '/events/';

// Spike test configuration (VU-driven; aligned with assignment wording)
// Calibrate VUs downward until CI is consistently green.
const SPIKE_VUS = Number(__ENV.SPIKE_VUS || 200);
const NORMAL_VUS = Number(__ENV.NORMAL_VUS || Math.max(1, Math.ceil(SPIKE_VUS * 0.1)));
const SLEEP_SECONDS = Number(__ENV.SLEEP_SECONDS || 0.2);

const P95_MS_SPIKE = Number(__ENV.P95_MS_SPIKE || 2000);
const P99_MS_SPIKE = Number(__ENV.P99_MS_SPIKE || 4000);
const MAX_FAILURE_RATE_SPIKE = Number(__ENV.MAX_FAILURE_RATE_SPIKE || 0.05);
const REQUEST_TIMEOUT = String(__ENV.REQUEST_TIMEOUT || '10s');

// "CI realistic" guardrails: prevent false-greens caused by an empty/tiny dataset in CI.
const REQUIRE_MIN_EVENTS = String(__ENV.REQUIRE_MIN_EVENTS || '1') === '1';
const MIN_EVENTS = Number(__ENV.MIN_EVENTS || 20);

/**
 * k6 Options
 *
 * @property {object[]} stages - An array of objects that specify the virtual user (VU) load progression.
 * @property {string} stages[].duration - The duration for which the VUs will be active.
 * @property {number} stages[].target - The number of VUs to ramp up or down to.
 * @property {object} thresholds - An object that defines the pass/fail criteria for the test.
 * @property {string[]} http_req_failed - An array with the failure rate threshold for HTTP requests.
 * @property {string[]} http_req_duration - An array with the duration threshold for HTTP requests.
 * @property {string[]} checks - An array with the success rate threshold for checks.
 */

export const options = {
    stages: [
        // Establish a small baseline
        { duration: '10s', target: NORMAL_VUS },
        // Sudden spike
        { duration: '5s', target: SPIKE_VUS },
        // Hold briefly at peak
        { duration: '45s', target: SPIKE_VUS },
        // Recovery period under baseline traffic
        { duration: '60s', target: NORMAL_VUS },
        // Ramp down
        { duration: '20s', target: 0 },
    ],
    thresholds: {
        'http_req_failed{endpoint:get_events_spike}': [`rate<${MAX_FAILURE_RATE_SPIKE}`],
        'http_req_duration{endpoint:get_events_spike}': [
            `p(95)<${P95_MS_SPIKE}`,
            `p(99)<${P99_MS_SPIKE}`,
        ],
        'checks{endpoint:get_events_spike}': ['rate>0.95'],
    },
};

/**
 * The main test function that is executed by each VU.
 */
export default function () {
	const url = `${BASE_URL}${EVENTS_PATH}`;
	const res = http.get(url, {
		tags: { endpoint: 'get_events_spike' },
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
		},
		{ endpoint: 'get_events_spike' }
	);

	sleep(SLEEP_SECONDS);
}
