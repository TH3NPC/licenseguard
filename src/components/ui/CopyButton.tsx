"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
  className = "btn btn-secondary btn-sm",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure context) — fail quietly.
    }
  }

  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {copied ? "Copied" : label}
    </button>
  );
}
