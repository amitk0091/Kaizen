"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { uid } from "@/lib/types";
import { Btn, Input, Chip, Empty, Check, Modal, Label, Card, Progress, Textarea, Select } from "./ui";

export default function Goals() {
  const { state, mutate } = useStore();
  const [form, setForm] = useState<any>(null);
  const [mil, setMil] = useState<Record<string, string>>({});

  const create = () => {
    if (!form.title?.trim()) return;
    mutate((s) => s.goals.unshift({ id: uid(), title: form.title.trim(), metric: form.metric || "", target: form.target || "", category: form.category || "Personal", why: form.why || "", obstacle: form.obstacle || "", plan: form.plan || "", milestones: [] }));
    setForm(null);
  };
  const addMil = (gid: string) => { const v = (mil[gid] || "").trim(); if (!v) return; mutate((s) => s.goals.find((g) => g.id === gid)!.milestones.push({ id: uid(), text: v, done: false })); setMil({ ...mil, [gid]: "" }); };
  const toggleMil = (gid: string, mid: string) => mutate((s) => { const m = s.goals.find((g) => g.id === gid)!.milestones.find((m) => m.id === mid)!; m.done = !m.done; });
  const delMil = (gid: string, mid: string) => mutate((s) => { const g = s.goals.find((g) => g.id === gid)!; g.milestones = g.milestones.filter((m) => m.id !== mid); });
  const del = (id: string) => mutate((s) => { s.goals = s.goals.filter((g) => g.id !== id); });
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <div className="text-sm text-ink3">Specific goals with an obstacle plan beat vague wishes. Break each into milestones.</div>
        <Btn variant="primary" onClick={() => setForm({})}>+ New goal</Btn>
      </div>
      {state.goals.length ? state.goals.map((g) => {
        const done = g.milestones.filter((m) => m.done).length;
        return (
          <Card key={g.id} className="mb-3.5">
            <div className="flex justify-between items-start">
              <div><div className="text-[17px] font-semibold">◆ {g.title}</div>
                <div className="text-xs text-ink3 mt-1 flex gap-2 flex-wrap">{g.category && <Chip>{g.category}</Chip>}{g.metric && <span>🎯 {g.metric}</span>}{g.target && <span>📅 {g.target}</span>}</div></div>
              <button className="text-ink3 hover:text-danger" onClick={() => del(g.id)}>✕</button>
            </div>
            <div className="flex items-center gap-3 my-3"><div className="flex-1"><Progress value={pct(done, g.milestones.length)} /></div><span className="text-xs text-ink3">{done}/{g.milestones.length}</span></div>
            {g.obstacle && <div className="text-sm bg-surface2 rounded-[9px] px-3 py-2 my-2"><b>If</b> {g.obstacle} <b>→ then</b> {g.plan || "…"}</div>}
            <div className="mt-1.5">
              {g.milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2 py-1.5">
                  <Check size={19} on={m.done} onClick={() => toggleMil(g.id, m.id)} />
                  <div className={"flex-1 text-[13.5px] " + (m.done ? "line-through text-ink3" : "")}>{m.text}</div>
                  <button className="text-ink3 hover:text-danger" onClick={() => delMil(g.id, m.id)}>✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input placeholder="Add a milestone…" value={mil[g.id] || ""} onChange={(e: any) => setMil({ ...mil, [g.id]: e.target.value })} onKeyDown={(e: any) => e.key === "Enter" && addMil(g.id)} />
              <Btn size="sm" onClick={() => addMil(g.id)}>Add</Btn>
            </div>
          </Card>
        );
      }) : <Empty icon="◆">No goals yet. Set one with the guided wizard.</Empty>}

      {form && (
        <Modal title="New goal — guided" onClose={() => setForm(null)}
          footer={<><Btn variant="ghost" onClick={() => setForm(null)}>Cancel</Btn><Btn variant="primary" onClick={create}>Create goal</Btn></>}>
          <div className="space-y-3">
            <div><Label>1 · Wish — what do you want?</Label><Input placeholder="Clear CA Inter Group 1" value={form.title || ""} onChange={(e: any) => setForm({ ...form, title: e.target.value })} autoFocus /></div>
            <div className="flex gap-3">
              <div className="flex-1"><Label>2 · Make it measurable</Label><Input placeholder="Score 60%+ in mocks" value={form.metric || ""} onChange={(e: any) => setForm({ ...form, metric: e.target.value })} /></div>
              <div className="flex-1"><Label>Target date</Label><Input type="date" value={form.target || ""} onChange={(e: any) => setForm({ ...form, target: e.target.value })} /></div>
            </div>
            <div><Label>Life area</Label><Select value={form.category || "Study"} onChange={(e: any) => setForm({ ...form, category: e.target.value })}>{["Study", "Career", "Health", "Finance", "Personal"].map((c) => <option key={c}>{c}</option>)}</Select></div>
            <div><Label>3 · Best outcome — why does this matter?</Label><Textarea placeholder="What changes when you achieve it?" value={form.why || ""} onChange={(e: any) => setForm({ ...form, why: e.target.value })} /></div>
            <div className="flex gap-3">
              <div className="flex-1"><Label>4 · Biggest inner obstacle</Label><Input placeholder="I scroll when bored" value={form.obstacle || ""} onChange={(e: any) => setForm({ ...form, obstacle: e.target.value })} /></div>
              <div className="flex-1"><Label>…then I will (if-then)</Label><Input placeholder="Phone in another room" value={form.plan || ""} onChange={(e: any) => setForm({ ...form, plan: e.target.value })} /></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
