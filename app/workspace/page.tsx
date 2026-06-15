"use client";

import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Italic,
  LinkIcon,
  List,
  LockKeyhole,
  Send,
  Type,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { ExplainerVideo } from "@/components/explainer-video";
import { ProgressSteps } from "@/components/progress-steps";
import { TopBar } from "@/components/top-bar";

const taskVideos = {
  website: process.env.NEXT_PUBLIC_TASK1_VIDEO_URL || "",
  healthcare: process.env.NEXT_PUBLIC_TASK2_VIDEO_URL || "",
  linkedin: process.env.NEXT_PUBLIC_TASK3_VIDEO_URL || "",
};

type WorkspaceDraft = {
  websiteFigmaLink: string;
  websiteFileName: string;
  websiteExplanation: string;
  healthcareFigmaLink: string;
  healthcareFileName: string;
  healthcareExplanation: string;
  linkedinPost: string;
  marketingFileName: string;
  marketingFigmaLink: string;
  videoUrl: string;
};

const emptyDraft: WorkspaceDraft = {
  websiteFigmaLink: "",
  websiteFileName: "",
  websiteExplanation: "",
  healthcareFigmaLink: "",
  healthcareFileName: "",
  healthcareExplanation: "",
  linkedinPost: "",
  marketingFileName: "",
  marketingFigmaLink: "",
  videoUrl: "",
};

const submittedKey = "assessmentSubmitted";
const acceptedDesignFiles = ".pdf,.png,.jpg,.jpeg";
const acceptedVideoHosts = ["loom.com", "youtube.com", "youtu.be", "vimeo.com"];

export default function WorkspacePage() {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState("Candidate");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [draft, setDraft] = useState<WorkspaceDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState(0);
  useEffect(() => {
    let isActive = true;
    const hydrationTimer = window.setTimeout(() => {
      if (!isActive) return;
      setCandidateName(localStorage.getItem("assessmentCandidateName") || "Candidate");
      setIsSubmitted(localStorage.getItem(submittedKey) === "true");

      const storedExpiry = localStorage.getItem("assessmentExpiresAt");
      if (storedExpiry) {
        setExpiresAt(new Date(storedExpiry));
      }
    }, 0);

    async function loadSessionTimer() {
      const sessionId = localStorage.getItem("assessmentSessionId");
      if (!sessionId) return;

      const response = await fetch(
        `/api/assessment-sessions?id=${encodeURIComponent(sessionId)}`,
      );

      if (!isActive || !response.ok) return;

      const data = (await response.json()) as {
        started_at?: string | null;
        expires_at?: string | null;
      };

      if (data.started_at) {
        localStorage.setItem("assessmentStartedAt", data.started_at);
      }

      if (data.expires_at) {
        localStorage.setItem("assessmentExpiresAt", data.expires_at);
        setExpiresAt(new Date(data.expires_at));
      }
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

  const isExpired = useMemo(() => {
    if (!expiresAt) return false;
    return expiresAt.getTime() <= now.getTime();
  }, [expiresAt, now]);

  const workspaceLocked = isSubmitted || isExpired;

  const completedRequired = useMemo(() => {
    let completed = 0;
    if (
      (draft.websiteFigmaLink || draft.websiteFileName) &&
      draft.websiteExplanation &&
      draft.videoUrl
    ) {
      completed += 1;
    }
    if ((draft.healthcareFigmaLink || draft.healthcareFileName) && draft.healthcareExplanation) completed += 1;
    if (
      draft.linkedinPost.trim() &&
      (draft.marketingFileName || draft.marketingFigmaLink)
    ) {
      completed += 1;
    }
    return completed;
  }, [draft]);

  const task1Done = Boolean(
    (draft.websiteFigmaLink || draft.websiteFileName) &&
      draft.websiteExplanation &&
      draft.videoUrl,
  );
  const task2Done = Boolean(
    (draft.healthcareFigmaLink || draft.healthcareFileName) &&
      draft.healthcareExplanation,
  );
  const task3Done = Boolean(
    draft.linkedinPost.trim() &&
      (draft.marketingFileName || draft.marketingFigmaLink),
  );
  const tabs = [
    {
      n: "1",
      label: "Website Redesign",
      done: task1Done,
      summary:
        "Redesign an Ajaia page with stronger hierarchy, conversion, responsiveness, and motion.",
      deliverables: "Figma/file, explanation, walkthrough",
    },
    {
      n: "2",
      label: "Product UI Flow",
      done: task2Done,
      summary:
        "Design a realistic HIPAA-ready healthcare translation flow with key screens and states.",
      deliverables: "Figma/file, journey explanation",
    },
    {
      n: "3",
      label: "LinkedIn Asset",
      done: task3Done,
      summary:
        "Write a LinkedIn post and create a supporting B2B graphic from the AI Reality Check report.",
      deliverables: "Post copy, graphic file/link",
    },
  ];

  function updateDraft(field: keyof WorkspaceDraft, value: string) {
    if (workspaceLocked) return;
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === "marketingFileName") {
        delete next.marketingFigmaLink;
      }
      return next;
    });
  }

  function handleFile(field: keyof WorkspaceDraft, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    updateDraft(field, file.name);
  }

  function insertFormatting(prefix: string, suffix = prefix) {
    const next = `${draft.linkedinPost}${draft.linkedinPost ? "\n" : ""}${prefix}selected text${suffix}`;
    updateDraft("linkedinPost", next);
  }

  function validateSubmission() {
    const nextErrors: Record<string, string> = {};

    if (!draft.websiteFigmaLink && !draft.websiteFileName) {
      nextErrors.websiteFigmaLink =
        "Add your AJAIA redesign Figma link or upload a design file.";
    }
    if (!draft.websiteExplanation.trim()) {
      nextErrors.websiteExplanation =
        "Explain layout, hierarchy, conversion, responsiveness, and animations.";
    }
    if (!draft.videoUrl.trim()) {
      nextErrors.videoUrl = "Add a short screen walkthrough URL showing the motion.";
    } else if (!isAcceptedVideoUrl(draft.videoUrl)) {
      nextErrors.videoUrl = "Use a Loom, YouTube, or Vimeo URL.";
    }
    if (!draft.healthcareFigmaLink && !draft.healthcareFileName) {
      nextErrors.healthcareFigmaLink =
        "Add your healthcare translation app journey/screens Figma link or upload a design file.";
    }
    if (!draft.healthcareExplanation.trim()) {
      nextErrors.healthcareExplanation =
        "Explain the user journey, key screens, real-time translation flow, and HIPAA-ready design decisions.";
    }
    if (!draft.linkedinPost.trim()) {
      nextErrors.linkedinPost = "Write the LinkedIn post.";
    }
    if (!draft.marketingFileName && !draft.marketingFigmaLink) {
      nextErrors.marketingFigmaLink =
        "Upload the supporting B2B graphic or paste a Figma link.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitAssessment() {
    if (isExpired) {
      setSubmitMessage("The assessment timer has expired. Submissions are locked.");
      return;
    }
    if (isSubmittingAssessment) return;

    setSubmitMessage("");
    if (!validateSubmission()) {
      setSubmitMessage("Complete the required sections before submitting.");
      if (!task1Done) setActiveTab(0);
      else if (!task2Done) setActiveTab(1);
      else if (!task3Done) setActiveTab(2);
      return;
    }

    setIsSubmittingAssessment(true);

    try {
      const candidateId = localStorage.getItem("assessmentCandidateId");
      const sessionId = localStorage.getItem("assessmentSessionId");

      if (!candidateId || !sessionId) {
        throw new Error("Candidate or assessment session was not found. Please start again.");
      }

      const response = await fetch("/api/assessment-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, sessionId, draft }),
      });

      const submission = (await response.json()) as {
        submitted_at?: string;
        error?: string;
      };

      if (!response.ok || !submission.submitted_at) {
        throw new Error(submission.error || "Assessment could not be submitted.");
      }

      localStorage.setItem(submittedKey, "true");
      localStorage.setItem("assessmentSubmittedAt", submission.submitted_at);
      setIsSubmitted(true);
      setSubmitMessage("Assessment submitted successfully.");
      setShowSubmitModal(true);
    } catch (error) {
      setSubmitMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting the assessment.",
      );
    } finally {
      setIsSubmittingAssessment(false);
    }
  }

  return (
    <>
      <TopBar />
      <main className="px-4 py-8 sm:px-6 lg:pl-[310px] lg:pr-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <ProgressSteps currentStep="assessment" />

          <header className="card">
            <div className="flex flex-col gap-4 border-b border-[var(--line-light)] px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Assessment workspace</p>
                <h1 className="title-lg mt-2">
                  Senior Full Stack Designer Assessment
                </h1>
                <p className="text-secondary-apple mt-2">{candidateName}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={submitAssessment}
                  disabled={workspaceLocked || isSubmittingAssessment}
                  suppressHydrationWarning
                  className="game-button"
                >
                  {workspaceLocked ? <LockKeyhole className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  {isSubmitted
                    ? "Submitted"
                    : isExpired
                      ? "Expired"
                      : isSubmittingAssessment
                        ? "Submitting..."
                        : "Submit Assessment"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-2">
              <StatusTile label="Required completed" value={`${completedRequired}/3`} />
              <StatusTile
                label="Review status"
                value={isSubmitted ? "Locked" : isExpired ? "Expired" : "In progress"}
              />
            </div>
          </header>

          {isExpired && !isSubmitted ? (
            <div className="card px-5 py-4 text-[14px] font-medium text-[var(--danger)]">
              The 4-hour timer has expired. The workspace is now locked.
            </div>
          ) : null}

          {submitMessage ? (
            <div className="card px-5 py-4 text-[14px] font-medium text-[var(--ink-900)]">
              {submitMessage}
            </div>
          ) : null}

          {/* Task switcher â€” one task at a time */}
          <div className="card flex gap-1.5 overflow-x-auto p-1.5">
            {tabs.map((tab, index) => {
              const isActive = activeTab === index;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  suppressHydrationWarning
                  className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                    isActive
                      ? "bg-[var(--ink-900)] text-white"
                      : "text-[var(--ink-muted)] hover:bg-[var(--sky-50)]"
                  }`}
                >
                  <span className="mono flex h-5 w-5 items-center justify-center text-[11px]">
                    {tab.done ? (
                      <Check className="h-4 w-4 text-[var(--sky-500)]" strokeWidth={3} />
                    ) : (
                      <span className={isActive ? "text-[var(--sky-400)]" : "text-[var(--ink-faint)]"}>
                        {tab.n}
                      </span>
                    )}
                  </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <section>
            {activeTab === 0 ? (
              <TaskCard
                id="task-1"
                number="1"
                title="Website Redesign"
                objective="Redesign one Ajaia page for stronger hierarchy, conversion, and motion."
                required
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
                  <div className="lg:w-[420px] lg:shrink-0">
                    <ExplainerVideo url={taskVideos.website} />
                  </div>
                  <div className="note flex flex-1 flex-col">
                    <p className="eyebrow">About this task</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                      Redesign one Ajaia page end to end: sharpen layout,
                      hierarchy, and the conversion path. Show desktop + mobile,
                      and note your motion direction.
                    </p>
                    <a
                      href="https://ajaia.ai/"
                      target="_blank"
                      rel="noreferrer"
                      className="source-link mt-auto"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Source: ajaia.ai
                      <span className="source-link-arrow" aria-hidden>↗</span>
                    </a>
                  </div>
                </div>
                <SubmissionFields
                  figmaLabel="Figma link"
                  figmaValue={draft.websiteFigmaLink}
                  fileName={draft.websiteFileName}
                  explanationValue={draft.websiteExplanation}
                  figmaError={errors.websiteFigmaLink}
                  explanationError={errors.websiteExplanation}
                  onFigmaChange={(value) => updateDraft("websiteFigmaLink", value)}
                  onFileChange={(event) => handleFile("websiteFileName", event)}
                  onExplanationChange={(value) => updateDraft("websiteExplanation", value)}
                  disabled={workspaceLocked}
                />
                <Field
                  label="Walkthrough video URL"
                  error={errors.videoUrl}
                  hint="Loom, YouTube, or Vimeo."
                >
                  <input
                    value={draft.videoUrl}
                    onChange={(event) => updateDraft("videoUrl", event.target.value)}
                    disabled={workspaceLocked}
                    suppressHydrationWarning
                    className="field-input"
                    placeholder="https://www.loom.com/share/..."
                  />
                </Field>
              </TaskCard>
            ) : null}

            {activeTab === 1 ? (
              <TaskCard
                id="task-2"
                number="2"
                title="Product UI Flow"
                objective="Design a HIPAA-ready healthcare translation flow."
                required
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
                  <div className="lg:w-[420px] lg:shrink-0">
                    <ExplainerVideo url={taskVideos.healthcare} />
                  </div>
                  <div className="note flex flex-1 flex-col">
                    <p className="eyebrow">About this task</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                      Map the journey from intake to translated conversation.
                      Show key patient + clinician screens and the real-time
                      states â€” listening, translating, reviewing, confirming.
                      Address consent and accessibility.
                    </p>
                  </div>
                </div>
                <SubmissionFields
                  figmaLabel="Figma link"
                  figmaValue={draft.healthcareFigmaLink}
                  fileName={draft.healthcareFileName}
                  explanationValue={draft.healthcareExplanation}
                  figmaError={errors.healthcareFigmaLink}
                  explanationError={errors.healthcareExplanation}
                  onFigmaChange={(value) => updateDraft("healthcareFigmaLink", value)}
                  onFileChange={(event) => handleFile("healthcareFileName", event)}
                  onExplanationChange={(value) => updateDraft("healthcareExplanation", value)}
                  disabled={workspaceLocked}
                />
              </TaskCard>
            ) : null}

            {activeTab === 2 ? (
              <TaskCard
                id="task-3"
                number="3"
                title="LinkedIn B2B Asset"
                objective="A LinkedIn post + supporting graphic from the AI Reality Check report."
                required
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
                  <div className="lg:w-[420px] lg:shrink-0">
                    <ExplainerVideo url={taskVideos.linkedin} />
                  </div>
                  <div className="note flex flex-1 flex-col">
                    <p className="eyebrow">About this task</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                      Draft a sharp, operator-minded post from the 2026 AI
                      Reality Check report and attach a supporting B2B graphic.
                    </p>
                    <a
                      href="https://ajaia.ai/2026-ai-reality-check-report"
                      target="_blank"
                      rel="noreferrer"
                      className="source-link mt-auto"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Source: 2026 AI Reality Check Report
                      <span className="source-link-arrow" aria-hidden>↗</span>
                    </a>
                  </div>
                </div>
                <div className="rounded-[10px] border border-[var(--line-light)] bg-[var(--sky-50)] p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <ToolbarButton label="Bold" onClick={() => insertFormatting("**")} disabled={workspaceLocked}>
                      <Type className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Italic" onClick={() => insertFormatting("_")} disabled={workspaceLocked}>
                      <Italic className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton label="Bullet" onClick={() => updateDraft("linkedinPost", `${draft.linkedinPost}${draft.linkedinPost ? "\n" : ""}- `)} disabled={workspaceLocked}>
                      <List className="h-4 w-4" />
                    </ToolbarButton>
                  </div>
                  <textarea
                    value={draft.linkedinPost}
                    onChange={(event) => updateDraft("linkedinPost", event.target.value)}
                    disabled={workspaceLocked}
                    suppressHydrationWarning
                    className="field-textarea min-h-56"
                    placeholder="Write the LinkedIn post here..."
                  />
                  <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-[var(--ink-subtle)]">
                    <span>{errors.linkedinPost ? <span className="font-medium text-[var(--danger)]">{errors.linkedinPost}</span> : "Saved when you submit."}</span>
                    <span className="mono">{draft.linkedinPost.length} chars</span>
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <FileInput
                    label="Supporting graphic upload"
                    fileName={draft.marketingFileName}
                    onChange={(event) => handleFile("marketingFileName", event)}
                    disabled={workspaceLocked}
                    error={errors.marketingFigmaLink}
                  />
                  <Field label="Graphic Figma link" error={errors.marketingFigmaLink} hint="Upload a file or paste a link.">
                    <div className="relative">
                      <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-subtle)]" />
                      <input
                        value={draft.marketingFigmaLink}
                        onChange={(event) => updateDraft("marketingFigmaLink", event.target.value)}
                        disabled={workspaceLocked}
                        suppressHydrationWarning
                        className="field-input pl-10"
                        placeholder="https://figma.com/..."
                      />
                    </div>
                  </Field>
                </div>
              </TaskCard>
            ) : null}


            <div className="mt-5 flex items-center justify-between gap-3">
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
              {activeTab < tabs.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab((tab) => Math.min(tabs.length - 1, tab + 1))}
                  suppressHydrationWarning
                  className="game-button"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitAssessment}
                  disabled={workspaceLocked || isSubmittingAssessment}
                  suppressHydrationWarning
                  className="game-button"
                >
                  {workspaceLocked ? <LockKeyhole className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  {isSubmitted ? "Submitted" : isExpired ? "Expired" : "Submit Assessment"}
                </button>
              )}
            </div>
          </section>
        </div>

        {showSubmitModal ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
            style={{ background: "rgba(0, 13, 51, 0.45)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-success-title"
          >
            <div
              className="w-full max-w-md bg-white p-8 text-center"
              style={{
                borderRadius: "var(--r-2)",
                boxShadow: "var(--shadow-2)",
                borderTop: "3px solid var(--sky-400)",
              }}
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center bg-[var(--ink-900)] text-[var(--sky-400)]">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h2
                id="submit-success-title"
                className="mt-4 text-[22px] font-bold tracking-[-0.01em] text-[var(--ink-900)]"
              >
                Assessment submitted
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                Your work is locked and ready for review. You can now view the
                final submission confirmation.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/confirmation")}
                  suppressHydrationWarning
                  className="game-button flex-1"
                >
                  View confirmation
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  suppressHydrationWarning
                  className="game-button-secondary flex-1"
                >
                  Stay here
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}

function isAcceptedVideoUrl(value: string) {
  try {
    const url = new URL(value);
    return acceptedVideoHosts.some((host) => url.hostname.includes(host));
  } catch {
    return false;
  }
}

function TaskCard({
  id,
  number,
  title,
  objective,
  required = false,
  children,
}: {
  id: string;
  number: string;
  title: string;
  objective: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <article id={id} className="card scroll-mt-6">
      <div className="flex flex-col gap-3 border-b border-[var(--line-light)] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="mono mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--ink-900)] text-[14px] font-medium text-[var(--sky-400)]">
            {number}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="title-md">{title}</h2>
              {required ? (
                <span className="bg-[var(--sky-100)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-600)]">
                  Required
                </span>
              ) : null}
            </div>
            <p className="text-secondary-apple mt-1">{objective}</p>
          </div>
        </div>
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </article>
  );
}

function SubmissionFields({
  figmaLabel,
  figmaValue,
  fileName,
  explanationValue,
  figmaError,
  explanationError,
  onFigmaChange,
  onFileChange,
  onExplanationChange,
  disabled,
}: {
  figmaLabel: string;
  figmaValue: string;
  fileName: string;
  explanationValue: string;
  figmaError?: string;
  explanationError?: string;
  onFigmaChange: (value: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onExplanationChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label={figmaLabel} error={figmaError}>
          <div className="relative">
            <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-subtle)]" />
            <input
              value={figmaValue}
              onChange={(event) => onFigmaChange(event.target.value)}
              disabled={disabled}
              suppressHydrationWarning
              className="field-input pl-10"
              placeholder="https://figma.com/..."
            />
          </div>
        </Field>
        <FileInput
          label="File upload"
          fileName={fileName}
          onChange={onFileChange}
          disabled={disabled}
        />
      </div>
      <Field label="Design explanation" error={explanationError}>
        <textarea
          value={explanationValue}
          onChange={(event) => onExplanationChange(event.target.value)}
          disabled={disabled}
          suppressHydrationWarning
          className="field-textarea min-h-32"
          placeholder="Explain your design decisions, interactions, and responsive behavior."
        />
      </Field>
    </>
  );
}

function FileInput({
  label,
  fileName,
  onChange,
  disabled,
  error,
}: {
  label: string;
  fileName: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error?: string;
}) {
  return (
    <Field label={label} hint="PDF, PNG, JPG" error={error}>
      <label className={`file-drop ${disabled ? "cursor-not-allowed opacity-60" : "file-drop-active"}`}>
        <span className="truncate">{fileName || "Upload PDF, PNG, or JPG"}</span>
        <FileUp className="h-4 w-4 shrink-0 text-[var(--ink-subtle)]" />
        <input
          type="file"
          accept={acceptedDesignFiles}
          onChange={onChange}
          disabled={disabled}
          suppressHydrationWarning
          className="sr-only"
        />
      </label>
    </Field>
  );
}

function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

function ToolbarButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      suppressHydrationWarning
      className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--line-light)] bg-white text-[var(--ink-900)] transition-all duration-200 hover:border-[var(--sky-400)] hover:bg-[var(--sky-50)] active:scale-95 disabled:cursor-not-allowed disabled:text-[var(--ink-subtle)]"
    >
      {children}
    </button>
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
