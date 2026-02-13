# VeriPura Connect Core - Business Logic Documentation

## 1. Core Philosophy: The Agentic Architecture

VeriPura is built on the principle of **"One Consignment, One Agent"**.
A dedicated **"Consignment Guardian Agent"** is instantiated for *every single consignment*. This agent acts as the orchestrator, leveraging specialized skills, memory, and sub-agents to ensure compliance.

### 1.1 The Guardian Agent (Orchestrator)

* **Role**: The primary interface and decision-maker for a specific consignment.
* **Memory**: Maintains persistent, stateful context (`agentState`) of the entire trade lifecycle, including past interactions, rejected documents, and route changes.
* **Skills**: Modular capabilities the agent can invoke, such as "Forensic Analysis", "Route Verification", or "Encryption".

### 1.2 Agent Internals: Memory & Skills

To operate effectively, the Guardian Agent relies on a structured internal architecture:

* **Structured Memory**: Beyond simple message history, the agent maintains:
  * *Short-Term Context*: Active conversation, current "thought process", and uncommitted state.
  * *Long-Term Facts*: A structured "Knowledge Graph" for the consignment (e.g., "Fact: Exporter is 'Acme Corp'", "Fact: Invoice #123 matches PO #999").
* **Skill Registry**: A plug-and-play interface where specific capabilities are registered.
  * *Interface*: `execute(context)`, `confidenceScore()`.
  * *Examples*: "ForensicScanner", "IotaAnchorer", "PdfCracker".

### 1.3 Sub-Agents & Specializations

The Guardian delegates to specialized **Sub-Agent Classes**:

* **Architecture**: Each Sub-Agent is a class instance with its own narrow context and goal.
* **Regulatory Sub-Agents**: e.g., `EUDR_Specialist` (ignores FDA rules, focuses solely on Deforestation logic).
* **VeriPura AI**: The proprietary "Brain" that powers these agents.
  * *RAG (Retrieval-Augmented Generation)*: Before making a decision, the AI queries the `training_dataset` for "similar past cases" to inform its judgment.
  * *RLHF*: It learns continuously from the "Golden Labels" provided by admin reviews.

---

## 2. Consignment Lifecycle & Workflows

### 2.1 Agent Initialization

1. **Spawn**: User creates a consignment -> A new Guardian Agent is spawned.
2. **Memory Initialization**: The agent initializes its context with the trade route (Origin, Destination) and product DNA.
3. **Skill Loading**: The agent loads necessary security keys (client-side generated) and compliance modules.
4. **Smart Seeding**:

* The "Trade DNA" is extracted (see Section 3.1).
* An initial "Roadmap" (Required Documents Checklist) is generated using AI + Local Rules.

### 2.2 The Component Roadmap (Dynamic Checklist)

The Roadmap is not a static list; it is a living state machine ("Pending" -> "Uploaded" -> "Validated" / "Rejected").

* **Self-Correction**: If a document (e.g., Invoice) reveals the trade is actually from "Vietnam" instead of "Thailand", the system triggers `updateConsignmentRoute`. this updates the core route and *regenerates* the roadmap requirements dynamically.

### 2.3 Guardian Assistant Interface

Instead of static forms, users interact with the **Guardian Assistant Chat**. This Natural Language Interface (NLI) allows users to:

* Request specific requirements ("I need a Phytosanitary Certificate").
* The Guardian interprets the intent and assigns the correct **Specialist Agent** (e.g., Vet & SPS Expert).
* The requirement is dynamically added to the Roadmap.

### 2.3 Document Upload & "The Guardian" Check

When a document is uploaded:

1. **Client-Side Encryption**: File is encrypted in the browser before upload (only encrypted blobs hit Firebase Storage).
2. **AI Analysis (The Guardian)**: The generic file is sent to Gemini Flash 2.0 for deep analysis (Forensics, Content, Context).
3. **Hashing & Anchoring**: A SHA-256 hash of the encrypted blob is computed and anchored to the IOTA Tangle via `iotaService`.
4. **Flagging**: If the Guardian detects issues (Tampering, Route Mismatch), the document is flagged `YELLOW` or `RED`.

---

## 3. The Compliance Engine (Three-Tier Logic)

Compliance is determined by a cascading 3-tier system to ensure speed and accuracy.

### Tier 1: Local Rule Matrix (Fast / Offline)

* **Source**: `services/rules/complianceRules.json`
* **Function**: Instant feedback in the UI. Checks basic Origin/Destination/Product matches.
* **Logic**: "If Origin=China AND Product=Shrimp, Require Health Cert".

### Tier 2: Generative AI (Flexible / Context)

* **Source**: Gemini Flash 2.0 (`complianceService.getRequiredDocuments`)
* **Function**: Handles edge cases and unstructured data ("What documents do I need for *fermented* fish sauce?").
* **Logic**: "As a Trade Compliance Officer, list generic requirements for [Context]."

### Tier 3: BigQuery Oracle (Deep / Regulatory)

* **Function**: The absolute source of regulatory truth.
* **Logic**: Executes 3 parallel queries:
    1. **HS Code Rules**: Matches 4-digit HS prefix (e.g., `0306`).
    2. **Trade Lane Rules**: Strict Country-to-Country regulations.
    3. **Attribute Rules**: Checks for keywords like "Organic", "Frozen", "Halal".
* **Memory**: Logs every query to `compliance_query_logs` to build a training dataset.

---

## 4. Validation & Forensics (The "Guardian" Logic)

Implemented in `validationService.ts`, the Guardian performs a forensic audit on every file.

### 4.1 Security & Forensics

* **Tamper Score (0-100)**: Detects pixel manipulation, font inconsistencies, and "cut-and-paste" attacks.
* **Handwriting Detection**: Explicitly looks for manual overrides on typed numbers (quantities, dates).
* **AI Detection**: Checks if the document itself appears synthetically generated.

### 4.2 Certification Validation (Phase 1)

For certificates (Organic, ISO, etc.), strict logic applies:

* **Date Validity**: `validUntil` vs. Current Date.
* **Holder Match**: Does the certificate holder match the Exporter?
* **Scope Match**: Is the specific product listed in the certified scope?

### 4.3 Route Verification

* **Extracts Origin/Destination** from the document text.
* **Compares against** the Consignment's defined route.
* **Mismatch Action**: Flags the document -> Prompts user to fix route -> Triggers Self-Correction Workflow.

---

## 5. Human-in-the-Loop & RLHF

When the AI is uncertain (`YELLOW`) or detects a blocker (`RED`):

1. **Queueing**: Item is added to `review_queue` collection in Firestore.
2. **Alerting**: An email is triggered to the compliance team.
3. **RLHF (Reinforcement Learning)**:
    * Admin reviews the flagged item.
    * **Decision (Approve/Reject)** is compared against the AI's initial verdict.
    * The result is saved to `training_dataset` as a "Golden Label" (e.g., `DISAGREED_FALSE_POSITIVE`) to retrain the model.

---

## 6. Data & Security Model

### 6.1 Data Privacy

* **Zero-Knowledge Storage**: Files are encrypted with user-held keys (simulated in MVP via `encryptionKeyJwk` stored on object, but architected for client-side only).
* **Lean Storage**: Only metadata exists in Firestore. Heavy blobs are in Storage. Critical proofs are on-chain.

### 6.2 IOTA Integration

* **The "Trust Layer"**.
* **Objects**: Each Consignment is a "Digital Object" on IOTA (L1).
* **Events**: Document uploads and status changes are anchored transactions.
* **Verification**: Third parties can verify the `documentHash` on-chain without seeing the file content.

---

## 7. Continuous Evolution & Updates

The Agentic Architecture stays up-to-date through two distinct mechanisms: **Active Monitoring (Data)** and **Reinforcement Learning (Behavior)**.

### 7.1 Regulatory Watchers (Data Updates)

* **Trigger**: **Cloud Scheduler (Cron)**.
  * *Frequency*: Daily (e.g., 00:00 UTC).
  * *Initiator*: Automated System Process.

### 7.1 The Compliance Intelligence Grid

**Mission**: The Guardian Agent ensures **regulatory compliance** and **chain-of-custody integrity**. It does NOT optimize profit or predict markets.

The Agent monitors four domains that can **invalidate compliance** or **compromise trust**:

* **Domain A: Regulatory & Legal** (Compliance Requirements)
  * *What*: New laws, updated standards, trade deal implementations.
  * *Examples*: EUDR timeline changes, FDA import alert additions, Tariff schedule updates.
  * *Source*: Official Journals, Government APIs, AI Research (Exa/Tavily for early signals).
  * *Action*: "New EUDR deadline detected → Re-validate Deforestation Declaration."

* **Domain B: Logistics & Chain Integrity** (Proof of Movement)
  * *What*: Events that break chain of custody or cold chain.
  * *Examples*: Port strikes (delays affecting shelf-life), Route deviations, Transit country changes.
  * *Source*: Maritime AIS, News feeds, Union announcements.
  * *Action*: "Route diverted through sanctioned port → Compliance VOID."

* **Domain C: Entity Compliance** (Legal Standing)
  * *What*: Changes in partner eligibility.
  * *Examples*: OFAC/UN Sanctions list updates, Supplier license revocations.
  * *Source*: Watchlists (Dow Jones, Refinitiv), Business registries.
  * *Action*: "Supplier added to SDN list → Shipment flagged."

* **Domain D: Physical Integrity** (Goods Quality)
  * *What*: Deviations from specified conditions.
  * *Examples*: Temperature excursions (IoT), Failed lab tests (CoA mismatch), Contamination alerts.
  * *Source*: IoT sensors, LIMS APIs, Inspection reports.
  * *Action*: "Cold chain broken → Compliance status: CONDITIONAL."

**The Fusion Engine**:

* Correlates consignment-specific attributes (Route, Partners, Product) with global signals
* **Invalidates** compliance status if a watched event occurs
* Creates immutable audit trail of all state changes (IOTA anchoring)

### 7.2 Behavioral Updates (Skill Updates)

* **Trigger**: **Human Admin Action**.
  * *Initiator*: Compliance Officer resolving a "Flagged" item in the Review Queue.
* **The RLHF Loop**: How the agent gets "smarter".
    1. **Flagging**: Guardian Agent is unsure.
    2. **Correction**: Admin reviews and provides the correct decision.
    3. **Learning**: This "Golden Label" is added to the training set.
    4. **Fine-Tuning**: The VeriPura AI model is periodically fine-tuned (or its RAG context updated) with these examples, improving accuracy for *all* future consignments.

---

## 8. Technical Patterns

### 8.1 The Serverless "Hydration" Pattern

To maintain the "One Agent, One Consignment" logical model within a cost-effective Serverless environment (Firebase), we use a **Hydration/Dehydration** lifecycle.

* **Logical Model**: The Agent appears to be "alive" 24/7.
* **Physical Reality**: The Agent is "sleeping" (serialized in DB) 99.9% of the time.
    1. **Event Trigger**: A file is uploaded or a message is sent.
    2. **Hydration**: The `AgentCore` wakes up and loads its `agentState` (Memory) from Firestore.
    3. **Execution**: The Agent processes the event (e.g., runs `ForensicSkill`).
    4. **Dehydration**: The Agent analyzes the result, updates its memory, saves the new `agentState` to DB, and shuts down.

This ensures we can scale to millions of consignments without paying for millions of idle servers.

### 8.2 Consignment Merkle Trees (Trust at Scale)

To achieve planetary-scale verification without overwhelming the IOTA Tangle with transactions, we use **per-consignment Merkle Trees**.

**The Challenge**: Anchoring every document individually to IOTA would cost ~$0.001/transaction. For a consignment with 20 documents across 1M shipments = $20M/year in blockchain fees alone.

**The Solution**: Merkle Tree batching per consignment.

1. **Document Upload**: Each document hash (SHA-256) is added to a Merkle Tree structure stored in Firestore.
2. **Milestone Anchoring**: At key lifecycle events (e.g., "Pre-shipment Complete", "Customs Cleared"), the **Merkle Root** is anchored to IOTA.
3. **Selective Verification**: A third party (e.g., customs) can verify any specific document by requesting:
    * The document hash
    * The Merkle proof path (sibling hashes from leaf to root)
    * The anchored root hash from IOTA
4. **Cost Reduction**: 20 documents = 1 IOTA transaction (instead of 20), reducing costs by **95%+**.

**Implementation Detail**:

```text
Consignment Merkle Tree:
├─ Root Hash (anchored to IOTA)
│  ├─ Branch Hash A
│  │  ├─ Leaf: Invoice.pdf (SHA-256: abc123...)
│  │  └─ Leaf: PackingList.pdf (SHA-256: def456...)
│  └─ Branch Hash B
│     ├─ Leaf: CoO.pdf (SHA-256: ghi789...)
│     └─ Leaf: LabReport.pdf (SHA-256: jkl012...)
```

### 8.3 Document Dependency Graph (Surgical Invalidation)

The Guardian Agent maintains a **Dependency Graph** to understand how documents relate to each other and to trade attributes (Route, Product, Partners).

**The Problem**: Traditional systems invalidate the *entire* consignment when any change occurs, creating bottlenecks.

**The Solution**: Graph-based surgical invalidation.

**Dependency Types**:

1. **Attribute Dependencies**: `Certificate of Origin` depends on `Route`
2. **Document Dependencies**: `Customs Declaration` depends on `Commercial Invoice`
3. **Temporal Dependencies**: `Final Inspection` must occur after `Pre-shipment Inspection`

**Example Scenario**:

* **Event**: Route changes from `Thailand → USA` to `Vietnam → USA`
* **Traditional System**: Flags entire consignment as "Invalid"
* **VeriPura**:
  1. Agent identifies documents dependent on "Route": `Certificate of Origin`, `Phytosanitary Certificate`
  2. Invalidates only those 2 documents
  3. Preserves validity of: `Lab Report`, `Commercial Invoice`, `Packing List` (15+ other docs)
  4. Anchors invalidation event to IOTA: `{"event": "ROUTE_CHANGE", "invalidated": ["CoO", "PhytoCert"], "reason": "Origin country changed", "timestamp": "..."}`

**Benefits**:

* **Reduced Re-work**: Only affected documents need re-upload
* **Faster Clearance**: Customs can still process unaffected documents
* **Audit Trail**: Full history of *why* specific documents were invalidated
