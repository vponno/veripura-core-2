# VeriPura Core - API Reference

> Documentation for key services, classes, and utilities.

---

## Table of Contents

1. [OCR Factory](#ocr-factory)
2. [Guardian Agent](#guardian-agent)
3. [Skill Registry](#skill-registry)
4. [Compliance Service](#compliance-service)
5. [Services](#services)
6. [Utilities](#utilities)
7. [Types](#types)

---

## OCR Factory

Document analysis provider with caching, retry logic, and fallback support.

### Import

```typescript
import { OCRFactory } from './services/compliance/ocr/OCRFactory';
```

### Methods

#### `getProvider(name?: string): DocumentAnalysisProvider`

Get a specific OCR provider.

```typescript
const provider = OCRFactory.getProvider('Gemini');
// or
const provider = OCRFactory.getProvider(); // Uses VITE_OCR_PROVIDER env
```

**Parameters:**
- `name` - Provider name: `'Gemini' | 'DeepSeek' | 'Kimi' | 'MiniMax' | 'Llama'`

**Returns:** DocumentAnalysisProvider instance

---

#### `analyzeWithFallback(fileBase64, mimeType, options, preferredProvider?, useCache?): Promise<AnalysisResult>`

Analyze document with automatic fallback to next provider on failure.

```typescript
const result = await OCRFactory.analyzeWithFallback(
  'data:application/pdf;base64,...',
  'application/pdf',
  { fromCountry: 'Thailand', toCountry: 'USA' },
  'Gemini',  // preferred provider
  true       // use cache
);
```

**Parameters:**
- `fileBase64` - Base64 encoded file
- `mimeType` - MIME type (e.g., 'application/pdf')
- `options.fromCountry` - Origin country
- `options.toCountry` - Destination country
- `preferredProvider` - Preferred provider (optional)
- `useCache` - Enable caching (default: true)

**Returns:** Promise<AnalysisResult>

---

#### `configureCache(config): void`

Configure caching behavior.

```typescript
OCRFactory.configureCache({
  enabled: true,
  ttlMs: 15 * 60 * 1000, // 15 minutes
  maxEntries: 100
});
```

---

#### `getConfiguredProviders(): string[]`

Get list of providers with valid API keys.

```typescript
const available = OCRFactory.getConfiguredProviders();
// ['Gemini', 'DeepSeek']
```

---

## Document Analysis Provider

Interface implemented by all OCR providers.

### Interface

```typescript
interface DocumentAnalysisProvider {
  name: string;
  analyze(
    fileBase64: string, 
    mimeType: string, 
    options: AnalysisOptions
  ): Promise<AnalysisResult>;
}
```

### AnalysisOptions

```typescript
interface AnalysisOptions {
  fromCountry: string;
  toCountry: string;
}
```

### AnalysisResult

```typescript
interface AnalysisResult {
  extractedData: {
    sellerName: string;
    buyerName: string;
    originCountry: string;
    destinationCountry: string;
    products: Product[];
    securityAnalysis: {
      isSuspicious: boolean;
      suspicionReason: string;
      tamperScore: number;
    };
  };
  checklist: ChecklistItem[];
}
```

---

## Base Provider

Base class for OCR providers with retry logic and logging.

### Import

```typescript
import { BaseProvider, DEFAULT_RETRY_CONFIG } from './services/compliance/ocr/providers/BaseProvider';
```

### Configuration

```typescript
interface RetryConfig {
  maxRetries: number;        // Default: 3
  baseDelayMs: number;       // Default: 1000
  maxDelayMs: number;         // Default: 10000
  timeoutMs?: number;         // Default: 60000
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Provider name |
| `modelId` | string | Model identifier |
| `apiKey` | string | API key |
| `baseUrl` | string | API base URL |
| `retryConfig` | RetryConfig | Retry configuration |

### Methods

#### `withRetry<T>(operation, config?): Promise<T>`

Execute operation with automatic retry on failure.

```typescript
const result = await this.withRetry(
  () => fetch('/api/analyze'),
  { maxRetries: 5, baseDelayMs: 500 }
);
```

---

## Guardian Agent

AI agent that orchestrates skills and manages compliance workflow.

### Import

```typescript
import { GuardianAgent } from './services/agent/guardianAgent';
```

### Constructor

```typescript
const agent = new GuardianAgent(
  'agent-1',           // Agent ID
  initialState,        // Optional: AgentState
  riskConfig           // Optional: ActiveDefenseConfig
);
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Agent identifier |
| `state` | AgentState | Current agent state |
| `skillRegistry` | SkillRegistry | Loaded skills |
| `subAgents` | Map<string, SubAgent> | Active sub-agents |

### Methods

#### `processEvent(event: AgentEvent): Promise<AgentEventResult>`

Process an agent event and return result.

```typescript
const result = await agent.processEvent({
  id: 'event-1',
  type: 'DOCUMENT_UPLOAD',
  payload: {
    documentId: 'doc-123',
    files: [file],
    shipment: { origin: 'Thailand', destination: 'USA' }
  }
});
```

---

## Skill Registry

Auto-discovers and manages AI skills.

### Import

```typescript
import { SkillRegistry } from './services/agent/skills/skillRegistry';
```

### Usage

```typescript
const registry = SkillRegistry.getInstance();

// List all skills
const skills = registry.list();

// Get skill by ID
const skill = registry.get('regulatory_check_skill');

// Execute skill
const result = await registry.execute('regulatory_check_skill', context);
```

### Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `getInstance()` | - | SkillRegistry |
| `list()` | - | ISkill[] |
| `get(id)` | skillId: string | ISkill \| undefined |
| `execute(id, context)` | skillId, context | Promise<SkillResult> |
| `getByCategory(category)` | category: string | ISkill[] |

---

## Skills

### Creating a Custom Skill

```typescript
import { ISkill, SkillCategory, SkillContext, SkillResult } from './types';

export class MyCustomSkill implements ISkill {
  id = 'my_custom_skill';
  name = 'My Custom Skill';
  category = SkillCategory.REGULATORY;
  description = 'Does something useful';

  async execute(context: SkillContext): Promise<SkillResult> {
    // Your logic here
    return {
      success: true,
      confidence: 0.9,
      data: { /* result data */ },
      verdict: 'COMPLIANT',
      auditLog: [{
        timestamp: new Date().toISOString(),
        action: 'EXECUTE',
        details: 'Skill completed successfully'
      }]
    };
  }
}
```

### Registering a Skill

Add to `services/agent/skills/index.ts`:

```typescript
export * from './myCustomSkill';
// or
import { MyCustomSkill } from './myCustomSkill';
registry.register(new MyCustomSkill());
```

---

## Compliance Service

Main service for compliance logic.

### Import

```typescript
import { complianceService } from './services/complianceService';
```

### Methods

#### `getRequiredDocuments(params): ChecklistItem[]`

Get required documents for a trade route.

```typescript
const docs = complianceService.getRequiredDocuments({
  fromCountry: 'Thailand',
  toCountry: 'Germany',
  products: [{ name: 'Coffee', hsCode: '0901', isOrganic: false }]
});
```

#### `validateDocument(document, rules): ValidationResult`

Validate a document against rules.

```typescript
const result = complianceService.validateDocument(document, rules);
```

---

## Consignment Service

Manages consignments in Firestore.

### Import

```typescript
import { consignmentService } from './services/consignmentService';
```

### Methods

| Method | Description |
|--------|-------------|
| `createConsignment(data)` | Create new consignment |
| `getConsignment(id)` | Get consignment by ID |
| `updateConsignment(id, data)` | Update consignment |
| `listConsignments(userId)` | List user's consignments |
| `deleteConsignment(id)` | Delete consignment |

---

## Types

### Core Types

```typescript
// Consignment
interface Consignment {
  id: string;
  exportFrom: string;
  importTo: string;
  products: Product[];
  status: 'draft' | 'pending' | 'processing' | 'completed' | 'failed';
  roadmap?: Record<string, ChecklistItem>;
  agentState?: AgentState;
}

// Product
interface Product {
  name: string;
  quantity: string;
  hsCode: string;
  isOrganic: boolean;
  attributes?: string[];
}

// Checklist Item
interface ChecklistItem {
  id: string;
  documentName: string;
  description: string;
  issuingAgency: string;
  agencyLink: string;
  category: ChecklistItemCategory;
  status: ChecklistItemStatus;
  isMandatory?: boolean;
  analysis?: any;
}

// Agent Event
interface AgentEvent {
  id: string;
  type: 'DOCUMENT_UPLOAD' | 'HUMAN_DECISION' | 'ROUTE_UPDATE' | 'USER_MESSAGE';
  payload: Record<string, any>;
  timestamp?: string;
}
```

### Enums

```typescript
enum ChecklistItemCategory {
  LOGISTICS = 'Logistics',
  CUSTOMS = 'Customs',
  TRANSPORT = 'Transport',
  CERTIFICATIONS = 'Certifications',
  REGULATORY = 'Regulatory',
  FINANCIAL = 'Financial',
  FOOD_SAFETY = 'Food Safety',
  SOCIAL_COMPLIANCE = 'Social Compliance',
  OTHER = 'Other'
}

enum ChecklistItemStatus {
  MISSING = 'Missing',
  PENDING = 'Pending Approval',
  READY = 'Ready',
  PENDING_REVIEW = 'Pending Review',
  REJECTED = 'Rejected'
}

enum SkillCategory {
  REGULATORY = 'regulatory',
  STANDARDS = 'standards',
  ENVIRONMENTAL = 'environmental',
  IOT = 'iot',
  TRADE = 'trade',
  INTEGRITY = 'integrity',
  // ...
}
```

---

## Utilities

### Error Boundary

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

// Wrap components that might crash
<ErrorBoundary>
  <GuardianRequirementChat />
</ErrorBoundary>
```

### Logger

```typescript
import { logger } from './services/lib/logger';

logger.log('Info message');
logger.warn('Warning');
logger.error('Error', error);
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|--------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase auth key |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project |
| `VITE_GEMINI_API_KEY` | Yes | Gemini API key |
| `VITE_OCR_PROVIDER` | No | Default: Gemini |
| `VITE_DEEPSEEK_API_KEY` | No | DeepSeek key |
| `VITE_KIMI_API_KEY` | No | Kimi key |
| `VITE_MINIMAX_API_KEY` | No | MiniMax key |
| `VITE_LLAMA_API_KEY` | No | Llama key |

---

## Error Handling

### OCR Errors

```typescript
try {
  const result = await OCRFactory.analyzeWithFallback(...);
} catch (error) {
  if (error.message.includes('No OCR providers configured')) {
    // No API keys set
  } else if (error.message.includes('failed')) {
    // All providers failed
  }
}
```

### Agent Errors

```typescript
const result = await agent.processEvent(event);

if (!result.success) {
  console.error('Agent error:', result.response);
  // Handle error
}
```

---

## Examples

### Complete Document Analysis Flow

```typescript
import { OCRFactory } from './services/compliance/ocr/OCRFactory';

async function analyzeDocument(file: File) {
  // Convert file to base64
  const base64 = await fileToBase64(file);
  
  // Analyze with fallback and caching
  const result = await OCRFactory.analyzeWithFallback(
    base64,
    file.type,
    {
      fromCountry: 'Thailand',
      toCountry: 'USA'
    },
    'Gemini',  // prefer Gemini
    true       // use cache
  );
  
  // Process results
  console.log('Extracted:', result.extractedData);
  console.log('Checklist:', result.checklist);
  
  return result;
}
```

### Using Skills Directly

```typescript
import { SkillRegistry } from './services/agent/skills/skillRegistry';

async function runComplianceCheck(consignment) {
  const registry = SkillRegistry.getInstance();
  
  // Run regulatory check
  const regulatoryResult = await registry.execute('regulatory_check_skill', {
    consignmentId: consignment.id,
    metadata: consignment
  });
  
  // Run ESG check
  const esgResult = await registry.execute('esg_score_skill', {
    consignmentId: consignment.id,
    metadata: consignment
  });
  
  return { regulatoryResult, esgResult };
}
```

---

## Changelog

See CHANGELOG.md for version history.

---

*Last updated: February 2026*
