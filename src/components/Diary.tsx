"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/store/useStore";
import { uid, todayStr, DiaryField, FieldType } from "@/lib/types";
import { Btn, Input, Chip, Empty, Check, Card, Label, Textarea, Select } from "./ui";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });
const FTYPES: FieldType[] = ["text", "longtext", "number", "rating", "select", "checkbox"];

export default function Diary() {
  const { state, mutate } = useStore();
  const [tab, setTab] = useState<"fill" | "builder" | "timeline">("fill");
  const tpl = state.diaryTemplates[state.diaryTemplates.length - 1];

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {(["fill", "builder", "timeline"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3.5 py-2 rounded-full border text-[13px] font-semibold ${tab === t ? "bg-accentSoft text-accent border-accent" : "bg-surface border-line text-ink2"}`}>
            {t === "fill" ? "Today's entry" : t === "builder" ? "Form builder" : "Week · Month · Year"}
          </button>
        ))}
      </div>
      {tab === "fill" && <Fill key={tpl.version} />}
      {tab === "builder" && <Builder />}
      {tab === "timeline" && <Timeline chart={ReactECharts} />}
    </div>
  );
}

function Fill() {
  const { state, mutate } = useStore();
  const [date, setDate] = useState(todayStr());
  const tpl = state.diaryTemplates[state.diaryTemplates.length - 1];
  const existing = state.diaryEntries.find((e) => e.date === date);
  const [values, setValues] = useState<Record<string, any>>(existing ? { ...existing.values } : {});
  const shift = (n: number) => { const d = new Date(date + "T00:00:00"); d.setDate(d.getDate() + n); const ns = d.toISOString().slice(0, 10); setDate(ns); const ex = state.diaryEntries.find((e) => e.date === ns); setValues(ex ? { ...ex.values } : {}); };
  const setV = (id: string, v: any) => setValues((p) => ({ ...p, [id]: v }));

  const saveEntry = () => {
    mutate((s) => {
      const e = s.diaryEntries.find((x) => x.date === date);
      if (e) e.values = values;
      else s.diaryEntries.push({ id: uid(), date, templateVersion: tpl.version, values });
    });
  };

  const field = (f: DiaryField) => {
    const v = values[f.id];
    if (f.type === "text") return <Input value={v || ""} onChange={(e: any) => setV(f.id, e.target.value)} />;
    if (f.type === "longtext") return <Textarea value={v || ""} onChange={(e: any) => setV(f.id, e.target.value)} />;
    if (f.type === "number") return <Input type="number" value={v ?? ""} onChange={(e: any) => setV(f.id, e.target.value)} />;
    if (f.type === "rating") return <div className="flex items-center gap-3"><input type="range" min={1} max={10} value={v || 5} onChange={(e) => setV(f.id, e.target.value)} className="flex-1" /><Chip tone="accent">{v || 5}</Chip></div>;
    if (f.type === "checkbox") return <Check on={!!v} onClick={() => setV(f.id, !v)} />;
    if (f.type === "select") return <Select value={v || ""} onChange={(e: any) => setV(f.id, e.target.value)}><option value=""></option>{(f.options || []).map((o) => <option key={o}>{o}</option>)}</Select>;
    return null;
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2">
        <div className="flex items-center gap-2"><Btn size="sm" onClick={() => shift(-1)}>←</Btn>
          <Input type="date" value={date} onChange={(e: any) => { setDate(e.target.value); const ex = state.diaryEntries.find((x) => x.date === e.target.value); setValues(ex ? { ...ex.values } : {}); }} className="w-auto" />
          <Btn size="sm" onClick={() => shift(1)}>→</Btn></div>
        <Chip>Template v{tpl.version}</Chip>
      </div>
      <div className="text-sm text-ink3 mb-3.5">You can back-date any entry — a missed day is never a lost day.</div>
      {tpl.fields.map((f) => <div key={f.id} className="mb-3.5"><Label>{f.label}</Label>{field(f)}</div>)}
      <Btn variant="primary" className="w-full" onClick={saveEntry}>{existing ? "Update entry" : "Save entry"}</Btn>
    </Card>
  );
}

function Builder() {
  const { state, mutate } = useStore();
  const tpl = state.diaryTemplates[state.diaryTemplates.length - 1];
  const [draft, setDraft] = useState<DiaryField[]>(() => JSON.parse(JSON.stringify(tpl.fields)));
  const [type, setType] = useState<FieldType>("text");
  const [label, setLabel] = useState("");

  const add = () => { setDraft([...draft, { id: "f_" + uid(), type, label: label.trim() || `New ${type}`, options: type === "select" ? ["Option 1", "Option 2"] : undefined }]); setLabel(""); };
  const remove = (id: string) => setDraft(draft.filter((f) => f.id !== id));
  const editOpts = (id: string) => { const f = draft.find((f) => f.id === id)!; const v = prompt("Comma-separated options:", (f.options || []).join(", ")); if (v !== null) setDraft(draft.map((x) => x.id === id ? { ...x, options: v.split(",").map((s) => s.trim()).filter(Boolean) } : x)); };
  const commit = () => { if (!draft.length) return; mutate((s) => s.diaryTemplates.push({ version: tpl.version + 1, fields: JSON.parse(JSON.stringify(draft)) })); alert("New template version saved. Past entries keep their original version."); };

  return (
    <Card>
      <div className="bg-accentSoft border border-line rounded-xl px-3.5 py-3 text-sm mb-3.5">🛡️ Editing creates <b>version {tpl.version + 1}</b> going forward. Past entries keep the version they were written with — your history is never changed.</div>
      {draft.map((f) => (
        <div key={f.id} className="flex gap-2 items-center p-2.5 border border-line rounded-[10px] mb-2 bg-bg">
          <span className="text-ink3">⠿</span><Chip>{f.type}</Chip>
          <span className="flex-1 text-[13.5px]">{f.label}</span>
          {f.type === "select" && <Btn size="sm" variant="ghost" onClick={() => editOpts(f.id)}>options</Btn>}
          <button className="text-ink3 hover:text-danger" onClick={() => remove(f.id)}>✕</button>
        </div>
      ))}
      <div className="flex gap-2 flex-wrap my-3">
        <Select value={type} onChange={(e: any) => setType(e.target.value)} className="w-auto">{FTYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select>
        <Input placeholder="Field label" value={label} onChange={(e: any) => setLabel(e.target.value)} className="flex-1" />
        <Btn onClick={add}>+ Add field</Btn>
      </div>
      <div className="flex items-center gap-3"><Btn variant="primary" onClick={commit}>Save as new version</Btn><span className="text-sm text-ink3">Current: v{tpl.version} · {tpl.fields.length} fields</span></div>
    </Card>
  );
}

function Timeline({ chart: ReactECharts }: any) {
  const { state } = useStore();
  const entries = [...state.diaryEntries].sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) return <Empty icon="✎">No entries yet. Fill today to start your timeline.</Empty>;
  const tpl = state.diaryTemplates[state.diaryTemplates.length - 1];
  const numField = tpl.fields.find((f) => f.type === "rating" || f.type === "number");
  const cs = (n: string) => (typeof window !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue(n).trim() : "#128a63");
  const data = numField ? entries.slice().reverse().filter((e) => e.values[numField.id] !== "" && e.values[numField.id] != null) : [];

  return (
    <div>
      {numField && data.length > 0 && (
        <Card className="mb-3.5">
          <div className="text-xs font-bold text-ink2 uppercase tracking-wide mb-3">Your broader view · {numField.label}</div>
          <ReactECharts opts={{ renderer: "svg" }} style={{ height: 260 }} option={{
            grid: { left: 36, right: 14, top: 18, bottom: 28 }, tooltip: { trigger: "axis" },
            xAxis: { type: "category", data: data.map((e) => e.date.slice(5)), axisLabel: { color: cs("--text-3") } },
            yAxis: { type: "value", axisLabel: { color: cs("--text-3") }, splitLine: { lineStyle: { color: cs("--border") } } },
            series: [{ type: "line", smooth: true, data: data.map((e) => Number(e.values[numField.id]) || 0), lineStyle: { color: cs("--accent"), width: 3 }, itemStyle: { color: cs("--accent") }, areaStyle: { opacity: 0.15, color: cs("--accent") } }],
          }} />
        </Card>
      )}
      <Card>
        <div className="text-xs font-bold text-ink2 uppercase tracking-wide mb-3">All entries · {entries.length}</div>
        {entries.map((e) => {
          const t = state.diaryTemplates.find((t) => t.version === e.templateVersion) || tpl;
          return (
            <div key={e.id} className="p-3 border border-line rounded-xl mb-2.5">
              <div className="flex justify-between"><b>{new Date(e.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</b><Chip>v{e.templateVersion}</Chip></div>
              <div className="text-xs text-ink2 mt-2">{t.fields.map((f) => { let v = e.values[f.id]; if (v === "" || v == null) return null; if (typeof v === "boolean") v = v ? "Yes" : "No"; return <div key={f.id} className="my-0.5"><span className="text-ink3">{f.label}:</span> {String(v)}</div>; })}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
