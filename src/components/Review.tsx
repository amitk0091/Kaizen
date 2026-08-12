"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/lib/api";
import { Btn, Card } from "./ui";

export default function Review() {
  const { state, mutate, push } = useStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const run = async () => {
    setErr(""); setBusy(true);
    try {
      await push(); // make sure the server has the latest data first
      const { html } = await api("/api/ai/review", { method: "POST" });
      mutate((s) => { s.lastReviewHtml = html; });
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <Card className="text-center py-8">
        <div className="text-4xl">✧</div>
        <h3 className="text-xl font-bold mt-2.5 mb-1.5">Your AI reflection coach</h3>
        <p className="text-ink2 max-w-[460px] mx-auto mb-4">It reads your goals, diary, learnings, habits and feelings to tell you honestly what's going right, what's going wrong, and one or two small ways to improve. One review per day.</p>
        <Btn variant="primary" onClick={run} disabled={busy}>{busy ? "Thinking…" : "Generate today's review"}</Btn>
        {err && <div className="text-danger text-sm mt-3">{err}</div>}
        <div className="text-[11.5px] text-ink3 max-w-[520px] mx-auto mt-4 text-left border-t border-line pt-3">Reflection grounded only in your own entries — <b>not</b> professional, medical, or financial advice. Powered by Gemini / Grok with your consent; falls back to an on-device summary if AI is unavailable.</div>
      </Card>
      {state.lastReviewHtml && (
        <Card className="mt-4">
          <div dangerouslySetInnerHTML={{ __html: state.lastReviewHtml }} />
        </Card>
      )}
    </div>
  );
}
