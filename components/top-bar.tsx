"use client";

import { Clock3, LockKeyhole } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

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

      const { data, error } = await getSupabaseClient()
        .from("assessment_sessions")
        .select("expires_at")
        .eq("id", sessionId)
        .single();

      if (!isActive || error || !data?.expires_at) return;

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
    <div className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1d1d1f] text-[13px] font-bold text-white">
            A
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">
            Ajaia Assessment
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden text-[12px] font-medium text-[#86868b] sm:inline">
            {isExpired
              ? "Time expired"
              : hasStarted
                ? "Time remaining"
                : "Timer not started"}
          </span>
          <div
            suppressHydrationWarning
            className={`flex min-h-9 items-center gap-2 rounded-xl px-4 text-[15px] font-semibold tabular-nums transition-colors ${
              isExpired
                ? "bg-[#fff0f0] text-[#d70015]"
                : hasStarted
                  ? "bg-[#f5f5f7] text-[#1d1d1f]"
                  : "bg-[#f5f5f7] text-[#86868b]"
            }`}
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
