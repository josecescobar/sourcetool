export function isValidAsin(value: string): boolean {
  if (!value || value.length !== 10) return false;
  return /^[A-Z0-9]{10}$/.test(value.toUpperCase());
}

export function extractAsin(url: string): string | null {
  // Match /dp/ASIN, /gp/product/ASIN, /gp/aw/d/ASIN
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1].toUpperCase();
  }
  return null;
}
