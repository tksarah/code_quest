import Link from "next/link";
import type { HTMLAttributeAnchorTarget, ReactNode } from "react";

export function RpgWindow({
  children,
  title,
  className = ""
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <section className={`rpg-window ${className}`}>
      {title ? <h2 className="rpg-caption">{title}</h2> : null}
      {children}
    </section>
  );
}

export function RpgButton({
  children,
  className = "",
  disabled = false,
  type = "submit"
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button className={`rpg-button ${className}`} disabled={disabled} type={type}>
      {children}
    </button>
  );
}

export function RpgLink({
  href,
  children,
  className = "",
  rel,
  target
}: {
  href: string;
  children: ReactNode;
  className?: string;
  rel?: string;
  target?: HTMLAttributeAnchorTarget;
}) {
  return (
    <Link className={`rpg-button inline-flex ${className}`} href={href} rel={rel} target={target}>
      {children}
    </Link>
  );
}

export function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-200">
      <span className="font-bold text-white">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`rpg-input ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`rpg-input min-h-28 ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`rpg-input ${props.className ?? ""}`} />;
}
