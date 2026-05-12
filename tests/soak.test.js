// ─────────────────────────────────────────────────────────────────────────────
// tests/soak.test.js
//
// TYPE     : Soak Test
// GOAL     : Detect memory leaks, resource exhaustion, and degradation over
//            a long duration at a comfortable (not extreme) load level.
//
// Scenario :
//   Ramp to a moderate 30 VUs and sustain for 2 hours.
//   Each VU alternates between all CRUD operations to exercise every code path.
//
// Tip: To run a shorter version during development, set env var:
//      k6 run -e SHORT=true tests/soak.test.js   (5 min total)
// ─────────────────────────────────────────────────────────────────────────────
import { sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { DEFAULT_THRESHOLDS } from '../config/env.js';
import { fullCrudCycle } from '../helpers/crud.js';

const soakDuration = new Trend('soak_cycle_duration_ms', true);
const errorRate = new Rate('soak_error_rate');

// Support a SHORT env-var for quick validation runs
const isShort = __ENV.SHORT === 'true';
const holdDuration = isShort ? '5m' : '2h';

export const options = {
    stages: [
        { duration: '2m', target: 30 },   // ramp up
        { duration: holdDuration, target: 30 },   // long hold (2 h or 5 m)
        { duration: '2m', target: 0 },   // ramp down
    ],
    thresholds: {
        ...DEFAULT_THRESHOLDS,
        // Soak-specific: response time must NOT degrade over time
        'http_req_duration': ['p(95)<2500', 'p(99)<4000'],
        'soak_cycle_duration_ms': ['p(95)<4000'],
        'soak_error_rate': ['rate<0.01'],
    },
};

export default function () {
    const start = Date.now();
    fullCrudCycle();
    soakDuration.add(Date.now() - start);
    sleep(2);  // 2 s sleep keeps each VU realistic without hammering at 30 VUs
}
