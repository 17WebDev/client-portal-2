import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Communication } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Calendar,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface ActivityTimelineProps {
  projectId: number;
}

type Activity = Communication & {
  type: string;
  title: string;
};

export function ActivityTimeline({ projectId }: ActivityTimelineProps) {
  // In a real app, this would fetch a combined timeline of communications, document uploads, status changes
  const { data: communications, isLoading } = useQuery<Communication[]>({
    queryKey: [`/api/projects/${projectId}/communications`],
  });

  if (isLoading) {
    return <ActivityTimelineSkeleton />;
  }

  if (!communications || communications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-6 text-gray-500">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  // In a real app we'd have different activity types mixed together
  // For this example we'll transform communications into activities
  const activities: Activity[] = communications.map((comm) => ({
    ...comm,
    type: comm.type || "message",
    title: getActivityTitle(comm.type),
  }));

  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {activities.map((activity, idx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {idx !== activities.length - 1 && (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    ></span>
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityIconColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">
                            {activity.title}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {activity.sender?.name && (
                            <>
                              By{" "}
                              <span className="font-medium text-gray-900">
                                {activity.sender.name}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        <p>{activity.message}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatRelativeTime(activity.createdAt)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityTimelineSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {[1, 2, 3].map((i) => (
              <li key={i}>
                <div className="relative pb-8">
                  {i !== 3 && (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    ></span>
                  )}
                  <div className="relative flex items-start space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48 mb-3" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getActivityIcon(type: string) {
  switch (type) {
    case "update":
      return <MessageSquare className="h-5 w-5 text-white" />;
    case "document":
      return <FileText className="h-5 w-5 text-white" />;
    case "decision":
      return <CheckCircle className="h-5 w-5 text-white" />;
    case "milestone":
      return <Calendar className="h-5 w-5 text-white" />;
    default:
      return <MessageSquare className="h-5 w-5 text-white" />;
  }
}

function getActivityIconColor(type: string) {
  switch (type) {
    case "update":
      return "bg-blue-500";
    case "document":
      return "bg-gray-400";
    case "decision":
      return "bg-green-500";
    case "milestone":
      return "bg-purple-500";
    case "question":
      return "bg-amber-500";
    default:
      return "bg-blue-500";
  }
}

function getActivityTitle(type: string) {
  switch (type) {
    case "update":
      return "Project Update";
    case "document":
      return "Document Shared";
    case "decision":
      return "Decision Made";
    case "milestone":
      return "Milestone Reached";
    case "question":
      return "Question Asked";
    default:
      return "Message";
  }
}
