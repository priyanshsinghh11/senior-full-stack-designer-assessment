"use client";

import { CheckCircle2, Clock3, FileText, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProgressSteps } from "@/components/progress-steps";

export default function SubmissionConfirmationPage() {
  const [candidateName] = useState(() => {
    if (typeof window === "undefined") return "Candidate";
    return localStorage.getItem("assessmentCandidateName") || "Candidate";
  });
  const [submittedAt] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("assessmentSubmittedAt") || new Date().toISOString();
  });
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("assessmentSessionId") || "";
  });

  const formattedSubmittedAt = useMemo(() => {
    if (!submittedAt) return "Not available";

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(submittedAt));
  }, [submittedAt]);

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <ProgressSteps currentStep="submit" />

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Submission confirmation
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
                  Assessment Submitted Successfully
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5">
            <p className="text-sm leading-6 text-slate-600">
              Thank you for completing the Senior Full Stack Designer Assessment.
              Our team will review your submission and contact you regarding next
              steps.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard icon={<FileText className="h-4 w-4" />} label="Candidate" value={candidateName} />
              <InfoCard icon={<FileText className="h-4 w-4" />} label="Assessment" value="Senior Full Stack Designer Assessment" />
              <InfoCard icon={<Clock3 className="h-4 w-4" />} label="Submitted" value={formattedSubmittedAt} />
              <InfoCard icon={<LockKeyhole className="h-4 w-4" />} label="Review status" value="Pending Review" />
            </div>

            {sessionId ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-normal text-slate-500">
                  Submission ID
                </p>
                <p className="mt-1 break-all text-sm font-medium text-slate-800">
                  {sessionId}
                </p>
              </div>
            ) : null}

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950/80">
              No further edits are allowed after submission.
            </div>

            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Back to Candidate Info
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-normal text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
