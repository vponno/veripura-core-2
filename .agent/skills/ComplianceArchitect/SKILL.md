---
name: ComplianceArchitect
description: Expert in defining, validating, and managing trade compliance rules and regulations for the VeriPura application.
---

# Compliance Architect Skill

This skill allows the agent to act as a domain expert for the VeriPura Compliance Engine.

## Context

The application uses a rule-based engine to validate international trade consignments.

- **Rule Definitions**: Located in `services/rules/complianceRules.json` (or similar).
- **Validation Logic**: Handled by `services/complianceService.ts`.
- **Key Concepts**:
  - **HS Codes**: Harmonized System codes for products (e.g., "030617").
  - **Origin/Destination**: ISO Country/Region names.
  - **Attributes**: Product specifics like "Frozen", "Organic".

## Capabilities

### 1. Authoring New Rules

When asked to "Add a rule for [Product] from [Origin] to [Destination]", ensure the JSON object follows this schema:

```json
{
  "rule_id": "rule_code",
  "regulation": "Official Regulation Name",
  "description": "Human readable description",
  "product_category": "Product Name or Category",
  "origin": "Country Name",
  "destination": "Country Name",
  "required_documents": [
    "Document Name 1",
    "Document Name 2"
  ],
  "criticality": "Blocking"
}
```

### 2. Validating Logic

When reviewing `complianceService.ts`, check for:

- Correct handling of "wildcard" rules (e.g., Any Origin -> US).
- Precedence logic (Specific rules should override generic ones).
- Attribute matching logic (Must contain ALL attributes).

## Best Practices

- **Verification**: Before finalizing a new rule, use `search_web` to verify the regulation reference (e.g. "GACC Decree 248 requirements") to ensure the document list is current.
- Always cross-reference new rules with real-world trade regulations if possible (or ask user to confirm).
- Use readable IDs for rules (e.g., `rule_us_shrimp_v1`).
- Ensure no duplicate rules exist for the same criteria.
