# VeriPura Connect - Security Roadmap (V2)

## 1. Wallet Management Pivot

**Current Status (MVP/V1):** Custodial. Private keys are stored in Firebase Firestore (`users/{uid}/iotaPrivateKey`) and LocalStorage.

**Risk:** High. Database compromise exposes all user funds. Admin access can read keys.

**Future Goal (V2):** Transition to a **Non-Custodial** or **KMS-backed** model.

### Option A: Non-Custodial (Browser-based)

* User's Private Key generates locally and **NEVER** leaves the browser.
* It is stored in `IndexedDB` (encrypted) or a dedicated Wallet Extension (like Metamask/Sui Wallet).
* **Transactions:** The frontend constructs the transaction -> Request User Signature -> User signs locally -> Frontend sends *Signed Transaction* to the backend.
* **Pros:** Zero liability for VeriPura. Max privacy.
* **Cons:** UX is harder (user must handle key loss).

### Option B: Cloud KMS (Managed Custodial)

* Use Google Cloud KMS or AWS KMS to generate and store keys.
* Keys are **never** exported in plain text.
* **Transactions:** Frontend requests action -> Backend verifies permission -> Backend calls KMS to `sign(hash)` -> KMS returns signature.
* **Pros:** Secure, good UX (user doesn't manage keys), recoverable.
* **Cons:** Centralized reliance.

## 2. Database Security Rules

* **Current:** Open read/write for authenticated users.
* **Required:**
  * Lock down `users` collection: `allow read, write: if request.auth.uid == userId;`
  * Lock down `consignments`: Only owner or specific validators can read/write.
