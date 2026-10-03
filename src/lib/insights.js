// Personal "what works for you" insights: compares an outcome (e.g. day rating)
// on days with vs without each habit. Correlation only — the UI says so.

const MIN_PER_GROUP = 3;
const MIN_DIFF = 0.3; // ignore differences too small to matter

const mean = (a) => a.reduce((n, x) => n + x, 0) / a.length;
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const num = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

// rows: [{ date, values: { fieldId: value }, focusMin }]
export function computeInsights(rows, fields, outcomeId) {
  const outcome = fields.find((f) => f.fieldId === outcomeId);
  if (!outcome) return [];
  const data = rows.map((r) => ({ ...r, y: num(r.values?.[outcomeId]) })).filter((r) => r.y !== null);
  const out = [];

  const compare = (label, inGroup, outGroup, phrasing) => {
    if (inGroup.length < MIN_PER_GROUP || outGroup.length < MIN_PER_GROUP) return;
    const a = mean(inGroup.map((r) => r.y));
    const b = mean(outGroup.map((r) => r.y));
    if (Math.abs(a - b) < MIN_DIFF) return;
    out.push({ label, a, b, diff: a - b, n: inGroup.length + outGroup.length, text: phrasing(a, b) });
  };
  const fmt = (x) => (Math.round(x * 10) / 10).toString();
  const o = outcome.label;

  for (const f of fields) {
    if (f.fieldId === outcomeId) continue;
    if (f.type === 'boolean') {
      compare(f.label,
        data.filter((r) => r.values?.[f.fieldId] === true),
        data.filter((r) => r.values?.[f.fieldId] === false),
        (a, b) => `When "${f.label}" was yes, ${o} averaged ${fmt(a)} vs ${fmt(b)} when it was no.`);
    } else if (f.type === 'number' || f.type === 'scale') {
      const withVal = data.filter((r) => num(r.values?.[f.fieldId]) !== null);
      if (withVal.length < MIN_PER_GROUP * 2) continue;
      const m = median(withVal.map((r) => num(r.values[f.fieldId])));
      const hi = withVal.filter((r) => num(r.values[f.fieldId]) > m);
      const lo = withVal.filter((r) => num(r.values[f.fieldId]) <= m);
      compare(f.label, hi, lo, (a, b) => `On days "${f.label}" was above ${fmt(m)}, ${o} averaged ${fmt(a)} vs ${fmt(b)} otherwise.`);
    }
  }

  // Deep work from focus sessions.
  compare('Deep work',
    data.filter((r) => (r.focusMin || 0) > 0),
    data.filter((r) => !(r.focusMin > 0)),
    (a, b) => `On days you did a focus session, ${o} averaged ${fmt(a)} vs ${fmt(b)} on days you didn't.`);

  return out.sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff)).slice(0, 4);
}
