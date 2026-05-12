// ─────────────────────────────────────────────────────────────────────────────
// tests/scalability.test.js
//
// TYPE     : Scalability Test
// GOAL     : Verify the system scales linearly — doubling VUs should NOT
//            more than double response time.
//
// Scenario :
//   Step through increasing VU levels (10 → 20 → 40 → 80 → 160).
//   Each step holds for 2 min so we can compare metrics across tiers.
// ─────────────────────────────────────────────────────────────────────────────
import { sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { RELAXED_THRESHOLDS } from '../config/env.js';
import { fullCrudCycle } from '../helpers/crud.js';

const scaleDuration = new Trend('scale_cycle_duration_ms', true);
const errorRate = new Rate('scale_error_rate');

export const options = {
    stages: [
        // Step 1  – 10 VUs
        { duration: '30s', target: 10 },
        { duration: '2m', target: 10 },
        // Step 2  – 20 VUs
        { duration: '30s', target: 20 },
        { duration: '2m', target: 20 },
        // Step 3  – 40 VUs
        { duration: '30s', target: 40 },
        { duration: '2m', target: 40 },
        // Step 4  – 80 VUs
        { duration: '30s', target: 80 },
        { duration: '2m', target: 80 },
        // Step 5  – 160 VUs
        { duration: '30s', target: 160 },
        { duration: '2m', target: 160 },
        // Cool-down
        { duration: '1m', target: 0 },
    ],
    thresholds: {
        ...RELAXED_THRESHOLDS,
        'scale_cycle_duration_ms': ['p(95)<6000'],
        'scale_error_rate': ['rate<0.08'],
    },
};

export default function () {
    const start = Date.now();
    fullCrudCycle();
    scaleDuration.add(Date.now() - start);
    sleep(1);
}
