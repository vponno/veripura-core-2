# VeriPura Connect

VeriPura Connect is a demand-driven supply chain platform leveraging the IOTA Rebased (MoveVM) blockchain and AI insights.

## Reverse Supply Chain Flow

Unlike traditional supply chains where farmers push produce to the market and hope for a sale, VeriPura implements a **Reverse Supply Chain**:

1.  **Demand Generation (Retailer)**:
    *   Retailers create `DemandOrders` via the Dashboard.
    *   These orders specify product type, quantity, price, and deadline.
    *   This signals guaranteed market interest before harvest.

2.  **Supply Matching (Farmer)**:
    *   Farmers view aggregated demand.
    *   Farmers use the "Scan & Upload" mobile feature to register a `FarmerLot`.
    *   During upload, the `farmerService` captures **GeoJSON coordinates** of the plot.
    *   This GeoJSON data is essential for **EUDR (European Union Deforestation Regulation)** compliance verification.

3.  **Settlement (IOTA MoveVM)**:
    *   A `SupplyContract` is automatically minted on the IOTA ledger.
    *   The `FarmerLot` object is linked to the `DemandOrder` object.
    *   Smart contracts handle escrow and final settlement upon delivery.

## Key Technical Components

*   **FarmerLot**: A Move Object containing harvest data and compliant GeoJSON.
*   **DemandOrder**: Represents the "Pull" signal from the market.
*   **Services**:
    *   `retailerService`: Manages demand lifecycle.
    *   `farmerService`: Handles GPS scanning and lot tokenization.

## Setup

1.  Install dependencies: `npm install`
2.  Start the app: `npm start`
