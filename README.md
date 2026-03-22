# 🔍 VeriVaani — Real-Time Fact-Checking API Platform for Vernacular Indian News

<div align="center">

![VeriVaani](https://img.shields.io/badge/VeriVaani-Fact%20Checker-2563eb?style=for-the-badge)
![GCP](https://img.shields.io/badge/Google%20Cloud-Platform-4285F4?style=for-the-badge&logo=google-cloud)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-8B5CF6?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-Production-009688?style=for-the-badge&logo=fastapi)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Hosting-FFA000?style=for-the-badge&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Detect misinformation in Hindi and English in under 500ms.**
Built for India. Powered by Gemini. Deployed on Google Cloud.

[Live API](https://verivani-api-726587187383.us-central1.run.app) · [Dashboard](https://verivani-api-726587187383.us-central1.run.app) · [API Docs](#api-reference) · [Get API Key](#quick-start)

</div>

---

## 📖 Table of Contents

- [What is VeriVaani](#what-is-verivani)
- [Live Demo](#live-demo)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment Guide](#deployment-guide)
- [Pipeline Optimization](#pipeline-optimization)
- [Facts Database](#facts-database)
- [Authentication](#authentication)
- [Integrations](#integrations)
- [Known Issues & Fixes](#known-issues--fixes)
- [Demo Day Checklist](#demo-day-checklist)
- [Contributing](#contributing)
- [License](#license)

---

## What is VeriVaani

VeriVaani is a **production-grade, real-time misinformation detection platform** specifically built for Indian vernacular content. It solves a critical problem: India produces millions of social media posts and news articles daily in Hindi, Marathi, Tamil, Telugu, and other regional languages — human fact-checkers cannot keep pace.

VeriVaani exposes a simple REST API that any developer, journalist, or blog platform can integrate in minutes. Submit a claim. Get a verdict.

```bash
curl -X POST https://verivani-api-726587187383.us-central1.run.app/v1/fact-check \
  -H "X-API-Key: vv_live_your_key" \
  -H "Content-Type: application/json" \
  -d '{"claim": "Modi sarkar ne 5000 rupaye kisan ko diye", "lang": "hi"}'

# Response in ~400ms:
{
  "verdict": "FALSE",
  "confidence": 0.95,
  "reason": "PM Kisan provides Rs 6000/year not Rs 5000",
  "supporting_fact_id": "fact_01",
  "model_used": "gemini-2.5-flash",
  "processing_time_ms": 387
}
```

---

## Live Demo

| Resource | URL |
|----------|-----|
| 🌐 Live API | https://verivani-api-726587187383.us-central1.run.app |
| 📊 Dashboard | https://verivani-api-726587187383.us-central1.run.app |
| 💚 Health Check | https://verivani-api-726587187383.us-central1.run.app/health |
| 📈 Pipeline Stats | https://verivani-api-726587187383.us-central1.run.app/admin/stats |

---

## Features

### Core Pipeline
- ⚡ **Sub-500ms verdicts** — pipeline optimization reduces token count by 47-57% before any LLM call
- 🗣️ **Vernacular-first** — native Hindi, Marathi, Tamil, Telugu, Bengali support via multilingual embeddings
- 🧠 **Gemini-powered** — Gemini 2.5 Flash for verdicts, smart routing keeps cost at ~$0.00003/call
- 🎯 **4 verdict types** — TRUE / FALSE / MISLEADING / UNVERIFIABLE with confidence score and evidence
- 💰 **Zero-cost path** — claims below similarity threshold return UNVERIFIABLE without calling any LLM

### API Platform
- 🔑 **API key management** — generate, name, copy, revoke keys with SHA256 hashing
- 📦 **Batch endpoint** — check up to 50 claims in a single API call
- 📊 **Usage dashboard** — real-time stats, daily call graphs, verdict breakdown per key
- 🔒 **Firebase Auth** — Google OAuth + email/password signup
- 🚦 **Rate limiting** — per-key rate limits with monthly quotas by plan
- 📚 **API docs** — copy-paste examples in cURL, Python, JavaScript

### Real-Time News Monitoring
- 📰 **Live news ingestion** — auto-fetches 6 Google News RSS feeds (English + Hindi) every 15 minutes
- 🤖 **AI claim extraction** — Gemini extracts 3-5 verifiable claims per article automatically
- 🔄 **Dynamic facts DB** — facts database grows from live news automatically
- 📡 **Pub/Sub pipeline** — Cloud Pub/Sub + Apache Beam Dataflow for streaming processing

### Integrations
- 🔌 **Embeddable widget** — one line of HTML for any website
- 📝 **WordPress plugin** — fact-check button in the editor
- 🔗 **REST API** — integrate with any language, framework, or platform

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     INPUT SOURCES                            │
│   Google News RSS (6 feeds) + User API Calls + Pub/Sub      │
│              Cloud Scheduler (every 15 min)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  PIPELINE OPTIMIZATION  │  ← PS5 Required Technique
              │  NoiseStripper          │    Removes hashtags, @mentions,
              │  ClaimExtractor         │    emojis, Hindi fillers,
              │  LanguageDetector       │    opinion markers
              │  Avg: 47-57% reduction  │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  EMBEDDING             │
              │  text-multilingual-    │
              │  embedding-002         │
              │  768-dim vectors       │
              │  RETRIEVAL_QUERY task  │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  VECTOR SEARCH         │
              │  Vertex AI             │
              │  30+ verified facts    │
              │  COSINE_DISTANCE       │
              │  top-3 neighbors       │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  SMART VERDICT ROUTING │
              │  score > 0.85 → Lite   │
              │  score > 0.60 → Flash  │
              │  score < 0.60 → skip   │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  FASTAPI (Cloud Run)   │
              │  Auth + Rate Limiting  │
              │  BackgroundTasks       │
              └────────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
   ┌──────────────────┐     ┌──────────────────────┐
   │    FIRESTORE     │     │   CLOUD MONITORING   │
   │  - fact_checks   │     │  - latency_ms        │
   │  - users         │     │  - compression_ratio │
   │  - api_keys      │     │  - posts_processed   │
   │  - usage_logs    │     │  - llm_calls_saved   │
   │  - raw_news      │     └──────────────────────┘
   │  - live_facts    │
   └──────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API Backend | FastAPI + Uvicorn on Cloud Run |
| Authentication | Firebase Auth (Google OAuth + Email) |
| Frontend | React + Vite on Firebase Hosting |
| Embeddings | Vertex AI — `text-multilingual-embedding-002` |
| LLM Verdict | Vertex AI — `gemini-2.5-flash` + `gemini-2.5-flash-lite` |
| Vector DB | Vertex AI Vector Search (Matching Engine) |
| Storage | Firestore (asia-south1) |
| Messaging | Cloud Pub/Sub |
| Stream Processing | Apache Beam on Cloud Dataflow |
| Scheduling | Cloud Scheduler |
| Monitoring | Cloud Monitoring (custom metrics) |
| CI/CD | Cloud Build + Artifact Registry |
| Container | Docker on python:3.11-slim |

---

## Quick Start

### 1. Get an API Key

Visit [verivani-api-726587187383.us-central1.run.app](https://verivani-api-726587187383.us-central1.run.app), sign up, and generate a free API key from your dashboard.

### 2. Make your first call

```bash
# Single claim
curl -X POST https://verivani-api-726587187383.us-central1.run.app/v1/fact-check \
  -H "X-API-Key: vv_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"claim": "Garlic cures COVID-19", "lang": "en"}'
```

```python
# Python
import requests

response = requests.post(
    "https://verivani-api-726587187383.us-central1.run.app/v1/fact-check",
    headers={"X-API-Key": "vv_live_YOUR_KEY"},
    json={"claim": "Garlic cures COVID-19", "lang": "en"}
)
print(response.json())
```

```javascript
// JavaScript
const response = await fetch(
  "https://verivani-api-726587187383.us-central1.run.app/v1/fact-check",
  {
    method: "POST",
    headers: {
      "X-API-Key": "vv_live_YOUR_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ claim: "Garlic cures COVID-19", lang: "en" })
  }
);
const data = await response.json();
console.log(data.verdict); // "FALSE"
```

### 3. Embed on any website

```html
<script src="https://verivani-api-726587187383.us-central1.run.app/widget.js"></script>
<div id="verivani-checker"></div>
```

---

## API Reference

### Authentication

All `/v1/` endpoints require an API key in the header:
```
X-API-Key: vv_live_your_key_here
```

All `/user/` endpoints require a Firebase ID token:
```
Authorization: Bearer <firebase_id_token>
```

---

### POST /v1/fact-check

Check a single claim.

**Request:**
```json
{
  "claim": "string — the claim to verify",
  "lang": "en | hi | auto (default: auto)"
}
```

**Response:**
```json
{
  "verdict": "TRUE | FALSE | MISLEADING | UNVERIFIABLE",
  "confidence": 0.95,
  "reason": "Explanation referencing the verified fact",
  "supporting_fact_id": "fact_01",
  "model_used": "gemini-2.5-flash",
  "compression_ratio": 0.57,
  "processing_time_ms": 387,
  "timestamp": "2026-03-21T07:27:01Z",
  "api_version": "v1"
}
```

**Error responses:**
- `401` — missing or invalid API key
- `429` — monthly limit exceeded, upgrade plan
- `500` — internal error with details

---

### POST /v1/fact-check/batch

Check up to 50 claims in one call.

**Request:**
```json
{
  "claims": ["claim 1", "claim 2", "claim 3"],
  "source": "my-wordpress-blog"
}
```

**Response:**
```json
{
  "results": [
    {"claim": "claim 1", "verdict": "FALSE", "confidence": 1.0, "reason": "..."},
    {"claim": "claim 2", "verdict": "TRUE", "confidence": 0.87, "reason": "..."}
  ],
  "total": 2,
  "processing_time_ms": 890,
  "api_version": "v1"
}
```

---

### GET /health

System health check. No auth required.

```json
{
  "status": "ok",
  "service": "verivaani-api",
  "vector_search_endpoint_initialized": true,
  "firestore_connected": true,
  "embedding_queue_size": 0,
  "embedding_model_used": "text-multilingual-embedding-002"
}
```

---

### GET /verdicts

Last 20 verdicts. No auth required. Used by the live dashboard.

---

### GET /admin/stats

Full pipeline statistics.

```json
{
  "pipeline": {
    "live_facts_total": 9,
    "raw_news_total": 90,
    "raw_news_processed": 8,
    "raw_news_pending": 82
  },
  "verdicts_total": 4,
  "api_status": "live"
}
```

---

### POST /user/keys — Generate API Key

Requires Firebase JWT.

```json
Request:  {"name": "My WordPress Blog"}
Response: {
  "key_id": "key_abc123",
  "api_key": "vv_live_a7f3k9...",
  "name": "My WordPress Blog",
  "monthly_limit": 1000,
  "rate_limit_per_minute": 10
}
```

> ⚠️ The full API key is shown **once only**. Copy it immediately.

---

### GET /user/usage — Usage Statistics

Requires Firebase JWT.

```json
{
  "total_calls": 247,
  "calls_this_month": 89,
  "monthly_limit": 1000,
  "plan": "free",
  "verdicts_breakdown": {
    "TRUE": 12, "FALSE": 34, "MISLEADING": 8, "UNVERIFIABLE": 35
  },
  "daily_usage": [{"date": "2026-03-21", "calls": 12}]
}
```

---

### Plans & Limits

| Plan | Monthly Calls | Rate Limit | Price |
|------|--------------|-----------|-------|
| Free | 1,000 | 10/min | $0 |
| Pro | 50,000 | 100/min | $29/mo |
| Enterprise | Unlimited | 1,000/min | Contact us |

---

## Project Structure

```
verivani/
├── api/                     # FastAPI backend
│   ├── main.py              # All endpoints + FastAPI lifespan
│   ├── auth.py              # Firebase JWT + API key verification
│   ├── keys.py              # Key generation, validation, revocation
│   ├── users.py             # User CRUD — Firestore users collection
│   ├── usage.py             # Usage tracking, rate limiting per key
│   ├── embeddings.py        # Vertex AI embedding service
│   ├── retrieval.py         # Vector Search client
│   ├── verdict.py           # Smart verdict routing
│   ├── storage.py           # Firestore save/read
│   └── monitoring.py        # Cloud Monitoring custom metrics
├── webapp/                  # React frontend — Firebase Hosting
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx  # Marketing page
│   │   │   ├── Auth.jsx     # Login + signup
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Playground.jsx
│   │   │   ├── ApiKeys.jsx
│   │   │   ├── Docs.jsx
│   │   │   └── Profile.jsx
│   │   └── components/
│   └── firebase.json
├── news_ingestion/          # Real-time news pipeline
│   ├── fetcher.py           # Google News RSS → Firestore
│   ├── extractor.py         # Gemini claim extraction
│   └── facts_updater.py     # Dynamic Vector Search updates
├── facts_db/                # Verified facts corpus
│   ├── facts_corpus.py      # 30 bilingual verified facts
│   └── build_index.py       # Build + upload Vector Search index
├── dataflow/                # Apache Beam streaming
│   ├── pipeline.py
│   └── deploy_dataflow.sh
├── demo/
│   ├── publisher.py         # Load test — --mode single/load/watch
│   └── dashboard.html       # Standalone live dashboard
├── widget/
│   └── widget.js            # Embeddable one-line widget
├── infra/
│   ├── setup_gcp.sh         # One-command GCP provisioning
│   └── teardown_gcp.sh      # Cleanup
├── credentials/
│   └── service-account.json # Never commit
├── Dockerfile
├── requirements.txt
├── validate.py              # Pre-deploy CI checks
└── .env
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Google Cloud
GOOGLE_CLOUD_PROJECT=virvani
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./credentials/service-account.json

# Gemini Models
EMBEDDING_MODEL=text-multilingual-embedding-002
EMBEDDING_MODEL_FALLBACK=text-multilingual-embedding-002
EMBEDDING_OUTPUT_DIMS=768
VERDICT_MODEL_PRIMARY=gemini-2.5-flash
VERDICT_MODEL_LITE=gemini-2.5-flash-lite
SIMILARITY_THRESHOLD=0.6

# Pub/Sub
PUBSUB_TOPIC=news-feed-topic
PUBSUB_PROCESSED_TOPIC=processed-claims

# Vertex AI Vector Search
VECTOR_SEARCH_ENDPOINT=projects/virvani/locations/us-central1/indexEndpoints/YOUR_ENDPOINT_ID
VECTOR_SEARCH_INDEX_ID=facts_deployed_index

# Firestore + GCS
FIRESTORE_COLLECTION=fact_checks
GCS_BUCKET=your-bucket-name

# Firebase (for frontend)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

> ⚠️ `VECTOR_SEARCH_INDEX_ID` must be the **deployed index string name** (`facts_deployed_index`) — NOT the numeric index resource ID.

---

## Deployment Guide

### Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed and authenticated
- Python 3.11+
- Node.js 18+ (for webapp)
- Docker

### Step 1 — Clone and configure

```bash
git clone https://github.com/yourusername/verivani.git
cd verivani
cp .env.example .env
# Fill in .env values
```

### Step 2 — Provision GCP infrastructure

```bash
bash infra/setup_gcp.sh
```

This creates: Pub/Sub topics, Firestore database, GCS bucket, service account with correct IAM roles, downloads credentials.

### Step 3 — Install dependencies

```bash
pip install -r requirements.txt
```

### Step 4 — Build the facts index

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./credentials/service-account.json
export PYTHONPATH=.
python3 facts_db/build_index.py
```

### Step 5 — Upload to GCS and deploy Vector Search

```bash
# Upload facts
gcloud storage cp facts.jsonl gs://YOUR_BUCKET/facts/facts.json

# Create index (takes 10-15 min)
gcloud ai indexes create \
  --project=YOUR_PROJECT \
  --region=us-central1 \
  --display-name="verivaani-facts-index" \
  --metadata-file=index_metadata.json

# Create endpoint
gcloud ai index-endpoints create \
  --project=YOUR_PROJECT \
  --region=us-central1 \
  --display-name="verivaani-facts-endpoint" \
  --public-endpoint-enabled

# Deploy index to endpoint (takes 10-20 min)
gcloud ai index-endpoints deploy-index ENDPOINT_ID \
  --deployed-index-id="facts_deployed_index" \
  --index=INDEX_ID \
  --project=YOUR_PROJECT \
  --region=us-central1
```

### Step 6 — Deploy Cloud Run API

```bash
export ENV_VARS="GOOGLE_CLOUD_PROJECT=virvani,EMBEDDING_MODEL=text-multilingual-embedding-002,..."

gcloud run deploy verivani-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --timeout 60 \
  --service-account verivani-sa@YOUR_PROJECT.iam.gserviceaccount.com \
  --set-env-vars "$ENV_VARS"
```

### Step 7 — Deploy frontend to Firebase Hosting

```bash
cd webapp
npm install
npm run build
firebase deploy --only hosting
```

### Step 8 — Set up Cloud Scheduler (auto real-time)

```bash
# Fetch news every 15 minutes
gcloud scheduler jobs create http verivani-news-fetcher \
  --schedule="*/15 * * * *" \
  --uri="https://YOUR_CLOUD_RUN_URL/admin/fetch-news" \
  --http-method=POST \
  --location=us-central1

# Extract claims every 30 minutes
gcloud scheduler jobs create http verivani-claim-extractor \
  --schedule="*/30 * * * *" \
  --uri="https://YOUR_CLOUD_RUN_URL/admin/extract-claims?limit=10" \
  --http-method=POST \
  --location=us-central1
```

### Step 9 — Validate everything

```bash
python3 validate.py
```

All 6 checks must pass before going live.

---

## Pipeline Optimization

This is the core technique (PS5 required). Before any embedding or LLM call, every post is stripped of non-factual content:

| What gets removed | Example |
|-------------------|---------|
| Hashtags | `#KisanScheme` |
| Mentions | `@PMOIndia` |
| URLs | `https://...` |
| RT prefix | `RT ` |
| Sensational emojis | `🔥💯😱` |
| Hindi fillers | `bhai, yaar, suno, dekho` |
| Opinion markers | `I think, rumour is, reportedly` |

**Example transformation:**
```
INPUT:  "OMG bhai dekho!! 🔥🔥 Modi sarkar ne 5000 rupaye kisan ko diye?? RT karo! #KisanScheme @PMOIndia"
OUTPUT: "Modi sarkar ne 5000 rupaye kisan ko diye"
TOKENS: 21 → 9  (57% reduction)
```

At 1000 posts/minute this means 57% lower embedding cost, faster processing, and better vector match quality.

---

## Facts Database

30 verified bilingual facts covering:

**Government Schemes:**
PM Kisan (₹6000/yr), Ayushman Bharat (₹5L health cover), Agnipath (4 years), PM SVANidhi (₹10k loans), SSY (₹250 minimum), PMJDY (zero balance), Mudra loans, RBI ₹2000 notes, Aadhaar-PAN linking, Ujjwala Yojana

**Health Misinformation:**
Garlic/COVID, 5G/viruses, vaccines/microchips, homeopathy/diabetes, papaya/dengue, cow urine/cancer, lemon-baking soda/cancer, mosquitoes/HIV, breath test/fibrosis, hot water/illness

**Economic Data:**
GDP 8.2% FY23-24, GST slabs (5/12/18/28%), income tax ₹7L rebate, UPI free transfers, digital rupee, Indian Railways (govt owned), Forex reserves, MGNREGA 100 days, FDI sectors

---

## Authentication

### Firebase Auth Flow
```
User clicks "Sign in with Google"
  → Firebase signInWithPopup(googleProvider)
  → Firebase returns ID token
  → Frontend sends: Authorization: Bearer <id_token>
  → Backend calls: firebase_admin.auth.verify_id_token(token)
  → Creates/updates user document in Firestore
  → Returns user profile
```

### API Key Flow
```
User generates key in dashboard
  → Backend generates: vv_live_<32 random chars>
  → Stores SHA256 hash in Firestore api_keys
  → Returns raw key ONCE — never stored in plaintext
  → User includes in: X-API-Key header
  → Backend hashes incoming key → looks up in Firestore
  → Checks is_active, monthly_limit, rate_limit
  → Increments usage counters on success
```

---

## Integrations

### Embeddable Widget

Add to any HTML page:
```html
<script src="https://verivani-api-726587187383.us-central1.run.app/widget.js"></script>
<div id="verivani-checker"></div>
```

### WordPress Plugin

Install from `integrations/wordpress/verivani.php`. Adds a Fact Check button to the WordPress editor. Select any text, click Fact Check, see the verdict inline.

### Any Language

The API is a standard REST endpoint. Works with Python, JavaScript, PHP, Ruby, Go, or any HTTP client.

---

## Known Issues & Fixes

| Error | Fix |
|-------|-----|
| `Unknown field: thinking_config` | Remove from verdict.py — not supported in SDK 1.71.1 |
| `pkg_resources not found` | Don't install apache-beam locally — only in dataflow/requirements-dataflow.txt |
| `Unknown model gemini-embedding-2-preview` | Use `text-multilingual-embedding-002` |
| `VECTOR_SEARCH_INDEX_ID` wrong | Must be `facts_deployed_index` not numeric ID `5097962627997368320` |
| Embedding 429 quota | Add `time.sleep(1.2)` between embedding calls |
| `news_ingestion not found` in Cloud Run | Add `COPY news_ingestion/ ./news_ingestion/` to Dockerfile |
| IAM race condition | Add roles one at a time, one command per role |
| Vector Search file extension error | Upload as `.json` not `.jsonl` |
| Vite WebSocket error in Cloud Shell | Run `npm run build && firebase deploy` instead of `npm run dev` |
| Batch not showing on dashboard | Add `save_verdict()` call inside batch endpoint loop |

---

## Demo Day Checklist

```
[ ] validate.py shows all checks passing
[ ] GET /health returns vector_search=true, firestore=true
[ ] POST /fact-check returns FALSE for "Garlic cures COVID-19"
[ ] POST /fact-check returns UNVERIFIABLE for breaking news
[ ] POST /fact-check/batch saves all results to dashboard
[ ] GET /verdicts returns real documents
[ ] Dashboard shows Connected indicator
[ ] Dashboard shows 4+ verdicts with colored badges
[ ] Inline claim checker on dashboard works
[ ] Google login completes full OAuth flow
[ ] API key generation shows key once in copy modal
[ ] /admin/stats shows accurate pipeline numbers
[ ] Cloud Scheduler jobs are active
[ ] GCP Console tabs ready: Cloud Run, Firestore, Vector Search
```

---

## Cost Estimate

| Service | Free Tier | Estimated Hackathon Cost |
|---------|-----------|--------------------------|
| Cloud Run | 2M req/month | $0 |
| Pub/Sub | 10 GB/month | $0 |
| Firestore | 1 GB / 50k reads | $0 |
| Cloud Monitoring | Always free | $0 |
| Vertex AI Embeddings | Pay per token | ~$0.01 |
| Vector Search | Pay per query | ~$0.02 |
| Gemini 2.5 Flash | ~$0.075/1M tokens | ~$0.004 |
| **Total** | | **~$0.034** |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please run `python3 validate.py` before submitting any PR.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ for India | Powered by Google Gemini | Deployed on GCP

**[Get your free API key →](https://verivani-api-726587187383.us-central1.run.app)**

</div>
