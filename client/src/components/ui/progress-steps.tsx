import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Step {
  id: string;
  name: string;
  status: 'complete' | 'current' | 'upcoming';
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  className?: string;
}

export function ProgressSteps({ steps, className }: ProgressStepsProps) {
  return (
    <div className={cn("w-full", className)}>
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => (
          <li key={step.id} className="md:flex-1">
            <div className={cn(
              "flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
              step.status === 'complete' ? "border-primary" : "border-border"
            )}>
              <span className="text-sm font-medium">
                {step.status === 'complete' ? (
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    <Check className="mr-1 h-3 w-3" />
                    Complete
                  </Badge>
                ) : step.status === 'current' ? (
                  <Badge variant="outline" className="border-primary text-primary">
                    In Progress
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Step {index + 1}
                  </Badge>
                )}
              </span>
              <span className={cn(
                "text-sm font-medium",
                step.status === 'complete' ? "text-primary" : 
                step.status === 'current' ? "text-primary" : "text-muted-foreground"
              )}>
                {step.name}
              </span>
              {step.description && (
                <span className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
