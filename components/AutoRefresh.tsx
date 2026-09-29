"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 60_000;

/**
 * Silently re-fetches the dashboard on a timer by asking Next.js to re-run the
 * server component (the page is `force-dynamic` / `no-store`, so this always
 * pulls a fresh read from the automation pipeline). Pauses while the tab isn't
 * visible so it doesn't do pointless work in a background tab.
 */
export default function AutoRefresh() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function tick() {
      if (document.visibilityState !== "visible") return;
      setRefreshing(true);
      router.refresh();
    }

    function start() {
      if (timerRef.current) return;
      timerRef.current = setInterval(tick, INTERVAL_MS);
    }

    function stop() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    if (enabled) {
      start();
    } else {
      stop();
    }

    function onVisibilityChange() {
      // Catch up immediately if the tab was hidden through a refresh cycle.
      if (enabled && document.visibilityState === "visible") tick();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, router]);

  // router.refresh() re-renders the server component; once the new props land
  // this component re-runs, which is as good a signal as any that the fetch resolved.
  useEffect(() => {
    setRefreshing(false);
  });

  return (
    <button
      type="button"
      onClick={() => setEnabled((v) => !v)}
      title={enabled ? "Auto-refreshing every 60s — click to pause" : "Auto-refresh paused — click to resume"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "var(--surface-sunken)",
        color: enabled ? "var(--status-good)" : "var(--text-muted)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: enabled ? "var(--status-good)" : "var(--text-muted)",
          animation: enabled && refreshing ? "auto-refresh-pulse 0.9s ease-in-out infinite" : "none",
        }}
      />
      {enabled ? "Live" : "Paused"}
      <style>{`
        @keyframes auto-refresh-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </button>
  );
}
