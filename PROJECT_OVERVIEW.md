# VeriPura Connect: Project Overview

## Executive Summary

**VeriPura Connect** is a cutting-edge **Export Compliance & Trade Automation Platform**. It empowers food exporters and supply chain managers to navigate complex regulatory landscapes with ease.

By combining **AI-driven documentation analysis** with the immutable trust of the **IOTA Rebased (MoveVM)** blockchain, VeriPura Connect automates the collection, validation, and anchoring of critical trade data. We replace manual, error-prone compliance processes with a secure, digital-first workflow.

---

## Target Audience

* **Primary User**: **Buyers (Retailers & Importers)**.
  * *Goal*: Manage demand, ensure compliance of incoming shipments, and mitigate regulatory risk.
* **Secondary User**: **Processors** (Next Phase).
  * *Goal*: Supply chain transparency and processing data validation.
* **Note**: *Farmers & Co-ops are currently out of scope.*

---

## Technology Stack

Our stack is built for security, speed, and data integrity.

### Frontend

* **Framework**: [React](https://react.dev/) (v18+) with [Vite](https://vitejs.dev/).
* **Styling**: [TailwindCSS](https://tailwindcss.com/) for a professional, responsive administration interface.
* **Key Libraries**:
  * `lucide-react`: Professional UI iconography.
  * `recharts`: Analytics for compliance metrics and volume tracking.

### Backend & AI

* **Platform**: [Firebase](https://firebase.google.com/) (Google Cloud).
  * **Auth**: Secure access control.
  * **Firestore**: Real-time state management for Consignment flows.
  * **Storage**: Encrypted document storage.
* **Artificial Intelligence**: **Google Gemini** (via `@google/genai`).
  * **Function**: The "Compliance Engine".
  * **Capabilities**: Automated document classification, data extraction (HS Codes, Weights), and cross-referencing against trade route regulations.

### Web3 / Trust Layer

* **Network**: **IOTA Rebased** (MoveVM) - The "Trust Layer".
* **Smart Contracts (Move)**:
  * `veripura::supply_chain`: On-chain logic to anchor compliance proofs.
  * **Objective**: Create an immutable audit trail for every validated step in the export roadmap.
* **Wallet Integration**: Browser-based key management for signing compliance assertions.

---

## Core Functionality

### 1. Export Assessment & Roadmap

* **Trade Route Selection**: Users define the export flow (e.g., Vietnam → United States).
* **Dynamic Roadmap**: The platform generates a tailored "Compliance Roadmap" based on the selected route (e.g., automatically requiring specific organic certs or phytosanitary documents).

### 2. Intelligent Consignment Management

* **Secure Document Upload**: Exporters upload required trade documents (Invoices, Certificates, Packing Lists).
* **AI Validation**:
  * **Tamper Detection**: AI analyzes files for signs of manipulation (font inconsistencies, digital alterations).
  * **Data Integrity**: Verifies that document contents (e.g., weight, origin) match the Consignment declaration.

### 3. Admin Review (RLHF)

* **Handling Exceptions**: When AI confidence is low or issues are flagged, specific items are routed to the "Admin Review Hub".
* **Human-in-the-Loop**: Compliance officers review these edge cases, resolving them and simultaneously retraining the system (Reinforcement Learning from Human Feedback).

---

## Roadmap

### Phase 1: Compliance Foundations (Current)

* [x] Consignment Registration & Dynamic Roadmaps
* [x] AI-Powered Document Analysis & Validation
* [x] Secure Document Storage & Encryption
* [x] Admin Review Hub (RLHF Feedback Loop)
* [x] Atomic Upload Orchestration & Rapid Scan

**Technology Stack**:

* **Frontend**: React, TailwindCSS, Lucide Icons, Recharts.
* **Backend**: Firebase (Auth, Firestore, Storage, Hosting).
* **AI**: Google Gemini Pro 1.5 (via Vertex AI/Studio) for document analysis.
* **Security**: AES-GCM encryption for stored documents.

### Phase 2: The "Move" to Immutable Trust

* [ ] **On-Chain Anchoring**: Deploy Move modules to anchor "Proof of Compliance".
* [ ] **Processor Integration**: Modules for processors to validate batching and quality before export.
* [ ] **Digital Product Passport**: Bundle data into a shareable digital identity.

**Technology Stack**:

* **Blockchain**: IOTA Rebased (Testnet).
* **Smart Contracts**: Move Language (MoveVM).
* **Integration**: IOTA TypeScript SDK for transaction signing & object management.

### Phase 3: Automation & Scale

* [ ] **Automated Regulatory Updates**: Real-time sync with global trade laws.
* [ ] **External Verifier Access**: Limited-access portals for Customs Agents or third-party auditors.
