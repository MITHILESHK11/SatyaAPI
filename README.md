# Data Policy Compliance Agent

This repository contains the deliverables for the **Data Policy Compliance Agent**, a cloud-native, deterministic enforcement system built on Google Cloud Platform (GCP).

## Deliverables

The system is designed to strictly solve Problem Statement 3: Automated Policy Compliance Enforcement.

1. **System Architecture, Deployment, Security, & Monitoring**: See [`/architecture.md`](./architecture.md)
2. **Database Schema**: See [`/database_schema.sql`](./database_schema.sql)
3. **Backend Code Structure & Rule Engine Logic**: See [`/backend_structure.py`](./backend_structure.py)
4. **Frontend Structure**: See [`/src/pages/ComplianceDashboard.tsx`](./src/pages/ComplianceDashboard.tsx) (Integrated into the React app)
5. **Dataset Loading Script**: See [`/dataset_loader.py`](./dataset_loader.py)
6. **Demo Scenario**: See [`/demo_scenario.md`](./demo_scenario.md)

## Key Features

*   **Deterministic Enforcement**: Uses parameterized SQL queries for rule execution, strictly prohibiting AI-generated SQL to ensure security and predictability.
*   **Agentic Workflow**: Manages the entire rule lifecycle from PDF ingestion and AI-assisted extraction (using Vertex AI) to human approval and automated scheduled execution.
*   **IBM AML Dataset Integration**: Designed to operate against the IBM AML dataset for validation and metric computation (Precision, Recall, F1).
*   **GCP Native**: Leverages Cloud Run, Cloud SQL (PostgreSQL), Cloud Storage, Cloud Scheduler, Cloud Logging, and Secret Manager.
*   **Human-in-the-Loop**: Provides a comprehensive React dashboard for rule governance, violation review, and false-positive marking.

## Running the Frontend

The frontend structure has been integrated into the existing React application.
To view the Compliance Dashboard:
1. Start the development server (if not already running).
2. Navigate to the `/compliance` route in the application.
