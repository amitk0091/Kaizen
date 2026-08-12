"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { uid } from "@/lib/types";
import { Btn, Input, Chip, SectionTitle, Empty, Check, Modal, Select, Label } from "./ui";

const PRI: any = { High: "danger", Medium: "warn", Low: "default" };

export default function Todos() {
  const { state, mutate } = useStore();
  const [text, setText] = useState("");
  const [edit, setEdit] = useState<any>(null);
  const open = state.todos.filter((t) => !t.done);
  const done = state.todos.filter((t) => t.done);

  const add = () => { const v = text.trim(); if (!v) return; mutate((s) => s.todos.unshift({ id: uid(), text: v, done: false, priority: "", when: "", due: "", goalId: "", recurring: "none" })); setText(""); };
  const toggle = (id: string) => mutate((s) => { const t = s.todos.find((x) => x.id === id); if (t) t.done = !t.done; });
  const del = (id: string) => mutate((s) => { s.todos = s.todos.filter((x) => x.id !== id); });

  const Row = (t: any) => (
    <div key={t.id} className="flex gap-3 items-start p-3 border border-line rounded-xl bg-surface mb-2.5">
      <Check on={t.done} onClick={() => toggle(t.id)} />
      <div className="flex-1 min-w-0">
        <div className={t.done ? "line-through text-ink3 text-sm" : "text-sm font-medium"}>{t.text}</div>
        <div className="text-xs text-ink3 mt-1 flex gap-2 flex-wrap items-center">
          {t.priority && <Chip tone={PRI[t.priority]}>{t.priority}</Chip>}
          {t.when && <span>⏰ {t.when}</span>}
          {t.due && <span>📅 {t.due}</span>}
          {t.goalId && state.goals.find((g) => g.id === t.goalId) && <Chip tone="accent">◆ {state.goals.find((g) => g.id === t.goalId)!.title}</Chip>}
          {t.recurring && t.recurring !== "none" && <Chip>↻ {t.recurring}</Chip>}
        </div>
      </div>
      <Btn size="sm" variant="ghost" onClick={() => setEdit({ ...t })}>Edit</Btn>
      <button className="text-ink3 hover:text-danger px-1" onClick={() => del(t.id)}>✕</button>
    </div>
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Add a to-do and press Enter…" value={text} onChange={(e: any) => setText(e.target.value)} onKeyDown={(e: any) => e.key === "Enter" && add()} autoFocus />
        <Btn variant="primary" onClick={add}>Add</Btn>
      </div>
      <SectionTitle>Open · {open.length}</SectionTitle>
      {open.length ? open.map(Row) : <Empty icon="✓">Nothing open. Enjoy the clarity.</Empty>}
      {done.length > 0 && <><div className="mt-5"><SectionTitle>Completed · {done.length}</SectionTitle></div>{done.map(Row)}</>}

      {edit && (
        <Modal title="Edit to-do" onClose={() => setEdit(null)}
          footer={<><Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => { mutate((s) => { const t = s.todos.find((x) => x.id === edit.id); if (t) Object.assign(t, edit); }); setEdit(null); }}>Save</Btn></>}>
          <div className="space-y-3">
            <div><Label>Task</Label><Input value={edit.text} onChange={(e: any) => setEdit({ ...edit, text: e.target.value })} /></div>
            <div className="flex gap-3">
              <div className="flex-1"><Label>Priority</Label><Select value={edit.priority} onChange={(e: any) => setEdit({ ...edit, priority: e.target.value })}>{["", "Low", "Medium", "High"].map((p) => <option key={p} value={p}>{p || "—"}</option>)}</Select></div>
              <div className="flex-1"><Label>Repeat</Label><Select value={edit.recurring} onChange={(e: any) => setEdit({ ...edit, recurring: e.target.value })}>{["none", "daily", "weekly"].map((p) => <option key={p} value={p}>{p}</option>)}</Select></div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1"><Label>Due date</Label><Input type="date" value={edit.due || ""} onChange={(e: any) => setEdit({ ...edit, due: e.target.value })} /></div>
              <div className="flex-1"><Label>When / where (cue)</Label><Input value={edit.when || ""} placeholder="After lunch, at desk" onChange={(e: any) => setEdit({ ...edit, when: e.target.value })} /></div>
            </div>
            <div><Label>Link to a goal</Label><Select value={edit.goalId || ""} onChange={(e: any) => setEdit({ ...edit, goalId: e.target.value })}><option value="">— none —</option>{state.goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</Select></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
