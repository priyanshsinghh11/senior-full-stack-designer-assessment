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
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <ProgressSteps currentStep="submit" />

        <section className="card">
          <div className="card-header py-6">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1d1d1f] text-white">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="eyebrow">Submission confirmation</p>
                <h1 className="title-lg mt-1.5">
                  Assessment Submitted Successfully
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">
            <p className="text-secondary-apple">
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
              <div className="note px-4 py-3">
                <p className="eyebrow">Submission ID</p>
                <p className="mt-1 break-all text-sm font-medium text-[#1d1d1f]">
                  {sessionId}
                </p>
              </div>
            ) : null}

            <div className="note px-4 py-3 text-sm leading-6 text-[#6e6e73]">
              No further edits are allowed after submission.
            </div>

            <Link href="/" className="game-button-secondary">
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
    <div className="rounded-xl bg-[#f5f5f7] p-4">
      <div className="flex items-center gap-2 text-[#86868b]">
        {icon}
        <span className="eyebrow">{label}</span>
      </div>
      <p className="mt-2 text-[15px] font-semibold text-[#1d1d1f]">{value}</p>
    </div>
  );
}
