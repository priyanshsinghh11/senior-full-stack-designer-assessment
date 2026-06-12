"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  LinkIcon,
  Loader2,
  Mail,
  Upload,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ProgressSteps } from "@/components/progress-steps";
import { getSupabaseClient } from "@/lib/supabase";

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || z.url().safeParse(value).success, {
    message: "Enter a valid URL.",
  });

const candidateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  resumeLink: optionalUrl,
  portfolioUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  agreementConfirmed: z.boolean().refine((value) => value, {
    message: "You must confirm this submission is your own work.",
  }),
});

type CandidateForm = z.infer<typeof candidateSchema>;

const acceptedResumeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function CandidateInformationPage() {
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      resumeLink: "",
      portfolioUrl: "",
      linkedinUrl: "",
      agreementConfirmed: false,
    },
  });

  const resumeFileLabel = useMemo(() => {
    if (!resumeFile) return "Upload PDF, DOC, or DOCX";
    return `${resumeFile.name} (${Math.ceil(resumeFile.size / 1024)} KB)`;
  }, [resumeFile]);

  function handleResumeFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setResumeFile(null);
      return;
    }

    if (!acceptedResumeTypes.includes(file.type)) {
      setResumeFile(null);
      setError("resumeLink", {
        message: "Resume upload must be a PDF, DOC, or DOCX file.",
      });
      return;
    }

    setResumeFile(file);
    setSubmitError("");
  }

  async function uploadResume(file: File, email: string) {
    const supabase = getSupabaseClient();
    const extension = file.name.split(".").pop() ?? "pdf";
    const safeEmail = email.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filePath = `${safeEmail}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage.from("resumes").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from("resumes").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function onSubmit(values: CandidateForm) {
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const supabase = getSupabaseClient();
      const resumeUrl = resumeFile
        ? await uploadResume(resumeFile, values.email)
        : values.resumeLink?.trim() || null;

      const { data: candidate, error: candidateError } = await supabase
        .from("candidates")
        .insert({
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          resume_url: resumeUrl,
          portfolio_url: values.portfolioUrl?.trim() || null,
          linkedin_url: values.linkedinUrl?.trim() || null,
          agreement_confirmed: values.agreementConfirmed,
        })
        .select("id")
        .single();

      if (candidateError) {
        throw new Error(candidateError.message);
      }

      localStorage.setItem("assessmentCandidateId", candidate.id);
      localStorage.setItem(
        "assessmentCandidateName",
        `${values.firstName} ${values.lastName}`,
      );
      localStorage.removeItem("assessmentSessionId");
      localStorage.removeItem("assessmentStartedAt");
      localStorage.removeItem("assessmentExpiresAt");
      localStorage.removeItem("assessmentWorkspaceDraft");
      localStorage.removeItem("assessmentSubmitted");
      setSubmitSuccess("Candidate information saved. Opening guide...");
      router.push("/guide");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while starting the assessment.",
      );
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <ProgressSteps currentStep="profile" />

        <header className="card px-6 py-6">
          <p className="eyebrow">Candidate information</p>
          <h1 className="title-lg mt-2">Tell us about yourself</h1>
          <p className="text-secondary-apple mt-2">
            Complete your profile details before opening the assessment guide.
          </p>
        </header>

        <section className="card">
          <div className="card-header">
            <h2 className="title-md">User Information</h2>
            <p className="text-secondary-apple mt-1">
              You can edit these details before opening the guide.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6">
              <div>
                <div className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#1d1d1f]">
                  <UserRound className="h-4 w-4 text-[#86868b]" />
                  Personal information
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name" error={errors.firstName?.message} required>
                    <input
                      {...register("firstName")}
                      className="field-input"
                      placeholder="Priyansh"
                      autoComplete="given-name"
                    />
                  </Field>
                  <Field label="Last name" error={errors.lastName?.message} required>
                    <input
                      {...register("lastName")}
                      className="field-input"
                      placeholder="Singh"
                      autoComplete="family-name"
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Email address" error={errors.email?.message} required>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
                      <input
                        {...register("email")}
                        className="field-input pl-10"
                        placeholder="name@example.com"
                        autoComplete="email"
                      />
                    </div>
                  </Field>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#1d1d1f]">
                  <BriefcaseBusiness className="h-4 w-4 text-[#86868b]" />
                  Professional information
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Field label="Resume upload" hint="Optional: PDF, DOC, or DOCX">
                      <label className="file-drop file-drop-active">
                        <span className="truncate">{resumeFileLabel}</span>
                        <Upload className="h-4 w-4 shrink-0 text-[#86868b]" />
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeFileChange}
                          className="sr-only"
                        />
                      </label>
                    </Field>

                    <Field
                      label="Resume link"
                      hint="Optional"
                      error={errors.resumeLink?.message}
                    >
                      <div className="relative">
                        <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
                        <input
                          {...register("resumeLink")}
                          className="field-input pl-10"
                          placeholder="https://..."
                        />
                      </div>
                    </Field>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Field
                      label="Portfolio URL"
                      hint="Optional"
                      error={errors.portfolioUrl?.message}
                    >
                      <input
                        {...register("portfolioUrl")}
                        className="field-input"
                        placeholder="https://yourportfolio.com"
                      />
                    </Field>
                    <Field
                      label="LinkedIn URL"
                      hint="Optional"
                      error={errors.linkedinUrl?.message}
                    >
                      <input
                        {...register("linkedinUrl")}
                        className="field-input"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <label className="flex gap-3">
                  <input
                    type="checkbox"
                    {...register("agreementConfirmed")}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">
                      I confirm that this assessment submission is my own work.
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Your candidate information will be used for this
                      assessment.
                    </span>
                  </span>
                </label>
                {errors.agreementConfirmed?.message ? (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {errors.agreementConfirmed.message}
                  </p>
                ) : null}
              </div>

              {submitError ? (
                <StatusMessage tone="error" message={submitError} />
              ) : null}
              {submitSuccess ? (
                <StatusMessage tone="success" message={submitSuccess} />
              ) : null}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Only personal information and agreement are required for now.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="game-button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue to Guide
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
  error,
  hint,
  required = false,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function StatusMessage({
  tone,
  message,
}: {
  tone: "error" | "success";
  message: string;
}) {
  const isError = tone === "error";

  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {isError ? null : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}
