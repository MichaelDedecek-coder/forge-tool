# Exa.ai Research-Augmented Analysis Guide

## 🔍 Co je Research-Augmented Analysis?

DataWizard 2026 nyní podporuje **Research-Augmented Analysis** - pokročilou funkci, která kombinuje statistickou analýzu vašich dat s externími research insights z webu pomocí Exa.ai.

### Jak to funguje?

1. **Statistická agregace** - DataWizard nejprve provede klasickou statistickou analýzu vašich dat (pandas)
2. **Inteligentní vyhledávání** - Na základě struktury dat a vašeho dotazu vyhledá relevantní informace přes Exa.ai
3. **Kontextová analýza** - Claude AI dostane jak vaše data, tak i externí research a vytvoří komplexní analýzu s benchmarky a kontextem

## 🎯 Výhody

### Bez Exa.ai (klasická analýza):
- ✅ Statistiky z vašich dat (mean, median, outliers...)
- ✅ Vizualizace (charts)
- ❌ Žádný externí kontext
- ❌ Žádné srovnání s trhem

### S Exa.ai (research-augmented):
- ✅ Vše výše PLUS:
- ✅ **Industry benchmarks** - "Váš růst 15% je nad průměrem trhu (9%)"
- ✅ **Tržní trendy** - "Aktuální trend ukazuje pokles o 3% v Q1 2026"
- ✅ **Konkurenční data** - Reference na industry reports
- ✅ **Validace dat** - "Vaše čísla odpovídají XYZ studii"

## 📋 Příklady použití

### 1. Prodejní data
**Vaše data**: CSV s prodejemi za rok 2025
**Exa najde**:
- Průměrný růst prodejů v vašem odvětví
- Sezónní trendy z market research
- Benchmarky konkurence

### 2. Marketing metriky
**Vaše data**: Konverze, CTR, engagement
**Exa najde**:
- Industry standard conversion rates
- Best practices studies
- Recent marketing trend reports

### 3. HR data
**Vaše data**: Platy, fluktuace zaměstnanců
**Exa najde**:
- Průměrné mzdy v oboru
- Retention benchmarks
- HR industry insights

## 🔧 Technická implementace

### Požadavky
- Exa.ai API key (získat na [exa.ai](https://exa.ai))
- Node.js package: `exa-js`

### Nastavení

1. **Získání API klíče**
   ```bash
   # Registrace na https://exa.ai
   # Zkopírujte váš API klíč
   ```

2. **Konfigurace environment**
   ```bash
   # .env.local
   EXA_API_KEY=your_exa_api_key_here
   ```

3. **Verifikace**
   - Restartujte Next.js server (`npm run dev`)
   - Nahrát CSV do DataWizard
   - Při analýze by se měla zobrazit stage: "Hledám kontextové informace..."

### API Endpoint

**POST /api/exa-research**

Request:
```json
{
  "statisticalSummary": { /* pandas stats */ },
  "userQuestion": "Analyzuj prodeje",
  "language": "cs"
}
```

Response:
```json
{
  "query": "sales revenue trends analysis",
  "insights": [
    {
      "title": "2026 Sales Benchmark Report",
      "url": "https://...",
      "summary": "Industry average growth is 9.2%...",
      "score": 0.87,
      "publishedDate": "2026-01-15"
    }
  ],
  "total": 5
}
```

## 🎨 UI Indikace

Když je Exa research úspěšný, uživatel vidí:

```
🔍 ✨ Research-Augmented Analysis
   Analýza obohacena o 5 externích zdrojů z Exa.ai
```

## 🛡️ Graceful Degradation

DataWizard funguje i **bez Exa API klíče**:

- ✅ Pokud `EXA_API_KEY` není nastaveno → skip research, pokračuj s klasickou analýzou
- ✅ Pokud Exa API selže → catch error, pokračuj bez research insights
- ✅ Uživatel vždy dostane výsledek (jen bez external context)

## 📊 Příklad výstupu

### Klasická analýza (bez Exa):
```
# Analýza prodejů Q4 2025

Celkové prodeje: $1,250,000
Průměrný růst: 15% (Q4 vs Q3)
Top produkt: Widget A (35% tržeb)
```

### Research-Augmented analýza (s Exa):
```
# Analýza prodejů Q4 2025

Celkové prodeje: $1,250,000
Průměrný růst: 15% (Q4 vs Q3)

🔍 Kontext trhu:
Podle Industry Report 2026, průměrný růst v segmentu je 9.2%.
Vaše čísla jsou **63% nad průměrem trhu** - excelentní performance!

Top produkt: Widget A (35% tržeb)

📈 Benchmark:
Podle Gartner Research, market leader má 42% revenue z top produktu.
Vaše diverzifikace je zdravá.
```

## 🚀 Pokročilé použití

### Custom research queries
Můžete upravit `/app/api/exa-research/route.js` pro:
- Specificke search category (research papers, news, company reports)
- Vlastní keyword extraction logiku
- Filtrování podle data publikace
- Více search results (default: 5)

### Integrace do vlastních agentů
```javascript
// Použití Exa research v custom agent
const exaResponse = await fetch('/api/exa-research', {
  method: 'POST',
  body: JSON.stringify({
    statisticalSummary: myStats,
    userQuestion: "Custom question",
    language: "en"
  })
});

const { insights } = await exaResponse.json();
// Use insights in your analysis
```

## 💰 Pricing & Limits

- **Exa.ai**: Check [exa.ai/pricing](https://exa.ai/pricing)
- **Volání**: Každá DataWizard analýza = 1 Exa search call (5 results)
- **Fallback**: Pokud dojdou kredity → graceful degradation, analýza pokračuje

## 🎓 Pro studenty SPŠS

Tato feature demonstruje:

1. **API Integration** - Jak propojit multiple AI services
2. **Graceful Degradation** - Jak handling chyb bez crash
3. **Structured Prompting** - Jak augmentovat LLM s external data
4. **Context Enrichment** - Jak RAG (Retrieval-Augmented Generation) funguje v praxi

## 📝 Credits

- **Exa.ai**: AI-powered semantic search engine
- **DataWizard**: FORGE CREATIVE - AI Job Agency
- **Implementace**: Claude Code + Michael Dedecek (2026)

---

**Questions?** michael@forgecreative.cz
