# Data Policy Compliance Agent - Dataset Loading Script
# This script loads the IBM AML dataset into Cloud SQL (PostgreSQL)

import pandas as pd
from sqlalchemy import create_engine
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_ibm_aml_dataset(csv_path: str, db_url: str):
    """
    Loads the IBM AML dataset into the PostgreSQL database.
    """
    logger.info(f"Loading dataset from {csv_path}...")
    
    try:
        # Create database engine
        engine = create_engine(db_url)
        
        # Read CSV file (using chunksize for large files)
        chunksize = 100000
        total_records = 0
        
        for chunk in pd.read_csv(csv_path, chunksize=chunksize):
            # Map columns to match the database schema
            chunk.rename(columns={
                'Timestamp': 'timestamp',
                'From Bank': 'from_bank',
                'Account': 'from_account', # Assuming 'Account' is the sender
                'To Bank': 'to_bank',
                'Account.1': 'to_account', # Assuming 'Account.1' is the receiver
                'Amount Received': 'amount_received',
                'Receiving Currency': 'receiving_currency',
                'Amount Paid': 'amount_paid',
                'Payment Currency': 'payment_currency',
                'Payment Format': 'payment_format',
                'Is Laundering': 'is_laundering'
            }, inplace=True)
            
            # Convert timestamp to datetime
            chunk['timestamp'] = pd.to_datetime(chunk['timestamp'])
            
            # Insert into database
            chunk.to_sql('ibm_aml_transactions', engine, if_exists='append', index=False)
            total_records += len(chunk)
            logger.info(f"Loaded {total_records} records so far...")
            
        logger.info(f"Successfully loaded {total_records} records into ibm_aml_transactions.")
        
    except Exception as e:
        logger.error(f"Failed to load dataset: {e}")
        raise

if __name__ == "__main__":
    # Example usage
    # Ensure you have the IBM AML dataset CSV file available locally or in GCS
    CSV_FILE_PATH = os.getenv("AML_CSV_PATH", "ibm_aml_dataset.csv")
    
    DB_USER = os.getenv("DB_USER", "admin")
    DB_PASS = os.getenv("DB_PASS", "password")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "aml_db")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
    
    if os.path.exists(CSV_FILE_PATH):
        load_ibm_aml_dataset(CSV_FILE_PATH, DATABASE_URL)
    else:
        logger.error(f"Dataset file not found at {CSV_FILE_PATH}")
