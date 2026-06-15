"use client";

import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProgressSteps } from "@/components/progress-steps";
import { TopBar } from "@/components/top-bar";

const checklist = [
  "Keep your Figma, portfolio, and reference files ready.",
  "Use one browser tab for the assessment workspace.",
  "Keep the workspace open until you submit the final assessment.",
  "Submit before the timer reaches zero.",
];

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
  sections: BriefSection[];
};

const briefs: Brief[] = [
  {
    number: "1",
    title: "Website Redesign",
    intro: "Choose one page from the Ajaia website and redesign it.",
    sections: [
      {
        heading: "Source website",
        link: { label: "https://ajaia.ai", href: "https://ajaia.ai" },
      },
      {
        heading: "Your task",
        body: "Redesign the page of your choice to significantly improve:",
        items: [
          "Visual quality",
          "Clarity of information",
          "Hierarchy",
          "Conversion potential",
          "Interaction design",
          "Animation / motion behavior",
        ],
      },
      {
        heading: "Requirements",
        items: [
          "A full-page redesign",
          "Responsive consideration",
          "Clear animation and motion direction",
          "A polished visual system appropriate for Ajaia's brand",
          "Modern, production-minded design thinking",
          "Any tool is allowed, including AI-assisted design tools",
        ],
      },
      {
        heading: "What to include",
        items: [
          "The original page you selected",
          "Your redesigned version",
          "A short explanation of why you chose that page",
          "A short explanation of the animation / motion system",
        ],
      },
    ],
  },
  {
    number: "2",
    title: "Product UI Flow",
    intro: "Design a UI flow for the following product concept.",
    sections: [
      {
        heading: "Product brief — AI Translator for Healthcare",
        body: "Real-time, medically accurate translation that improves patient communication and clinical workflows.",
      },
      {
        heading: "Outcome",
        body: "Clear, instant communication that reduces errors and accelerates care.",
      },
      {
        heading: "Top 3 pains solved",
        items: [
          "Misunderstandings that risk incorrect diagnosis or treatment",
          "Delays caused by unavailable interpreters",
          "Compliance risks from using unsecured translation tools",
        ],
      },
      {
        heading: "Core features",
        items: [
          "Real-time audio & text translation",
          "HIPAA-ready, secure architecture",
          "Cross-device access",
          "Multi-language auto-detection",
          "Clinical clarity filters",
          "Workflow-optimized communication",
        ],
      },
      {
        heading: "Your task",
        body: "Create a UI flow for this product. You may define the flow, but it should feel realistic for a healthcare setting — for example:",
        items: [
          "Intake or triage translation",
          "Bedside communication",
          "Telehealth translation",
          "Doctor-patient conversation support",
          "Review / export of translated interaction history",
        ],
      },
      {
        heading: "Requirements",
        items: [
          "Strong UX thinking",
          "Clean information hierarchy",
          "Trust and clarity in a healthcare context",
          "Realistic workflow design",
          "Thoughtful handling of speed, usability, and compliance-sensitive contexts",
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
    title: "LinkedIn Post + Graphic",
    intro:
      "Create one LinkedIn post and one supporting graphic based on any idea, insight, or takeaway from the 2026 AI Reality Check Report.",
    sections: [
      {
        heading: "Source report",
        link: {
          label: "2026 AI Reality Check Report",
          href: "https://ajaia.ai/2026-ai-reality-check-report",
        },
      },
      {
        heading: "Your task",
        body: "Create a LinkedIn post that feels native to Ajaia's style and audience. The post should feel:",
        items: [
          "Credible",
          "Sharp",
          "Practical",
          "Operator-minded",
          "AI-forward",
          "Written for executives, operators, and enterprise teams focused on real implementation",
        ],
      },
      {
        heading: "Supporting graphic",
        body: "The supporting graphic should be visually strong, on-brand, and appropriate for LinkedIn.",
      },
      {
        heading: "What to include",
        items: [
          "The final LinkedIn post copy",
          "The final graphic",
          "A 1–2 sentence note explaining the angle you chose",
        ],
      },
    ],
  },
];

const expectations: BriefSection[] = [
  {
    heading: "AI-native workflow note",
    body: "AI usage is core to this role. Add a short note covering:",
    items: [
      "Which AI tools you used",
      "Where they helped most",
      "How they sped up your process",
      "What you refined by hand",
      "Which decisions were yours",
    ],
  },
  {
    heading: "Walkthrough video",
    body: "Record a short walkthrough (link goes in Task 1):",
    items: [
      "Your approach and time priorities",
      "Why you made your design choices",
      "Your animation approach on the web redesign",
      "Usability in the healthcare flow",
      "Ajaia's brand voice and AI usage",
    ],
  },
  {
    heading: "Deliverables",
    body: "What to hand in by the end of the session:",
    items: [
      "1 redesigned Ajaia website page",
      "1 healthcare translation UI flow",
      "1 LinkedIn post and graphic",
      "1 short AI workflow note",
      "1 walkthrough video link",
    ],
  },
];

export default function AssessmentGuidePage() {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState("Candidate");
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setCandidateName(localStorage.getItem("assessmentCandidateName") || "Candidate");
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  function enterWorkspace() {
    setStartError("");
    setIsStarting(true);

    const sessionId = localStorage.getItem("assessmentSessionId");
    if (!sessionId) {
      setStartError("Your assessment session was not found. Please complete Page 1 again.");
      setIsStarting(false);
      return;
    }

    router.push("/workspace");
  }

  return (
    <>
      <TopBar />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
          <ProgressSteps currentStep="guidance" />

          <header className="card flex flex-col justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center">
            <div>
              <p className="eyebrow">Assessment guide</p>
              <h1 className="title-lg mt-2">Review Your Three Assessments</h1>
              <p className="text-secondary-apple mt-2">{candidateName}</p>
            </div>
          </header>

          <section className="card">
            <div className="card-header">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1d1d1f]">
                <ClipboardList className="h-4 w-4 text-[#86868b]" />
                What you will complete
              </div>
              <p className="text-secondary-apple mt-2">
                Your workspace contains the three required assessments below.
                Your 4-hour timer is already running in the top bar, so read
                each brief carefully before you enter the workspace.
              </p>
            </div>

            <div className="card-body space-y-5">
              {briefs.map((brief) => (
                <article key={brief.number} className="note">
                  <div className="flex gap-4">
                    <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1d1d1f] text-[13px] font-semibold text-white">
                      {brief.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="title-md">{brief.title}</h2>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6e6e73]">
                          Required
                        </span>
                      </div>
                      <p className="text-secondary-apple mt-1">{brief.intro}</p>

                      <div className="mt-4 space-y-4">
                        {brief.sections.map((section) => (
                          <BriefBlock key={section.heading} section={section} />
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1d1d1f]">
              <ShieldCheck className="h-4 w-4 text-[#86868b]" />
              Readiness checklist
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <Sparkles className="h-4 w-4 text-[#86868b]" />
              Expectations &amp; deliverables
            </div>
            <p className="text-secondary-apple mt-2">
              We evaluate how effectively you used AI — not whether you avoided
              it.
            </p>
            <div className="mt-5 grid gap-6 lg:grid-cols-3">
              {expectations.map((section) => (
                <BriefBlock key={section.heading} section={section} dense />
              ))}
            </div>
          </section>

          <section className="card flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1d1d1f]">
                <FileText className="h-4 w-4 text-[#86868b]" />
                Next screen
              </div>
              <p className="text-secondary-apple mt-2">
                Submit each task directly in the workspace using the Figma link,
                file upload, and explanation fields.
              </p>
              {startError ? (
                <p className="mt-3 rounded-xl bg-[#f5f5f7] px-4 py-3 text-[13px] font-medium text-[#d70015]">
                  {startError}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={enterWorkspace}
              disabled={isStarting}
              suppressHydrationWarning
              className="game-button shrink-0"
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  Enter Assessment Workspace
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </section>
        </div>
      </main>
    </>
  );
}

function BriefBlock({
  section,
  dense = false,
}: {
  section: BriefSection;
  dense?: boolean;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-[#1d1d1f]">{section.heading}</p>
      {section.body ? (
        <p className="mt-1 text-sm leading-6 text-[#6e6e73]">{section.body}</p>
      ) : null}
      {section.link ? (
        <a
          href={section.link.href}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex text-[14px] font-medium text-[#1d1d1f] underline underline-offset-4 decoration-[#d2d2d7] transition hover:decoration-[#1d1d1f]"
        >
          {section.link.label}
        </a>
      ) : null}
      {section.items ? (
        <ul
          className={`mt-2 grid gap-1.5 text-sm leading-6 text-[#6e6e73] ${
            dense ? "" : "md:grid-cols-2"
          }`}
        >
          {section.items.map((item) => (
            <li key={item} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d1d1f]" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
