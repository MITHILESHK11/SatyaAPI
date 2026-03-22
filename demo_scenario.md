# Data Policy Compliance Agent - Demo Scenario

## Scenario Overview
This demo showcases the end-to-end capabilities of the Data Policy Compliance Agent using the IBM AML dataset. The scenario demonstrates how a compliance officer uploads a policy, how the system extracts deterministic rules, and how those rules are enforced against the operational database.

## Prerequisites
1. The system is deployed on GCP (Cloud Run, Cloud SQL, Cloud Scheduler).
2. The IBM AML dataset is loaded into the `ibm_aml_transactions` table in Cloud SQL.
3. The user is logged into the React frontend dashboard.

## Step 1: Policy Ingestion
**Action:** The compliance officer uploads a PDF document titled "Global Anti-Money Laundering Policy 2024".

**Policy Text Excerpt:**
> "To mitigate the risk of money laundering, all transactions exceeding $10,000 USD must be flagged for review. Furthermore, any account initiating more than 5 transfers within a 24-hour period must be investigated for high-frequency velocity. Finally, transfers between 'Bank A' and 'Bank B' exceeding $5,000 must be scrutinized."

## Step 2: Rule Extraction (Vertex AI)
**Action:** The backend receives the PDF, extracts the text, and sends it to Vertex AI (Gemini) with a strict prompt to output JSON matching the `RuleBase` schema.

**Extracted Rules (DRAFT status):**

1. **Large Transfer Limit**
   - Type: `THRESHOLD`
   - Target Table: `ibm_aml_transactions`
   - Target Column: `amount_paid`
   - Operator: `>`
   - Threshold Value: `10000`

2. **High Frequency Velocity**
   - Type: `AGGREGATION`
   - Target Table: `ibm_aml_transactions`
   - Group By Fields: `from_account`
   - Aggregation Function: `COUNT`
   - Aggregation Field: `id`
   - Having Operator: `>`
   - Having Threshold: `5`
   - Timestamp Field: `timestamp`
   - Time Window Hours: `24`

3. **Suspicious Bank Pair Transfer**
   - Type: `THRESHOLD` (with complex conditions, simplified for demo)
   - Target Table: `ibm_aml_transactions`
   - Target Column: `amount_paid`
   - Operator: `>`
   - Threshold Value: `5000`
   - *(Note: The rule engine can be extended to support complex WHERE clauses like `from_bank = 'Bank A' AND to_bank = 'Bank B'`)*

## Step 3: Human-in-the-Loop Review
**Action:** The compliance officer navigates to the "Rule Management" tab on the dashboard.
- They review the extracted rules.
- They approve the "Large Transfer Limit" and "High Frequency Velocity" rules.
- The status of these rules changes from `DRAFT` to `ACTIVE`.
- The transition is logged in `rule_audit_logs`.

## Step 4: Deterministic Enforcement
**Action:** Cloud Scheduler triggers the `/api/v1/rules/execute` endpoint.

**Execution Logic:**
The Rule Engine translates the `ACTIVE` rules into parameterized SQL queries:

*Query 1 (Large Transfer Limit):*
```sql
SELECT id, timestamp, amount_paid 
FROM ibm_aml_transactions 
WHERE amount_paid > 10000
```

*Query 2 (High Frequency Velocity):*
```sql
SELECT from_account, COUNT(id) as agg_value
FROM ibm_aml_transactions
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY from_account
HAVING COUNT(id) > 5
```

The queries are executed against the Cloud SQL database using the `readonly_engine` user.

## Step 5: Violation Logging & Review
**Action:** The engine detects violations in the IBM AML dataset.
- Transaction #45920 has an `amount_paid` of $12,500.
- Account #998877 initiated 7 transfers in the last 24 hours.

These violations are logged in the `rule_violations` table with plain-language justifications:
- "Amount $12,500 > Threshold $10,000"
- "Account initiated 7 transfers, exceeding the limit of 5 within 24 hours."

**Action:** The compliance officer navigates to the "Violation Logs" tab.
- They review Transaction #45920.
- They cross-reference the `is_laundering` flag from the IBM AML dataset (ground truth).
- If `is_laundering` is 0, they mark the violation as a "False Positive".
- If `is_laundering` is 1, they escalate the transaction for further investigation.

## Step 6: Monitoring & Metrics
**Action:** The compliance officer views the Cloud Monitoring dashboard.
- They see the execution history (records scanned, execution time).
- They track the precision and recall of the rules by comparing the flagged violations against the `is_laundering` column in the dataset.
- They notice a spike in "High Frequency Velocity" violations and adjust the rule threshold to 10 transfers per 24 hours (creating a new version of the rule).
