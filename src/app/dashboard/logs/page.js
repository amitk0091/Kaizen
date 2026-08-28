'use client';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, today } from '@/lib/clientApi';
import { useTheme } from '@/lib/theme';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function range(preset) {
  const to = today();
  const d = new Date();
  if (preset === 'week') d.setDate(d.getDate() - 6);
  else if (preset === 'month') d.setDate(d.getDate() - 29);
  else d.setDate(d.getDate() - 89);
  const from = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return { from, to };
}

export default function LogsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [preset, setPreset] = useState('week');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [entries, setEntries] = useState([]);
  const [fields, setFields] = useState([]);
  const [chartField, setChartField] = useState('');

  const bounds = preset === 'custom' && custom.from && custom.to ? custom : range(preset);

  useEffect(() => { (async () => {
    const s = await apiGet('/api/tracker/schema');
    const active = (s.schema.fields || []).filter((f) => f.isActive);
    setFields(active);
    const numeric = active.find((f) => f.type === 'number' || f.type === 'scale');
    if (numeric && !chartField) setChartField(numeric.fieldId);
  })(); }, []);

  useEffect(() => { (async () => {
    if (!bounds.from || !bounds.to) return;
    const r = await apiGet(`/api/tracker/entries?from=${bounds.from}&to=${bounds.to}`);
    setEntries((r.entries || []).sort((a, b) => a.date.localeCompare(b.date)));
  })(); }, [bounds.from, bounds.to]);

  const chartData = useMemo(() => entries.map((e) => ({ date: e.date.slice(5), value: Number(e.values?.[chartField]) || 0 })), [entries, chartField]);
  const numericFields = fields.filter((f) => f.type === 'number' || f.type === 'scale');

  const gridStroke = isDark ? '#1e293b' : '#eef2f7';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = isDark
    ? { backgroundColor: '#111827', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0' }
    : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#0b1120' };

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Logs</h1>
      <p className="text-ink-600 text-sm mt-1">Your history. Making progress visible is a proven motivator.</p>

      <div className="flex flex-wrap gap-2 mt-4">
        {['week', 'month', 'custom'].map((p) => (
          <button key={p} onClick={() => setPreset(p)} className={`chip border capitalize ${preset === p ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface text-ink-700 border-slate-300'}`}>{p === 'week' ? 'This week' : p === 'month' ? 'This month' : 'Custom'}</button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <input type="date" className="input flex-1 min-w-[130px] sm:max-w-[170px]" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
          <span className="text-ink-400 text-sm">to</span>
          <input type="date" className="input flex-1 min-w-[130px] sm:max-w-[170px]" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
        </div>
      )}

      {numericFields.length > 0 && (
        <div className="card p-4 mt-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="font-bold text-sm shrink-0">Trend</h2>
            <select className="input max-w-[200px]" value={chartField} onChange={(e) => setChartField(e.target.value)}>
              {numericFields.map((f) => <option key={f.fieldId} value={f.fieldId}>{f.label}</option>)}
            </select>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} stroke={gridStroke} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} stroke={gridStroke} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tickColor }} cursor={{ stroke: gridStroke }} />
                <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card mt-4 overflow-hidden">
        {entries.length === 0 ? (
          <p className="p-6 text-center text-ink-500 text-sm">No check-ins in this range yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.slice().reverse().map((e) => (
              <div key={e._id} className="p-4">
                <div className="text-sm font-semibold text-ink-800">{new Date(e.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600">
                  {fields.map((f) => {
                    const v = e.values?.[f.fieldId];
                    if (v === undefined || v === '' || v === null) return null;
                    return <span key={f.fieldId}><span className="text-ink-400">{f.label}:</span> {Array.isArray(v) ? v.join(', ') : String(v)}</span>;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
