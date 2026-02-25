# VeriPura - Architecture Decisions

## Primary Markets

VeriPura is designed for the following primary markets in Phase 1:

| Market | Regions | Focus |
|--------|---------|-------|
| **EU** | All 27 EU member states | EUDR, Organic, Food Safety |
| **US** | USA (FDA, CBP) | FSMA, Organic Equivalence |
| **ASEAN** | Thailand, Vietnam, Indonesia, Malaysia, Singapore, Philippines, etc. | Export hub for agricultural products |

### Supported Countries

Currently supported countries in `constants.ts`:

- **ASEAN (10)**: Brunei, Cambodia, Indonesia, Laos, Malaysia, Myanmar, Philippines, Singapore, Thailand, Vietnam
- **EU (27)**: All 27 member states
- **Americas**: United States, Canada, Brazil
- **Asia Pacific**: China, Japan, South Korea, Australia, India
- **Other**: United Kingdom, Switzerland

### Future Expansion

Phase 2 will add:
- Middle East (UAE, Saudi Arabia, Oman)
- Latin America (Mexico, Argentina, Chile, Peru)
- Africa (South Africa, Nigeria, Kenya)
- Central Asia (Kazakhstan, Uzbekistan)

---

## Hardcoded Data

### Trade Agreements

Trade agreements are currently mocked in `tariffOptimizer.ts`. In production, these should be fetched from:
- WTO Tariff Database
- Regional trade databases (ASEAN, EU)
- Commercial APIs (TradeLens, Descartes)

### Carbon Emission Factors

Currently includes factors for major ASEAN export routes. Should be expanded to include:
- All IATA routes
- Maritime shipping lanes
- Ground transport

### Living Wage Benchmarks

Currently includes Vietnam. Should be expanded to include:
- All ILO conventions
- Global Living Wage Database
- Anker Methodology benchmarks

---

## Model Configuration

### Default Models

| Task | Model | Provider |
|------|-------|----------|
| OCR/Document Analysis | gemini-2.5-flash | Vertex/Gemini |
| Vision (Advanced) | Qwen2.5-VL-72B | HuggingFace |
| Legal Expert | legal-bert-base-uncased | HuggingFace |
| Doc Parsing | ibm/docling | HuggingFace |

### Environment Variables

Override default models:

```bash
VITE_DEFAULT_MODEL=gemini-2.5-flash
VITE_VISION_MODEL=Qwen2.5-VL-72B-Instruct
```

---

## Technical Constraints

### Browser Limitations

- Large SDKs (Firebase, IOTA) bundled statically
- WebCrypto limitations in some browsers
- No server-side rendering (SPA)

### API Rate Limits

- Gemini: 15 requests/minute (free tier)
- DeepSeek: Varies by plan
- Consider caching and rate limiting in production

---

*Last updated: February 2026*
