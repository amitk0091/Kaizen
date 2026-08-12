"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { uid, todayStr } from "@/lib/types";
import { streak } from "@/lib/review";
import { Btn, Input, Chip, Empty, Modal, Label, Card } from "./ui";

const last7 = () => Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 864e5).toISOString().slice(0, 10));

export default function Habits() {
  const { state, mutate } = useStore();
  const [form, setForm] = useState<any>(null);
  const toggle = (id: string, d: string) => mutate((s) => { const h = s.habits.find((x) => x.id === id)!; h.log = h.log || {}; h.log[d] ? delete h.log[d] : (h.log[d] = true); });
  const del = (id: string) => mutate((s) => { s.habits = s.habits.filter((x) => x.id !== id); });
  const create = () => { if (!form.name?.trim()) return; mutate((s) => s.habits.push({ id: uid(), name: form.name.trim(), stack: form.stack || "", tiny: form.tiny || "", reward: form.reward || "", log: {} })); setForm(null); };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <div className="text-sm text-ink3">Anchor a tiny habit to a cue. Streaks are forgiving — a minimum version still counts.</div>
        <Btn variant="primary" onClick={() => setForm({})}>+ New habit</Btn>
      </div>
      {state.habits.length ? state.habits.map((h) => (
        <Card key={h.id} className="mb-3">
          <div className="flex justify-between items-start">
            <div><div className="text-base font-semibold">{h.name}</div>
              <div className="text-xs text-ink3 mt-1">{h.stack && `↳ ${h.stack}`}{h.tiny && ` · min: ${h.tiny}`}</div></div>
            <div className="flex items-center gap-2"><Chip tone="accent">🔥 {streak(h.log)} day</Chip><button className="text-ink3 hover:text-danger" onClick={() => del(h.id)}>✕</button></div>
          </div>
          <div className="flex gap-1.5 mt-3">
            {last7().map((d) => (
              <div key={d} className="flex-1 text-center">
                <div className="text-[10px] text-ink3">{new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "narrow" })}</div>
                <div onClick={() => toggle(h.id, d)} className="h-8 rounded-[9px] mt-1 grid place-items-center border border-line cursor-pointer"
                  style={{ background: h.log?.[d] ? "var(--accent)" : "var(--surface-2)", color: h.log?.[d] ? "var(--accent-text)" : "transparent" }}>✓</div>
              </div>
            ))}
          </div>
        </Card>
      )) : <Empty icon="↻">No habits yet. Start smaller than feels necessary.</Empty>}

      {form && (
        <Modal title="New habit" onClose={() => setForm(null)}
          footer={<><Btn variant="ghost" onClick={() => setForm(null)}>Cancel</Btn><Btn variant="primary" onClick={create}>Create</Btn></>}>
          <div className="space-y-3">
            <div><Label>Habit</Label><Input placeholder="Revise 10 flashcards" value={form.name || ""} onChange={(e: any) => setForm({ ...form, name: e.target.value })} autoFocus /></div>
            <div><Label>Habit stack — "After [existing habit], I will…"</Label><Input placeholder="After I have morning tea" value={form.stack || ""} onChange={(e: any) => setForm({ ...form, stack: e.target.value })} /></div>
            <div className="flex gap-3">
              <div className="flex-1"><Label>Tiny minimum version</Label><Input placeholder="Just 2 cards" value={form.tiny || ""} onChange={(e: any) => setForm({ ...form, tiny: e.target.value })} /></div>
              <div className="flex-1"><Label>Immediate reward</Label><Input placeholder="Tick + short walk" value={form.reward || ""} onChange={(e: any) => setForm({ ...form, reward: e.target.value })} /></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
