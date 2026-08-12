"use client";
import React from "react";

export const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

export function Card({ children, className = "", ...p }: any) {
  return <div className={cx("bg-surface border border-line rounded-xl2 p-4 shadow-soft", className)} {...p}>{children}</div>;
}

export function Btn({ variant = "default", size = "md", className = "", ...p }: any) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] transition disabled:opacity-50";
  const sizes: any = { md: "px-4 py-2 text-sm", sm: "px-2.5 py-1.5 text-xs rounded-lg" };
  const variants: any = {
    default: "border border-line2 bg-surface text-ink hover:bg-surface2",
    primary: "bg-accent text-accentInk hover:brightness-105 border border-accent",
    ghost: "bg-transparent text-ink2 hover:bg-surface2 border border-transparent",
    danger: "bg-transparent text-danger hover:bg-surface2 border border-transparent",
  };
  return <button className={cx(base, sizes[size], variants[variant], className)} {...p} />;
}

export function Input(p: any) {
  return <input {...p} className={cx("w-full px-3 py-2.5 rounded-[10px] bg-bg border border-line2 text-ink outline-none focus:border-accent", p.className)} />;
}
export function Textarea(p: any) {
  return <textarea {...p} className={cx("w-full px-3 py-2.5 rounded-[10px] bg-bg border border-line2 text-ink outline-none focus:border-accent min-h-[90px] leading-relaxed resize-y", p.className)} />;
}
export function Select({ children, ...p }: any) {
  return <select {...p} className={cx("w-full px-3 py-2.5 rounded-[10px] bg-bg border border-line2 text-ink outline-none focus:border-accent", p.className)}>{children}</select>;
}
export function Label({ children }: any) {
  return <label className="block text-xs font-semibold text-ink2 mb-1.5">{children}</label>;
}
export function Chip({ children, tone = "default" }: any) {
  const tones: any = {
    default: "bg-surface2 text-ink2 border-line",
    accent: "bg-accentSoft text-accent border-line",
    warn: "text-warn border-line",
    danger: "text-danger border-line",
  };
  return <span className={cx("inline-flex items-center text-[11.5px] px-2.5 py-0.5 rounded-full border", tones[tone])}>{children}</span>;
}
export function SectionTitle({ children }: any) {
  return <div className="text-xs font-bold text-ink2 uppercase tracking-wide mb-3">{children}</div>;
}
export function Empty({ icon = "🌱", children }: any) {
  return <div className="text-center py-8 text-ink3"><div className="text-3xl mb-2">{icon}</div>{children}</div>;
}
export function Check({ on, onClick, size = 22 }: any) {
  return (
    <div onClick={onClick} style={{ width: size, height: size }}
      className={cx("shrink-0 grid place-items-center rounded-[7px] border-2 cursor-pointer mt-0.5",
        on ? "bg-accent border-accent text-accentInk" : "border-line2 text-transparent")}>✓</div>
  );
}

export function Modal({ title, children, footer, onClose }: any) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45">
      <div className="bg-surface border border-line rounded-[18px] w-full max-w-[560px] max-h-[88vh] overflow-auto shadow-soft">
        <div className="flex items-center px-4 py-4 border-b border-line sticky top-0 bg-surface"><h3 className="text-[17px] font-bold">{title}</h3></div>
        <div className="p-4">{children}</div>
        {footer && <div className="px-4 py-3.5 border-t border-line flex gap-2 justify-end sticky bottom-0 bg-surface">{footer}</div>}
      </div>
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  return <div className="h-2 rounded-full bg-surface2 overflow-hidden"><div className="h-full bg-accent rounded-full transition-all" style={{ width: `${value}%` }} /></div>;
}
