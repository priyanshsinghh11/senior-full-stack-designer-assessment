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
  const [candidateName] = useState(() => {
    if (typeof window === "undefined") return "Candidate";
    return localStorage.getItem("assessmentCandidateName") || "Candidate";
  });
  const [expiresAt, setExpiresAt] = useState<Date | null>(() => {
    if (typeof window === "undefined") return null;
    const storedExpiry = localStorage.getItem("assessmentExpiresAt");
    return storedExpiry ? new Date(storedExpiry) : null;
  });
  const [now, setNow] = useState(() => new Date());
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");

  useEffect(() => {
    let isActive = true;

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
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <ProgressSteps currentStep="guidance" />

        <header className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Assessment guide
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
              Get Ready Before You Start Working
            </h1>
            <p className="mt-1 text-sm text-slate-500">{candidateName}</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <MonitorPlay className="h-4 w-4 text-slate-500" />
                Guide video
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Watch this short walkthrough before entering the assignment
                workspace. The timer has not started yet.
              </p>
            </div>

            <div className="p-5">
              <div className="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
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
                    <MonitorPlay className="h-10 w-10 text-slate-300" />
                    <div>
                      <p className="text-base font-semibold">
                        Guide video placeholder
                      </p>
                      <p className="mt-1 max-w-md text-sm leading-6 text-slate-300">
                        Add `NEXT_PUBLIC_GUIDE_VIDEO_URL` in `.env.local` with a
                        YouTube, Loom, or Vimeo link to embed the video here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 p-5">
              <div
                className={`flex flex-col justify-between gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center ${
                  isExpired
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock3 className="h-4 w-4" />
                    Assessment timer
                  </div>
                  <p className="mt-1 text-sm opacity-80">
                  The countdown starts only after you click Start Assessment below.
                  </p>
                </div>
                <div className="text-2xl font-semibold tabular-nums">
                  {timeRemaining}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                Readiness checklist
              </div>
              <ul className="mt-4 space-y-3">
                {checklist.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-950">
                <FileText className="h-4 w-4" />
                Next screen
              </div>
              <p className="mt-2 text-sm leading-6 text-blue-950/80">
                The workspace contains three assessment tasks, manual progress
                save, file/link fields, and final submission validation.
              </p>
              {startError ? (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {startError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={startAssessment}
                disabled={isStarting}
                className="game-button mt-4 w-full"
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
