// Minimal CSV helpers — no dependency needed for our shapes.

export function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: string[][]) {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

/**
 * Parse simple 2-column CSV lines ("question,answer") supporting quoted
 * fields. Used for bulk library import.
 */
export function parseTwoColumnCsv(text: string): Array<{ question: string; answer: string }> {
  const out: Array<{ question: string; answer: string }> = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const fields = parseCsvLine(line);
    if (fields.length >= 2 && fields[0].trim() && fields[1].trim()) {
      out.push({ question: fields[0].trim(), answer: fields.slice(1).join(", ").trim() });
    }
  }
  return out;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}
