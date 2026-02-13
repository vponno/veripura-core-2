---
name: ComplianceListBuilder
description: Dedicated skill for researching, verifying, and maintaining the static compliance rule list (complianceRules.json).
---

# Compliance List Builder

This skill focuses on building and maintaining the `services/rules/complianceRules.json` source of truth.

## Workflow: Adding a New Rule

1.  **Trigger**: User says "Add a rule for [Product] to [Country]" or "Ensure we cover [Regulation]".
2.  **Research**:
    *   Use `search_web` to find the official regulation (e.g., "import requirements for frozen fish to Vietnam").
    *   Identify: Regulation Name, Issuing Agency, Specific Documents (e.g., "Health Certificate", "Bill of Lading").
    *   Determine if generic or specific (e.g. only applies to "Frozen" or "Organic").
3.  **Construct JSON**:
    *   Follow the schema in `services/rules/complianceRules.json`.
    *   `rule_id`: `rule_[country]_[product]_[feature]` (e.g., `rule_vn_frozen_fish`).
    *   `isMandatory`: Always `true` for hard rules.
4.  **Verification**:
    *   Check if a conflicting rule exists in `services/rules/complianceRules.json`.
    *   Read the file first.
    *   Append the new rule to the array.

## JSON Schema Reference

```json
{
    "rule_id": "string",
    "regulation": "string",
    "description": "string",
    "product_category": "string (or 'General')",
    "origin": "string (or 'any')",
    "destination": "string (or 'any')",
    "required_documents": [
        {
            "name": "string",
            "category": "string",
            "description": "string",
            "isMandatory": boolean
        }
    ],
    "criticality": "Blocking | Warning"
}
```

## Best Practices
*   **Granularity**: Prefer specific rules (e.g. "Shrimp to US") over generic ones unless it's a global standard (e.g. "Bill of Lading").
*   **Citations**: Put the regulation name in the `regulation` field so we can trace it back.
*   **Duplicates**: Never add a rule if the exact same `origin`, `destination`, and `product_category` logic already exists. Update the existing one instead.
