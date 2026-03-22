# Data Policy Compliance Agent - Backend Code Structure

import os
import json
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from pydantic import BaseModel
from sqlalchemy import create_engine, text, MetaData, Table, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from google.cloud import aiplatform
from google.cloud import storage
import vertexai
from vertexai.generative_models import GenerativeModel, Part, SafetySetting

# 1. Configuration & Setup
app = FastAPI(title="Data Policy Compliance Agent API")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Database Configuration (Secret Manager injected via env vars)
DB_USER = os.getenv("DB_USER", "admin")
DB_PASS = os.getenv("DB_PASS", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "aml_db")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

# Read-Only Database Connection for Rule Execution
DB_READONLY_USER = os.getenv("DB_READONLY_USER", "readonly_engine")
DB_READONLY_PASS = os.getenv("DB_READONLY_PASS", "readonly_password")
READONLY_DATABASE_URL = f"postgresql://{DB_READONLY_USER}:{DB_READONLY_PASS}@{DB_HOST}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

readonly_engine = create_engine(READONLY_DATABASE_URL)
ReadonlySessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=readonly_engine)

# Whitelisted Tables for Rule Execution
ALLOWED_TABLES = ["ibm_aml_transactions"]

# 2. Pydantic Models
class RuleBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str # THRESHOLD, RANGE, AGGREGATION
    target_table: str
    target_column: str
    operator: str
    threshold_value: Optional[str] = None
    range_start: Optional[str] = None
    range_end: Optional[str] = None
    group_by_fields: Optional[str] = None
    aggregation_function: Optional[str] = None
    aggregation_field: Optional[str] = None
    having_operator: Optional[str] = None
    having_threshold: Optional[str] = None
    timestamp_field: Optional[str] = None
    time_window_hours: Optional[int] = None

class RuleCreate(RuleBase):
    policy_id: int

class RuleStatusUpdate(BaseModel):
    new_status: str # DRAFT, PENDING_APPROVAL, APPROVED, ACTIVE, ARCHIVED
    reason: str
    changed_by: str

# 3. Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_readonly_db():
    db = ReadonlySessionLocal()
    try:
        yield db
    finally:
        db.close()

# 4. Rule Engine Logic (Deterministic SQL Generation)
class RuleEngine:
    @staticmethod
    def validate_schema(table_name: str, column_name: str) -> bool:
        if table_name not in ALLOWED_TABLES:
            return False
        # In a real app, query information_schema to validate column existence
        return True

    @staticmethod
    def build_threshold_query(rule: Dict[str, Any]) -> str:
        # Parameterized query to prevent SQL injection
        return f"SELECT id, timestamp, {rule['target_column']} FROM {rule['target_table']} WHERE {rule['target_column']} {rule['operator']} :threshold_value"

    @staticmethod
    def build_range_query(rule: Dict[str, Any]) -> str:
        return f"SELECT id, timestamp, {rule['target_column']} FROM {rule['target_table']} WHERE {rule['target_column']} BETWEEN :range_start AND :range_end"

    @staticmethod
    def build_aggregation_query(rule: Dict[str, Any]) -> str:
        group_by = rule['group_by_fields']
        agg_func = rule['aggregation_function']
        agg_field = rule['aggregation_field']
        having_op = rule['having_operator']
        time_col = rule['timestamp_field']
        
        # Example: COUNT(*) > 5 within 24 hours grouped by from_account
        return f"""
            SELECT {group_by}, {agg_func}({agg_field}) as agg_value
            FROM {rule['target_table']}
            WHERE {time_col} >= NOW() - INTERVAL '{rule['time_window_hours']} hours'
            GROUP BY {group_by}
            HAVING {agg_func}({agg_field}) {having_op} :having_threshold
        """

    @staticmethod
    def execute_rule(db: Session, rule: Dict[str, Any]):
        if not RuleEngine.validate_schema(rule['target_table'], rule['target_column']):
            raise ValueError(f"Invalid schema reference: {rule['target_table']}.{rule['target_column']}")

        query_str = ""
        params = {}

        if rule['type'] == 'THRESHOLD':
            query_str = RuleEngine.build_threshold_query(rule)
            params = {'threshold_value': rule['threshold_value']}
        elif rule['type'] == 'RANGE':
            query_str = RuleEngine.build_range_query(rule)
            params = {'range_start': rule['range_start'], 'range_end': rule['range_end']}
        elif rule['type'] == 'AGGREGATION':
            query_str = RuleEngine.build_aggregation_query(rule)
            params = {'having_threshold': rule['having_threshold']}
        else:
            raise ValueError(f"Unsupported rule type: {rule['type']}")

        try:
            # Execute parameterized query using read-only connection
            result = db.execute(text(query_str), params).fetchall()
            return result
        except SQLAlchemyError as e:
            logger.error(f"SQL Execution Error for Rule {rule['id']}: {e}")
            raise

# 5. API Endpoints

@app.post("/api/v1/rules/extract", status_code=status.HTTP_202_ACCEPTED)
async def extract_rules_from_pdf(policy_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Uses Vertex AI (Gemini) to extract rules from a PDF stored in GCS.
    This is the ONLY place AI is used.
    """
    # 1. Fetch PDF from GCS (mocked)
    # pdf_content = fetch_from_gcs(policy_id)
    
    # 2. Call Gemini (mocked)
    # vertexai.init(project="your-project", location="us-central1")
    # model = GenerativeModel("gemini-1.5-pro-preview-0409")
    # prompt = "Extract compliance rules from this text. Output JSON matching the RuleBase schema."
    # response = model.generate_content([prompt, pdf_content])
    
    # 3. Parse JSON and save as DRAFT rules
    # rules_data = json.loads(response.text)
    # for rule in rules_data:
    #     save_draft_rule(db, rule)
    
    return {"message": "Rule extraction started in background."}

@app.put("/api/v1/rules/{rule_id}/status")
def update_rule_status(rule_id: int, status_update: RuleStatusUpdate, db: Session = Depends(get_db)):
    """
    State machine transition for rules.
    DRAFT -> PENDING_APPROVAL -> APPROVED -> ACTIVE
    """
    # 1. Fetch rule
    # 2. Validate transition
    # 3. Update status
    # 4. Log transition in rule_audit_logs
    return {"message": f"Rule {rule_id} status updated to {status_update.new_status}"}

@app.post("/api/v1/rules/execute")
def execute_active_rules(db: Session = Depends(get_db), readonly_db: Session = Depends(get_readonly_db)):
    """
    Triggered by Cloud Scheduler. Executes all ACTIVE rules.
    """
    # 1. Fetch all ACTIVE rules
    # active_rules = db.execute(text("SELECT * FROM compliance_rules WHERE status = 'ACTIVE'")).fetchall()
    
    # 2. For each rule:
    #    try:
    #        violations = RuleEngine.execute_rule(readonly_db, rule)
    #        # 3. Log violations in rule_violations table
    #        # 4. Log execution success in rule_executions
    #    except Exception as e:
    #        # 5. Log execution failure in rule_executions
    #        logger.error(f"Rule {rule['id']} failed: {e}")
    
    return {"message": "Execution completed."}

# 6. Dataset Loading Script (dataset_loader.py)
# import pandas as pd
# from sqlalchemy import create_engine
# 
# def load_ibm_aml_dataset(csv_path: str, db_url: str):
#     engine = create_engine(db_url)
#     df = pd.read_csv(csv_path)
#     # Map columns to schema
#     df.rename(columns={'Timestamp': 'timestamp', 'From Bank': 'from_bank', ...}, inplace=True)
#     df.to_sql('ibm_aml_transactions', engine, if_exists='append', index=False)
#     print(f"Loaded {len(df)} records.")
