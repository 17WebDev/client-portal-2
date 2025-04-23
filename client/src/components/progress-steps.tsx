import { CheckIcon } from "lucide-react";

export type Step = {
  id: string;
  name: string;
  status: "current" | "complete" | "upcoming";
};

interface ProgressStepsProps {
  steps: Step[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={`relative flex-1 ${
              stepIdx !== steps.length - 1 ? "pr-8" : ""
            }`}
          >
            {step.status === "complete" ? (
              <div className="group">
                <span className="flex items-center">
                  <span className="flex h-9 items-center">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 group-hover:bg-blue-700">
                      <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="ml-4 text-sm font-medium text-gray-900">
                    {step.name}
                  </span>
                </span>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-blue-600"></div>
                ) : null}
              </div>
            ) : step.status === "current" ? (
              <div className="group" aria-current="step">
                <span className="flex items-center">
                  <span className="flex h-9 items-center">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                    </span>
                  </span>
                  <span className="ml-4 text-sm font-medium text-blue-600">
                    {step.name}
                  </span>
                </span>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"></div>
                ) : null}
              </div>
            ) : (
              <div className="group">
                <span className="flex items-center">
                  <span className="flex h-9 items-center">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300"></span>
                    </span>
                  </span>
                  <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-700">
                    {step.name}
                  </span>
                </span>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"></div>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}