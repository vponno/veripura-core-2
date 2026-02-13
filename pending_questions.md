# Pending Questions - Session 2026-02-01

## Context

User provided an Executive Summary with new implementation details (Merkle Trees, Dependency-Aware Logic). These questions need to be answered before implementation.

---

## 1. Consignment Merkle Trees

**Question:** Should the Merkle Tree be recalculated on every document upload (dynamic), or only at specific milestones (e.g., "Consignment Locked")?

* **Options**:
  * **A) Dynamic**: Every document upload triggers a Merkle Tree recalculation and a new IOTA anchor
    * *Pros*: Real-time verifiability, complete audit trail
    * *Cons*: Higher IOTA transaction costs, more complex state management
  * **B) Milestone-Based**: Only anchor at key lifecycle events ("Pre-shipment Complete", "In Transit", "Delivered")
    * *Pros*: Lower costs, simpler logic
    * *Cons*: Gaps in audit trail between milestones

* **User Decision**: *[Pending]*

---

## 2. Document Dependency Intelligence

**Question:** Are document dependencies hardcoded (Route → CoO, Lab → Quality) or do we want the Agent to *learn* them from training data?

* **Options**:
  * **A) Hardcoded Rules**: Manually define dependency graphs in configuration
    * *Example*: `{ "route_change": ["certificate_of_origin", "customs_declaration"] }`
    * *Pros*: Predictable behavior, easier to debug
    * *Cons*: Rigid, requires manual updates for new document types
  * **B) AI-Learned Dependencies**: The Agent infers relationships from RLHF training data
    * *Pros*: Adaptable to new trade patterns, discovers non-obvious relationships
    * *Cons*: Risk of incorrect inferences, harder to explain to users

* **User Decision**: *[Pending]*

---

## 3. Executive Summary Integration

**Question:** Where should the Executive Summary content live?

* **Options**:
  * **A)** Update `bizlogic.md` to include Merkle Trees and Dependency Logic in technical sections
  * **B)** Keep as separate `executive_summary.md` for investor/partner presentations
  * **C)** Integrate as new "Section 1" of `patent_disclosure_draft.md` to strengthen claims

* **User Decision**: *[Pending]*

---

## Next Steps (When Resuming)

1. Answer the above questions
2. Implement Merkle Tree logic in architecture
3. Define Document Dependency model
4. Update patent claims based on these technical details
