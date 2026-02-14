export interface ParsedRow {
  identifier: string;
  buyPrice?: number;
}

export interface ParseResult {
  rows: ParsedRow[];
  detectedColumns: {
    identifier: string;
    buyPrice: string | null;
  };
  totalRows: number;
  skippedRows: number;
}

const IDENTIFIER_PATTERNS = [
  /^asin$/i,
  /^upc$/i,
  /^ean$/i,
  /^barcode$/i,
  /^sku$/i,
  /^identifier$/i,
  /^product.?id$/i,
  /^item.?(number|no|#|code)$/i,
];

const BUY_PRICE_PATTERNS = [
  /^(buy|cost|purchase|wholesale|unit).?(price|cost)?$/i,
  /^price$/i,
  /^cost$/i,
  /^unit.?cost$/i,
];

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function detectColumn(headers: string[], patterns: RegExp[]): string | null {
  for (const header of headers) {
    const clean = header.replace(/['"]/g, '').trim();
    for (const pattern of patterns) {
      if (pattern.test(clean)) return header;
    }
  }
  return null;
}

function parsePriceValue(raw: string): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[$€£,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

export function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], detectedColumns: { identifier: '', buyPrice: null }, totalRows: 0, skippedRows: 0 };
  }

  const headers = parseCsvLine(lines[0]!);
  const identifierCol = detectColumn(headers, IDENTIFIER_PATTERNS);
  const buyPriceCol = detectColumn(headers, BUY_PRICE_PATTERNS);

  // If no identifier column detected, use the first column
  const idIndex = identifierCol ? headers.indexOf(identifierCol) : 0;
  const priceIndex = buyPriceCol ? headers.indexOf(buyPriceCol) : -1;

  const rows: ParsedRow[] = [];
  let skippedRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]!);
    const identifier = fields[idIndex]?.replace(/['"]/g, '').trim();

    if (!identifier) {
      skippedRows++;
      continue;
    }

    const row: ParsedRow = { identifier };

    if (priceIndex >= 0 && fields[priceIndex]) {
      const price = parsePriceValue(fields[priceIndex]);
      if (price !== undefined) row.buyPrice = price;
    }

    rows.push(row);
  }

  return {
    rows,
    detectedColumns: {
      identifier: identifierCol || headers[0] || 'Column 1',
      buyPrice: buyPriceCol,
    },
    totalRows: rows.length,
    skippedRows,
  };
}
