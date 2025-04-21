import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatString: string = "MMM d, yyyy"): string {
  if (!date) return "";
  return format(new Date(date), formatString);
}

export function formatRelativeTime(date: string | Date): string {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatTimeline(startDate: string | Date, endDate?: string | Date): string {
  if (!startDate) return "";
  if (!endDate) return formatDate(startDate);
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function formatCurrency(amount: number | string): string {
  if (!amount) return "$0";
  const parsedAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0
  }).format(parsedAmount);
}

export function getInitials(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (!str) return "";
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    // Project statuses
    "planning": "blue",
    "in_progress": "amber",
    "completed": "green",
    "on_hold": "slate",
    
    // Document statuses
    "draft": "slate",
    "sent": "amber",
    "signed": "green",
    "paid": "green",
    
    // Client onboarding statuses
    "pending": "slate",
    "in_progress": "amber",
    "completed": "green",
    
    // Pipeline stages
    "qualifying_call": "blue",
    "discovery_call": "indigo",
    "followup_call": "violet",
    "free_work_delivery": "amber",
    "final_presentation": "green",
  };
  
  return statusMap[status.toLowerCase()] || "slate";
}

export function getStatusText(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function calculateProgress(phases: { completedAt: string | null }[]): number {
  if (!phases || phases.length === 0) return 0;
  const completedPhases = phases.filter(phase => phase.completedAt).length;
  return Math.round((completedPhases / phases.length) * 100);
}

export function getRandomColor(index: number): string {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-amber-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-emerald-500",
    "bg-pink-500"
  ];
  return colors[index % colors.length];
}
