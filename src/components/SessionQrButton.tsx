"use client";

import QRCode from "qrcode";
import { useEffect, useId, useState } from "react";

type CopyStatus = "idle" | "copied" | "failed";

function toAbsoluteUrl(value: string): string {
  try {
    return new URL(value).toString();
  } catch {
    if (typeof window === "undefined") return value;
    return new URL(value, window.location.origin).toString();
  }
}

export function SessionQrButton({
  joinCode,
  joinUrl,
  sessionTitle
}: {
  joinCode: string;
  joinUrl: string;
  sessionTitle: string;
}) {
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [resolvedJoinUrl, setResolvedJoinUrl] = useState(joinUrl);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const absoluteJoinUrl = toAbsoluteUrl(joinUrl);
    setResolvedJoinUrl(absoluteJoinUrl);
    setQrDataUrl(null);
    setError(null);

    QRCode.toDataURL(absoluteJoinUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
      color: {
        dark: "#172033",
        light: "#ffffff"
      }
    })
      .then((dataUrl) => {
        if (!isCancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!isCancelled) setError("QRコードを生成できませんでした。");
      });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      isCancelled = true;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, joinUrl]);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timerId = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timerId);
  }, [copyStatus]);

  async function copyJoinUrl() {
    try {
      await navigator.clipboard.writeText(resolvedJoinUrl);
      setCopyStatus("copied");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = resolvedJoinUrl;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      setCopyStatus(copied ? "copied" : "failed");
    }
  }

  return (
    <>
      <button
        aria-label={`${sessionTitle} の参加QRコードを表示`}
        className="admin-qr-button"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        QR
      </button>

      {isOpen ? (
        <div
          className="admin-qr-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
          role="presentation"
        >
          <section
            aria-labelledby={titleId}
            aria-modal="true"
            className="admin-qr-modal"
            role="dialog"
          >
            <div className="admin-qr-modal-header">
              <div>
                <p className="admin-qr-kicker">参加QR</p>
                <h3 id={titleId}>{sessionTitle}</h3>
              </div>
              <button
                aria-label="QRコードを閉じる"
                className="admin-qr-close"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="admin-qr-code-frame">
              {qrDataUrl ? (
                <img alt={`${sessionTitle} の参加QRコード`} height={280} src={qrDataUrl} width={280} />
              ) : error ? (
                <p className="admin-qr-status">{error}</p>
              ) : (
                <p className="admin-qr-status">QRコードを生成中...</p>
              )}
            </div>

            <dl className="admin-qr-details">
              <div>
                <dt>参加コード</dt>
                <dd>{joinCode}</dd>
              </div>
              <div>
                <dt>参加URL</dt>
                <dd>{resolvedJoinUrl}</dd>
              </div>
            </dl>

            <button className="admin-qr-copy" onClick={copyJoinUrl} type="button">
              {copyStatus === "copied"
                ? "コピーしました"
                : copyStatus === "failed"
                  ? "コピーできませんでした"
                  : "参加URLをコピー"}
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
