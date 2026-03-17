# European CSV & Multi-Sheet XLSX Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix "Statistical pre-aggregation failed" error for European CSV files (`;` separator, `,` decimal) and add multi-sheet XLSX support.

**Architecture:** Two targeted fixes — (1) Add auto-detection of CSV separator and decimal format in the Python pre-aggregation script inside `route.js`, (2) Add smart sheet selection in the client-side XLSX parser in `page.js` to pick the largest sheet instead of always the first.

**Tech Stack:** Python (pandas, csv.Sniffer) in E2B sandbox, SheetJS (xlsx) on client

---

### Task 1: Smart CSV separator/decimal detection in pre-aggregation script

**Files:**
- Modify: `app/api/datapalo/route.js:70-79` (the Python pre-aggregation script string)

**Step 1: Replace the `pd.read_csv('dataset.csv')` call (line 77) with auto-detection logic**

In the Python string template (starts ~line 68), replace:
```python
    # Load dataset
    df = pd.read_csv('dataset.csv')
```

With:
```python
    # Auto-detect separator and decimal format (European CSV support)
    import csv as csv_module
    with open('dataset.csv', 'r') as f:
        sample = f.read(8192)

    # Detect delimiter
    detected_sep = ','
    try:
        dialect = csv_module.Sniffer().sniff(sample, delimiters=';,\\t|')
        detected_sep = dialect.delimiter
    except csv_module.Error:
        # Fallback: count occurrences in first line
        first_line = sample.split('\\n')[0]
        if first_line.count(';') > first_line.count(','):
            detected_sep = ';'

    # European convention: semicolon separator → comma decimal
    detected_decimal = ',' if detected_sep == ';' else '.'

    print(f"📋 Detected separator: '{detected_sep}', decimal: '{detected_decimal}'")

    # Load dataset with detected format
    df = pd.read_csv('dataset.csv', sep=detected_sep, decimal=detected_decimal)
```

**Step 2: Run syntax check**
```bash
node -c app/api/datapalo/route.js
```

**Step 3: Commit**
```bash
git add app/api/datapalo/route.js
git commit -m "fix: auto-detect CSV separator and decimal format (European CSV support)"
```

---

### Task 2: Multi-sheet XLSX handling in client

**Files:**
- Modify: `app/datapalo/page.js:238-244` (the SheetJS onDrop handler)

**Step 1: Replace first-sheet-only logic with smart sheet selection**

Replace:
```javascript
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const csvText = XLSX.utils.sheet_to_csv(worksheet);
```

With:
```javascript
      const workbook = XLSX.read(binaryStr, { type: "binary" });

      // Smart sheet selection: pick the sheet with the most data
      let bestSheet = workbook.SheetNames[0];
      if (workbook.SheetNames.length > 1) {
        let maxRows = 0;
        for (const name of workbook.SheetNames) {
          const ws = workbook.Sheets[name];
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
          const rowCount = range.e.r - range.s.r + 1;
          if (rowCount > maxRows) {
            maxRows = rowCount;
            bestSheet = name;
          }
        }
        if (workbook.SheetNames.length > 1) {
          console.log(`📊 Multi-sheet file: ${workbook.SheetNames.length} sheets. Using "${bestSheet}" (${maxRows} rows)`);
        }
      }

      const worksheet = workbook.Sheets[bestSheet];
      const csvText = XLSX.utils.sheet_to_csv(worksheet);
```

**Step 2: Run syntax check**
```bash
node -c app/datapalo/page.js
```

**Step 3: Commit**
```bash
git add app/datapalo/page.js
git commit -m "fix: auto-select largest sheet in multi-sheet XLSX files"
```
