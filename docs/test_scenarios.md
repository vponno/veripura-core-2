# VeriPura Connect: Official Test Scenarios

Use these scenarios to test the robustness of the compliance engine and the smoothness of the user interface.

## Scenario A: The "Happy Path" (Standard Commodity)
- **Trade Route**: Vietnam → United States
- **Product**: "Cinnamon Sticks"
- **HS Code**: `0906.11`
- **Expected Outcome**:
    - Roadmap requires: **Purchase Order**, **Commercial Invoice**, **Packing List**, **Bill of Lading**.
    - All validation levels should be `GREEN` (unless you deliberately upload a tampered file).

## Scenario B: The "Regulated Path" (Spices/Meat)
- **Trade Route**: Vietnam → Indonesia
- **Product**: "Dried Peppercorns"
- **Expected Outcome**:
    - Triggers **Halal Certificate** requirement due to the destination (Indonesia) and food category.
    - Triggers **Phytosanitary Certificate** (IPPC) requirement since it's a plant product.

## Scenario C: The "Organic Path" (Premium Export)
- **Trade Route**: Vietnam → Switzerland
- **Product**: "Bio Arabica Coffee Beans"
- **Expected Outcome**:
    - Triggers **Organic Certificate** requirement because the product name contains "Bio".
    - Triggers strict Swiss customs roadmap.

## Scenario D: The "Self-Correction" (Route Mismatch)
- **Step 1**: Start a consignment with **Vietnam → United States**.
- **Step 2**: Upload the `sample_po.pdf` (or any PDF where you've edited the text to say "Destination: Switzerland").
- **Expected Outcome**:
    - AI detects the mismatch between your initial selection (USA) and the document (Switzerland).
    - A **Route Mismatch Modal** appears.
    - Clicking "Update Route" fixes the consignment details and refreshes the roadmap for Switzerland.

## Scenario E: The "Guardian Alert" (Security)
- **Action**: Upload a document with mismatched weights or fonts.
- **Expected Outcome**:
    - AI flags the document as `YELLOW` (Pending Review).
    - Reason: "High tamper score" or "Handwritten modifications".
    - The document appears in the **Admin Review Hub** for manual resolution.
