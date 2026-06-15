"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MonitorPlay,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProgressSteps } from "@/components/progress-steps";
import { getSupabaseClient } from "@/lib/supabase";

const guideVideoUrl = process.env.NEXT_PUBLIC_GUIDE_VIDEO_URL || "";

const checklist = [
  "Keep your Figma, portfolio, and reference files ready.",
  "Use one browser tab for the assessment workspace.",
  "Save progress before switching networks or devices.",
  "Submit before the timer reaches zero.",
];

export default function AssessmentGuidePage() {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState("Candidate");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");

  useEffect(() => {
    let isActive = true;
    const hydrationTimer = window.setTimeout(() => {
      if (!isActive) return;
      setCandidateName(localStorage.getItem("assessmentCandidateName") || "Candidate");

      const storedExpiry = localStorage.getItem("assessmentExpiresAt");
      if (storedExpiry) {
        setExpiresAt(new Date(storedExpiry));
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

  const embedUrl = getEmbeddableVideoUrl(guideVideoUrl);

  async function startAssessment() {
    setStartError("");
    setIsStarting(true);

    try {
      const candidateId = localStorage.getItem("assessmentCandidateId");

      if (!candidateId) {
        throw new Error("Candidate information was not found. Please complete Page 1 again.");
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const { data: session, error } = await getSupabaseClient()
        .from("assessment_sessions")
        .insert({
          candidate_id: candidateId,
          assessment_name: "Senior Full Stack Designer Assessment",
          status: "started",
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      localStorage.setItem("assessmentSessionId", session.id);
      localStorage.setItem("assessmentStartedAt", now.toISOString());
      localStorage.setItem("assessmentExpiresAt", expiresAt.toISOString());
      localStorage.removeItem("assessmentWorkspaceDraft");
      localStorage.removeItem("assessmentSubmitted");
      router.push("/workspace");
    } catch (error) {
      setStartError(
        error instanceof Error
          ? error.message
          : "Something went wrong while starting the assessment.",
      );
      setIsStarting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <ProgressSteps currentStep="guidance" />

        <header className="card flex flex-col justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">Assessment guide</p>
            <h1 className="title-lg mt-2">
              Get Ready Before You Start Working
            </h1>
            <p className="text-secondary-apple mt-2">{candidateName}</p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="card">
            <div className="card-header">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1d1d1f]">
                <MonitorPlay className="h-4 w-4 text-[#86868b]" />
                Guide video
              </div>
              <p className="text-secondary-apple mt-2">
                Watch this short walkthrough before entering the assignment
                workspace. The timer has not started yet.
              </p>
            </div>

            <div className="card-body">
              <div className="aspect-video overflow-hidden rounded-xl bg-[#1d1d1f]">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title="Assessment guide video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
                    <MonitorPlay className="h-10 w-10 text-white/60" />
                    <div>
                      <p className="text-[15px] font-semibold">
                        Guide video placeholder
                      </p>
                      <p className="mt-1 max-w-md text-sm leading-6 text-white/60">
                        Add `NEXT_PUBLIC_GUIDE_VIDEO_URL` in `.env.local` with a
                        YouTube, Loom, or Vimeo link to embed the video here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-black/[0.06] p-6">
              <div
                className={`flex flex-col justify-between gap-3 rounded-xl bg-[#f5f5f7] px-5 py-4 sm:flex-row sm:items-center ${
                  isExpired ? "text-[#d70015]" : "text-[#1d1d1f]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-semibold">
                    <Clock3 className="h-4 w-4" />
                    Assessment timer
                  </div>
                  <p className="mt-1 text-[13px] text-[#6e6e73]">
                  The countdown starts only after you click Start Assessment below.
                  </p>
                </div>
                <div className="text-[28px] font-semibold tabular-nums tracking-[-0.02em]">
                  {timeRemaining}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="card p-6">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1d1d1f]">
                <ShieldCheck className="h-4 w-4 text-[#86868b]" />
                Readiness checklist
              </div>
              <ul className="mt-4 space-y-3">
                {checklist.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-[#6e6e73]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d1d1f]" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-6">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1d1d1f]">
                <FileText className="h-4 w-4 text-[#86868b]" />
                Next screen
              </div>
              <p className="text-secondary-apple mt-2">
                The workspace contains three assessment tasks, manual progress
                save, file/link fields, and final submission validation.
              </p>
              {startError ? (
                <p className="mt-3 rounded-xl bg-[#f5f5f7] px-4 py-3 text-[13px] font-medium text-[#d70015]">
                  {startError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={startAssessment}
                disabled={isStarting}
                suppressHydrationWarning
                className="game-button mt-5 w-full"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Assessment
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function getEmbeddableVideoUrl(value: string) {
  if (!value) return "";

  try {
    const url = new URL(value);

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : value;
    }

    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : value;
    }

    if (url.hostname.includes("vimeo.com")) {
      const videoId = url.pathname.split("/").filter(Boolean).at(0);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : value;
    }

    return value;
  } catch {
    return "";
  }
}
