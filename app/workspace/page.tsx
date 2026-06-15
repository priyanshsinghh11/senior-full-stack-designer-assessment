"use client";

import {
  CheckCircle2,
  Clock3,
  FileUp,
  Italic,
  LinkIcon,
  List,
  LockKeyhole,
  Save,
  Send,
  Type,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { ProgressSteps } from "@/components/progress-steps";
import { getSupabaseClient } from "@/lib/supabase";

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

const autosaveKey = "assessmentWorkspaceDraft";
const submittedKey = "assessmentSubmitted";
const acceptedDesignFiles = ".pdf,.png,.jpg,.jpeg";
const acceptedVideoHosts = ["loom.com", "youtube.com", "youtu.be", "vimeo.com"];

export default function WorkspacePage() {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState("Candidate");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [draft, setDraft] = useState<WorkspaceDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [now, setNow] = useState(() => new Date());

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

      const storedDraft = localStorage.getItem(autosaveKey);
      if (storedDraft) {
        try {
          setDraft({ ...emptyDraft, ...JSON.parse(storedDraft) });
        } catch {
          setDraft(emptyDraft);
        }
      }
    }, 0);

    async function loadSessionTimer() {
      const sessionId = localStorage.getItem("assessmentSessionId");
      if (!sessionId) return;

      const { data, error } = await getSupabaseClient()
        .from("assessment_sessions")
        .select("started_at, expires_at, status")
        .eq("id", sessionId)
        .single();

      if (!isActive || error || !data) return;

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

  function saveProgress() {
    if (workspaceLocked) return;
    localStorage.setItem(autosaveKey, JSON.stringify(draft));
    setLastSavedAt(new Date());
    setSubmitMessage("Progress saved.");
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
      return;
    }

    setIsSubmittingAssessment(true);

    try {
      const candidateId = localStorage.getItem("assessmentCandidateId");
      const sessionId = localStorage.getItem("assessmentSessionId");

      if (!candidateId || !sessionId) {
        throw new Error("Candidate or assessment session was not found. Please start again.");
      }

      const submittedAt = new Date().toISOString();
      const supabase = getSupabaseClient();

      const { error: submissionError } = await supabase
        .from("assessment_submissions")
        .upsert(
          {
            candidate_id: candidateId,
            assessment_session_id: sessionId,
            website_figma_link: draft.websiteFigmaLink.trim() || null,
            website_file_name: draft.websiteFileName || null,
            website_explanation: draft.websiteExplanation.trim(),
            website_walkthrough_url: draft.videoUrl.trim(),
            healthcare_figma_link: draft.healthcareFigmaLink.trim() || null,
            healthcare_file_name: draft.healthcareFileName || null,
            healthcare_explanation: draft.healthcareExplanation.trim(),
            linkedin_post: draft.linkedinPost.trim(),
            linkedin_graphic_file_name: draft.marketingFileName || null,
            linkedin_graphic_figma_link: draft.marketingFigmaLink.trim() || null,
            submitted_payload: draft,
            submitted_at: submittedAt,
            updated_at: submittedAt,
          },
          { onConflict: "assessment_session_id" },
        );

      if (submissionError) {
        throw new Error(submissionError.message);
      }

      const { error: sessionError } = await supabase
        .from("assessment_sessions")
        .update({
          status: "submitted",
          submitted_at: submittedAt,
          updated_at: submittedAt,
        })
        .eq("id", sessionId);

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      localStorage.setItem(autosaveKey, JSON.stringify(draft));
      localStorage.setItem(submittedKey, "true");
      localStorage.setItem("assessmentSubmittedAt", submittedAt);
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
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <ProgressSteps currentStep="assessment" />

        <header className="card">
          <div className="flex flex-col gap-4 border-b border-black/[0.06] px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="eyebrow">Assessment workspace</p>
              <h1 className="title-lg mt-2">
                Senior Full Stack Designer Assessment
              </h1>
              <p className="text-secondary-apple mt-2">{candidateName}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f5f5f7] px-5 text-[15px] font-semibold tabular-nums text-[#1d1d1f]">
                <Clock3 className="h-4 w-4 text-[#86868b]" />
                {timeRemaining}
              </div>
              <button
                type="button"
                onClick={saveProgress}
                disabled={workspaceLocked}
                suppressHydrationWarning
                className="game-button-secondary"
              >
                <Save className="h-4 w-4" />
                Save Progress
              </button>
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

          <div className="grid gap-3 px-6 py-5 md:grid-cols-3">
            <StatusTile label="Required completed" value={`${completedRequired}/3`} />
            <StatusTile
              label="Manual save"
              value={lastSavedAt ? lastSavedAt.toLocaleTimeString() : "Not saved"}
            />
            <StatusTile
              label="Review status"
              value={isSubmitted ? "Locked" : isExpired ? "Expired" : "In progress"}
            />
          </div>
        </header>

        {isExpired && !isSubmitted ? (
          <div className="card px-5 py-4 text-[14px] font-medium text-[#d70015]">
            The 4-hour timer has expired. The workspace is now locked.
          </div>
        ) : null}

        {submitMessage ? (
          <div className="card px-5 py-4 text-[14px] font-medium text-[#1d1d1f]">
            {submitMessage}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="card p-5 xl:sticky xl:top-6 xl:self-start">
            <p className="eyebrow">Tasks</p>
            <nav className="mt-3 space-y-2">
              {[
                ["task-1", "Website Redesign"],
                ["task-2", "Product UI Flow"],
                ["task-3", "LinkedIn B2B Asset"],
              ].map(([href, label], index) => (
                <a
                  key={href}
                  href={`#${href}`}
                  className="flex items-center gap-3 rounded-xl bg-[#f5f5f7] px-3.5 py-2.5 text-[14px] font-medium text-[#1d1d1f] transition-all duration-200 hover:bg-[#e8e8ed]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                    {index + 1}
                  </span>
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <section className="space-y-5">
            <TaskCard
              id="task-1"
              number="1"
              title="Website Redesign"
              objective="Redesign the AJAIA homepage to improve layout, visual hierarchy, conversion, and responsiveness. Include a written description of the animations, hover states, and microinteractions you would use."
              required
            >
              <div className="note">
                <p className="text-[14px] font-semibold text-[#1d1d1f]">
                  Source page
                </p>
                <a
                  href="https://ajaia.ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex text-[14px] font-medium text-[#1d1d1f] underline underline-offset-4 decoration-[#d2d2d7] transition hover:decoration-[#1d1d1f]"
                >
                  https://ajaia.ai/
                </a>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#6e6e73] md:grid-cols-2">
                  <li>Improve layout and section structure.</li>
                  <li>Clarify visual hierarchy and messaging priority.</li>
                  <li>Strengthen conversion paths and calls to action.</li>
                  <li>Show responsive behavior for desktop and mobile.</li>
                  <li>Describe animations, hover states, and microinteractions.</li>
                </ul>
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
                label="Short screen walkthrough URL"
                error={errors.videoUrl}
                hint="Show the motion/animation direction. Accepted: Loom, YouTube, Vimeo."
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

            <TaskCard
              id="task-2"
              number="2"
              title="Product UI Flow"
              objective="Design a user journey and key screens for a real-time, HIPAA-ready healthcare translation app."
              required
            >
              <div className="note">
                <p className="text-[14px] font-semibold text-[#1d1d1f]">
                  Required deliverables
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#6e6e73] md:grid-cols-2">
                  <li>User journey from patient intake to translated conversation.</li>
                  <li>Key screens for patient, clinician, and interpreter/AI assistance.</li>
                  <li>Real-time translation states: listening, translating, reviewing, and confirming.</li>
                  <li>HIPAA-ready patterns for consent, privacy, audit trail, and secure handling.</li>
                  <li>Accessibility decisions for stressful healthcare environments.</li>
                </ul>
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

            <TaskCard
              id="task-3"
              number="3"
              title="LinkedIn B2B Asset"
              objective="Create a LinkedIn post and supporting B2B graphic from the AI Reality Check report."
              required
            >
              <div className="note">
                <p className="text-[14px] font-semibold text-[#1d1d1f]">
                  Required deliverables
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#6e6e73] md:grid-cols-2">
                  <li>LinkedIn post copy written in the editor below.</li>
                  <li>Supporting B2B graphic uploaded as an image/PDF or linked from Figma.</li>
                </ul>
              </div>
              <div className="rounded-xl bg-[#f5f5f7] p-4">
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
                <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-[#86868b]">
                  <span>{errors.linkedinPost ? <span className="font-medium text-[#d70015]">{errors.linkedinPost}</span> : "Use Save Progress to store your draft."}</span>
                  <span>{draft.linkedinPost.length} characters</span>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <FileInput
                  label="Supporting B2B graphic upload"
                  fileName={draft.marketingFileName}
                  onChange={(event) => handleFile("marketingFileName", event)}
                  disabled={workspaceLocked}
                  error={errors.marketingFigmaLink}
                />
                <Field label="Supporting B2B graphic Figma link" error={errors.marketingFigmaLink} hint="Upload a file or paste a Figma link.">
                  <div className="relative">
                    <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
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
          </section>
        </div>
      </div>

      {showSubmitModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-success-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-[0_20px_70px_rgba(0,0,0,0.18)]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f]">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2
              id="submit-success-title"
              className="mt-4 text-[22px] font-semibold tracking-[-0.022em] text-[#1d1d1f]"
            >
              Assessment submitted
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6e6e73]">
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
      <div className="flex flex-col gap-3 border-b border-black/[0.06] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] text-[13px] font-semibold text-white">
            {number}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="title-md">{title}</h2>
              {required ? (
                <span className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6e6e73]">
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
            <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
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
        <FileUp className="h-4 w-4 shrink-0 text-[#86868b]" />
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-[#e8e8ed] active:scale-95 disabled:cursor-not-allowed disabled:text-[#86868b]"
    >
      {children}
    </button>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 rounded-xl bg-[#f5f5f7] px-4 py-3">
      <div>
        <p className="eyebrow">{label}</p>
        <p className="mt-1 text-[15px] font-semibold text-[#1d1d1f]">{value}</p>
      </div>
      <CheckCircle2 className="h-4 w-4 text-[#86868b]" />
    </div>
  );
}
