"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { uid, todayStr } from "@/lib/types";
import { Modal, Btn, Textarea } from "@/components/ui";
import Home from "@/components/Home";
import Todos from "@/components/Todos";
import Habits from "@/components/Habits";
import Goals from "@/components/Goals";
import Checklists from "@/components/Checklists";
import Diary from "@/components/Diary";
import Learnings from "@/components/Learnings";
import MindDump from "@/components/MindDump";
import Review from "@/components/Review";
import Help from "@/components/Help";
import Onboarding from "@/components/Onboarding";
import Paywall from "@/components/Paywall";

const NAV = [
  ["home", "◎", "Today"], ["todos", "✓", "To-dos"], ["habits", "↻", "Habits"], ["goals", "◆", "Goals"],
  ["checklists", "☰", "Checklists"], ["diary", "✎", "Diary"], ["learnings", "✦", "Learnings"],
  ["mind", "☁", "Mind Dump"], ["review", "✧", "AI Review"],
] as const;
const BOTTOM = [["home", "◎", "Today"], ["todos", "✓", "To-dos"], ["goals", "◆", "Goals"], ["diary", "✎", "Diary"], ["review", "✧", "Review"]] as const;
const TITLES: Record<string, [string, string]> = {
  home: ["Today", "Your day at a glance"], todos: ["To-dos", "Capture and finish what matters"], habits: ["Habits", "Small actions, done consistently"],
  goals: ["Goals", "Where you are heading"], checklists: ["Checklists", "Reusable routines"], diary: ["Daily Diary", "Your own reflection form"],
  learnings: ["Learnings", "Remember what you learn"], mind: ["Mind Dump", "Empty your head, gain clarity"], review: ["AI Review", "Honest, kind, and actionable"],
  help: ["Help & FAQ", "Get the most out of Kaizen"],
};

export default function AppShell() {
  const router = useRouter();
  const { state, ready, init, setTheme, blocked, setEntitled, clearBlocked } = useStore();
  const [view, setView] = useState("home");
  const [me, setMe] = useState<any>(null);
  const [fab, setFab] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [qc, setQc] = useState("");

  useEffect(() => {
    init();
    api("/api/auth/me").then((m) => { setMe(m); if (m?.subscription) setEntitled(!!m.subscription.entitled); }).catch(() => {});
  }, [init, setEntitled]);
  // If a write was refused server-side (trial ended), surface the paywall.
  useEffect(() => { if (blocked) setPaywall(true); }, [blocked]);
  useEffect(() => { if (state.theme) document.documentElement.setAttribute("data-theme", state.theme); }, [state.theme]);
  useEffect(() => { try { localStorage.setItem("kaizen-theme", JSON.stringify(state.theme)); } catch {} }, [state.theme]);

  const trialDaysLeft = me?.subscription ? Math.ceil((new Date(me.subscription.trialEnd).getTime() - Date.now()) / 864e5) : 3;
  const entitled = me?.subscription ? me.subscription.entitled : true;
  const paid = me?.subscription?.status === "active";

  const logout = async () => { await api("/api/auth/logout", { method: "POST" }); router.replace("/login"); };
  const quick = (kind: string) => {
    const v = qc.trim(); if (!v) return;
    useStore.getState().mutate((s) => {
      if (kind === "todo") s.todos.unshift({ id: uid(), text: v, done: false, priority: "", when: "", due: "", goalId: "", recurring: "none" });
      if (kind === "learning") s.learnings.push({ id: uid(), date: todayStr(), topic: "", text: v, cards: [] });
      if (kind === "mind") s.minddumps.push({ id: uid(), date: todayStr(), emotion: "", intensity: "", text: v, action: false });
    });
    setQc(""); setFab(false);
  };

  if (!ready) return <div className="min-h-screen grid place-items-center text-ink3">Loading Kaizen…</div>;

  const views: Record<string, JSX.Element> = {
    home: <Home go={setView} trialDaysLeft={trialDaysLeft} onUpgrade={() => setPaywall(true)} />,
    todos: <Todos />, habits: <Habits />, goals: <Goals />, checklists: <Checklists />,
    diary: <Diary />, learnings: <Learnings />, mind: <MindDump />, review: <Review />, help: <Help />,
  };

  return (
    <div className="flex min-h-screen">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* Sidebar */}
      <aside className="w-[236px] shrink-0 bg-surface border-r border-line p-3 sticky top-0 h-screen hidden md:flex flex-col gap-1">
        <div className="flex items-center gap-2.5 px-2.5 pt-1.5 pb-4">
          <div className="w-8 h-8 rounded-[9px] bg-accent text-accentInk grid place-items-center font-extrabold">改</div>
          <div><div className="font-bold">Kaizen</div><div className="text-[11px] text-ink3">Think clearly. Grow daily.</div></div>
        </div>
        {NAV.map(([k, ic, label]) => (
          <button key={k} onClick={() => setView(k)} className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium text-left ${view === k ? "bg-accentSoft text-accent font-semibold" : "text-ink2 hover:bg-surface2"}`}>
            <span className="w-5 text-center">{ic}</span> {label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setView("help")} className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium text-left ${view === "help" ? "bg-accentSoft text-accent" : "text-ink2 hover:bg-surface2"}`}><span className="w-5 text-center">?</span> Help & FAQ</button>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium text-left text-ink2 hover:bg-surface2"><span className="w-5 text-center">⎋</span> Log out</button>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="sticky top-0 z-30 bg-bg/85 backdrop-blur border-b border-line flex items-center gap-3 px-4 md:px-6 py-3">
          <div><h2 className="text-lg font-bold">{TITLES[view][0]}</h2><div className="text-xs text-ink3">{TITLES[view][1]}</div></div>
          <div className="flex-1" />
          <button onClick={() => (entitled ? null : setPaywall(true))} className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full bg-accentSoft text-accent border border-line">
            {paid ? "Pro" : trialDaysLeft > 0 ? `Trial · ${trialDaysLeft} day${trialDaysLeft > 1 ? "s" : ""} left` : "Trial ended · Upgrade"}
          </button>
          <button onClick={() => setTheme(state.theme === "dark" ? "light" : "dark")} className="w-9 h-9 rounded-[10px] border border-line bg-surface grid place-items-center">{state.theme === "dark" ? "☀" : "☾"}</button>
        </div>
        <div className="p-4 md:p-6 max-w-[1080px] w-full mx-auto flex-1 pb-24 md:pb-8">
          {views[view]}
        </div>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-surface border-t border-line flex justify-around px-1 py-1.5" style={{ paddingBottom: "calc(6px + env(safe-area-inset-bottom))" }}>
        {BOTTOM.map(([k, ic, label]) => (
          <button key={k} onClick={() => setView(k)} className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-[10px] font-semibold ${view === k ? "text-accent" : "text-ink3"}`}><span className="text-lg">{ic}</span>{label}</button>
        ))}
      </nav>

      {/* FAB */}
      <button onClick={() => setFab(true)} className="fixed right-4 md:right-6 bottom-[78px] md:bottom-6 w-14 h-14 rounded-full bg-accent text-accentInk text-2xl shadow-lg z-[60]">+</button>

      {fab && (
        <Modal title="Quick capture" onClose={() => setFab(false)}>
          <Textarea placeholder="Capture anything — a task, a thought, a learning…" value={qc} onChange={(e: any) => setQc(e.target.value)} autoFocus />
          <div className="flex gap-2 flex-wrap mt-3">
            <Btn onClick={() => quick("todo")}>✓ To-do</Btn>
            <Btn onClick={() => quick("learning")}>✦ Learning</Btn>
            <Btn onClick={() => quick("mind")}>☁ Mind dump</Btn>
          </div>
        </Modal>
      )}

      {!state.onboarded && <Onboarding />}
      {paywall && <Paywall onClose={() => { setPaywall(false); clearBlocked(); }} onPaid={() => { setPaywall(false); api("/api/auth/me").then((m) => { setMe(m); if (m?.subscription) setEntitled(!!m.subscription.entitled); }); }} />}
    </div>
  );
}
