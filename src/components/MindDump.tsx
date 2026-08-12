"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { uid, todayStr } from "@/lib/types";
import { Btn, Input, Chip, Empty, Card, Textarea, SectionTitle } from "./ui";

const EMOS = ["Anxious", "Overwhelmed", "Frustrated", "Sad", "Excited", "Calm", "Confused", "Angry", "Hopeful"];

export default function MindDump() {
  const { state, mutate } = useStore();
  const [emo, setEmo] = useState(""); const [intensity, setIntensity] = useState("3");
  const [text, setText] = useState(""); const [date, setDate] = useState(todayStr());

  const save = (mode: "accept" | "action") => {
    if (!text.trim()) return;
    mutate((s) => s.minddumps.push({ id: uid(), date, emotion: emo, intensity, text: text.trim(), action: mode === "action" }));
    if (mode === "action") {
      const step = prompt("What is one small, concrete next step? (This becomes a to-do)");
      if (step) mutate((s) => s.todos.unshift({ id: uid(), text: step, done: false, priority: "", when: "", due: "", goalId: "", recurring: "none" }));
    }
    setText(""); setEmo("");
  };
  const del = (id: string) => mutate((s) => { s.minddumps = s.minddumps.filter((m) => m.id !== id); });

  return (
    <div>
      <Card className="mb-3.5">
        <div className="text-sm text-ink3 mb-2.5">1) Name the feeling (naming it calms the brain). 2) Dump it all out. 3) Let it go, or turn it into one small step.</div>
        <div className="text-xs font-semibold text-ink2 mb-1.5">How are you feeling?</div>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {EMOS.map((e) => <button key={e} onClick={() => setEmo(e)} className={`px-3 py-1.5 rounded-full border text-[13px] font-semibold ${emo === e ? "bg-accentSoft text-accent border-accent" : "bg-surface border-line text-ink2"}`}>{e}</button>)}
        </div>
        <div className="flex items-center gap-3 mb-2.5"><span className="text-xs font-semibold text-ink2">Intensity</span><input type="range" min={1} max={5} value={intensity} onChange={(e) => setIntensity(e.target.value)} className="flex-1" /><Chip>{intensity}/5</Chip></div>
        <Textarea placeholder="Write freely — no filter, no judgment. Just get it out of your head." value={text} onChange={(e: any) => setText(e.target.value)} />
        <div className="flex justify-between items-center mt-2.5 gap-2 flex-wrap">
          <Input type="date" value={date} onChange={(e: any) => setDate(e.target.value)} className="max-w-[160px]" />
          <div className="flex gap-2"><Btn onClick={() => save("accept")}>Save & let go</Btn><Btn variant="primary" onClick={() => save("action")}>Turn into a to-do</Btn></div>
        </div>
      </Card>
      <SectionTitle>Past entries</SectionTitle>
      {[...state.minddumps].reverse().map((m) => (
        <div key={m.id} className="p-3 border border-line rounded-xl mb-2.5">
          <div className="flex justify-between"><div className="flex items-center gap-2">{m.emotion && <Chip tone="warn">{m.emotion}{m.intensity ? ` · ${m.intensity}/5` : ""}</Chip>}<span className="text-xs text-ink3">{m.date}</span></div><button className="text-ink3 hover:text-danger" onClick={() => del(m.id)}>✕</button></div>
          <div className="text-[13.5px] mt-1.5">{m.text}</div>
          {m.action && <div className="mt-1.5"><Chip tone="accent">→ turned into a to-do</Chip></div>}
        </div>
      ))}
      {!state.minddumps.length && <Empty icon="☁">Nothing here yet.</Empty>}
    </div>
  );
}
