import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Link } from "wouter";
import { PipelineStageData } from "@/lib/types";
import { getStatusText } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function PipelineChart() {
  const { data: pipelineData, isLoading } = useQuery<PipelineStageData[]>({
    queryKey: ["/api/analytics/pipeline"],
  });

  if (isLoading) {
    return <PipelineChartSkeleton />;
  }

  if (!pipelineData || pipelineData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
          <CardDescription>No pipeline data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md font-medium text-gray-900">Pipeline Stages</CardTitle>
            <CardDescription>Current status of prospects and leads</CardDescription>
          </div>
          <Link href="/admin/clients">
            <a className="text-sm font-medium text-blue-600 hover:text-blue-500">View all</a>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pt-3 pb-5">
        <div className="grid grid-cols-5 gap-4">
          {pipelineData.map((stage) => (
            <div key={stage.stage} className="flex flex-col items-center">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${calculatePercentage(stage.count, getMaxCount(pipelineData))}%` 
                  }}
                ></div>
              </div>
              <p className="mt-2 text-xs font-medium text-gray-500 text-center">
                {getStatusText(stage.stage)}
              </p>
              <p className="text-sm font-semibold text-gray-900">{stage.count}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineChartSkeleton() {
  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="px-6 pt-3 pb-5">
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="w-full h-2 rounded-full" />
              <Skeleton className="mt-2 h-4 w-20" />
              <Skeleton className="mt-1 h-5 w-8 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getMaxCount(data: PipelineStageData[]): number {
  return Math.max(...data.map(stage => stage.count), 1);
}

function calculatePercentage(count: number, max: number): number {
  if (max === 0) return 0;
  return Math.max((count / max) * 100, 5); // Ensure minimum visibility
}
