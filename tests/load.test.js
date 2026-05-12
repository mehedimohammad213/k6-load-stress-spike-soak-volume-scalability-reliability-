// ─────────────────────────────────────────────────────────────────────────────
// tests/load.test.js
//
// TYPE     : Load Test
// GOAL     : Validate normal + peak usage behaviour
//
// Scenario :
//   1. Ramp to 20 VUs over 1 min  (normal load)
//   2. Hold at 20 VUs for 3 min
//   3. Ramp to 50 VUs over 1 min  (peak load)
//   4. Hold at 50 VUs for 3 min
//   5. Ramp down to 0 over 1 min
//
// Each VU performs a full CRUD cycle every iteration.
// ─────────────────────────────────────────────────────────────────────────────
import { sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { DEFAULT_THRESHOLDS } from '../config/env.js';
import { fullCrudCycle, listTerms } from '../helpers/crud.js';

// Custom metrics
const crudDuration = new Trend('crud_cycle_duration_ms', true);
const errorRate = new Rate('crud_error_rate');

export const options = {
    stages: [
        { duration: '1m', target: 20 },   // ramp up  → normal
        { duration: '3m', target: 20 },   // hold      → normal
        { duration: '1m', target: 50 },   // ramp up  → peak
        { duration: '3m', target: 50 },   // hold      → peak
        { duration: '1m', target: 0 },   // ramp down
    ],
    thresholds: {
        ...DEFAULT_THRESHOLDS,
        'crud_cycle_duration_ms': ['p(95)<3000'],
        'crud_error_rate': ['rate<0.02'],
    },
};

export default function () {
    const start = Date.now();
    fullCrudCycle();
    crudDuration.add(Date.now() - start);
    sleep(1);
}
