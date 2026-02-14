export interface MathToken {
  type: 'PERCENT' | 'ABSOLUTE';
  operator: '+' | '-';
  value: number;
}

export function parseMathExpression(expression: string): MathToken[] {
  const tokens: MathToken[] = [];
  // Match patterns like: +10%, -10%, +$2.50, -$2.50, +2.50, -2.50
  const regex = /([+-])\s*\$?([\d.]+)\s*(%)?/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(expression)) !== null) {
    const operator = match[1] as '+' | '-';
    const value = parseFloat(match[2] ?? '');
    const isPercent = match[3] === '%';

    if (isNaN(value)) continue;

    tokens.push({
      type: isPercent ? 'PERCENT' : 'ABSOLUTE',
      operator,
      value,
    });
  }

  return tokens;
}

export function applyMathExpression(baseValue: number, expression: string): number {
  const tokens = parseMathExpression(expression);
  let result = baseValue;

  for (const token of tokens) {
    if (token.type === 'PERCENT') {
      const amount = result * (token.value / 100);
      result = token.operator === '+' ? result + amount : result - amount;
    } else {
      result = token.operator === '+' ? result + token.value : result - token.value;
    }
  }

  return Math.round(result * 100) / 100;
}
