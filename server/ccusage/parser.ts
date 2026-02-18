/**
 * Parse JSON from ccusage output.
 * Handles the blocks duplication bug: ccusage blocks prints the JSON twice,
 * so we parse only the first complete JSON object by tracking brace depth.
 */
export function parseFirstJson<T>(raw: string): T {
  // Find the start of JSON (first [ or {)
  const startBracket = raw.indexOf("[");
  const startBrace = raw.indexOf("{");

  let start: number;
  let openChar: string;
  let closeChar: string;

  if (startBracket === -1 && startBrace === -1) {
    throw new Error("No JSON found in ccusage output");
  }

  if (startBracket === -1) {
    start = startBrace;
    openChar = "{";
    closeChar = "}";
  } else if (startBrace === -1) {
    start = startBracket;
    openChar = "[";
    closeChar = "]";
  } else if (startBracket < startBrace) {
    start = startBracket;
    openChar = "[";
    closeChar = "]";
  } else {
    start = startBrace;
    openChar = "{";
    closeChar = "}";
  }

  // Track brace/bracket depth to find the end of first complete JSON
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\") {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === openChar || ch === (openChar === "[" ? "{" : "[")) {
      depth++;
    } else if (ch === closeChar || ch === (closeChar === "]" ? "}" : "]")) {
      depth--;
      if (depth === 0) {
        const jsonStr = raw.slice(start, i + 1);
        return JSON.parse(jsonStr) as T;
      }
    }
  }

  // Fallback: try parsing the whole thing
  const trimmed = raw.trim();
  return JSON.parse(trimmed) as T;
}
