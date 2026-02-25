# VeriPura Core - User Guide

> How to use VeriPura for export compliance management.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating a Consignment](#creating-a-consignment)
3. [Uploading Documents](#uploading-documents)
4. [Understanding the Compliance Roadmap](#understanding-the-compliance-roadmap)
5. [Managing Documents](#managing-documents)
6. [Reviewing AI Analysis](#reviewing-ai-analysis)
7. [Admin Review Process](#admin-review-process)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating an Account

1. Visit VeriPura at `https://veripura.com`
2. Click **Sign Up**
3. Enter your email and password
4. Verify your email

### Dashboard Overview

After login, you'll see the Dashboard with:

| Section | Description |
|---------|-------------|
| **Active Consignments** | Your in-progress shipments |
| **Recent Activity** | Latest updates across all consignments |
| **Compliance Score** | Overall compliance rate |
| **Pending Actions** | Documents awaiting review |

---

## Creating a Consignment

### Step 1: Start New Consignment

1. Click **New Consignment** on the Dashboard
2. Or navigate to **Consignments** → **Register Consignment**

### Step 2: Select Trade Route

Choose your export path:

```
From: [Country] → To: [Country]
Example: Thailand → United States
```

The system automatically generates a compliance roadmap based on:
- Destination country regulations
- Product type
- Required certifications

### Step 3: Add Product Details

| Field | Description |
|-------|-------------|
| Product Name | e.g., "Jasmine Rice" |
| HS Code | 6-10 digit code (system can help find) |
| Quantity | Weight, units, etc. |
| Organic | Toggle if product is certified organic |
| Attributes | Select: Frozen, Dried, Roasted, Halal, Kosher, etc. |

### Step 4: Upload Initial Document

Upload a **Purchase Order** or **Commercial Invoice** to:
- Initialize AI analysis
- Generate your compliance roadmap
- Extract key data (seller, buyer, products)

---

## Uploading Documents

### Supported Formats

| Type | Extensions |
|------|------------|
| PDF | `.pdf` |
| Images | `.jpg`, `.png`, `.jpeg` |
| Documents | `.docx` (future) |

### Upload Process

1. Click **Upload Document** in the consignment
2. Select file or drag-and-drop
3. Wait for AI analysis (typically 5-15 seconds)
4. Review extracted data
5. Confirm or correct information

### Document Types

VeriPura recognizes these document types:

| Category | Documents |
|----------|-----------|
| **Financial** | Commercial Invoice, Packing List |
| **Customs** | Bill of Lading, Import Declaration |
| **Regulatory** | Health Certificate, Phytosanitary Certificate |
| **Certifications** | Organic Certificate, Halal Certificate, Fairtrade |
| **Logistics** | Certificate of Origin, Insurance Certificate |

---

## Understanding the Compliance Roadmap

The roadmap shows all required documents for your shipment.

### Roadmap Status Icons

| Icon | Meaning |
|------|---------|
| ✅ | Document uploaded and verified |
| ⏳ | Pending upload |
| ⚠️ | Requires attention |
| ❌ | Failed validation |

### Document Priority

| Type | Description |
|------|-------------|
| **Mandatory** | Required for customs clearance |
| **Advisable** | Recommended for smoother process |
| **Conditional** | Required based on product/destination |

### Example Roadmap

For **Thailand → USA (Organic Rice)**:

```
Mandatory Documents:
├── Commercial Invoice ✅
├── Bill of Lading ⏳
├── Packing List ⏳
├── Organic Certificate ⏳ (USDA NOP)
└── Health Certificate ⏳

Advisable Documents:
├── Certificate of Origin (Form A)
└── Insurance Certificate
```

---

## Managing Documents

### Viewing Documents

1. Open your consignment
2. Scroll to **Documents** section
3. Click any document to preview

### Document Actions

| Action | Description |
|--------|-------------|
| **Preview** | View document in-app |
| **Approve** | Mark as valid |
| **Reject** | Flag for review |
| **Download** | Save locally |

### Replacing Documents

If you need to replace a document:

1. Click **Replace** on the document
2. Upload new version
3. AI re-analyzes automatically

---

## Reviewing AI Analysis

### What the AI Checks

When you upload a document, the AI verifies:

1. **Authenticity** - Signs of tampering or AI generation
2. **Data Consistency** - Matches your consignment details
3. **Completeness** - All required fields present
4. **Compliance** - Meets destination country requirements

### Analysis Results

Each document shows:

```
┌─────────────────────────────────────────┐
│ Document: Commercial Invoice           │
├─────────────────────────────────────────┤
│ Status: ⚠️ Needs Review                │
│ Confidence: 85%                        │
│                                         │
│ Extracted Data:                         │
│ • Seller: Thai Export Co.              │
│ • Buyer: US Imports LLC                │
│ • Products: Jasmine Rice (1000kg)      │
│                                         │
│ Warnings:                               │
│ ⚠️ Origin mismatch: Declaration says  │
│   Vietnam, invoice shows Thailand     │
└─────────────────────────────────────────┘
```

### Human Review

When AI confidence is below threshold, the document goes to **Admin Review**.

---

## Admin Review Process

### When Review is Needed

Documents require human review when:

- AI confidence < 70%
- Data conflicts detected
- Unusual patterns flagged
- Manual verification requested

### Review Steps

1. Navigate to **Admin Review** from menu
2. View pending documents
3. For each document:
   - Review AI analysis
   - Examine original document
   - Approve or reject
   - Add notes if needed

### Feedback Loop

Your review helps train the AI. When you override an AI decision:

- Select reason: "AI Error", "New Information", "Policy Change"
- AI learns from corrections

---

## Troubleshooting

### Common Issues

#### "Upload Failed"

| Cause | Solution |
|-------|----------|
| File too large | Max 10MB per file |
| Unsupported format | Use PDF or image |
| Network error | Check connection, retry |

#### "AI Analysis Taking Too Long"

| Cause | Solution |
|-------|----------|
| High load | Wait 30 seconds, refresh |
| API issue | Contact support |

#### "Incorrect Data Extracted"

| Cause | Solution |
|-------|----------|
| Poor document quality | Upload clearer scan |
| Unusual format | Use Admin Review to correct |

#### "Missing Required Document"

| Cause | Solution |
|-------|----------|
| Not generated yet | Complete previous steps |
| Not applicable | Use "Not Applicable" flag |

### Getting Help

- **Documentation**: See docs/RUNBOOK.md
- **Support**: support@veripura.com
- **Status**: status.veripura.com

---

## Best Practices

### Document Quality

1. **Use high-resolution scans** - 300 DPI preferred
2. **Full document visible** - Include all edges
3. **Clear text** - Avoid blurry images
4. **Complete documents** - Include all pages

### Workflow

1. **Start early** - Begin compliance process weeks before shipping
2. **Upload in order** - Invoice → Packing List → Certificates
3. **Check regularly** - Monitor for new requirements
4. **Resolve quickly** - Address warnings promptly

### Data Entry

1. **Verify HS codes** - Use correct 6-10 digit codes
2. **Accurate weights** - Match actual shipment
3. **Correct country names** - Use full official names

---

## FAQ

### How long does AI analysis take?

Typically 5-15 seconds. Larger documents may take longer.

### What happens if I miss a required document?

The system will flag the issue and prevent final clearance until resolved.

### Can I use my own certificates?

Yes, as long as they meet destination country requirements.

### Is my data secure?

Yes. All documents are encrypted at rest and in transit. See our Security documentation.

### Can multiple users work on same consignment?

Yes, with appropriate permissions. All changes are tracked in audit log.

---

## Glossary

| Term | Definition |
|------|------------|
| **Consignment** | A shipment of goods from exporter to importer |
| **HS Code** | Harmonized System code for product classification |
| **Roadmap** | List of required documents for a shipment |
| **Compliance** | Meeting all legal and regulatory requirements |
| **AI Analysis** | Automated document review by artificial intelligence |

---

*Last updated: February 2026*
