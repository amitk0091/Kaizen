import { AppState, todayStr } from "./types";

export function streak(log: Record<string, boolean> = {}) {
  let s = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    if (log[d]) s++;
    else if (i > 0) break;
  }
  return s;
}

/** Compact, privacy-conscious summary of the user's data for the LLM prompt. */
export function summarizeForAI(s: AppState) {
  const t = todayStr();
  const goals = s.goals.map((g) => ({
    title: g.title, done: g.milestones.filter((m) => m.done).length, total: g.milestones.length,
    obstacle: g.obstacle, plan: g.plan,
  }));
  const habits = s.habits.map((h) => ({ name: h.name, streak: streak(h.log), logged: Object.keys(h.log || {}).length }));
  const moodField = s.diaryTemplates.at(-1)?.fields.find((f) => f.type === "rating");
  const moods = moodField ? s.diaryEntries.map((e) => Number(e.values[moodField.id])).filter((n) => !isNaN(n)) : [];
  const dueCards = s.learnings.flatMap((l) => l.cards).filter((c) => c.due <= t).length;
  const emotions: Record<string, number> = {};
  s.minddumps.forEach((m) => { if (m.emotion) emotions[m.emotion] = (emotions[m.emotion] || 0) + 1; });
  return {
    date: t,
    persona: s.persona,
    goals,
    habits,
    todosOpen: s.todos.filter((x) => !x.done).length,
    todosOpenHigh: s.todos.filter((x) => !x.done && x.priority === "High").length,
    learningsCount: s.learnings.length,
    dueCards,
    moodRecent: moods.slice(-5),
    moodAvg: moods.length ? +(moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : null,
    emotions,
    worriesActioned: s.minddumps.filter((m) => m.action).length,
  };
}

export function buildPrompt(s: AppState) {
  const summary = summarizeForAI(s);
  return `You are Kaizen, a warm, honest personal-growth coach. Using ONLY the user's data below, write a short reflection with exactly three sections:
1. "What's going right" (celebrate real, specific wins — competence).
2. "What to watch" (gently flag risks; never shame; be kind and specific).
3. "Improve, bit by bit" (1-2 tiny, concrete next steps; use autonomy-supportive language like "you might try").
Ground every point in the data. Do not invent facts. Do not give medical, legal, or financial advice. Keep it under 180 words.

USER DATA (JSON):
${JSON.stringify(summary)}`;
}

/** Deterministic fallback used when no AI key is configured or the API fails. */
export function heuristicReview(s: AppState): string {
  const t = todayStr();
  const good: string[] = [], watch: string[] = [], steps: string[] = [];
  s.habits.forEach((h) => {
    const st = streak(h.log);
    if (st >= 3) good.push(`Your habit "<b>${esc(h.name)}</b>" is on a ${st}-day streak — consistency is compounding.`);
    else if (Object.keys(h.log || {}).length === 0) watch.push(`You created "<b>${esc(h.name)}</b>" but haven't checked it yet. Shrink it to a 2-minute version.`);
  });
  s.goals.forEach((g) => {
    const done = g.milestones.filter((m) => m.done).length;
    if (done > 0) good.push(`Real progress on "<b>${esc(g.title)}</b>" (${done}/${g.milestones.length} milestones).`);
    else if (g.milestones.length) watch.push(`Goal "<b>${esc(g.title)}</b>" has milestones but none done yet.${g.obstacle ? ` Recall your plan: if <i>${esc(g.obstacle)}</i>, then <i>${esc(g.plan || "")}</i>.` : ""}`);
  });
  if (s.goals.length === 0) steps.push("Set one specific goal with a target date and name the single biggest obstacle in your way.");
  const dueCards = s.learnings.flatMap((l) => l.cards).filter((c) => c.due <= t).length;
  if (dueCards > 0) steps.push(`Review your ${dueCards} due card${dueCards > 1 ? "s" : ""} — spaced retrieval is what makes learning stick.`);
  if (s.learnings.length >= 3) good.push(`You've logged ${s.learnings.length} learnings — a compounding knowledge base.`);
  const actioned = s.minddumps.filter((m) => m.action).length;
  if (actioned > 0) good.push(`You turned ${actioned} worr${actioned > 1 ? "ies" : "y"} into action instead of looping — the abstract-to-concrete shift that beats overthinking.`);
  const openHi = s.todos.filter((x) => !x.done && x.priority === "High").length;
  if (openHi > 0) steps.push(`You have ${openHi} high-priority to-do${openHi > 1 ? "s" : ""} open — do the hardest first while energy is fresh.`);
  if (!good.length) good.push("You showed up and reflected — that intention is where every change starts.");
  if (!watch.length) watch.push("Nothing concerning stands out. Keep your streaks alive and review weekly.");
  if (!steps.length) steps.push("Pick one tiny action for tomorrow and stack it onto something you already do.");
  return renderReview(good, watch, steps.slice(0, 3), true);
}

export function renderReview(good: string[], watch: string[], steps: string[], demo = false) {
  const block = (cls: string, title: string, items: string[]) =>
    `<div class="ai-block ${cls}"><div class="ai-title">${title}</div>${items.map((x) => `<p>${x}</p>`).join("")}</div>`;
  return `<div class="ai-review">
    ${block("ai-good", "✓ What's going right", good)}
    ${block("ai-watch", "◐ What to watch", watch)}
    ${block("ai-step", "→ Improve, bit by bit", steps)}
    <div class="ai-disc">${demo ? "Generated locally (no AI key configured)." : "Generated by your AI coach (Gemini / Grok)."} Reflection only — not medical, legal, or financial advice.</div>
  </div>`;
}

function esc(s = "") { return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)); }
