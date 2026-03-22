-- Data Policy Compliance Agent - Database Schema

-- 1. IBM AML Dataset (Operational Database)
CREATE TABLE IF NOT EXISTS ibm_aml_transactions (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    from_bank VARCHAR(50),
    from_account VARCHAR(50),
    to_bank VARCHAR(50),
    to_account VARCHAR(50),
    amount_received DECIMAL(15, 2),
    receiving_currency VARCHAR(10),
    amount_paid DECIMAL(15, 2),
    payment_currency VARCHAR(10),
    payment_format VARCHAR(50),
    is_laundering INT NOT NULL DEFAULT 0 -- 1 for true, 0 for false
);

CREATE INDEX idx_aml_timestamp ON ibm_aml_transactions(timestamp);
CREATE INDEX idx_aml_from_account ON ibm_aml_transactions(from_account);
CREATE INDEX idx_aml_to_account ON ibm_aml_transactions(to_account);

-- 2. Rule Management
CREATE TYPE rule_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'ARCHIVED');
CREATE TYPE rule_type AS ENUM ('THRESHOLD', 'RANGE', 'AGGREGATION');

CREATE TABLE IF NOT EXISTS compliance_rules (
    id SERIAL PRIMARY KEY,
    policy_id INT, -- Reference to the uploaded PDF policy
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status rule_status NOT NULL DEFAULT 'DRAFT',
    type rule_type NOT NULL,
    target_table VARCHAR(50) NOT NULL, -- Whitelisted table name (e.g., 'ibm_aml_transactions')
    target_column VARCHAR(50) NOT NULL,
    operator VARCHAR(10) NOT NULL, -- e.g., '>', '<', 'BETWEEN', 'IN'
    threshold_value VARCHAR(255),
    range_start VARCHAR(255),
    range_end VARCHAR(255),
    -- Aggregation specific fields
    group_by_fields VARCHAR(255), -- Comma-separated list
    aggregation_function VARCHAR(20), -- e.g., 'COUNT', 'SUM', 'AVG'
    aggregation_field VARCHAR(50),
    having_operator VARCHAR(10),
    having_threshold VARCHAR(255),
    timestamp_field VARCHAR(50),
    time_window_hours INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- 3. Rule Lifecycle Audit Log
CREATE TABLE IF NOT EXISTS rule_audit_logs (
    id SERIAL PRIMARY KEY,
    rule_id INT REFERENCES compliance_rules(id),
    previous_status rule_status,
    new_status rule_status,
    changed_by VARCHAR(100) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Violations Log
CREATE TABLE IF NOT EXISTS rule_violations (
    id SERIAL PRIMARY KEY,
    rule_id INT REFERENCES compliance_rules(id),
    transaction_id INT REFERENCES ibm_aml_transactions(id),
    violation_details JSONB NOT NULL, -- Stores the exact values that triggered the rule
    justification TEXT NOT NULL, -- Plain-language explanation
    is_false_positive BOOLEAN DEFAULT FALSE,
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_violations_rule_id ON rule_violations(rule_id);
CREATE INDEX idx_violations_transaction_id ON rule_violations(transaction_id);

-- 5. Execution History
CREATE TABLE IF NOT EXISTS rule_executions (
    id SERIAL PRIMARY KEY,
    rule_id INT REFERENCES compliance_rules(id),
    records_scanned INT NOT NULL,
    violations_found INT NOT NULL,
    execution_time_ms INT NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED'
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security: Create Read-Only User for Rule Engine
-- GRANT SELECT ON ibm_aml_transactions TO readonly_engine;
