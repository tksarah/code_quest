"use client";

import { useEffect, useState } from "react";

export function CopyJoinCodeButton({ joinCode }: { joinCode: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timerId = window.setTimeout(() => setStatus("idle"), 1800);
    return () => window.clearTimeout(timerId);
  }, [status]);

  async function copyJoinCode() {
    try {
      await navigator.clipboard.writeText(joinCode);
      setStatus("copied");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = joinCode;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      setStatus(copied ? "copied" : "failed");
    }
  }

  const suffix =
    status === "copied" ? "コピー済み" : status === "failed" ? "コピー不可" : "クリックでコピー";

  return (
    <button
      aria-label={`参加コード ${joinCode} をコピー`}
      className="admin-copy-code"
      onClick={copyJoinCode}
      type="button"
    >
      <span className="admin-copy-code-value">{joinCode}</span>
      <span className="admin-copy-code-status">{suffix}</span>
    </button>
  );
}
