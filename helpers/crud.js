// ─────────────────────────────────────────────────────────────────────────────
// helpers/crud.js  –  Reusable CRUD helpers for terms-conditions
// ─────────────────────────────────────────────────────────────────────────────
import http from 'k6/http';
import { check, group } from 'k6';
import { ENDPOINT, buildHeaders } from '../config/env.js';

// ── Payload factories ─────────────────────────────────────────────────────────

let _counter = 0;

/**
 * Returns a unique payload for CREATE / UPDATE operations.
 * Using a counter + timestamp keeps slug values unique across VUs.
 */
export function makePayload(prefix = 'test') {
    _counter++;
    const uid = `${prefix}-${__VU}-${__ITER}-${_counter}`;
    return {
        slug: uid,
        title: `Load Test – ${uid}`,
        content: `Automated load-test content created at VU=${__VU} ITER=${__ITER}.`,
        isActive: true,
    };
}

// ── CRUD operations ───────────────────────────────────────────────────────────

/** GET /terms-conditions  — list all */
export function listTerms() {
    let res;
    group('LIST terms-conditions', () => {
        res = http.get(ENDPOINT, { headers: buildHeaders() });
        check(res, {
            'LIST: status 200': (r) => r.status === 200,
            'LIST: has data array': (r) => {
                try { return Array.isArray(JSON.parse(r.body).data); }
                catch { return false; }
            },
        });
    });
    return res;
}

/** GET /terms-conditions/:id  — read one */
export function getTerm(id) {
    let res;
    group('GET term by id', () => {
        res = http.get(`${ENDPOINT}/${id}`, { headers: buildHeaders() });
        check(res, {
            'GET: status 200 or 404': (r) => r.status === 200 || r.status === 404,
        });
    });
    return res;
}

/** POST /terms-conditions  — create */
export function createTerm(payload) {
    let res;
    group('CREATE term', () => {
        res = http.post(
            ENDPOINT,
            JSON.stringify(payload || makePayload('create')),
            { headers: buildHeaders() }
        );
        check(res, {
            'CREATE: status 201 or 200': (r) => r.status === 201 || r.status === 200,
            'CREATE: has id in response': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return !!(body.data && body.data.id) || !!(body.id);
                } catch { return false; }
            },
        });
    });
    return res;
}

/** PUT /terms-conditions/:id  — update */
export function updateTerm(id, payload) {
    let res;
    group('UPDATE term', () => {
        res = http.put(
            `${ENDPOINT}/${id}`,
            JSON.stringify(payload || makePayload('update')),
            { headers: buildHeaders() }
        );
        check(res, {
            'UPDATE: status 2xx or 404': (r) => r.status < 300 || r.status === 404,
        });
    });
    return res;
}

/** DELETE /terms-conditions/:id  — delete */
export function deleteTerm(id) {
    let res;
    group('DELETE term', () => {
        res = http.del(
            `${ENDPOINT}/${id}`,
            null,
            { headers: buildHeaders() }
        );
        check(res, {
            'DELETE: status 2xx or 404': (r) => r.status < 300 || r.status === 404,
        });
    });
    return res;
}

/**
 * Full CRUD cycle: Create → Read → Update → Delete
 * Returns the created item's id (or null on failure).
 */
export function fullCrudCycle() {
    // 1. Create
    const createRes = createTerm();
    let createdId = null;
    try {
        const body = JSON.parse(createRes.body);
        createdId = (body.data && body.data.id) || body.id || null;
    } catch { /* ignore */ }

    // 2. List (read all)
    listTerms();

    // 3. Read one (use id=1 as fallback, it exists in the live data)
    const readId = createdId || 1;
    getTerm(readId);

    // 4. Update
    if (createdId) updateTerm(createdId, makePayload('update'));

    // 5. Delete
    if (createdId) deleteTerm(createdId);

    return createdId;
}
