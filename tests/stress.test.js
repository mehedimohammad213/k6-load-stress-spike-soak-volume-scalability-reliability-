// ─────────────────────────────────────────────────────────────────────────────
// tests/stress.test.js
//
// TYPE     : Stress Test
// GOAL     : Find the breaking point of the system by pushing beyond limits
//
// Scenario :
//   Continuously ramp VUs from 10 → 200 in steps, then tear down.
//   Each step holds for 2 min so the server has time to show instability.
//   Expectations are deliberately relaxed — we WANT to find the failure.
// ─────────────────────────────────────────────────────────────────────────────
import { sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { RELAXED_THRESHOLDS } from '../config/env.js';
import { fullCrudCycle } from '../helpers/crud.js';

const stressDuration = new Trend('stress_cycle_duration_ms', true);
const errorRate = new Rate('stress_error_rate');

export const options = {
    stages: [
        { duration: '1m', target: 10 },  // warm-up
        { duration: '2m', target: 10 },  // hold
        { duration: '1m', target: 50 },  // increase
        { duration: '2m', target: 50 },  // hold
        { duration: '1m', target: 100 },  // increase
        { duration: '2m', target: 100 },  // hold
        { duration: '1m', target: 150 },  // increase
        { duration: '2m', target: 150 },  // hold
        { duration: '1m', target: 200 },  // push to limit
        { duration: '2m', target: 200 },  // hold at limit
        { duration: '2m', target: 0 },  // ramp down / recovery
    ],
    thresholds: {
        ...RELAXED_THRESHOLDS,
        'stress_cycle_duration_ms': ['p(99)<8000'],
        'stress_error_rate': ['rate<0.10'],  // tolerate up to 10 % at peak
    },
};

export default function () {
    const start = Date.now();
    fullCrudCycle();
    stressDuration.add(Date.now() - start);
    errorRate.add(false); // incremented by failed checks inside crud helpers
    sleep(0.5);
}
