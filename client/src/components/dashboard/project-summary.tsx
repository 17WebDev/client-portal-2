import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Project } from "@/lib/types";
import { formatDate, getStatusColor, getStatusText } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface ProjectSummaryProps {
  projectId: number;
}

export function ProjectSummary({ projectId }: ProjectSummaryProps) {
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
  });

  if (isLoading) {
    return <ProjectSummarySkeleton />;
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-gray-500">Project not found</p>
        </CardContent>
      </Card>
    );
  }

  // This would come from the API in a real application
  const projectManager = { name: "Alex Thompson" };
  const nextMilestone = {
    name: "Design approval meeting",
    date: new Date(new Date().setDate(new Date().getDate() + 5))
  };

  return (
    <Card className="bg-white shadow overflow-hidden sm:rounded-lg">
      <CardContent className="px-0 py-0">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{project.name}</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Started {formatDate(project.createdAt)} • 
            {project.goLiveDate ? ` Est. completion: ${formatDate(project.goLiveDate)}` : " Timeline TBD"}
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Project manager</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {projectManager.name}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Current status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getStatusColor(project.status)}-100 text-${getStatusColor(project.status)}-800`}>
                  {getStatusText(project.status)}
                </span>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Progress</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {project.progressPercentage}% Complete
                      </span>
                    </div>
                  </div>
                  <Progress value={project.progressPercentage} className="h-2" />
                </div>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Next milestone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {nextMilestone.name} - {formatDate(nextMilestone.date)}
              </dd>
            </div>
            {project.description && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {project.description}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectSummarySkeleton() {
  return (
    <Card className="bg-white shadow overflow-hidden sm:rounded-lg">
      <CardContent className="px-0 py-0">
        <div className="px-4 py-5 sm:px-6">
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="border-t border-gray-200">
          <dl>
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
              >
                <Skeleton className="h-4 w-32" />
                <div className="mt-1 sm:col-span-2 sm:mt-0">
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            ))}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
