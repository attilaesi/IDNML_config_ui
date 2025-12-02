// lib/params.ts

export type ParamsObject = Record<string, string | number>;

export function parseCellTextToParams(text: string): ParamsObject | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const params: ParamsObject = {};

  const lines = trimmed.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || !line.includes(':')) continue;

    const [keyRaw, valueRaw] = line.split(':', 1 + 1); // split once
    const key = keyRaw.trim();
    let value = valueRaw.trim();

    if (!key) continue;

    // optionally ignore mediatypes in DB layer
    if (key.toLowerCase() === 'mediatypes') {
      // you can either store or ignore; here we ignore for DB
      continue;
    }

    // Try to coerce to number if it's an integer
    if (/^-?\d+$/.test(value)) {
      params[key] = parseInt(value, 10);
    } else {
      params[key] = value;
    }
  }

  return Object.keys(params).length === 0 ? {} : params;
}

export function paramsToCellText(params: any): string {
  if (!params || typeof params !== 'object') return '';

  const lines: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (key.toLowerCase() === 'mediatypes') {
      // show mediatypes for user visibility if you store it
      lines.push(`mediatypes: ${String(value)}`);
      continue;
    }
    lines.push(`${key}: ${String(value)}`);
  }

  return lines.join('\n');
}