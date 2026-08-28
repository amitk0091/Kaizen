// AI provider abstraction: Gemini primary, Grok fallback.
// Uses REST APIs directly to avoid SDK version drift.

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  if (!key) throw new Error('GEMINI_API_KEY missing');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 1200 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) throw new Error('Gemini empty response');
  return text;
}

async function callGrok(prompt) {
  const key = process.env.GROK_API_KEY;
  const model = process.env.GROK_MODEL || 'grok-2-latest';
  if (!key) throw new Error('GROK_API_KEY missing');
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Grok ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Grok empty response');
  return text;
}

// Try Gemini, fall back to Grok. Returns { text, model }.
export async function generateReview(prompt) {
  try {
    const text = await callGemini(prompt);
    return { text, model: 'gemini' };
  } catch (e) {
    console.error('Gemini failed, falling back to Grok:', e.message);
    const text = await callGrok(prompt);
    return { text, model: 'grok' };
  }
}

// Basic self-harm / crisis detection so we can attach resources and avoid clinical advice.
export function detectCrisis(text = '') {
  const t = text.toLowerCase();
  const flags = ['suicide', 'kill myself', 'end my life', 'self harm', 'self-harm', 'want to die', 'hurt myself'];
  return flags.some((f) => t.includes(f));
}
