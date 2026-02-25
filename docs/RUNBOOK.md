# VeriPura Core - Developer Runbook

> Quick reference for setting up, running, and debugging VeriPura.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Running the App](#running-the-app)
4. [Building for Production](#building-for-production)
5. [Common Issues & Fixes](#common-issues--fixes)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Debugging](#debugging)
9. [Architecture Overview](#architecture-overview)

---

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start development server
npm run dev
```

The app runs at `http://localhost:3000`

---

## Environment Setup

### Required Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_FIREBASE_API_KEY` | Firebase authentication | Firebase Console → Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Firebase Console |
| `VITE_GEMINI_API_KEY` | AI document analysis | Google AI Studio |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_OCR_PROVIDER` | `Gemini` | OCR provider: Gemini, DeepSeek, Kimi, MiniMax, Llama |
| `VITE_DEEPSEEK_API_KEY` | - | DeepSeek API key |
| `VITE_KIMI_API_KEY` | - | Kimi API key |
| `VITE_MINIMAX_API_KEY` | - | MiniMax API key |
| `VITE_LLAMA_API_KEY` | - | Llama API key (via Together.ai) |
| `VITE_LLAMA_BASE_URL` | `https://api.together.ai/v1` | Llama endpoint |

---

## Running the App

### Development Mode

```bash
npm run dev
```

- Hot reload enabled
- Opens on `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

---

## Common Issues & Fixes

### "API Key not found"
Add to `.env`:
```bash
VITE_GEMINI_API_KEY=your_actual_key
```

### Firebase Connection Failed
1. Check Firebase Console → Authentication → Sign-in method enabled
2. Verify `VITE_FIREBASE_API_KEY` is correct

### Build Fails - TypeScript Errors
```bash
npm run type-check
```

---

## Deployment

### Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and deploy
firebase login
firebase deploy
```

### Manual Deploy

Upload `dist/` folder to any static host (Vercel, Netlify, AWS S3).

---

## Architecture Overview

```
Frontend (React)
    │
    ├── Pages: Dashboard, Consignment, AdminReview
    ├── Components: UploadZone, DocumentList, Chat
    └── Contexts: AuthContext, ThemeContext
    │
Services Layer
    │
    ├── OCR Factory: Gemini, DeepSeek, Kimi, MiniMax, Llama
    ├── Guardian Agent: Skills Registry, SubAgents, Memory
    └── Compliance Service: Rules Engine, Validation
    │
Backend (Firebase)
    │
    ├── Auth, Firestore, Storage, Functions
    │
Trust Layer (IOTA MoveVM)
    └── Supply Chain Contracts, Document Anchoring
```

### AI Document Flow

1. User uploads document (PDF/Image)
2. OCRFactory.selects provider
3. BaseProvider.withRetry() handles failures
4. Provider.analyze() calls AI
5. Extract: seller, buyer, products, HS codes
6. Compliance Engine generates roadmap
7. Guardian Agent executes skills
8. Display results

### Adding a New Skill

```typescript
// 1. Create: services/agent/skills/myNewSkill.ts
// 2. Implement ISkill interface
// 3. Export from: services/agent/skills/index.ts
// 4. Restart - loads automatically
```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run type-check` | TypeScript check |

| Key Files | Purpose |
|-----------|---------|
| `services/compliance/ocr/OCRFactory.ts` | Document analysis |
| `services/agent/guardianAgent.ts` | AI orchestration |
| `services/agent/skills/skillRegistry.ts` | Skill management |
| `services/complianceService.ts` | Compliance logic |
| `types.ts` | TypeScript definitions |

---

*Last updated: February 2026*
