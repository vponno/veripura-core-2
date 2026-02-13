# VeriPura Core: Skills Ecosystem

The VeriPura "Guardian Agents" are powered by a suite of specialized, modular **Skills**. These skills act as the "API to the World," ingesting data from regulations, industry standards, scientific databases, and real-time news to make informed compliance decisions.

## 1. Regulatory & Legislative Skills

*Fed by Government Data, Law, and Trade Agreements*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **[RegulatoryCheckSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/regulatoryCheck.ts#14-102)** | **Official Gazettes (EU, FDA)** | Validates specific import rules (EUDR, FSMA, FSVP). Checks product/origin bans. |
| **[SanctionsSentry](file:///Users/onno/veripura-core-opencode/services/agent/subagents/sanctionsSentry.ts#5-60)**<br>*(via WatchlistScent)* | **OFAC, UN, EU Sanctions Lists** | Screen exporters, vessels, and banks against global blacklists. |
| **[LabelingComplianceSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/labelingCompliance.ts#3-35)** | **Codex Alimentarius / EU 1169/2011** | Verifies mandatory label info (allergens, net weight, language) per destination. |
| **[TariffOptimizer](file:///Users/onno/veripura-core-opencode/services/agent/subagents/tariffOptimizer.ts#5-82)**<br>*(Planned)* | **WCO HS Nomenclature / FTA Texts** | Determines HS Codes and preferential duty eligibility. |

## 2. Industry Standards & Certification Skills

*Fed by Private Standards, NGOs, and Audit Bodies*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **[CertificateValidatorSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/certificateValidator.ts#16-67)** | **GFSI, ISO, MSC Databases** | Validates certificate authenticity, expiry, and scope (HACCP, BRCGS, GlobalGAP). |
| **[EthicalAuditSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/ethicalAudit.ts#14-74)** | **SMETA, SA8000, Fairtrade** | Grades social compliance audits (A-E ratings) and flags labor violations. |
| **[FoodSafetyAuditSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/foodSafetyAudit.ts#15-110)** | **BRCGS, SQF, FSSC 22000** | Analyzes technical food safety audit reports for non-conformities. |
| **[ReligiousComplianceSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/religiousCompliance.ts#3-30)** | **Jakim, MUI, OU Kosher** | Verifies Halal/Kosher certification authorities against approved lists. |

## 3. Scientific & Environmental Skills

*Fed by Research, Geospatial Data, and Environmental Baselines*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **[CalculatorSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/calculator.ts#3-92)**<br>*(Carbon)* | **Gavin Green / IPCC Factors** | Calculates Scope 3 transport emissions based on weight/distance/mode. |
| **[RiskDatabaseSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/riskDatabase.ts#3-36)** | **EPPO / WOAH (OIE)** | Checks biosecurity risks (pests, diseases) for specific Origin-Product pairs. |
| **[IngredientAnalysisSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/ingredientAnalysis.ts#3-37)** | **Scientific Literature / CAS Registry** | Decodes chemical synonyms to find hidden banned substances or allergens. |

## 4. Real-Time & IoT Skills

*Fed by Physical Sensors and Location Telemetry*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **[IoTSensorAnalysisSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/iotAnalysis.ts#3-39)** | **Live Data Loggers** | Analyzes temperature logs (MKT) to detect cold chain breaches. |
| **[RegulatoryCheckSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/regulatoryCheck.ts#14-102)**<br>*(EUDR)* | **Satellite Imagery / Geolocation** | Verifies plot coordinates against deforestation maps. |

## 5. Trade & Economic Skills

*Fed by Market Data, Customs Tariffs, and Economic Indicators*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **[CalculatorSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/calculator.ts#3-92)**<br>*(Wages)* | **Global Living Wage Coalition** | Compares paid wages against regional living wage benchmarks (Anker Methodology). |
| **[CalculatorSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/calculator.ts#3-92)**<br>*(Price)* | **Commodity Markets (IndexMundi)** | Checks declared unit prices against market averages to detect transfer pricing fraud. |
| **[DocumentAnalysisSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/documentAnalysis.ts#3-52)** | **Logistics Standards (Incoterms 2020)** | Parses shipping documents (B/L, Invoice) to validate consistencies and clause risks. |
| **[TariffOptimizer](file:///Users/onno/veripura-core-opencode/services/agent/subagents/tariffOptimizer.ts#5-82)** | **WCO HS Nomenclature / FTA Texts** | Determines HS Codes and preferential duty eligibility. |

## 6. Trust & Integrity Skills

*Fed by Internal Logic and Blockchain State*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **[ConflictScannerSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/conflictScanner.ts#15-46)** | **Internal Knowledge Graph** | Detects "Fact Conflicts" (e.g., Invoice says 10T, B/L says 12T) to prevent fraud. |
| **[IotaAnchorSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/iotaAnchor.ts#3-25)** | **IOTA Tangle / MoveVM** | Anchors verified compliance proofs to the blockchain for immutable audit trails. |

## 7. Societal & Cultural Intelligence Skills

*Fed by Linguistics, Regional Norms, and News Sentiment*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **[DocumentAnalysisSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/documentAnalysis.ts#3-52)**<br>*(Context)* | **Natural Language Models (LLM)** | Interprets regional nuances in logistics terms. |
| **[RiskDatabaseSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/riskDatabase.ts#3-36)**<br>*(Social)* | **NGO Reports / News Feeds** | Detects labor unrest, strikes, or cultural holidays affecting supply chain timing. |

## 8. Historical & Performance Skills

*Fed by Internal System History and Supplier Track Records*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **[RiskDatabaseSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/riskDatabase.ts#3-36)**<br>*(Profiling)* | **VeriPura Supplier History** | Flags suppliers with repeated past compliance failures or document anomalies. |
| **[ConflictScannerSkill](file:///Users/onno/veripura-core-opencode/services/agent/skills/conflictScanner.ts#15-46)**<br>*(Pattern)* | **Historical Shipment Data** | Detects deviations from established norms (e.g., "This route 12 days vs 4"). |

## 9. Financial & Risk Skills

*Fed by Credit Bureaus, Insurance Databases, and Geopolitical Feeds*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **`CreditRiskSkill`** | **Dun & Bradstreet / Coface** | Evaluates supplier financial health and bankruptcy risk. |
| **`InsuranceValidationSkill`** | **Lloyd's / Cargo Insurance APIs** | Checks if cargo value exceeds policy limits or if specific commodities are excluded. |
| **`CountryRiskSkill`** | **Marsh / Aon Political Risk Maps** | Monitors civil unrest, expropriation risk, and sovereign default indicators. |
| **`PaymentTermComplianceSkill`** | **Internal ERP / Banking Logs** | Flags suspicious payment patterns (e.g., shell companies) for FCPA/Anti-Bribery compliance. |

## 10. Technical & Quality Agnostic Skills

*Fed by Labs, Chemists, and Dangerous Goods Regulations*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **`LabResultValidationSkill`** | **LIMS / COA Data** | Verifies Certificate of Analysis values against product specifications and tolerances. |
| **`ContainerSealIntegritySkill`** | **Customs & Terminal Feeds** | Validates seal numbers against B/L and detects potential tampering events. |
| **`ADR_IMDGComplianceSkill`** | **UN Dangerous Goods List** | Classifies chemical goods (Hazmat) and verifies labeling/packaging for transport. |

## 11. Emerging Compliance Skills

*Fed by New Directives (ESG, DPP, Forced Labor)*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **`DigitalProductPassportSkill`** | **CIRPASS / ESPR Data Structures** | Assembles full lifecycle data (repairability, recycling) for EU Digital Product Passports. |
| **`ForcedLaborSkill`** | **UFLPA Entity List / Sheffield Hallam** | Screens sub-tier suppliers for links to state-sponsored forced labor programs. |
| **`ESGScoreSkill`** | **CSRD / SFDR Reporting Standards** | Aggregates Scope 1, 2, & 3 data into standardized sustainability reporting metrics. |

## 12. Meta-Skills (The "Brain's" Operating System)

*Fed by System Context and Agent Performance Metrics*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **`SkillDiscoverySkill`** | **Skill Registry Metadata** | Recommends the best tool for a vague user request (e.g., "Check if this is risky"). |
| **`SkillConfidenceSkill`** | **Historical Prediction Accuracy** | Assigns a confidence score to agent outputs based on data quality and past success. |
| **`SkillChainingSkill`** | **Workflow Heuristics** | Orchestrates complex multi-agent workflows (e.g., "If ESG fails, trigger Legal Review"). |

## 13. Specialized High-Risk Industry Skills

*Fed by Sector-Specific Regulations (Pharma, Nuclear, CITES)*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **`PharmaComplianceSkill`** | **GDP / GMP Guidelines** | Verifies Good Distribution Practice for pharmaceuticals and medical devices. |
| **`RadioactiveMaterialSkill`** | **IAEA / Euratom** | Monitor compliance for Class 7 radioactive materials transport and storage. |
| **`CulturalHeritageSkill`** | **CITES / Interpol Art Theft Database** | Screens artifacts and protected species against blacklists to prevent trafficking. |
| **`AnimalWelfareSkill`** | **Global Animal Partnership / WOAH** | Audits live animal transport conditions against welfare standards (beyond Vet/SPS). |
| **`MaritimeSafetySkill`** | **IMO / SOLAS / MARPOL** | Verifies vessel classification, safety equipment, and pollution prevention compliance. |

## 14. Crisis & Resilience Skills

*Fed by Rapid Response Feeds and Recall Databases*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **`RecallMonitorSkill`** | **RASFF (EU) / FDA Recalls** | Instantly cross-checks active shipments against new product recall alerts. |
| **`CrisisResponseSkill`** | **Global Incident Maps** | Triggers automated contingency protocols (e.g., rerouting) during port strikes or natural disasters. |

## 15. Packaging & Circular Economy Skills

*Fed by Waste Directives and Material Databases*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **`PackagingComplianceSkill`** | **EPR Schemes / Plastic Tax Laws** | Calculates Extended Producer Responsibility fees and checks packaging recyclability. |
| **`WasteTrackingSkill`** | **Basel Convention** | Monitors transboundary movement of hazardous waste and "end-of-life" products. |

## 16. Cybersecurity & Digital Trust Skills

*Fed by SecOps and Data Privacy Frameworks*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **`DataPrivacySkill`** | **GDPR / CCPA Rules** | Scrubs personal data (PII) from shipping documents before public blockchain anchoring. |
| **`DigitalChainOfCustodySkill`** | **Cybersecurity Logs** | Validates the digital integrity of the document trail to detect man-in-the-middle tampering. |

## 17. Agent Architecture & DevOps Skills

*Fed by System Telemetry, Version Control, and Health Checks*

| Skill Name | Data Source | Responsibility |
| :--- | :--- | :--- |
| **`SkillTelemetrySkill`** | **OpenTelemetry / CloudWatch** | Logs inputs, outputs, latency, and token costs for every skill execution to enable observability. |
| **`SkillVersionManager`** | **Feature Flags / Registry** | Routes requests to specific skill versions (v1 vs v2) to allow safe A/B testing and rollouts. |
| **`ReliabilityFallbackSkill`** | **Circuit Breaker Status** | Detects API failures or timeouts and triggers deterministic fallback logic (e.g., regex vs. LLM). |
| **`ConflictResolutionSkill`** | **Prioritization Logic** | Arbitrates when two skills provide opposing advice (e.g., "Lowest Cost" vs. "Lowest Carbon"). |
