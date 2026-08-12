"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { uid, todayStr } from "@/lib/types";
import { Btn, Input, Chip, Empty, Card, Textarea, SectionTitle } from "./ui";

export default function Learnings() {
  const { state } = useStore();
  const [tab, setTab] = useState<"log" | "review">("log");
  const due = state.learnings.flatMap((l) => l.cards).filter((c) => c.due <= todayStr()).length;
  return (
    <div>
      <div className="flex gap-1.5 mb-4">
        <button onClick={() => setTab("log")} className={`px-3.5 py-2 rounded-full border text-[13px] font-semibold ${tab === "log" ? "bg-accentSoft text-accent border-accent" : "bg-surface border-line text-ink2"}`}>Log & library</button>
        <button onClick={() => setTab("review")} className={`px-3.5 py-2 rounded-full border text-[13px] font-semibold ${tab === "review" ? "bg-accentSoft text-accent border-accent" : "bg-surface border-line text-ink2"}`}>Review cards {due ? `· ${due} due` : ""}</button>
      </div>
      {tab === "log" ? <Log /> : <Review />}
    </div>
  );
}

function Log() {
  const { state, mutate } = useStore();
  const [topic, setTopic] = useState(""); const [text, setText] = useState(""); const [date, setDate] = useState(todayStr());
  const [makeCard, setMakeCard] = useState(true); const [q, setQ] = useState(""); const [a, setA] = useState("");
  const add = () => {
    if (!text.trim()) return;
    const cards = makeCard && q.trim() && a.trim() ? [{ id: uid(), q: q.trim(), a: a.trim(), due: todayStr(), interval: 0, reps: 0 }] : [];
    mutate((s) => s.learnings.push({ id: uid(), date, topic: topic.trim(), text: text.trim(), cards }));
    setText(""); setQ(""); setA(""); setTopic("");
  };
  const del = (id: string) => mutate((s) => { s.learnings = s.learnings.filter((l) => l.id !== id); });
  return (
    <div>
      <Card className="mb-3.5">
        <div className="flex gap-2 flex-wrap"><Input placeholder="Topic (optional)" value={topic} onChange={(e: any) => setTopic(e.target.value)} className="max-w-[200px]" /><Input type="date" value={date} onChange={(e: any) => setDate(e.target.value)} className="max-w-[160px]" /></div>
        <Textarea placeholder="What did you learn today?" value={text} onChange={(e: any) => setText(e.target.value)} className="mt-2.5" />
        <label className="flex items-center gap-2 text-sm mt-2.5"><input type="checkbox" checked={makeCard} onChange={(e) => setMakeCard(e.target.checked)} /> Also make a review card (active recall)</label>
        {makeCard && <div className="flex gap-2 mt-2.5"><Input placeholder="Question / cue" value={q} onChange={(e: any) => setQ(e.target.value)} /><Input placeholder="Answer" value={a} onChange={(e: any) => setA(e.target.value)} /></div>}
        <div className="flex justify-end mt-2.5"><Btn variant="primary" onClick={add}>Save</Btn></div>
      </Card>
      <SectionTitle>Library · {state.learnings.length}</SectionTitle>
      {[...state.learnings].reverse().map((l) => (
        <div key={l.id} className="p-3 border border-line rounded-xl mb-2.5">
          <div className="flex justify-between"><div className="flex items-center gap-2">{l.topic && <Chip tone="accent">{l.topic}</Chip>}<span className="text-xs text-ink3">{l.date}</span></div><button className="text-ink3 hover:text-danger" onClick={() => del(l.id)}>✕</button></div>
          <div className="text-[13.5px] mt-1.5">{l.text}</div>
          {l.cards.length > 0 && <div className="mt-1.5"><Chip>✦ {l.cards.length} card{l.cards.length > 1 ? "s" : ""}</Chip></div>}
        </div>
      ))}
      {!state.learnings.length && <Empty icon="✦">Nothing logged yet.</Empty>}
    </div>
  );
}

const MULT: any = { again: 0, hard: 1.3, good: 2.2, easy: 2.6 };
function Review() {
  const { state, mutate } = useStore();
  const [show, setShow] = useState(false);
  const due: { card: any; topic: string }[] = [];
  state.learnings.forEach((l) => l.cards.forEach((c) => { if (c.due <= todayStr()) due.push({ card: c, topic: l.topic }); }));
  if (!due.length) return <Empty icon="✦">No cards due. Spaced repetition brings them back right before you forget.</Empty>;
  const cur = due[0];
  const rate = (rating: string) => {
    mutate((s) => {
      s.learnings.forEach((l) => l.cards.forEach((c) => {
        if (c.id === cur.card.id) {
          c.reps = (c.reps || 0) + 1;
          let iv = rating === "again" ? 0 : (c.interval ? Math.round(c.interval * MULT[rating]) : (rating === "hard" ? 1 : rating === "good" ? 3 : 7));
          c.interval = iv;
          const d = new Date(); d.setDate(d.getDate() + Math.max(iv, rating === "again" ? 0 : 1)); c.due = d.toISOString().slice(0, 10);
        }
      }));
    });
    setShow(false);
  };
  return (
    <Card className="text-center py-8">
      <div className="text-sm text-ink3">{cur.topic ? cur.topic + " · " : ""}{due.length} due</div>
      <div className="text-xl font-semibold my-4">{cur.card.q}</div>
      {show ? (
        <div>
          <div className="border-t border-line pt-4 text-[17px] text-accent">{cur.card.a}</div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Btn onClick={() => rate("again")}>Again</Btn><Btn onClick={() => rate("hard")}>Hard</Btn>
            <Btn variant="primary" onClick={() => rate("good")}>Good</Btn><Btn onClick={() => rate("easy")}>Easy</Btn>
          </div>
        </div>
      ) : <Btn variant="primary" onClick={() => setShow(true)}>Show answer</Btn>}
    </Card>
  );
}
