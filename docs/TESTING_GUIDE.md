# VeriPura Core - Testing Guide

> How to write, run, and maintain tests for VeriPura.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Setup](#test-setup)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Coverage Areas](#test-coverage-areas)
6. [Mock Data](#mock-data)
7. [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

### What to Test

| Priority | What | Why |
|----------|------|-----|
| 🔴 High | OCR Providers, Compliance Logic | Core business value |
| 🟠 Medium | Skill Registry, Guardian Agent | Critical orchestration |
| 🟡 Low | UI Components | Change frequently |

### Test Pyramid

```
        /\
       /  \      E2E (Playwright)
      /----\     - Critical user flows
     /      \
    /--------\  Unit Tests (Vitest)
   /          \ - Services, utilities
  /------------\ 
               - None yet, add incrementally
```

---

## Test Setup

### Install Testing Dependencies

```bash
# Vitest for unit tests
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Already installed: Playwright
npm install -D @playwright/test
```

### Update package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Create vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Create test/setup.ts

```typescript
import '@testing-library/jest-dom';

// Mock Firebase
vi.mock('firebase/auth', () => ({
  getAuth: () => ({}),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

// Mock import.meta.env
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-firebase-key');
```

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run in watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/consignment.spec.ts

# Run with UI
npm run test:e2e:ui
```

---

## Writing Tests

### 1. Unit Test Example - OCR Factory

```typescript
// src/services/ocr/OCRFactory.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OCRFactory } from './OCRFactory';

describe('OCRFactory', () => {
  beforeEach(() => {
    // Reset providers cache
    vi.clearAllMocks();
  });

  describe('getProvider', () => {
    it('should return Gemini provider by default', () => {
      const provider = OCRFactory.getProvider('Gemini');
      expect(provider.name).toBe('Gemini');
    });

    it('should throw if API key not set', () => {
      expect(() => OCRFactory.getProvider('DeepSeek')).toThrow();
    });
  });

  describe('analyzeWithFallback', () => {
    it('should return cached result if available', async () => {
      const mockResult = {
        extractedData: { sellerName: 'Test' },
        checklist: [],
      };
      
      // First call would cache
      // Second call should return cached
    });

    it('should fallback to next provider on failure', async () => {
      // Test fallback logic
    });
  });
});
```

### 2. Unit Test Example - Compliance Service

```typescript
// src/services/complianceService.test.ts
import { describe, it, expect } from 'vitest';
import { complianceService } from './complianceService';

describe('complianceService', () => {
  describe('getRequiredDocuments', () => {
    it('should return correct docs for EU import', () => {
      const docs = complianceService.getRequiredDocuments({
        fromCountry: 'Thailand',
        toCountry: 'Germany',
        products: [{ name: 'Coffee', hsCode: '0901' }],
      });
      
      expect(docs).toContain('Phytosanitary Certificate');
    });

    it('should require organic cert for organic products', () => {
      const docs = complianceService.getRequiredDocuments({
        fromCountry: 'Thailand',
        toCountry: 'USA',
        products: [{ name: 'Organic Rice', hsCode: '1006', isOrganic: true }],
      });
      
      expect(docs.some(d => d.toLowerCase().includes('organic'))).toBe(true);
    });
  });
});
```

### 3. E2E Test Example - Consignment Flow

```typescript
// tests/consignment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Consignment Registration', () => {
  test.beforeEach(async ({ page }) => {
    // Go to app and login
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-btn"]');
  });

  test('should create new consignment', async ({ page }) => {
    // Navigate to register consignment
    await page.click('[data-testid="new-consignment"]');
    
    // Fill form
    await page.selectOption('[data-testid="from-country"]', 'Thailand');
    await page.selectOption('[data-testid="to-country"]', 'USA');
    
    // Upload document
    await page.setInputFiles('[data-testid="file-upload"]', {
      name: 'test-invoice.pdf',
      mimeType: 'application/pdf',
    });
    
    // Verify AI analysis
    await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible();
    
    // Submit
    await page.click('[data-testid="submit-btn"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should show compliance roadmap', async ({ page }) => {
    // Navigate to existing consignment
    await page.click('[data-testid="consignment-1"]');
    
    // Verify roadmap visible
    await expect(page.locator('[data-testid="roadmap"]')).toBeVisible();
    await expect(page.locator('[data-testid="roadmap-item"]')).toHaveCount(5);
  });
});
```

### 4. Component Test Example

```typescript
// src/components/ErrorBoundary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should show error message on error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    consoleError.mockRestore();
  });

  it('should allow retry on error', async () => {
    const user = userEvent.setup();
    let renderCount = 0;
    
    const ConditionalThrow = () => {
      renderCount++;
      if (renderCount === 1) throw new Error('First render error');
      return <div>Recovered</div>;
    };
    
    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );
    
    await user.click(screen.getByText('Try Again'));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
```

---

## Test Coverage Areas

### High Priority - Must Have Tests

| Area | What to Test |
|------|--------------|
| **OCR Providers** | Analysis, error handling, retry logic |
| **Compliance Service** | Document requirements by route |
| **Skill Registry** | Skill loading, execution |
| **Guardian Agent** | Event processing, memory updates |

### Medium Priority

| Area | What to Test |
|------|--------------|
| **Error Boundary** | Error catching, fallback UI |
| **OCR Factory** | Provider selection, caching, fallback |
| **Document Validation** | Validation rules |

### Lower Priority

| Area | What to Test |
|------|--------------|
| **UI Components** | Render, user interactions |
| **Forms** | Input validation, submission |

---

## Mock Data

### Create test/fixtures/

```typescript
// test/fixtures/mockConsignment.ts
export const mockConsignment = {
  id: 'test-123',
  exportFrom: 'Thailand',
  importTo: 'USA',
  products: [
    {
      name: 'Jasmine Rice',
      quantity: '1000 kg',
      hsCode: '1006.30',
      isOrganic: false,
    }
  ],
  status: 'pending',
  createdAt: new Date().toISOString(),
};

// test/fixtures/mockDocument.ts
export const mockDocument = {
  id: 'doc-456',
  name: 'Commercial Invoice',
  category: 'Financial',
  status: 'UPLOADED',
  fileUrl: 'https://example.com/invoice.pdf',
};

// test/fixtures/mockAIResponse.ts
export const mockAIResponse = {
  extractedData: {
    sellerName: 'Thai Export Co.',
    buyerName: 'US Import LLC',
    originCountry: 'Thailand',
    destinationCountry: 'USA',
    products: [
      {
        name: 'Jasmine Rice',
        quantity: '1000 kg',
        hsCode: '1006.30',
        isOrganic: false,
        attributes: ['Premium'],
      }
    ],
    securityAnalysis: {
      isSuspicious: false,
      suspicionReason: '',
      tamperScore: 5,
    },
  },
  checklist: [
    {
      id: '1',
      documentName: 'Commercial Invoice',
      description: 'Required for customs',
      issuingAgency: 'CBP',
      agencyLink: 'https://cbp.gov',
      category: 'Financial',
      status: 'MISSING',
      isMandatory: true,
    }
  ],
};
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Unit tests
        run: npm test -- --coverage
      
      - name: E2E tests
        run: |
          npm run build
          npm run preview &
          sleep 5
          npm run test:e2e
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
```

---

## Running Tests in Development

### Quick Test Commands

```bash
# Run unit tests once
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- OCRFactory.test.ts

# Run tests matching pattern
npm test -- --grep "should return"

# Run E2E for specific feature
npm run test:e2e -- tests/consignment.spec.ts
```

### Debugging Failed Tests

```bash
# Run in watch mode with --inspect-brk
npm test -- --inspect-brk

# Open in browser DevTools
# Add "debugger;" to test code
```

---

## Test Data Management

### Environment Variables for Tests

```bash
# .env.test
VITE_GEMINI_API_KEY=test-gemini-key
VITE_FIREBASE_API_KEY=test-firebase-key
VITE_OCR_PROVIDER=Gemini
```

### Seed Data

For E2E tests, create a `test/seed/` folder with:
- Sample PDF invoices
- Sample certificates
- Sample packing lists

---

## Best Practices

1. **Name tests descriptively**: `it('should return correct docs for EU import')`
2. **AAA pattern**: Arrange, Act, Assert
3. **One concern per test**: Don't test multiple things
4. **Mock external dependencies**: Firebase, AI APIs
5. **Keep tests fast**: Unit tests < 100ms each
6. **Review test output**: Ensure meaningful failures

---

## Troubleshooting

### "Cannot find module"
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Tests timeout
```bash
# Increase timeout in vitest.config.ts
export default defineConfig({
  test: {
    timeout: 10000,
  },
});
```

### Playwright not found
```bash
npx playwright install chromium
```

---

## Next Steps

1. Install testing dependencies
2. Write tests for OCR Factory (highest ROI)
3. Write tests for Compliance Service
4. Add E2E tests for critical flows
5. Set up CI/CD

---

*Last updated: February 2026*
