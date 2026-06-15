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
    <nav aria-label="Assessment progress" className="card px-5 py-5">
      <ol className="grid grid-cols-4">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={step.id}
              className="relative flex flex-col items-center gap-2.5 text-center"
            >
              {index > 0 ? (
                <span
                  className={`absolute left-0 right-1/2 top-[15px] h-px transition-colors duration-300 ${
                    isComplete || isCurrent ? "bg-[#1d1d1f]" : "bg-[#d2d2d7]"
                  }`}
                />
              ) : null}
              {index < steps.length - 1 ? (
                <span
                  className={`absolute left-1/2 right-0 top-[15px] h-px transition-colors duration-300 ${
                    isComplete ? "bg-[#1d1d1f]" : "bg-[#d2d2d7]"
                  }`}
                />
              ) : null}

              <span
                className={`relative z-10 flex h-8 w-12 items-center justify-center rounded-xl text-[12px] font-semibold transition-all duration-300 ${
                  isComplete
                    ? "bg-[#1d1d1f] text-white"
                    : isCurrent
                      ? "bg-[#1d1d1f] text-white shadow-[0_0_0_4px_rgba(0,0,0,0.06)]"
                      : "bg-[#f5f5f7] text-[#86868b] ring-1 ring-[#d2d2d7]"
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
              </span>

              <span
                className={`text-[12px] font-medium sm:text-[13px] ${
                  isCurrent ? "text-[#1d1d1f]" : "text-[#86868b]"
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
