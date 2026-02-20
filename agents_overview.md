# VeriPura Core - Agent Overview

This document lists the specialized agents within the VeriPura Core system, their responsibilities, and the capabilities (skills) they utilize to perform their duties.

## 1. Regulatory & Compliance Agents

### EU Deforestation Regulation (EUDR) Specialist

* **ID:** `eudr_specialist`
* **Role:** Ensures compliance with EU Deforestation Regulation.
* **Capabilities:**
  * Analyzes geolocation data.
  * Verifies deforestation-free status for relevant commodities (cattle, cocoa, coffee, oil palm, rubber, soya, wood).
* **Activation:** Shipments to EU destinations.

### FSMA Specialist (USA)

* **ID:** `fsma_specialist`
* **Role:** Expert on FDA Food Safety Modernization Act.
* **Capabilities:**
  * Verifies Foreign Supplier Verification Program (FSVP) requirements.
  * Checks for PCQI (Preventive Controls Qualified Individual) documentation.
* **Activation:** Shipments to USA.

### Sanctions Sentry

* **ID:** `sanctions_sentry`
* **Role:** Global trade compliance guardian.
* **Capabilities:**
  * Checks entities against OFAC, EU, and UN sanctions lists.
  * **Skill:** `WatchlistScentSkill` (sanctions screening).
* **Activation:** All international shipments.

### AEO Checkpoint

* **ID:** `aeo_checkpoint`
* **Role:** Authorized Economic Operator compliance.
* **Capabilities:**
  * Validates AEO security criteria.
  * Ensures supply chain security standards.
* **Activation:** General trade compliance context.

### Tariff Optimizer

* **ID:** `tariff_optimizer`
* **Role:** Customs duty and tariff expert.
* **Capabilities:**
  * Analyzes HS Codes for preferential tariff eligibility (FTAs).
  * Estimates landed cost duties.
* **Activation:** General trade compliance context.

### Incoterms Advisor

* **ID:** `incoterms_advisor`
* **Role:** International Commercial Terms expert.
* **Capabilities:**
  * Validates correct usage of Incoterms 2020.
  * Identifies risk transfer points and insurance responsibilities.
* **Activation:** All shipments.

## 2. Product Safety & Quality Agents

### Vet & SPS Expert

* **ID:** `vet_sps_expert`
* **Role:** Veterinary and Sanitary/Phytosanitary specialist.
* **Capabilities:**
  * Verifies health certificates for animal products.
  * Checks phytosanitary requirements for plant products.
* **Activation:** Meat, animal products, fresh produce.

### Food Safety Auditor

* **ID:** `food_safety_auditor`
* **Role:** General food safety compliance.
* **Capabilities:**
  * Reviews basic food safety documentation.
  * **Skill:** `FoodSafetyAuditSkill`.
* **Activation:** All food shipments.

### HACCP Specialist

* **ID:** `haccp_specialist`
* **Role:** Hazard Analysis Critical Control Point expert.
* **Capabilities:**
  * Verifies HACCP implementation and critical control point monitoring.
* **Activation:** Products with 'HACCP' attribute.

### GMP Inspector

* **ID:** `gmp_inspector`
* **Role:** Good Manufacturing Practice inspector.
* **Capabilities:**
  * Audits manufacturing hygiene and process controls.
* **Activation:** Products with 'GMP' attribute.

### FSSC 22000 Expert

* **ID:** `fssc_22000_expert`
* **Role:** FSSC 22000 certification specialist.
* **Capabilities:**
  * Validates FSSC 22000 certification validity and scope.
* **Activation:** Products with 'FSSC 22000' attribute.

### BRCGS Specialist

* **ID:** `brcgs_specialist`
* **Role:** British Retail Consortium Global Standards expert.
* **Capabilities:**
  * Verifies BRCGS Food Safety certification.
* **Activation:** Products with 'BRC' or 'BRCGS' attribute.

## 3. Sustainability & Ethics Agents

### Organic Sentinel

* **ID:** `organic_sentinel`
* **Role:** Validates organic certifications and equivalency arrangements.
* **Key Functions:**
  * **Global Standard Validation:** Supports USDA NOP, EU Organic, JAS (Japan), COR (Canada), China Organic, Korea Organic (MAFRA), ACO (Australia), OOAP (New Zealand), and UK Organic.
  * **Equivalency Checking:** Automatically handles trade arrangements (e.g., US-EU, US-Canada).
  * **Certificate Verification:** Ensures provided certificates match destination requirements.
* **Trigger:** Detection of "Organic" attribute in product metadata.

### Ethical Sourcing Specialist

* **ID:** `ethical_sourcing_specialist`
* **Role:** Labor rights and ethical trade monitor.
* **Capabilities:**
  * Verifies social audits (SMETA, SA8000).
  * **Skill:** `EthicalAuditSkill`.
* **Activation:** High-risk origins or general ethical checks.

### Living Wage Validator

* **ID:** `living_wage_validator`
* **Role:** Fair compensation analyst.
* **Capabilities:**
  * Compares paid wages against Global Living Wage Coalition benchmarks or local context.
* **Activation:** General ethical checks.

### Social Compliance Whistleblower

* **ID:** `social_compliance_whistleblower`
* **Role:** Detector of labor violations.
* **Capabilities:**
  * Scans for reports of forced labor or unsafe working conditions.
* **Activation:** General ethical checks.

### IUU Fishery Watcher

* **ID:** `iuu_fishery_watcher`
* **Role:** Illegal, Unreported, and Unregulated fishing monitor.
* **Capabilities:**
  * Verifies Catch Certificates.
  * Checks vessel blacklists.
* **Activation:** Fish and seafood products (HS 03).

### Eco Marker Specialist

* **ID:** `eco_marker_specialist`
* **Role:** Sustainability certification expert.
* **Capabilities:**
  * Verifies Rainforest Alliance, Fairtrade, and other eco-labels.
* **Activation:** Coffee, Cocoa, Tea, or products with specific eco-labels.

### Carbon Tracker

* **ID:** `carbon_tracker`
* **Role:** Supply chain emissions analyst.
* **Capabilities:**
  * Estimates transport emissions (Scope 3).
* **Activation:** All shipments.

### BSCI Auditor

* **ID:** `bsci_auditor`
* **Role:** Business Social Compliance Initiative auditor.
* **Capabilities:**
  * Reviews BSCI audit reports and grades (A-E).
* **Activation:** Products with 'BSCI' attribute.

## 4. Specific Requirements Agents

### Halal / Kosher Guardian

* **ID:** `halal_kosher_guardian`
* **Role:** Religious dietary compliance.
* **Capabilities:**
  * Verifies Halal or Kosher certification validity.
  * Checks ingredient compatibility.
* **Activation:** Products marked Halal or Kosher.

### Labeling Inspector

* **ID:** `labeling_inspector`
* **Role:** Product labeling compliance.
* **Capabilities:**
  * Checks mandatory label information (allergens, net weight, language requirements).
* **Activation:** Consumer packaged goods.

### Ingredient Cryptographer

* **ID:** `ingredient_cryptographer`
* **Role:** Ingredient list analyzer.
* **Capabilities:**
  * Decodes complex ingredient lists to find hidden allergens or banned substances.
* **Activation:** Processed foods.

## 5. Logistics & Operations Agents

### Chain of Custody Auditor

* **ID:** `chain_of_custody_auditor`
* **Role:** Traceability guardian.
* **Capabilities:**
  * Verifies the link between shipping documents to ensure continuous custody.
  * **Skill:** `CertificateValidatorSkill`.
* **Activation:** All shipments.

### Cold Chain Diplomat

* **ID:** `cold_chain_diplomat`
* **Role:** Temperature-controlled logistics expert.
* **Capabilities:**
  * Monitors temperature data logs (IoT) for excursions.
* **Activation:** Temperature-sensitive goods.

### Logistics Lingo Interpreter

* **ID:** `logistics_lingo_interpreter`
* **Role:** Expert in shipping terminology and documentation.
* **Capabilities:**
  * Clarifies discrepancies in shipping descriptions across documents.
* **Activation:** Discrepancy resolution.

### Insurance Claims Scout

* **ID:** `insurance_claims_scout`
* **Role:** Risk and claims analyst.
* **Capabilities:**
  * Pre-assesses potential for insurance claims based on incidents.
* **Activation:** Incidents or damaged goods.

### Price Parity Agent

* **ID:** `price_parity_agent`
* **Role:** Valuation analyst.
* **Capabilities:**
  * Checks declared value against market averages to prevent transfer pricing fraud.
* **Activation:** All shipments.

### Document Reconciliation Specialist

* **ID:** `document_reconciler`
* **Role:** Integrity guardian for trade documentation.
* **Capabilities:**
  * Parses uploaded documents (PDFs, Images) using LlamaParse.
  * Cross-references document contents with digital consignment data to flag inconsistencies (e.g., mismatching origin, quantity, or product description).
  * **Skill:** `DocumentGuardSkill`.
* **Activation:** Document Upload events.

## 6. Infrastructure Agents

### Bio Security Border Guard

* **ID:** `bio_security_border_guard`
* **Role:** Biosecurity risk monitor.
* **Capabilities:**
  * Checks for pest/disease risks associated with origin/product combos.
* **Activation:** Agricultural goods.

---

## 7.0 Roadmap: Planned Agents

*These agents map to gaps in the 17-Source Skills Ecosystem and are planned for future implementation.*

### 7.1 Financial & Risk Agents

| Status | Planned Agent ID | Name | Maps to Skill | Description |
| :---: | :--- | :--- | :--- | :--- |
| ✅ IMPLEMENTED | `credit_risk_analyst` | Credit Risk Analyst | `CreditRiskSkill` | Evaluates supplier financial health via Dun & Bradstreet / Coface |
| ✅ IMPLEMENTED | `insurance_validator` | Insurance Validator | `InsuranceValidationSkill` | Validates cargo insurance adequacy against policy limits |
| ✅ IMPLEMENTED | `country_risk_monitor` | Country Risk Monitor | `CountryRiskSkill` | Monitors political unrest, expropriation risk |
| | `payment_compliance_scout` | Payment Compliance Scout | `PaymentTermComplianceSkill` | FCPA/Anti-Bribery payment pattern analysis |

### 7.2 Technical & Quality Agents

| Status | Planned Agent ID | Name | Maps to Skill | Description |
| :---: | :--- | :--- | :--- | :--- |
| ✅ IMPLEMENTED | `lab_result_validator` | Lab Result Validator | `LabResultValidationSkill` | Verifies COA values against specifications |
| ✅ IMPLEMENTED | `container_seal_guard` | Container Seal Guard | `ContainerSealIntegritySkill` | Validates seal numbers, detects tampering |
| ✅ IMPLEMENTED | `adr_imdg_specialist` | ADR/IMDG Specialist | `ADR_IMDGComplianceSkill` | Dangerous goods classification and labeling |

### 7.3 Emerging Compliance Agents

| Status | Planned Agent ID | Name | Maps to Skill | Description |
| :---: | :--- | :--- | :--- | :--- |
| ✅ IMPLEMENTED | `digital_passport_architect` | Digital Product Passport Architect | `DigitalProductPassportSkill` | Builds EU Digital Product Passports (CIRPASS) |
| ✅ IMPLEMENTED | `forced_labor_detector` | Forced Labor Detector | `ForcedLaborSkill` | Screens for UFLPA/Sheffield Hallam links |
| ✅ IMPLEMENTED | `esg_score_keeper` | ESG Score Keeper | `ESGScoreSkill` | CSRD/SFDR aggregated sustainability reporting |

### 7.4 Meta-Skills (Agent Operating System)

| Status | Planned Agent ID | Name | Maps to Skill | Description |
| :---: | :--- | :--- | :--- | :--- |
| ✅ IMPLEMENTED | `skill_discovery_broker` | Skill Discovery Broker | `SkillDiscoverySkill` | Recommends best skill for vague requests |
| ✅ IMPLEMENTED | `confidence_calibrator` | Confidence Calibrator | `SkillConfidenceSkill` | Scores output reliability |
| ✅ IMPLEMENTED | `workflow_orchestrator` | Workflow Orchestrator | `SkillChainingSkill` | Chains multi-agent workflows |

### 7.5 Specialized High-Risk Industry Agents

| Status | Planned Agent ID | Name | Maps to Skill | Description |
| :---: | :--- | :--- | :--- | :--- |
| ✅ IMPLEMENTED | `pharma_compliance_guard` | Pharma Compliance Guard | `PharmaComplianceSkill` | GDP/GMP verification for pharma |
| | `radioactive_material_monitor` | Radioactive Material Monitor | `RadioactiveMaterialSkill` | Class 7 transport compliance |
| | `cultural_heritage_sentinel` | Cultural Heritage Sentinel | `CulturalHeritageSkill` | CITES/Interpol artifact screening |
| | `animal_welfare_auditor` | Animal Welfare Auditor | `AnimalWelfareSkill` | Live animal transport welfare |
| | `maritime_safety_inspector` | Maritime Safety Inspector | `MaritimeSafetySkill` | IMO/SOLAS/MARPOL compliance |

### 7.6 Crisis & Resilience Agents

| Status | Planned Agent ID | Name | Maps to Skill | Description |
| :---: | :--- | :--- | :--- | :--- |
| ✅ IMPLEMENTED | `recall_monitor` | Recall Monitor | `RecallMonitorSkill` | RASFF/FDA recall cross-check |
| | `crisis_response_coordinator` | Crisis Response Coordinator | `CrisisResponseSkill` | Automated contingency during disasters |

### 7.7 Packaging & Circular Economy Agents

| Planned Agent ID | Name | Maps to Skill | Description |
| :--- | :--- | :--- | :--- |
| `packaging_compliance_officer` | Packaging Compliance Officer | `PackagingComplianceSkill` | EPR fee calculation, recyclability |
| `waste_tracking_sentinel` | Waste Tracking Sentinel | `WasteTrackingSkill` | Basel Convention waste monitoring |

### 7.8 Cybersecurity & Digital Trust Agents

| Planned Agent ID | Name | Maps to Skill | Description |
| :--- | :--- | :--- | :--- |
| `data_privacy_guard` | Data Privacy Guard | `DataPrivacySkill` | PII scrubbing before blockchain |
| `digital_chain_guard` | Digital Chain of Custody Guard | `DigitalChainOfCustodySkill` | Document trail integrity verification |

### 7.9 Agent Architecture & DevOps Agents

| Status | Planned Agent ID | Name | Maps to Skill | Description |
| :---: | :--- | :--- | :--- | :--- |
| ✅ IMPLEMENTED | `skill_telemetry_collector` | Skill Telemetry Collector | `SkillTelemetrySkill` | Observability logs for skill execution |
| ✅ IMPLEMENTED | `skill_version_manager` | Skill Version Manager | `SkillVersionManager` | A/B testing and version routing |
| ✅ IMPLEMENTED | `reliability_fallback_controller` | Reliability Fallback Controller | `ReliabilityFallbackSkill` | Circuit breaker, fallback logic |
| ✅ IMPLEMENTED | `conflict_resolution_arbiter` | Conflict Resolution Arbiter | `ConflictResolutionSkill` | Arbitrates skill conflicts |

---

**Note:** All agents are orchestrated by the central **Guardian Agent**, which utilizes a Dependency Graph to determine the activation order and information flow between these specialists.
**Interface:** Users interact with these agents via the **Guardian Assistant Chat**, which interprets natural language requests (e.g., "Add Halal Cert") and assigns the appropriate specialist.
