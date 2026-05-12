# KTO Solutions – k6 Load Testing Suite

Performance testing suite for **`https://api.kto.solutions/api/v1/terms-conditions`** (CRUD).

---

## 📦 Prerequisites

| Requirement       | Version |
|--------------------|---------|
| **k6**            | ≥ 0.50  |
| **Node.js** (optional, for npm scripts) | ≥ 18 |

### Install k6 (Debian / Ubuntu)

```bash
npm run install:k6
```

Or manually:  
```bash
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo 'deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main' \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6 -y
```

---

## 🗂 Project Structure

```
loadtest/
├── config/
│   └── env.js              # Base URL, headers, thresholds
├── helpers/
│   └── crud.js             # Reusable CRUD operations & payloads
├── tests/
│   ├── load.test.js        # Normal + peak usage
│   ├── stress.test.js      # Push to the breaking point
│   ├── spike.test.js       # Sudden traffic bursts
│   ├── soak.test.js        # Long-duration stability (2 h)
│   ├── volume.test.js      # Large data / payload handling
│   ├── scalability.test.js # Linear growth handling
│   └── reliability.test.js # Consistent uptime verification
├── reports/                # JSON output directory
├── package.json
└── README.md
```

---

## 🚀 Running Tests

### Individual Tests

```bash
# Load Test — normal + peak (9 min)
npm run test:load

# Stress Test — break the system (17 min)
npm run test:stress

# Spike Test — sudden traffic change (~5 min)
npm run test:spike

# Soak Test — long-duration stability (2 h 4 min)
npm run test:soak

# Volume Test — large data handling (4 min)
npm run test:volume

# Scalability Test — growth handling (~14 min)
npm run test:scalability

# Reliability Test — consistent uptime (32 min)
npm run test:reliability
```

### Run All Tests Sequentially

```bash
npm run test:all
```

### Short Runs (Dev Mode)

Soak and Reliability tests support a `SHORT` env var for quick validation:

```bash
k6 run -e SHORT=true tests/soak.test.js          # 5 min instead of 2 h
k6 run -e SHORT=true tests/reliability.test.js    # 3 min instead of 30 min
```

### Save Reports to JSON

```bash
npm run report:load         # → reports/load.json
npm run report:stress       # → reports/stress.json
npm run report:spike        # → reports/spike.json
npm run report:soak         # → reports/soak.json
npm run report:volume       # → reports/volume.json
npm run report:scalability  # → reports/scalability.json
npm run report:reliability  # → reports/reliability.json
```

---

## 🔒 Authentication

If the API requires a Bearer token, pass it via environment variable:

```bash
k6 run -e AUTH_TOKEN=your_jwt_token tests/load.test.js
```

---

## 📊 Test Type Summary

| Type            | Goal                      | VUs         | Duration    |
|-----------------|---------------------------|-------------|-------------|
| **Load**        | Normal + peak usage       | 20 → 50     | ~9 min      |
| **Stress**      | Break the system          | 10 → 200    | ~17 min     |
| **Spike**       | Sudden traffic change     | 5 ⇆ 200     | ~5 min      |
| **Soak**        | Long-duration stability   | 30 (steady) | ~2 h 4 min  |
| **Volume**      | Large data handling       | 10 (batch)  | ~4 min      |
| **Scalability** | Growth handling           | 10 → 160    | ~14 min     |
| **Reliability** | Consistent uptime         | 25 (steady) | ~32 min     |

---

## 🎯 CRUD Operations Tested

Every test exercises the full CRUD lifecycle on `/terms-conditions`:

| Operation | Method   | Endpoint                     |
|-----------|----------|------------------------------|
| **Create** | `POST`  | `/api/v1/terms-conditions`   |
| **List**   | `GET`   | `/api/v1/terms-conditions`   |
| **Read**   | `GET`   | `/api/v1/terms-conditions/:id` |
| **Update** | `PUT`   | `/api/v1/terms-conditions/:id` |
| **Delete** | `DELETE` | `/api/v1/terms-conditions/:id` |

---

## ⚙️ Customising

| What                      | Where                    |
|---------------------------|--------------------------|
| Base URL / API endpoint   | `config/env.js`          |
| Default thresholds        | `config/env.js`          |
| Payload shape             | `helpers/crud.js → makePayload()` |
| VU count & stage durations | each `tests/*.test.js`  |
| Volume batch size          | `k6 run -e BATCH_SIZE=20 tests/volume.test.js` |
