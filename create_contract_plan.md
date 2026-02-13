# Plan: Create Supply Contract Flow

## Objective
Enable the authenticated user (Farmer) to create a `SupplyContract` on the IOTA network.

## User Story
As a Farmer, I want to initiate a new supply contract by specifying the product, quantity, and price, so that I can sell my produce to a Buyer.

## Prerequisites
1.  **Authenticated User**: User must be logged in via Google.
2.  **IOTA Wallet**: User must have a linked IOTA address and a stored private key (Burner Wallet).
3.  **Funds**: User must have IOTA tokens to pay for gas (Solved via Faucet).

## Implementation Steps

### 1. Private Key Management (Security Improvement)
*   **Goal**: Ensure the user accepts responsibility for their private key.
*   **Action**: Update `AuthDebug` (and eventually the Profile page) to allow the user to **Reveal** and **Copy** their full private key.
*   **Warning**: Add a UI warning that "This key is only stored in your browser. If you clear your cache, it is gone forever unless you back it up."

### 2. UI: Create Contract Form
*   **Component**: `pages/CreateContract.tsx`
*   **Route**: `/create-contract`
*   **Fields**:
    *   Product Type (Dropdown/Text)
    *   Quantity (kg) (Number)
    *   Price per kg (Number)
    *   Target Buyer (Optional Address input, or default to "Open Market")
*   **Action**: "Create Smart Contract" button.

### 3. Logic: Transaction Construction
*   **File**: `services/iotaService.ts`
*   **Method**: `createSupplyContract(signer: Keypair, data: ContractData)`
*   **Process**:
    *   Use `@iota/iota-sdk` to create a `TransactionBlock`.
    *   **Target Move Function**: `veripura::supply_chain::create_contract` (Note: Since the module might not be deployed yet on Testnet, we will simulate the *Move Call* structure but might fallback to a simple transfer or a "Dry Run" if the package ID is not yet available).
    *   **Alternative (Phase 1)**: If the Move module is not live, we can store the contract data in **Firestore** but anchor a hash of it on the IOTA Tangle (Data Integrity proof) using a 0-value transaction with a data payload.
    *   **Phase 2 (MoveVM)**: Once `veripura::supply_chain` is deployed, we switch to the actual Move call.

### 4. Integration
*   Connect the UI Form to the `iotaService`.
*   Handle "Signing": Retrieve `iota_sk` from `localStorage`, create `Ed25519Keypair`, and sign.
*   Handle "Submission": Execute transaction.
*   Handle "Success": Redirect to Dashboard or Contract View.

## Dependencies
*   `@iota/iota-sdk` (Loaded)
*   `react-router-dom` (Loaded)
*   `firebase/firestore` (Loaded)
