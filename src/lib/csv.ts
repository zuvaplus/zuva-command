// Minimal CSV line splitter that respects double-quoted fields (so a
// value containing a comma doesn't break column alignment) — no external
// CSV library needed for these small, fixed-column formats. Shared by
// the prospects import route (server-side parsing) and the Dev Tracker
// import modal (client-side parsing, per that feature's own design).
export function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current.trim())
  return fields
}

export function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map(parseCsvLine)
}
