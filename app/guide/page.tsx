"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LinkIcon,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { ProgressSteps } from "@/components/progress-steps";
import { TopBar } from "@/components/top-bar";

type BriefSection = {
  heading: string;
  body?: string;
  items?: string[];
  link?: { label: string; href: string };
};

type Brief = {
  number: string;
  title: string;
  intro: string;
  summary: string;
  deliverables: string;
  sections: BriefSection[];
};

const briefs: Brief[] = [
  {
    number: "1",
    title: "Website Redesign",
    intro: "Choose one page from the Ajaia website and redesign it.",
    summary:
      "Redesign an Ajaia page with stronger hierarchy, conversion, responsiveness, and motion.",
    deliverables: "Figma/file, explanation, walkthrough",
    sections: [
      {
        heading: "Source website",
        link: { label: "Source: ajaia.ai", href: "https://ajaia.ai" },
      },
      {
        heading: "Your task",
        body: "Redesign the page of your choice to significantly improve visual quality, clarity, hierarchy, conversion, interaction design, and motion behavior.",
      },
      {
        heading: "Requirements",
        items: [
          "A full-page redesign",
          "Responsive desktop and mobile consideration",
          "Clear animation and motion direction",
          "A polished visual system appropriate for Ajaia's brand",
          "Modern, production-minded design thinking",
        ],
      },
      {
        heading: "What to include",
        items: [
          "The original page you selected",
          "Your redesigned version",
          "A short explanation of why you chose that page",
          "A short explanation of the animation and motion system",
        ],
      },
    ],
  },
  {
    number: "2",
    title: "Product UI Flow",
    intro: "Design a UI flow for a healthcare translation product concept.",
    summary:
      "Design a realistic HIPAA-ready healthcare translation flow with key screens and states.",
    deliverables: "Figma/file, journey explanation",
    sections: [
      {
        heading: "Product brief",
        body: "Real-time, medically accurate translation that improves patient communication and clinical workflows.",
      },
      {
        heading: "Outcome",
        body: "Clear, instant communication that reduces errors and accelerates care.",
      },
      {
        heading: "Top pains solved",
        items: [
          "Misunderstandings that risk incorrect diagnosis or treatment",
          "Delays caused by unavailable interpreters",
          "Compliance risks from unsecured translation tools",
        ],
      },
      {
        heading: "Core features",
        items: [
          "Real-time audio and text translation",
          "HIPAA-ready secure architecture",
          "Cross-device access",
          "Multi-language auto-detection",
          "Clinical clarity filters",
          "Workflow-optimized communication",
        ],
      },
      {
        heading: "What to include",
        items: [
          "Key screens for the flow",
          "A brief explanation of the user journey",
          "Important states or interactions",
          "Any assumptions you made",
        ],
      },
    ],
  },
  {
    number: "3",
    title: "LinkedIn Asset",
    intro:
      "Create a LinkedIn post and one supporting graphic from the 2026 AI Reality Check Report.",
    summary:
      "Write a LinkedIn post and create a supporting B2B graphic from the AI Reality Check report.",
    deliverables: "Post copy, graphic file/link",
    sections: [
      {
        heading: "Source report",
        link: {
          label: "Source: 2026 AI Reality Check Report",
          href: "https://ajaia.ai/2026-ai-reality-check-report",
        },
      },
      {
        heading: "Your task",
        body: "Create a LinkedIn post that feels credible, sharp, practical, operator-minded, and AI-forward.",
      },
      {
        heading: "Audience",
        items: [
          "Executives",
          "Operators",
          "Enterprise teams focused on real implementation",
        ],
      },
      {
        heading: "What to include",
        items: [
          "The final LinkedIn post copy",
          "The final graphic",
          "A 1-2 sentence note explaining the angle you chose",
        ],
      },
    ],
  },
];

export default function AssessmentGuidePage() {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState("Candidate");
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setCandidateName(localStorage.getItem("assessmentCandidateName") || "Candidate");
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  async function enterWorkspace() {
    setStartError("");
    setIsStarting(true);

    try {
      const candidateId = localStorage.getItem("assessmentCandidateId");
      if (!candidateId) {
        throw new Error("Candidate information was not found. Please complete Page 1 again.");
      }

      const existingSessionId = localStorage.getItem("assessmentSessionId");
      if (!existingSessionId) {
        const response = await fetch("/api/assessment-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId,
            assessmentName: "Senior Full Stack Designer Assessment",
          }),
        });

        const session = (await response.json()) as {
          id?: string;
          started_at?: string;
          expires_at?: string;
          error?: string;
        };

        if (!response.ok || !session.id || !session.started_at || !session.expires_at) {
          throw new Error(session.error || "Assessment session could not be started.");
        }

        localStorage.setItem("assessmentSessionId", session.id);
        localStorage.setItem("assessmentStartedAt", session.started_at);
        localStorage.setItem("assessmentExpiresAt", session.expires_at);
        localStorage.removeItem("assessmentWorkspaceDraft");
        localStorage.removeItem("assessmentSubmitted");
      }

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
    <>
      <TopBar />
      <main className="px-4 py-8 sm:px-6 lg:pl-[310px] lg:pr-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <ProgressSteps currentStep="guidance" />

          <header className="card">
            <div className="flex flex-col gap-4 border-b border-[var(--line-light)] px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Assessment guide</p>
                <h1 className="title-lg mt-2">
                  Senior Full Stack Designer Assessment
                </h1>
                <p className="text-secondary-apple mt-2">{candidateName}</p>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <span className="inline-flex items-center gap-1.5 bg-[var(--sky-100)] px-3 py-1 text-[12px] font-semibold text-[var(--ink-600)] ring-1 ring-[var(--sky-300)]">
                  <Clock3 className="h-3.5 w-3.5" />
                  Timer starts in workspace
                </span>
                <button
                  type="button"
                  onClick={enterWorkspace}
                  disabled={isStarting}
                  suppressHydrationWarning
                  className="game-button"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      Enter Workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-2">
              <StatusTile label="Briefs reviewed" value={`${activeTab + 1}/3 selected`} />
              <StatusTile label="Timer status" value="Not started" />
            </div>
          </header>

          {startError ? (
            <div className="card px-5 py-4 text-[14px] font-medium text-[var(--danger)]">
              {startError}
            </div>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-3" aria-label="Assessment guide cards">
            {briefs.map((brief, index) => {
              const isActive = activeTab === index;

              return (
                <button
                  key={brief.number}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  suppressHydrationWarning
                  className={`group flex min-h-[220px] flex-col border bg-white p-5 text-left transition-all duration-200 ${
                    isActive
                      ? "border-[var(--ink-900)] shadow-[var(--shadow-2)]"
                      : "border-[var(--line-light)] shadow-[var(--shadow-1)] hover:-translate-y-0.5 hover:border-[var(--sky-400)]"
                  }`}
                  style={{ borderRadius: "var(--r-2)" }}
                  aria-pressed={isActive}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`mono flex h-10 w-10 shrink-0 items-center justify-center ${
                        isActive
                          ? "bg-[var(--ink-900)] text-[var(--sky-400)]"
                          : "bg-[var(--sky-50)] text-[var(--ink-900)]"
                      }`}
                    >
                      {brief.number}
                    </span>
                    <span className="bg-[var(--sky-100)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-600)]">
                      Required
                    </span>
                  </div>

                  <h2 className="title-md mt-5">{brief.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                    {brief.summary}
                  </p>
                  <div className="mt-auto pt-5">
                    <p className="eyebrow">Deliverables</p>
                    <p className="mt-1 text-[13px] font-medium text-[var(--ink-900)]">
                      {brief.deliverables}
                    </p>
                  </div>
                </button>
              );
            })}
          </section>

          <div className="card flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Selected assessment</p>
              <p className="mt-1 text-[16px] font-semibold text-[var(--ink-900)]">
                {briefs[activeTab].number}. {briefs[activeTab].title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab((tab) => Math.max(0, tab - 1))}
                disabled={activeTab === 0}
                suppressHydrationWarning
                className="game-button-secondary min-h-10 px-3"
                aria-label="Previous assessment"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="mono min-w-14 text-center text-[var(--ink-900)]">
                {activeTab + 1}/3
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveTab((tab) => Math.min(briefs.length - 1, tab + 1))
                }
                disabled={activeTab === briefs.length - 1}
                suppressHydrationWarning
                className="game-button-secondary min-h-10 px-3"
                aria-label="Next assessment"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <GuideCard
            number={briefs[activeTab].number}
            title={briefs[activeTab].title}
            objective={briefs[activeTab].intro}
          >
            <div className="grid content-start gap-4 lg:h-[400px] lg:grid-cols-2 lg:overflow-y-auto lg:pr-1">
              {briefs[activeTab].sections.map((section) => (
                <BriefBlock key={section.heading} section={section} />
              ))}
            </div>
          </GuideCard>

          <div className="mt-0 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveTab((tab) => Math.max(0, tab - 1))}
              disabled={activeTab === 0}
              suppressHydrationWarning
              className="game-button-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            {activeTab < briefs.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setActiveTab((tab) => Math.min(briefs.length - 1, tab + 1))
                }
                suppressHydrationWarning
                className="game-button"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[var(--sky-100)] px-3 py-1 text-[12px] font-semibold text-[var(--ink-600)] ring-1 ring-[var(--sky-300)]">
                  <Clock3 className="h-3.5 w-3.5" />
                  Timer starts in workspace
                </span>
                <button
                  type="button"
                  onClick={enterWorkspace}
                  disabled={isStarting}
                  suppressHydrationWarning
                  className="game-button"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      Enter Workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function BriefBlock({ section }: { section: BriefSection }) {
  return (
    <div className="note">
      <p className="eyebrow">{section.heading}</p>
      {section.body ? (
        <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{section.body}</p>
      ) : null}
      {section.link ? (
        <a
          href={section.link.href}
          target="_blank"
          rel="noreferrer"
          className="source-link mt-3"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          {section.link.label}
          <span className="source-link-arrow" aria-hidden>↗</span>
        </a>
      ) : null}
      {section.items ? (
        <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-[var(--ink-muted)]">
          {section.items.map((item) => (
            <li key={item} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-900)]" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function GuideCard({
  number,
  title,
  objective,
  children,
}: {
  number: string;
  title: string;
  objective: string;
  children: ReactNode;
}) {
  return (
    <article className="card scroll-mt-6">
      <div className="flex flex-col gap-3 border-b border-[var(--line-light)] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="mono mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--ink-900)] text-[14px] font-medium text-[var(--sky-400)]">
            {number}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="title-md">{title}</h2>
              <span className="bg-[var(--sky-100)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-600)]">
                Required
              </span>
            </div>
            <p className="text-secondary-apple mt-1">{objective}</p>
          </div>
        </div>
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </article>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 rounded-[10px] border border-[var(--line-light)] bg-[var(--sky-50)] px-4 py-3">
      <div>
        <p className="eyebrow">{label}</p>
        <p className="mono mt-1 text-[15px] text-[var(--ink-900)]">{value}</p>
      </div>
      <CheckCircle2 className="h-4 w-4 text-[var(--sky-500)]" />
    </div>
  );
}
