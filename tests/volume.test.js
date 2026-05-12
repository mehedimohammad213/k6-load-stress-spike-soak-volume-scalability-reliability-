// ─────────────────────────────────────────────────────────────────────────────
// tests/volume.test.js
//
// TYPE     : Volume Test
// GOAL     : Validate system behaviour when handling large amounts of data
//            (many records created, listed, and queried simultaneously)
//
// Scenario :
//   Each VU rapidly creates many terms records (batch write),
//   then immediately lists them (large response payload).
//   Focus is on throughput and payload size, not concurrency count.
// ─────────────────────────────────────────────────────────────────────────────
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { DEFAULT_THRESHOLDS, ENDPOINT, buildHeaders } from '../config/env.js';
import { createTerm, listTerms, makePayload } from '../helpers/crud.js';

const volumeCreateDuration = new Trend('volume_create_ms', true);
const volumeListDuration = new Trend('volume_list_ms', true);
const recordsCreated = new Counter('volume_records_created');
const errorRate = new Rate('volume_error_rate');

// How many records each VU batch-creates per iteration
const BATCH_SIZE = __ENV.BATCH_SIZE ? parseInt(__ENV.BATCH_SIZE) : 10;

export const options = {
    stages: [
        { duration: '30s', target: 10 },  // gentle ramp
        { duration: '3m', target: 10 },  // hold (focus is on data volume, not VU count)
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        ...DEFAULT_THRESHOLDS,
        'volume_create_ms': ['p(95)<3000'],
        'volume_list_ms': ['p(95)<3000'],
        'volume_error_rate': ['rate<0.02'],
        'volume_records_created': ['count>0'],
    },
};

export default function () {
    // ── Batch create ────────────────────────────────────────────────────────────
    const payloads = Array.from({ length: BATCH_SIZE }, (_, i) =>
        makePayload(`vol-${i}`)
    );

    const batchRequests = payloads.map((p) => ({
        method: 'POST',
        url: ENDPOINT,
        body: JSON.stringify(p),
        params: { headers: buildHeaders() },
    }));

    const createStart = Date.now();
    const responses = http.batch(batchRequests);
    volumeCreateDuration.add(Date.now() - createStart);

    let batchOk = true;
    responses.forEach((r) => {
        const ok = r.status === 200 || r.status === 201;
        if (ok) recordsCreated.add(1);
        else batchOk = false;
    });
    errorRate.add(!batchOk);

    // ── List (large response) ───────────────────────────────────────────────────
    const listStart = Date.now();
    const listRes = listTerms();
    volumeListDuration.add(Date.now() - listStart);

    check(listRes, {
        'volume: list response < 5 MB': (r) =>
            r.body.length < 5 * 1024 * 1024,
    });

    sleep(1);
}
