// ─────────────────────────────────────────────────────────────────────────────
// config/env.js  –  Centralised configuration for all k6 test suites
// ─────────────────────────────────────────────────────────────────────────────

export const BASE_URL = 'https://api.kto.solutions/api/v1';
export const ENDPOINT  = `${BASE_URL}/terms-conditions`;

// Optional: set your Bearer token here if the API ever requires auth
// You can also override via K6_AUTH_TOKEN env var:  k6 run -e AUTH_TOKEN=xxx ...
export const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

/**
 * Build default request headers.
 * Automatically adds Authorization if a token is present.
 */
export function buildHeaders(extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extra,
  };
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  return headers;
}

// ── Shared performance thresholds used across most test types ─────────────────
export const DEFAULT_THRESHOLDS = {
  http_req_failed:   ['rate<0.01'],          // <1 % error rate
  http_req_duration: ['p(95)<2000'],         // 95th percentile under 2 s
};

export const RELAXED_THRESHOLDS = {
  http_req_failed:   ['rate<0.05'],          // <5 % — used for stress / spike
  http_req_duration: ['p(95)<5000'],
};
