"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CheckCircle2,
  LinkIcon,
  Loader2,
  Mail,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ProgressSteps } from "@/components/progress-steps";
import { TopBar } from "@/components/top-bar";
import { getSupabaseClient } from "@/lib/supabase";

const requiredUrl = z
  .string()
  .trim()
  .min(1, "Resume link is required.")
  .refine((value) => z.url().safeParse(value).success, {
    message: "Enter a valid URL.",
  });

const candidateSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  resumeLink: requiredUrl,
});

type CandidateForm = z.infer<typeof candidateSchema>;

export default function CandidateInformationPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      fullName: "",
      email: "",
      resumeLink: "",
    },
  });

  async function onSubmit(values: CandidateForm) {
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const supabase = getSupabaseClient();
      const fullName = values.fullName.trim();

      const { data: candidate, error: candidateError } = await supabase
        .from("candidates")
        .insert({
          full_name: fullName,
          email: values.email,
          resume_url: values.resumeLink.trim(),
        })
        .select("id")
        .single();

      if (candidateError) {
        throw new Error(candidateError.message);
      }

      localStorage.setItem("assessmentCandidateId", candidate.id);
      localStorage.setItem("assessmentCandidateName", fullName);
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
    <>
      <TopBar />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <ProgressSteps currentStep="profile" />

        <header className="card px-6 py-6">
          <p className="eyebrow">Candidate information</p>
          <h1 className="title-lg mt-2">Tell us about yourself</h1>
          <p className="text-secondary-apple mt-2">
            Complete your basic details before opening the assessment guide.
          </p>
        </header>

        <section className="card">
          <div className="card-header">
            <h2 className="title-md">User Information</h2>
            <p className="text-secondary-apple mt-1">
              Enter your name, email, and resume link before opening the guide.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6">
            <div>
              <div className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#1d1d1f]">
                <UserRound className="h-4 w-4 text-[#86868b]" />
                Candidate details
              </div>

              <div className="grid gap-4">
                <Field label="Full name" error={errors.fullName?.message} required>
                  <input
                    {...register("fullName")}
                    suppressHydrationWarning
                    className="field-input"
                    placeholder="Priyansh Singh"
                    autoComplete="name"
                  />
                </Field>

                <Field label="Email address" error={errors.email?.message} required>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
                    <input
                      {...register("email")}
                      suppressHydrationWarning
                      className="field-input pl-10"
                      placeholder="name@example.com"
                      autoComplete="email"
                    />
                  </div>
                </Field>

                <Field
                  label="Resume link"
                  error={errors.resumeLink?.message}
                  required
                >
                  <div className="relative">
                    <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" />
                    <input
                      {...register("resumeLink")}
                      suppressHydrationWarning
                      className="field-input pl-10"
                      placeholder="https://..."
                    />
                  </div>
                </Field>
              </div>
            </div>

            {submitError ? (
              <StatusMessage tone="error" message={submitError} />
            ) : null}
            {submitSuccess ? (
              <StatusMessage tone="success" message={submitSuccess} />
            ) : null}

            <div className="flex flex-col gap-3 border-t border-black/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-secondary-apple">
                Your 4-hour timer starts later, when you enter the workspace —
                not now.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                suppressHydrationWarning
                className="game-button rounded-xl"
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
    </>
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
      <span className="field-label flex items-center gap-1">
        {label}
        {required ? <span className="text-[#d70015]">*</span> : null}
      </span>
      {children}
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
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
      className={`flex items-start gap-2 rounded-xl bg-[#f5f5f7] px-4 py-3 text-[14px] font-medium ${
        isError ? "text-[#d70015]" : "text-[#1d1d1f]"
      }`}
    >
      {isError ? null : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}
