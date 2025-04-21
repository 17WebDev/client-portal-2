import { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconColor?: string;
  footer?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function DashboardCard({
  title,
  value,
  icon,
  iconColor = "text-blue-600",
  footer,
  className,
}: DashboardCardProps) {
  return (
    <Card className={cn("bg-white overflow-hidden shadow", className)}>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0", iconColor)}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-xl font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {footer && (
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href={footer.href}>
              <a className="font-medium text-blue-700 hover:text-blue-900">
                {footer.label}
              </a>
            </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
