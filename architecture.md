# Data Policy Compliance Agent - System Architecture & Deployment

## 1. System Architecture

The Data Policy Compliance Agent is a cloud-native, deterministic enforcement system built on Google Cloud Platform (GCP).

### Core Components
- **Frontend**: React-based dashboard deployed on Cloud Run.
- **Backend**: Python FastAPI service deployed on Cloud Run.
- **Database**: Cloud SQL (PostgreSQL) for storing the IBM AML dataset, extracted rules, and violation logs.
- **Storage**: Cloud Storage (GCS) for uploading and storing PDF policy documents.
- **AI Engine**: Vertex AI (Gemini) used **strictly** for extracting deterministic rules from PDF text.
- **Monitoring & Scheduling**: Cloud Scheduler triggers periodic compliance checks. Cloud Logging and Cloud Monitoring track execution history and system health.
- **Security**: Secret Manager stores database credentials and API keys. IAM roles enforce least-privilege access.

### Workflow
1. **Policy Ingestion**: User uploads a PDF policy via the React frontend. The PDF is stored in GCS.
2. **Rule Extraction**: The FastAPI backend triggers Vertex AI to extract rules (Threshold, Range, Aggregation) from the PDF text.
3. **Rule Lifecycle**: Extracted rules are saved in Cloud SQL with a `DRAFT` status. A human reviewer approves them (`PENDING_APPROVAL` -> `APPROVED` -> `ACTIVE`).
4. **Deterministic Enforcement**: Cloud Scheduler triggers the rule engine. The engine translates `ACTIVE` rules into parameterized SQL queries and executes them against the IBM AML dataset in Cloud SQL (read-only).
5. **Violation Logging**: Violating records are logged in the database with explainable justifications.
6. **Review**: Users review violations on the dashboard, mark false positives, or create exceptions.

## 2. Security Implementation

- **SQL Injection Prevention**: The system uses SQLAlchemy with strict parameterized queries. Dynamic SQL concatenation is strictly prohibited. Table and column names are validated against a hardcoded whitelist.
- **Read-Only Access**: The rule execution engine connects to the database using a dedicated PostgreSQL user with `SELECT`-only permissions on the IBM AML tables.
- **Secret Management**: Database passwords, Vertex AI credentials, and API keys are stored in GCP Secret Manager and injected into Cloud Run as environment variables.
- **IAM Roles**:
  - Cloud Run Service Account: `roles/secretmanager.secretAccessor`, `roles/storage.objectAdmin`, `roles/cloudsql.client`, `roles/aiplatform.user`.
  - Cloud Scheduler Service Account: `roles/run.invoker` (to trigger the backend endpoint).

## 3. Monitoring Logic

- **Cloud Scheduler**: Configured to call the `/api/v1/rules/execute` endpoint every hour (`0 * * * *`).
- **Cloud Logging**: All rule transitions (e.g., `DRAFT` to `ACTIVE`) and execution results (success/failure, number of violations) are logged with structured JSON payloads.
- **Cloud Monitoring**: Alerts are configured for:
  - High error rates on the execution endpoint.
  - Sudden spikes in the number of violations (anomaly detection).
  - Database connection failures.
- **Execution History**: The `rule_executions` table tracks every run, including timestamp, rule ID, records scanned, and violations found.

## 4. GCP Deployment Guide

### Prerequisites
- GCP Project with billing enabled.
- Google Cloud CLI (`gcloud`) installed.
- APIs enabled: Cloud Run, Cloud SQL, Cloud Storage, Secret Manager, Vertex AI, Cloud Scheduler.

### Step 1: Database Setup
```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create compliance-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=us-central1

# Create database and users
gcloud sql databases create aml_db --instance=compliance-db
gcloud sql users create admin --instance=compliance-db --password=STRONG_PASSWORD
gcloud sql users create readonly_engine --instance=compliance-db --password=READONLY_PASSWORD
```

### Step 2: Secret Manager
```bash
echo -n "STRONG_PASSWORD" | gcloud secrets create db-password --data-file=-
echo -n "READONLY_PASSWORD" | gcloud secrets create db-readonly-password --data-file=-
```

### Step 3: Storage & Scheduler
```bash
# Create GCS bucket for PDFs
gsutil mb gs://compliance-policies-bucket

# Create Cloud Scheduler job
gcloud scheduler jobs create http compliance-check-job \
  --schedule="0 * * * *" \
  --uri="https://BACKEND_URL/api/v1/rules/execute" \
  --http-method=POST \
  --oidc-service-account-email=scheduler-sa@PROJECT_ID.iam.gserviceaccount.com
```

### Step 4: Deploy Backend and Frontend
```bash
# Deploy Backend
gcloud run deploy compliance-backend \
  --source ./backend \
  --region us-central1 \
  --set-secrets="DB_PASS=db-password:latest,DB_READONLY_PASS=db-readonly-password:latest" \
  --set-env-vars="DB_HOST=/cloudsql/PROJECT_ID:us-central1:compliance-db,DB_USER=admin,DB_NAME=aml_db"

# Deploy Frontend
gcloud run deploy compliance-frontend \
  --source ./frontend \
  --region us-central1 \
  --set-env-vars="VITE_API_URL=https://BACKEND_URL"
```
