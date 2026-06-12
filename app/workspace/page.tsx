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
  const [candidateName] = useState(() => {
    if (typeof window === "undefined") return "Candidate";
    return localStorage.getItem("assessmentCandidateName") || "Candidate";
  });
  const [expiresAt, setExpiresAt] = useState<Date | null>(() => {
    if (typeof window === "undefined") return null;
    const storedExpiry = localStorage.getItem("assessmentExpiresAt");
    return storedExpiry ? new Date(storedExpiry) : null;
  });
  const [draft, setDraft] = useState<WorkspaceDraft>(() => {
    if (typeof window === "undefined") return emptyDraft;
    const storedDraft = localStorage.getItem(autosaveKey);
    return storedDraft ? { ...emptyDraft, ...JSON.parse(storedDraft) } : emptyDraft;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(submittedKey) === "true";
  });
  const [submitMessage, setSubmitMessage] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let isActive = true;

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

  function submitAssessment() {
    if (isExpired) {
      setSubmitMessage("The assessment timer has expired. Submissions are locked.");
      return;
    }

    setSubmitMessage("");
    if (!validateSubmission()) {
      setSubmitMessage("Complete the required sections before submitting.");
      return;
    }

    localStorage.setItem(autosaveKey, JSON.stringify(draft));
    localStorage.setItem(submittedKey, "true");
    localStorage.setItem("assessmentSubmittedAt", new Date().toISOString());
    setIsSubmitted(true);
    setSubmitMessage("Assessment submitted successfully. Redirecting...");
    router.push("/confirmation");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <ProgressSteps currentStep="assessment" />

        <header className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Assessment workspace
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
                Senior Full Stack Designer Assessment
              </h1>
              <p className="mt-1 text-sm text-slate-500">{candidateName}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800">
                <Clock3 className="h-4 w-4 text-slate-500" />
                {timeRemaining}
              </div>
              <button
                type="button"
                onClick={saveProgress}
                disabled={workspaceLocked}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                <Save className="h-4 w-4" />
                Save Progress
              </button>
              <button
                type="button"
                onClick={submitAssessment}
                disabled={workspaceLocked}
                className="game-button px-4"
              >
                {workspaceLocked ? <LockKeyhole className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {isSubmitted ? "Submitted" : isExpired ? "Expired" : "Submit Assessment"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 px-5 py-4 md:grid-cols-3">
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
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            The 4-hour timer has expired. The workspace is now locked.
          </div>
        ) : null}

        {submitMessage ? (
          <div
            className={`rounded-md border px-4 py-3 text-sm font-medium ${
              isSubmitted
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-blue-200 bg-blue-50 text-blue-900"
            }`}
          >
            {submitMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-6 xl:self-start">
            <p className="text-sm font-semibold text-slate-800">Tasks</p>
            <nav className="mt-3 space-y-2">
              {[
                ["task-1", "Website Redesign"],
                ["task-2", "Product UI Flow"],
                ["task-3", "LinkedIn B2B Asset"],
              ].map(([href, label], index) => (
                <a
                  key={href}
                  href={`#${href}`}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold ring-1 ring-slate-200">
                    {index + 1}
                  </span>
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <section className="space-y-6">
            <TaskCard
              id="task-1"
              number="1"
              title="Website Redesign"
              objective="Redesign the AJAIA homepage to improve layout, visual hierarchy, conversion, and responsiveness. Include a written description of the animations, hover states, and microinteractions you would use."
              required
            >
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-950">
                  Source page
                </p>
                <a
                  href="https://ajaia.ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex text-sm font-medium text-blue-700 underline-offset-4 hover:underline"
                >
                  https://ajaia.ai/
                </a>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-blue-950/80 md:grid-cols-2">
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
                  className="field-input disabled:bg-slate-100"
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
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-950">
                  Required deliverables
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-emerald-950/80 md:grid-cols-2">
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
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-indigo-950">
                  Required deliverables
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-indigo-950/80 md:grid-cols-2">
                  <li>LinkedIn post copy written in the editor below.</li>
                  <li>Supporting B2B graphic uploaded as an image/PDF or linked from Figma.</li>
                </ul>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
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
                  className="min-h-56 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  placeholder="Write the LinkedIn post here..."
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>{errors.linkedinPost ? <span className="font-medium text-red-600">{errors.linkedinPost}</span> : "Use Save Progress to store your draft."}</span>
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
                    <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={draft.marketingFigmaLink}
                      onChange={(event) => updateDraft("marketingFigmaLink", event.target.value)}
                      disabled={workspaceLocked}
                      className="field-input pl-9 disabled:bg-slate-100"
                      placeholder="https://figma.com/..."
                    />
                  </div>
                </Field>
              </div>
            </TaskCard>
          </section>
        </div>
      </div>
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
    <article id={id} className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
            {number}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
              {required ? (
                <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                  Required
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{objective}</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-5">{children}</div>
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
            <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={figmaValue}
              onChange={(event) => onFigmaChange(event.target.value)}
              disabled={disabled}
              className="field-input pl-9 disabled:bg-slate-100"
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
          className="min-h-32 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
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
      <label className={`flex min-h-11 items-center justify-between gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 transition ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-slate-400 hover:bg-slate-100"}`}>
        <span className="truncate">{fileName || "Upload PDF, PNG, or JPG"}</span>
        <FileUp className="h-4 w-4 shrink-0 text-slate-500" />
        <input
          type="file"
          accept={acceptedDesignFiles}
          onChange={onChange}
          disabled={disabled}
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
    >
      {children}
    </button>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-normal text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
      </div>
      <CheckCircle2 className="h-4 w-4 text-slate-400" />
    </div>
  );
}
