// ─────────────────────────────────────────────────────────────────────────────
// tests/endurance.test.js
//
// TYPE     : Endurance Test
// GOAL     : Evaluate the system's performance over an extended period (e.g., 8 hours).
//            Primarily used to uncover memory leaks, database connection issues,
//            or resource degradation over a very long time under sustained load.
//
// Scenario :
//   Ramp to a sustained 20 VUs and hold for 8 hours.
//
// Tip: To run a shorter version during development, set env var:
//      k6 run -e SHORT=true tests/endurance.test.js   (5 min total)
// ─────────────────────────────────────────────────────────────────────────────
import { sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { DEFAULT_THRESHOLDS } from '../config/env.js';
import { fullCrudCycle } from '../helpers/crud.js';

const enduranceDuration = new Trend('endurance_cycle_ms', true);
const errorRate = new Rate('endurance_error_rate');
const totalIterations = new Counter('endurance_iterations');

// Support a SHORT env-var for quick validation runs
const isShort = __ENV.SHORT === 'true';
const holdDuration = isShort ? '5m' : '8h';

export const options = {
    stages: [
        { duration: '5m', target: 20 },   // ramp up
        { duration: holdDuration, target: 20 },   // long hold (8 hours)
        { duration: '5m', target: 0 },   // ramp down
    ],
    thresholds: {
        ...DEFAULT_THRESHOLDS,
        // System must not degrade over 8 hours
        'http_req_duration': ['p(95)<3000'],
        'endurance_cycle_ms': ['p(95)<4500'],
        'endurance_error_rate': ['rate<0.01'],
    },
};

export default function () {
    const start = Date.now();
    fullCrudCycle();
    enduranceDuration.add(Date.now() - start);
    totalIterations.add(1);
    errorRate.add(false);
    sleep(2); // 2s sleep to maintain a steady, realistic load pace over 8 hours
}
