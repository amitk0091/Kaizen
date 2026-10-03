// Pull the list items out of the "## 3 tiny steps…" section of an AI review.
export function extractTinySteps(markdown = '') {
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => /^#{1,6}\s*3 tiny steps/i.test(l.trim()));
  if (start === -1) return [];
  const steps = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^#{1,6}\s/.test(line)) break;
    const m = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (m) {
      const text = m[1].replace(/\*\*|__|`/g, '').trim();
      if (text) steps.push(text.slice(0, 300));
    }
  }
  return steps.slice(0, 3);
}
