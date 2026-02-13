module veripura::supply_chain {
    use iota::object::{Self, UID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use iota::package;
    use iota::display;
    use std::string::{Self, String};
    use std::option::{Self, Option};

    /// Struct representing the Export Consignment (Lean Storage)
    use iota::coin::{Self, Coin};
    use iota::balance::{Self, Balance};

    /// Struct representing the Purchase Order (PO) - The core asset
    struct PurchaseOrder has key, store {
        id: UID,
        retailer: address,
        product_spec_hash: vector<u8>,
        quantity: u64,
        value: u64,
        status: String, // MINTED, VALIDATED, FINANCED, FILLED, CANCELLED
        validation_ref: Option<address>, // Reference to ValidationObject
        lender: Option<address>, // If financed
        repayment_vault: Balance<iota::iota::IOTA>, // Or USDC
    }

    /// Struct representing the Farmer's Lot (The Asset to verify)
    struct FarmerLot has key, store {
        id: UID,
        farmer: address,
        geojson_hash: vector<u8>,
        estimated_yield: u64,
        compliance_status: String,
    }

    /// Struct representing the Guardian Agent's Validation Stamp
    struct ValidationObject has key, store {
        id: UID,
        po_id: address,
        guardian_id: address,
        critical_alerts: u64, // Must be 0 for valid collateral
        timestamp: u64,
    }

    // ... (Existing Init) ...

    /// Entry Function: Register a new Consignment (Compact)
    public entry fun register_consignment(
        internal_id: String,
        data_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        // Timestamp would ideally come from Clock, using 0 for now or passing it.
        // For strict L1 compactness we can omit or pass as arg. using a dummy for mvp.
        
        let consignment = Consignment {
            id: object::new(ctx),
            owner: sender,
            internal_id,
            data_hash,
            status: string::utf8(b"PENDING_INSPECTION"),
            timestamp: 0 // Placeholder, or use clock::timestamp_ms(clock) if available
        };

        // Transfer the object to the Creator (Owner)
        transfer::public_transfer(consignment, sender);
    }

    /// Entry Function: Mint a Purchase Order (PO Token)
    public entry fun mint_po(
        product_spec_hash: vector<u8>,
        quantity: u64,
        value: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let po = PurchaseOrder {
            id: object::new(ctx),
            retailer: sender,
            product_spec_hash,
            quantity,
            value,
            status: string::utf8(b"MINTED"),
            validation_ref: option::none(),
            lender: option::none(),
            repayment_vault: balance::zero(),
        };
        transfer::public_transfer(po, sender);
    }
}
