'use client';
// Minimal markdown renderer for headings, bold, and lists (AI review output).
export default function Markdown({ text }) {
  const lines = (text || '').split('\n');
  const out = [];
  let list = [];
  const flush = (k) => { if (list.length) { out.push(<ul key={'ul' + k} className="list-disc pl-5 space-y-1 my-2 text-ink-700">{list}</ul>); list = []; } };
  const inline = (s) => {
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>);
  };
  lines.forEach((ln, i) => {
    if (ln.startsWith('## ')) { flush(i); out.push(<h3 key={i} className="font-bold text-ink-900 mt-4 mb-1">{ln.slice(3)}</h3>); }
    else if (ln.startsWith('# ')) { flush(i); out.push(<h2 key={i} className="font-extrabold text-lg mt-4 mb-1">{ln.slice(2)}</h2>); }
    else if (ln.trim().startsWith('- ') || ln.trim().startsWith('* ')) { list.push(<li key={i}>{inline(ln.trim().slice(2))}</li>); }
    else if (ln.trim() === '---') { flush(i); out.push(<hr key={i} className="my-3 border-slate-200" />); }
    else if (ln.trim() === '') { flush(i); }
    else { flush(i); out.push(<p key={i} className="text-ink-700 my-1">{inline(ln)}</p>); }
  });
  flush('end');
  return <div>{out}</div>;
}
