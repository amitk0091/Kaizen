"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Modal, Btn, Card } from "./ui";

declare global { interface Window { Razorpay: any } }

export default function Paywall({ onClose, onPaid }: { onClose: () => void; onPaid: () => void }) {
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const pay = async (plan: "monthly" | "yearly") => {
    setErr(""); setBusy(plan);
    try {
      const order = await api("/api/payments/order", { method: "POST", body: JSON.stringify({ plan }) });
      const rzp = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
        name: "Kaizen", description: plan === "yearly" ? "Pro · Yearly" : "Pro · Monthly",
        theme: { color: "#128a63" },
        handler: async (resp: any) => {
          try { await api("/api/payments/verify", { method: "POST", body: JSON.stringify({ ...resp, plan }) }); onPaid(); }
          catch (e: any) { setErr(e.message); }
        },
        modal: { ondismiss: () => setBusy("") },
      });
      rzp.open();
    } catch (e: any) { setErr(e.message); setBusy(""); }
  };

  return (
    <Modal title="Keep growing with Kaizen Pro" onClose={onClose}>
      <p className="text-sm text-ink3 mb-4">Your trial has ended — your data is safe and always viewable. Unlock creating, editing and your daily AI review.</p>
      <div className="grid gap-3">
        <Card className="flex items-center justify-between"><div><div className="font-semibold">Monthly</div><div className="text-sm text-ink3">Everything, billed monthly</div></div><div className="text-right"><div className="text-lg font-bold">₹49<span className="text-sm text-ink3">/mo</span></div><Btn variant="primary" size="sm" onClick={() => pay("monthly")} disabled={!!busy}>{busy === "monthly" ? "…" : "Choose"}</Btn></div></Card>
        <Card className="flex items-center justify-between border-accent"><div><div className="font-semibold">Yearly <span className="text-accent text-xs">· save ~15%</span></div><div className="text-sm text-ink3">Everything, billed yearly</div></div><div className="text-right"><div className="text-lg font-bold">₹499<span className="text-sm text-ink3">/yr</span></div><Btn variant="primary" size="sm" onClick={() => pay("yearly")} disabled={!!busy}>{busy === "yearly" ? "…" : "Choose"}</Btn></div></Card>
      </div>
      {err && <div className="text-danger text-sm mt-3">{err}</div>}
      <p className="text-[11.5px] text-ink3 mt-4">Secure checkout via Razorpay (UPI, cards, wallets, net-banking). Cancel anytime.</p>
    </Modal>
  );
}
