"use client";

import { Clock3, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export function TopBar() {
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let isActive = true;
    const hydrationTimer = window.setTimeout(() => {
      if (!isActive) return;
      const storedExpiry = localStorage.getItem("assessmentExpiresAt");
      if (storedExpiry) {
        setExpiresAt(new Date(storedExpiry));
        setHasStarted(true);
      }
    }, 0);

    async function loadSessionTimer() {
      const sessionId = localStorage.getItem("assessmentSessionId");
      if (!sessionId) return;

      const response = await fetch(
        `/api/assessment-sessions?id=${encodeURIComponent(sessionId)}`,
      );

      if (!isActive || !response.ok) return;

      const data = (await response.json()) as { expires_at?: string | null };

      if (!data.expires_at) return;

      localStorage.setItem("assessmentExpiresAt", data.expires_at);
      setExpiresAt(new Date(data.expires_at));
      setHasStarted(true);
    }

    void loadSessionTimer();

    return () => {
      isActive = false;
      window.clearTimeout(hydrationTimer);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const timeRemaining = useMemo(() => {
    if (!expiresAt) return "4:00:00";

    const diff = Math.max(0, expiresAt.getTime() - now.getTime());
    const hours = Math.floor(diff / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1000);

    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [expiresAt, now]);

  const isExpired = useMemo(() => {
    if (!expiresAt) return false;
    return expiresAt.getTime() <= now.getTime();
  }, [expiresAt, now]);

  return (
    <div
      className="sticky top-0 z-40 border-b"
      style={{
        height: "72px",
        background: "rgba(0, 13, 51, 0.6)",
        borderColor: "var(--line-dark)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/ajaia-logo-white.png"
            alt="Ajaia"
            width={512}
            height={123}
            priority
            className="h-[26px] w-auto"
          />
          <span className="hidden h-5 w-px bg-white/20 sm:block" aria-hidden />
          <span className="mt-0.5 hidden text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--sky-400)] sm:inline">
            Assessment
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-[12px] font-medium text-[var(--sky-100)] sm:inline">
            {isExpired
              ? "Time expired"
              : hasStarted
                ? "Time remaining"
                : "Timer not started"}
          </span>
          <div
            suppressHydrationWarning
            className="mono flex min-h-9 items-center gap-2 px-4 text-[15px] font-medium tabular-nums"
            style={{
              borderRadius: "var(--r-0)",
              border: "1px solid var(--line-dark)",
              background: isExpired
                ? "rgba(192, 52, 29, 0.18)"
                : "rgba(255, 255, 255, 0.05)",
              color: isExpired
                ? "#ffb4a6"
                : hasStarted
                  ? "var(--sky-400)"
                  : "var(--sky-100)",
            }}
          >
            {isExpired ? (
              <LockKeyhole className="h-4 w-4" />
            ) : (
              <Clock3 className="h-4 w-4" />
            )}
            {hasStarted ? timeRemaining : "Not started"}
          </div>
        </div>
      </div>
    </div>
  );
}
