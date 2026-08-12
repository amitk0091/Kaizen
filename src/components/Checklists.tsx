"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { uid } from "@/lib/types";
import { Btn, Input, Chip, Empty, Check, Modal, Label, Card, Progress } from "./ui";

export default function Checklists() {
  const { state, mutate } = useStore();
  const [form, setForm] = useState<any>(null);
  const [item, setItem] = useState<Record<string, string>>({});
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  const create = () => { if (!form.title?.trim()) return; mutate((s) => s.checklists.unshift({ id: uid(), title: form.title.trim(), items: [] })); setForm(null); };
  const add = (cid: string) => { const v = (item[cid] || "").trim(); if (!v) return; mutate((s) => s.checklists.find((c) => c.id === cid)!.items.push({ id: uid(), text: v, done: false })); setItem({ ...item, [cid]: "" }); };
  const toggle = (cid: string, iid: string) => mutate((s) => { const it = s.checklists.find((c) => c.id === cid)!.items.find((i) => i.id === iid)!; it.done = !it.done; });
  const delItem = (cid: string, iid: string) => mutate((s) => { const c = s.checklists.find((c) => c.id === cid)!; c.items = c.items.filter((i) => i.id !== iid); });
  const reset = (cid: string) => mutate((s) => s.checklists.find((c) => c.id === cid)!.items.forEach((i) => (i.done = false)));
  const del = (cid: string) => mutate((s) => { s.checklists = s.checklists.filter((c) => c.id !== cid); });

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <div className="text-sm text-ink3">Reusable routines — morning ritual, exam-day kit, launch steps.</div>
        <Btn variant="primary" onClick={() => setForm({})}>+ New checklist</Btn>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {state.checklists.length ? state.checklists.map((c) => {
          const done = c.items.filter((i) => i.done).length;
          return (
            <Card key={c.id}>
              <div className="flex justify-between items-center"><div className="text-base font-semibold">{c.title}</div>
                <div className="flex items-center gap-2"><Chip>{done}/{c.items.length}</Chip><button className="text-ink3 hover:text-danger" onClick={() => del(c.id)}>✕</button></div></div>
              <div className="my-2.5"><Progress value={pct(done, c.items.length)} /></div>
              {c.items.map((i) => (
                <div key={i.id} className="flex items-center gap-2 py-1.5">
                  <Check size={19} on={i.done} onClick={() => toggle(c.id, i.id)} />
                  <div className={"flex-1 text-[13.5px] " + (i.done ? "line-through text-ink3" : "")}>{i.text}</div>
                  <button className="text-ink3 hover:text-danger" onClick={() => delItem(c.id, i.id)}>✕</button>
                </div>
              ))}
              <div className="flex gap-2 mt-2"><Input placeholder="Add item…" value={item[c.id] || ""} onChange={(e: any) => setItem({ ...item, [c.id]: e.target.value })} onKeyDown={(e: any) => e.key === "Enter" && add(c.id)} /><Btn size="sm" onClick={() => add(c.id)}>Add</Btn></div>
              <div className="mt-2"><Btn size="sm" variant="ghost" onClick={() => reset(c.id)}>↺ Reset all</Btn></div>
            </Card>
          );
        }) : <Empty icon="☰">No checklists yet.</Empty>}
      </div>
      {form && (
        <Modal title="New checklist" onClose={() => setForm(null)}
          footer={<><Btn variant="ghost" onClick={() => setForm(null)}>Cancel</Btn><Btn variant="primary" onClick={create}>Create</Btn></>}>
          <div><Label>Title</Label><Input placeholder="Morning routine" value={form.title || ""} onChange={(e: any) => setForm({ ...form, title: e.target.value })} autoFocus /></div>
        </Modal>
      )}
    </div>
  );
}
