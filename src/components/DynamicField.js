'use client';
export default function DynamicField({ field, value, onChange, disabled }) {
  const set = (v) => onChange(field.fieldId, v);
  const common = 'input';
  switch (field.type) {
    case 'number':
      return <input type="number" className={common} disabled={disabled} value={value ?? ''} onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'longtext':
      return <textarea className={common + ' min-h-[80px]'} disabled={disabled} value={value ?? ''} onChange={(e) => set(e.target.value)} />;
    case 'boolean':
      return (
        <button type="button" disabled={disabled} onClick={() => set(!value)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold border ${value ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface text-ink-700 border-slate-300'}`}>
          {value ? 'Yes \u2713' : 'No'}
        </button>
      );
    case 'scale':
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} disabled={disabled} onClick={() => set(n)}
              className={`h-10 w-10 rounded-full text-sm font-bold border ${value === n ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface text-ink-700 border-slate-300'}`}>{n}</button>
          ))}
        </div>
      );
    case 'select':
      return (
        <select className={common} disabled={disabled} value={value ?? ''} onChange={(e) => set(e.target.value)}>
          <option value="">Select…</option>
          {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'multiselect':
      const arr = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((o) => {
            const on = arr.includes(o);
            return (
              <button type="button" key={o} disabled={disabled}
                onClick={() => set(on ? arr.filter((x) => x !== o) : [...arr, o])}
                className={`chip border ${on ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface text-ink-700 border-slate-300'}`}>{o}</button>
            );
          })}
        </div>
      );
    case 'time':
      return <input type="time" className={common} disabled={disabled} value={value ?? ''} onChange={(e) => set(e.target.value)} />;
    default:
      return <input type="text" className={common} disabled={disabled} value={value ?? ''} onChange={(e) => set(e.target.value)} />;
  }
}
