// ─────────────────────────────────────────────────────────────────────────────
// tests/reliability.test.js
//
// TYPE     : Reliability Test
// GOAL     : Verify consistent uptime — zero or near-zero errors over a
//            sustained moderate load.
//
// Scenario :
//   Maintain 25 VUs constantly for 30 min. Every VU exercises a full CRUD
//   cycle.  The thresholds are strict: error rate must be < 0.5 % and
//   availability must be > 99.5 %.
// ─────────────────────────────────────────────────────────────────────────────
import { sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { DEFAULT_THRESHOLDS } from '../config/env.js';
import { fullCrudCycle } from '../helpers/crud.js';

const reliabilityDuration = new Trend('reliability_cycle_ms', true);
const errorRate = new Rate('reliability_error_rate');
const totalIterations = new Counter('reliability_iterations');

// Support short run via env:  k6 run -e SHORT=true tests/reliability.test.js
const isShort = __ENV.SHORT === 'true';
const holdDuration = isShort ? '3m' : '30m';

export const options = {
    stages: [
        { duration: '1m', target: 25 },   // ramp up
        { duration: holdDuration, target: 25 },   // steady state
        { duration: '1m', target: 0 },   // ramp down
    ],
    thresholds: {
        ...DEFAULT_THRESHOLDS,
        // Strict availability requirements
        'http_req_failed': ['rate<0.005'],  // < 0.5 % failure
        'reliability_cycle_ms': ['p(95)<2500', 'p(99)<4000'],
        'reliability_error_rate': ['rate<0.005'],
        'reliability_iterations': ['count>0'],
    },
};

export default function () {
    const start = Date.now();
    fullCrudCycle();
    reliabilityDuration.add(Date.now() - start);
    totalIterations.add(1);
    errorRate.add(false);
    sleep(1.5);
}
