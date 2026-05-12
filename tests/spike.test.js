// ─────────────────────────────────────────────────────────────────────────────
// tests/spike.test.js
//
// TYPE     : Spike Test
// GOAL     : Validate behaviour during sudden, extreme traffic changes
//
// Scenario :
//   Start at near-zero. Instantly spike to 200 VUs, hold briefly,
//   then drop back instantly — repeated twice to simulate real-world bursts.
//   Tests whether the system can auto-scale down and recover.
// ─────────────────────────────────────────────────────────────────────────────
import { sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { RELAXED_THRESHOLDS } from '../config/env.js';
import { listTerms, createTerm } from '../helpers/crud.js';

const spikeDuration = new Trend('spike_response_ms', true);
const errorRate = new Rate('spike_error_rate');

export const options = {
    stages: [
        // Baseline
        { duration: '30s', target: 5 },

        // ── Spike 1 ──────────────────────────────────────────────────────────────
        { duration: '10s', target: 200 },  // sudden ramp-up
        { duration: '1m', target: 200 },  // sustain spike
        { duration: '10s', target: 5 },  // sudden drop

        // Recovery period
        { duration: '1m', target: 5 },

        // ── Spike 2 ──────────────────────────────────────────────────────────────
        { duration: '10s', target: 200 },
        { duration: '1m', target: 200 },
        { duration: '10s', target: 5 },

        // Cool-down
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        ...RELAXED_THRESHOLDS,
        'spike_response_ms': ['p(95)<6000'],
        'spike_error_rate': ['rate<0.15'],  // higher tolerance during spike
    },
};

export default function () {
    const start = Date.now();

    // During a spike, focus on read + write (the most common real traffic mix)
    listTerms();
    createTerm();

    spikeDuration.add(Date.now() - start);
    sleep(0.2);
}
