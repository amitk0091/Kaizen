"use client";
import { useStore } from "@/store/useStore";
import { uid } from "@/lib/types";
import { Modal, Btn } from "./ui";

const PERSONAS: [string, string][] = [["School student", "📚"], ["Govt-exam aspirant", "🏛️"], ["CA / pro-exam", "🧮"], ["Engineer / developer", "💻"], ["Business owner", "📈"], ["General", "🌱"]];
const SEEDS: Record<string, [string, string]> = {
  "School student": ["Improve this term's grades", "Revise 10 flashcards"],
  "Govt-exam aspirant": ["Complete the full syllabus once", "Study 1 focused hour"],
  "CA / pro-exam": ["Clear next exam group", "Practice 5 problems"],
  "Engineer / developer": ["Ship my side project", "Write today's TIL"],
  "Business owner": ["Grow monthly revenue", "Plan top 3 priorities"],
  "General": ["Build one better daily habit", "5-minute reflection"],
};

export default function Onboarding() {
  const { mutate } = useStore();
  const finish = (persona: string) => {
    const sd = SEEDS[persona] || SEEDS["General"];
    mutate((s) => {
      s.persona = persona; s.onboarded = true;
      s.goals.push({ id: uid(), title: sd[0], metric: "", target: "", category: "Personal", why: "", obstacle: "", plan: "", milestones: [] });
      s.habits.push({ id: uid(), name: sd[1], stack: "", tiny: "", reward: "", log: {} });
    });
  };
  return (
    <Modal title="Welcome to Kaizen 改" onClose={() => finish("General")}>
      <p className="text-sm text-ink3 mt-0 mb-4">Think clearly. Grow daily. Pick what best describes you — we'll tailor your starter setup. You're on a <b>3-day free trial</b> with everything unlocked.</p>
      <div className="grid grid-cols-2 gap-3">
        {PERSONAS.map(([name, icon]) => (
          <button key={name} onClick={() => finish(name)} className="p-4 rounded-xl border border-line2 bg-surface hover:bg-surface2 flex flex-col items-center">
            <div className="text-2xl">{icon}</div><div className="mt-1.5 text-sm font-medium">{name}</div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
