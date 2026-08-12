"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Btn, Input, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(""); setBusy(true);
    try {
      await api(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify({ email, password }) });
      router.replace("/app"); // session cookie lasts 30 days — no repeated logins
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") submit(); };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 rounded-[11px] bg-accent text-accentInk grid place-items-center font-extrabold text-xl">改</div>
          <div><div className="text-xl font-bold">Kaizen</div><div className="text-xs text-ink3">Think clearly. Grow daily.</div></div>
        </div>
        <Card className="p-6">
          <div className="flex gap-1 p-1 bg-surface2 rounded-[10px] mb-5">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode === m ? "bg-surface text-ink shadow-soft" : "text-ink3"}`}>
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <Input type="email" placeholder="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} onKeyDown={onKey} autoFocus />
            <Input type="password" placeholder="Password" value={password} onChange={(e: any) => setPassword(e.target.value)} onKeyDown={onKey} />
            {err && <div className="text-danger text-sm">{err}</div>}
            <Btn variant="primary" className="w-full" onClick={submit} disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </Btn>
          </div>
          <p className="text-[11.5px] text-ink3 mt-4 text-center">
            {mode === "signup" ? "Start your 3-day free trial — no card required." : "You'll stay logged in for 30 days."}
          </p>
        </Card>
        <p className="text-[11px] text-ink3 mt-4 text-center">Kaizen is a self-improvement tool, not medical or professional advice.</p>
      </div>
    </div>
  );
}
