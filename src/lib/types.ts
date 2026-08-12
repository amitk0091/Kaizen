export type ID = string;

export interface Todo { id: ID; text: string; done: boolean; priority: "" | "Low" | "Medium" | "High"; when?: string; due?: string; goalId?: string; recurring?: "none" | "daily" | "weekly"; }
export interface ChecklistItem { id: ID; text: string; done: boolean; }
export interface Checklist { id: ID; title: string; items: ChecklistItem[]; }
export interface MindDump { id: ID; date: string; emotion: string; intensity: string; text: string; action: boolean; }
export interface Milestone { id: ID; text: string; done: boolean; }
export interface Goal { id: ID; title: string; metric?: string; target?: string; category?: string; why?: string; obstacle?: string; plan?: string; milestones: Milestone[]; }
export interface Habit { id: ID; name: string; stack?: string; tiny?: string; reward?: string; log: Record<string, boolean>; }
export type FieldType = "text" | "longtext" | "number" | "rating" | "select" | "checkbox";
export interface DiaryField { id: ID; type: FieldType; label: string; options?: string[]; }
export interface DiaryTemplate { version: number; fields: DiaryField[]; }
export interface DiaryEntry { id: ID; date: string; templateVersion: number; values: Record<string, any>; }
export interface Card { id: ID; q: string; a: string; due: string; interval: number; reps: number; }
export interface Learning { id: ID; date: string; topic: string; text: string; cards: Card[]; }

export interface AppState {
  theme: "light" | "dark";
  persona: string | null;
  onboarded: boolean;
  trialStart: string;
  todos: Todo[];
  checklists: Checklist[];
  minddumps: MindDump[];
  goals: Goal[];
  habits: Habit[];
  diaryTemplates: DiaryTemplate[];
  diaryEntries: DiaryEntry[];
  learnings: Learning[];
  lastReviewHtml?: string | null;
  updatedAt: number;
}

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
export const todayStr = () => new Date().toISOString().slice(0, 10);

export function seedTemplate(): DiaryTemplate {
  return {
    version: 1,
    fields: [
      { id: "f_mood", type: "rating", label: "Mood today (1-10)" },
      { id: "f_energy", type: "select", label: "Energy level", options: ["Low", "Medium", "High"] },
      { id: "f_focus", type: "number", label: "Hours of deep focus" },
      { id: "f_top", type: "text", label: "Top priority for today" },
      { id: "f_win", type: "longtext", label: "One win / good thing today" },
      { id: "f_health", type: "checkbox", label: "Did something for my health?" },
    ],
  };
}

export function defaultState(): AppState {
  return {
    theme: "light",
    persona: null,
    onboarded: false,
    trialStart: todayStr(),
    todos: [],
    checklists: [],
    minddumps: [],
    goals: [],
    habits: [],
    diaryTemplates: [seedTemplate()],
    diaryEntries: [],
    learnings: [],
    lastReviewHtml: null,
    updatedAt: Date.now(),
  };
}
