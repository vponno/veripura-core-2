# BigQuery Schema: Advanced Compliance Engine (Phase 2)

This document defines the schema for the "Rule Matrix" that drives the Advanced Compliance Engine. These tables will store the complex regulatory logic that the AI and rule-based systems will validate against.

## Dataset: `veripura_compliance_rules`

### Table 1: `regulations`

**Purpose**: Stores high-level regulation metadata (e.g., EUDR, FDA FSMA).

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `regulation_id` | STRING | Unique ID (e.g., `EUDR_2025`) |
| `name` | STRING | Full name of the regulation |
| `jurisdiction` | STRING | Region where it applies (e.g., `EU`, `USA`) |
| `effective_date` | DATE | When the regulation becomes active |
| `description` | STRING | Summary of the regulation |
| `doc_vector` | `ARRAY<FLOAT64>` | Embedding of the full regulation text for RAG (Optional) |

```sql
CREATE TABLE `veripura_compliance_rules.regulations` (
  regulation_id STRING NOT NULL,
  name STRING NOT NULL,
  jurisdiction STRING NOT NULL,
  effective_date DATE,
  description STRING,
  doc_vector ARRAY<FLOAT64>
);
```

---

### Table 2: `compliance_requirements` (The Rule Matrix)

**Purpose**: Maps specific products and origins to required documents and rules.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `requirement_id` | STRING | Unique ID (e.g., `REQ_COFFEE_VN_EU`) |
| `regulation_ids` | `ARRAY<STRING>` | Links to `regulations` table (e.g., `["EUDR_2025"]`) |
| `hs_code_prefix` | STRING | HS Code match (e.g., `0901` for Coffee) |
| `origin_country` | STRING | Origin country ISO code (e.g., `VN`) |
| `destination_region` | STRING | Destination ISO code or region (e.g., `EU`, `US`) |
| `required_documents` | ARRAY<STRUCT<doc_type STRING, description STRING>> | List of required docs |
| `validation_logic_sql` | STRING | Custom SQL snippet to validate specific fields if needed |

```sql
CREATE TABLE `veripura_compliance_rules.compliance_requirements` (
  requirement_id STRING NOT NULL,
  regulation_ids ARRAY<STRING>,
  hs_code_prefix STRING,
  origin_country STRING,
  destination_region STRING,
  required_documents ARRAY<STRUCT<
    doc_type STRING, 
    description STRING,
    agency_link STRING
  >>,
  validation_logic_sql STRING
);
```

---

### Table 3: `consignment_validations` (Audit Log)

**Purpose**: Stores the results of every validation check performed on a consignment.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `validation_id` | STRING | Unique ID |
| `consignment_id` | STRING | Link to Firestore Consignment ID |
| `doc_type` | STRING | Type of document analyzed |
| `timestamp` | TIMESTAMP | When the check ran |
| `status` | STRING | `PASS`, `FAIL`, `WARNING` |
| `rule_hits` | `ARRAY<STRING>` | IDs of rules that triggered |
| `ai_confidence` | FLOAT64 | Confidence score of the AI analysis |
| `iota_tx_hash` | STRING | IOTA Transaction Digest (Proof of Existence) |
| `tamper_score` | INTEGER | Security Shield Score (0-100) |

```sql
CREATE TABLE `veripura_audit_logs.consignment_validations` (
  validation_id STRING NOT NULL,
  consignment_id STRING NOT NULL,
  doc_type STRING,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  status STRING,
  rule_hits ARRAY<STRING>,
  ai_confidence FLOAT64,
  iota_tx_hash STRING,
  tamper_score INT64
);
```

---

### Table 4: `training_dataset_mirror` (AI Feedback Loop)

**Purpose**: Replicates the Firestore `training_dataset` for SQL-based analysis and model monitoring.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `document_id` | STRING | Firestore Doc ID |
| `consignment_id` | STRING | Link to Consignment |
| `doc_type` | STRING | Document Type |
| `status` | STRING | `human_verified`, `labeled_by_ai` |
| `validation_level` | STRING | `GREEN`, `YELLOW`, `RED` |
| `pdf_url` | STRING | URL to source file |
| `human_review_decision` | STRING | `approved`, `rejected` |
| `human_review_label` | STRING | `AGREED`, `DISAGREED_FALSE_POSITIVE`, `DISAGREED_FALSE_NEGATIVE` |
| `created_at` | TIMESTAMP | Creation time |

```sql
CREATE TABLE `veripura_ml.training_dataset_mirror` (
  document_id STRING NOT NULL,
  consignment_id STRING,
  doc_type STRING,
  status STRING,
  validation_level STRING,
  pdf_url STRING,
  human_review_decision STRING,
  human_review_label STRING,
  created_at TIMESTAMP
);
```
