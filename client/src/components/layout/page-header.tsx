import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="sm:flex sm:items-center">
      <div className="sm:flex-auto">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-gray-700">{description}</p>
        )}
      </div>
      {action && (
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {action.href ? (
            <Link href={action.href}>
              <Button>
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
