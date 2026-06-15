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
      className="p-6 lg:fixed lg:left-5 lg:top-[96px] lg:bottom-0 lg:z-30 lg:w-[260px]"
    >
      <div className="mb-8 flex items-center gap-3">
        <span className="deco-squares !h-5 !w-5" aria-hidden />
        <p className="eyebrow">Progress</p>
      </div>

      <ol className="flex flex-col">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={`relative flex gap-4 ${isLast ? "" : "pb-12"}`}
            >
              {!isLast ? (
                <span
                  className={`absolute left-[19px] top-10 h-full w-px transition-colors duration-300 ${
                    isComplete ? "bg-[var(--ink-900)]" : "bg-[var(--line-light)]"
                  }`}
                />
              ) : null}

              <span
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center text-[13px] font-semibold transition-all duration-300 ${
                  isComplete
                    ? "bg-[var(--ink-900)] text-white"
                    : isCurrent
                      ? "bg-[var(--ink-900)] text-[var(--sky-400)] shadow-[0_0_0_4px_var(--sky-100)]"
                      : "bg-white text-[var(--ink-subtle)] ring-1 ring-[var(--line-light)]"
                }`}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <span className="mono">{index + 1}</span>
                )}
              </span>

              <span className="flex flex-col pt-1.5">
                <span
                  className={`text-[16px] font-semibold leading-tight ${
                    isCurrent
                      ? "text-[var(--ink-900)]"
                      : isComplete
                        ? "text-[var(--ink-muted)]"
                        : "text-[var(--ink-subtle)]"
                  }`}
                >
                  {step.label}
                </span>
                <span className="mt-1 text-[12px] font-medium text-[var(--ink-faint)]">
                  {isComplete ? "Done" : isCurrent ? "In progress" : "Upcoming"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
