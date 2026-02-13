# Smart Contract Architecture: VeriPura Connect (IOTA MoveVM)

## Goal
To design and implement the core smart contract infrastructure on IOTA Rebased (MoveVM) that enables the "Reverse Supply Chain" model. This includes Identity management, PO Tokenization, Validation stamping, and Lien-based settlement.

## User Review Required
> [!IMPORTANT]
> **One-Click Onboarding**: We strictly assume that creating a user account *automatically* generates both an IOTA Wallet and an IOTA DID. The user will not perform separate "Create Wallet" steps.

## Proposed Architecture

### 1. Identity & Onboarding (IOTA Identity)
*   **Concept**: Unified "Account = Wallet + DID".
*   **Implementation**:
    *   **User Action**: "Sign Up" (via Email/Social).
    *   **Backend Action**:
        1.  Generate verifiable Keypair (Ed25519).
        2.  Derive IOTA Address (for payments).
        3.  Register IOTA DID (for credentials/signing).
    *   **Storage**: Keys stored securely (e.g., AWS KMS or Stronghold) or non-custodial (MPC). For Phase 1, we assume a **Custodial/Managed** approach for UX friction reduction.

### 2. The Purchase Order (PO) Token (IOTA Tokenization)
*   **Standard**: IOTA Coin Standard (Move Object).
*   **Metadata**:
    *   `retailer_id`: DID of the buyer.
    *   `product_spec`: Hash of the product requirements.
    *   `quantity`: Committed amount.
    *   `value`: Total Fiat/Stablecoin value.
    *   `status`: `MINTED` | `VALIDATED` | `FINANCED` | `FILLED` | `CANCELLED`.
*   **Lifecycle**:
    *   **Minting**: Retailer locks verifiable commitment ➔ `MINTED`.
    *   **Assignment**: Matched with a Farmer DID.

### 3. The Guardian Gatekeeper (IOTA Notarization)
*   **Concept**: The "Oracle" that stamps validity on-chain.
*   **Flow**:
    1.  Farmer uploads docs to `agentService`.
    2.  Guardian Agent verifies against Ground Truth.
    3.  If `Critical Alerts == 0`:
        *   Guardian signs a **Validation Object** (a Move resource).
        *   This object is attached to the PO Token.
    *   **State Transition**: `MINTED` ➔ `VALIDATED`.

### 4. Settlement & Lien Logic (MoveVM)
*   **Concept**: Programmatic debt repayment.
*   **Smart Contract Function**: `settle_po(payment: Coin<USDC>, po: Potential<PO>)`
*   **Logic**:
    ```move
    public fun settle_po(payment: Coin<USDC>, po: &mut PO) {
        // 1. Check if Financed
        if (po.is_financed) {
            let debt_amount = po.loan_principal + po.loan_interest;
            let lender = po.lender_address;
            
            // 2. Split Payment
            let repayment = coin::split(&mut payment, debt_amount);
            transfer::public_transfer(repayment, lender);
        }
        
        // 3. Send Remainder to Farmer
        transfer::public_transfer(payment, po.farmer_address);
    }
    ```

## Implementation Phases

### Phase 1: Mocks & Interfaces
*   Define Move `struct` definitions for PO and FarmerLot.
*   Mock the `GuardianAgent` signature on the frontend.

### Phase 2: Testnet Deployment
*   Deploy `POService` module to IOTA Rebased Testnet.
*   Implement `mint` and `validate` functions.

### Phase 3: Lien Logic Integration
*   Implement `finance_po` (locks the PO as collateral).
*   Implement `settle_po` (split payments).

## Verification Plan

### Automated Tests
*   **Move Unit Tests**: Write unit tests for the `settle_po` function to verify split logic.
*   **Integration Tests**: Script a flow: Mint ➔ Validate ➔ Finance ➔ Settle.

### Manual Verification
1.  **Identity Creation**: Sign up a new user and verify a DID is created in the database/log.
2.  **PO Lifecycle**:
    *   Create a Demand Order as Retailer.
    *   Upload valid docs as Farmer (trigger Guardian).
    *   Verify PO status changes to `VALIDATED`.
