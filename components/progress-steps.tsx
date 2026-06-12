import { Check } from "lucide-react";

const steps = [
  { id: "profile", label: "Profile" },
  { id: "guidance", label: "Guidance" },
  { id: "assessment", label: "Assessment" },
  { id: "submit", label: "Submit" },
] as const;

type StepId = (typeof steps)[number]["id"];

export function ProgressSteps({ currentStep }: { currentStep: StepId }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <nav
      aria-label="Assessment progress"
      className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm"
    >
      <ol className="grid grid-cols-4">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={step.id}
              className="relative flex flex-col items-center gap-2 text-center"
            >
              {index > 0 ? (
                <span
                  className={`absolute left-0 right-1/2 top-4 h-px ${
                    isComplete || isCurrent ? "bg-slate-950" : "bg-slate-200"
                  }`}
                />
              ) : null}
              {index < steps.length - 1 ? (
                <span
                  className={`absolute left-1/2 right-0 top-4 h-px ${
                    isComplete ? "bg-slate-950" : "bg-slate-200"
                  }`}
                />
              ) : null}

              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  isComplete
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : index + 1}
              </span>

              <span
                className={`text-xs font-medium sm:text-sm ${
                  isCurrent ? "text-slate-950" : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
