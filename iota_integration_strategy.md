# IOTA Integration Strategy

**Version**: 1.0  
**Last Updated**: 2026-02-03  
**Status**: Draft - Pending Architecture Review

---

## Executive Summary

This document outlines VeriPura's technical integration strategy with the IOTA ecosystem, specifically:

1. **Near-term**: Hash anchoring to IOTA Tangle for immutable audit trails
2. **Mid-term**: Compatibility with TWIN digital identity and product passport infrastructure
3. **Long-term**: Move smart contracts for on-chain compliance logic

**Key Decision**: VeriPura operates as a **compliance verification layer** compatible with, but not dependent on, TWIN/ADAPT infrastructure.

---

## 1. Current State: Hash Anchoring via IOTA SDK

### 1.1 What We Anchor

**Per Consignment:**

* Merkle Root Hash (batches all document hashes)
* Forensic Verdict Metadata (Guardian Agent's decision)
* Invalidation Events (route changes, compliance status changes)

**What We Do NOT Anchor:**

* Raw documents (privacy preservation)
* Personal data (GDPR compliance)
* Business-sensitive information (trade secrets)

### 1.2 Technical Implementation

**Current Code:**

* [`iotaService.ts`](../services/iotaService.ts) - Already implemented
* Uses `@iota/sdk` npm package
* Anchors to IOTA Tangle Mainnet

**Anchoring Pattern**:

```typescript
interface AnchoredData {
  type: 'CONSIGNMENT_MERKLE_ROOT' | 'INVALIDATION_EVENT' | 'FORENSIC_VERDICT';
  consignmentId: string;
  merkleRoot?: string;
  timestamp: string;
  metadata: {
    validationLevel?: 'GREEN' | 'YELLOW' | 'RED';
    invalidatedDocs?: string[];
    reason?: string;
  };
}
```

### 1.3 Verification Flow

**Third-Party Verification (e.g., Customs):**

1. Request consignment proof from VeriPura
2. Receive: `{ merkleRoot, merkleProof[], iotaTxHash }`
3. Verify against IOTA Tangle independently
4. Confirm document integrity without accessing raw files

**Benefits:**

* Zero-knowledge verification (privacy preserved)
* Third-party auditable (no trust in VeriPura required)
* Immutable (cannot be backdated or altered)

---

## 2. TWIN Ecosystem Integration

### 2.1 What is TWIN?

**TWIN** (Trade World Information Network) provides:

* Digital identities for trade partners (verified by institutions)
* Digital product passports (origin, certifications, sustainability)
* Interoperability layer for existing trade systems

**Source**: IOTA Foundation's trade digitization initiative

### 2.2 Integration Strategy: "Compliance Layer on Top"

**Architectural Decision**:

```text
┌─────────────────────────────────────────────────┐
│         VeriPura Compliance Guardian            │
│    (Forensic Analysis + RLHF + Dependency)      │
└─────────────────┬───────────────────────────────┘
                  │ Reads identities/passports
                  │ Writes compliance verdicts
┌─────────────────▼───────────────────────────────┐
│              TWIN Infrastructure                │
│    (Digital IDs + Product Passports + APIs)     │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              IOTA Tangle                        │
│       (Shared Truth Layer + Anchoring)          │
└─────────────────────────────────────────────────┘
```

**Division of Concerns:**

| Responsibility       | TWIN                 | VeriPura                         |
| :------------------- | :------------------- | :------------------------------- |
| Partner Identity     | ✅ Manages           | ✅ Verifies against watchlists   |
| Product Passport     | ✅ Stores baseline   | ✅ Validates forensically        |
| Transport History    | ✅ Tracks events     | ✅ Monitors for deviations       |
| Compliance Rules     | ❌                   | ✅ Guardian Agent intelligence   |
| Document Forensics   | ❌                   | ✅ AI-powered tamper detection   |
| RLHF Learning        | ❌                   | ✅ Self-improving validation     |

### 2.3 API Integration Points

**What VeriPura Needs from TWIN:**

1. **Identity Verification API**

    ```typescript
    interface TWINIdentityAPI {
      getVerifiedPartner(partnerId: string): {
        companyName: string;
        registrationNumber: string;
        verifiedBy: string; // Institution that verified
        verificationDate: string;
        status: 'active' | 'suspended' | 'revoked';
      };
    }
    ```

2. **Product Passport API**

    ```typescript
    interface TWINProductPassportAPI {
      getPassport(productId: string): {
        origin: string;
        certifications: string[];
        sustainabilityData: object;
        transportHistory: Event[];
      };
    }
    ```

**What VeriPura Provides to TWIN:**

1. **Compliance Verdict API**

    ```typescript
    interface VeriPuraComplianceAPI {
      getConsignmentCompliance(consignmentId: string): {
        status: 'COMPLIANT' | 'CONDITIONAL' | 'VOID';
        validationLevel: 'GREEN' | 'YELLOW' | 'RED';
        lastVerified: string;
        iotaProof: string; // IOTA tx hash
      };
    }
    ```

### 2.4 Standalone vs. TWIN-Dependent

**Decision**: **Hybrid Approach**

* VeriPura works **standalone** (does not require TWIN to function)
* If TWIN is available, VeriPura **enhances** with identity/passport integration
* Feature flag: `VITE_ENABLE_TWIN_INTEGRATION`

**Rationale:**

* Market flexibility (not locked to IOTA ecosystem)
* Incremental adoption (deploy VeriPura first, add TWIN later)
* Risk mitigation (if TWIN development delays, VeriPura still launches)

---

## 3. Move Smart Contracts Roadmap

### 3.1 Why Move?

IOTA uses **Move** (originally from Sui) for smart contracts.

**Move's Key Properties:**

* Digital assets cannot be copied (resource safety)
* Clear ownership semantics
* Compile-time verification (prevents entire classes of bugs)

**Relevance to VeriPura:**

* Compliance rules are "resources" (cannot be duplicated)
* Forensic verdicts are "assets" (ownership matters for liability)
* Financial incentives (staking for validators) require safe asset handling

### 3.2 Current State: No Smart Contracts

**What We Have:**

* Off-chain validation (Gemini AI + BigQuery)
* On-chain anchoring (hashes only)

**What We Don't Have:**

* On-chain compliance logic
* Tokenized incentives
* Decentralized validator network

### 3.3 Roadmap: Three Phases

#### **Phase 1: Hash Anchoring Only** (Current - Q1 2026)

**Status**: ✅ Implemented

* Merkle roots anchored to IOTA
* No smart contracts required
* Centralized validation (VeriPura backend)

#### **Phase 2: On-Chain Compliance Registry** (Q3 2026)

**Goal**: Move compliance verdicts on-chain for third-party verifiability

**Use Case:**

* Customs wants to verify compliance without trusting VeriPura's database
* They query IOTA smart contract directly
* Contract returns: `{ consignmentId, status, timestamp, merkleRoot }`

**Move Module Pseudocode:**

```move
module VeriPura::ComplianceRegistry {
    use iota::object::{Self, UID};
    use iota::tx_context::TxContext;

    /// Represents a compliance verdict for a consignment
    struct ComplianceVerdictNFT has key, store {
        id: UID,
        consignment_id: vector<u8>,
        merkle_root: vector<u8>,
        validation_level: u8, // 0=GREEN, 1=YELLOW, 2=RED
        timestamp: u64,
        guardian_signature: vector<u8>
    }

    /// Guardian Agent publishes verdict on-chain
    public entry fun publish_verdict(
        consignment_id: vector<u8>,
        merkle_root: vector<u8>,
        validation_level: u8,
        ctx: &mut TxContext
    ) {
        // Verify caller is authorized Guardian
        // Create NFT representing verdict
        // Transfer to public registry
    }

    /// Third party verifies compliance
    public fun verify_compliance(
        verdict: &ComplianceVerdictNFT,
        document_hash: vector<u8>,
        merkle_proof: vector<vector<u8>>
    ): bool {
        // Verify merkle proof against root
        // Return true if document is in the tree
    }
}
```

**Benefits:**

* Decentralized verification (no VeriPura API required)
* Immutable verdicts (cannot be altered after publication)
* Auditable history (all verdicts queryable on-chain)

#### **Phase 3: Decentralized Validation Network** (2027+)

**Goal**: Move Guardian Agent validation on-chain with economic incentives

**Concept:**

* Multiple independent validators run Guardian Agents
* Validators stake IOTA to participate
* Consensus on compliance verdicts
* Rewards for honest validation
* Slashing for malicious behavior

**Move Module Pseudocode:**

```move
module VeriPura::ValidatorNetwork {
    struct Validator has key {
        id: UID,
        stake: Balance<IOTA>,
        reputation_score: u64,
        verdicts_validated: u64
    }

    struct ValidationTask has key {
        id: UID,
        consignment_id: vector<u8>,
        required_validators: u8,
        current_votes: vector<Vote>,
        consensus_reached: bool
    }

    public entry fun submit_vote(
        task: &mut ValidationTask,
        validator: &Validator,
        validation_level: u8, // 0=GREEN, 1=YELLOW, 2=RED
        ctx: &mut TxContext
    ) {
        // Verify validator has sufficient stake
        // Record vote
        // If threshold reached, finalize verdict
        // Distribute rewards
    }
}
```

**Challenges:**

* Requires economic modeling (tokenomics)
* Requires decentralized AI inference (expensive on-chain)
* May need hybrid approach (AI off-chain, consensus on-chain)

### 3.4 Decision Points

**Should we build Phase 2 (On-Chain Registry)?**

**Arguments For:**

* True decentralization (removing VeriPura as trust dependency)
* Competitive advantage (no other compliance platform does this)
* ADAPT/AfCFTA fit (reduces reliance on single entity)

**Arguments Against:**

* Adds complexity (smart contract security audits required)
* Gas costs (every verdict publication costs IOTA fees)
* Maintenance burden (smart contract upgrades are hard)

**Recommendation**: **Build Phase 2 as MVP, defer Phase 3**

* Phase 2 provides immediate value (third-party verification)
* Minimal gas costs (1 tx per consignment vs. 20 for individual documents)
* Feasible with current team (no tokenomics design needed)

---

## 4. Starfish Compatibility Checklist

**Starfish** is IOTA's next-generation consensus mechanism (post-Mysticeti).

### 4.1 Key Changes

| Aspect                  | Mysticeti (Current) | Starfish (Future) |
| :---------------------- | :------------------ | :---------------- |
| Confirmation Time       | ~1 second           | Similar           |
| Validator Communication | Broadcast-heavy     | Gossip-optimized  |
| Fault Tolerance         | 1/3 Byzantine       | Higher tolerance  |
| Throughput              | High                | Higher            |

### 4.2 What VeriPura Needs to Ensure

#### ✅ **1. No Hardcoded Block Intervals**

**Current Code Audit:**

* ✅ We don't assume specific confirmation times
* ✅ We use event-driven anchoring (not time-based)
* ✅ Retry logic handles network delays

#### ✅ **2. Flexible Transaction Submission**

**Pattern to Maintain**:

```typescript
async function anchorToIOTA(data: AnchoredData): Promise<string> {
  const MAX_RETRIES = 3;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const txHash = await iotaClient.submitBlock(data);
      await waitForConfirmation(txHash); // Does not assume timeout
      return txHash;
    } catch (error) {
      if (isRetryable(error)) {
        retries++;
        await exponentialBackoff(retries);
      } else {
        throw error;
      }
    }
  }
}
```

#### ⚠️ **3. Monitoring Consensus Health**

**Future Addition Needed:**

* Subscribe to IOTA network status
* Detect consensus delays
* Inform Guardian Agents if anchoring is degraded

**Implementation Note**:

```typescript
// To be added when Starfish launches
interface IOTANetworkMonitor {
  getConsensusHealth(): {
    status: 'healthy' | 'degraded' | 'stalled';
    averageConfirmationTime: number;
    validatorParticipation: number;
  };
}
```

#### ✅ **4. Independent Validation Logic**

**Critical Principle:**

* Guardian Agent validation does NOT depend on IOTA finality
* IOTA is used for **proof storage**, not **validation logic**
* Business logic remains off-chain and fast

**Current Architecture**:

```text
User uploads document
  ↓
Guardian Agent validates (off-chain, <2s)
  ↓
Returns verdict to user immediately
  ↓
Anchors verdict to IOTA asynchronously (background task)
```

**Why This Matters:**

* If IOTA network is congested, users still get verdicts
* Anchoring is "best effort" (can retry later)
* Business continuity is not IOTA-dependent

---

## 5. Implementation Timeline

### Q1 2026: Current State

* ✅ Merkle Tree hash anchoring
* ✅ IOTA SDK integration
* ✅ Off-chain validation

### Q2 2026: TWIN Exploration

* [ ] Contact IOTA Foundation re: TWIN API access
* [ ] Prototype identity verification integration
* [ ] Feature flag: `VITE_ENABLE_TWIN_INTEGRATION`

### Q3 2026: Move Smart Contracts (Phase 2)

* [ ] Learn Move language
* [ ] Develop `ComplianceRegistry` module
* [ ] Testnet deployment
* [ ] Security audit

### Q4 2026: ADAPT Pilot

* [ ] Partner with ADAPT for AfCFTA use case
* [ ] Deploy on IOTA Mainnet
* [ ] Integrate with TWIN (if available)

### 2027+: Decentralized Validation (Phase 3)

* [ ] Economic modeling (tokenomics)
* [ ] Validator network design
* [ ] Community governance

---

## 6. Risk Analysis

### Risk 1: TWIN Development Delays

**Mitigation**: Standalone mode ensures VeriPura is not blocked

### Risk 2: Move Smart Contract Complexity

**Mitigation**: Start with simple registry (Phase 2), defer complex logic

### Risk 3: IOTA Network Congestion

**Mitigation**: Asynchronous anchoring + retry logic

### Risk 4: Starfish Breaking Changes

**Mitigation**: Follow IOTA SDK best practices, avoid low-level APIs

---

## 7. Success Metrics

**Near-Term (Q1-Q2 2026):**

* [ ] 100% of consignments successfully anchored to IOTA
* [ ] <2s average anchoring time
* [ ] Zero anchoring failures (with retries)

**Mid-Term (Q3-Q4 2026):**

* [ ] TWIN integration live (if available)
* [ ] Move smart contract deployed to Mainnet
* [ ] 1,000+ on-chain compliance verdicts

**Long-Term (2027+):**

* [ ] Decentralized validator network with 10+ independent nodes
* [ ] Zero downtime for compliance validation
* [ ] ADAPT partnership with 100+ African SMEs using VeriPura

---

## 8. Next Steps

**Immediate Actions:**

1. ✅ Document this strategy (this file)
2. [ ] Review with team
3. [ ] Contact IOTA Foundation re: TWIN partnership
4. [ ] Begin Move language learning (Phase 2 prep)

**Decision Required:**

* Should we commit to Phase 2 (Move smart contracts) in Q3 2026?
* What is the minimum TWIN integration to prove concept?

---

**Document Owner**: Technical Architecture Team  
**Review Cycle**: Monthly (aligned with IOTA Starfish development timeline)
