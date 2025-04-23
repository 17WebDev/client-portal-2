import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Client, Project } from "@/lib/types";
import { ClientOnboardingForm } from "@/components/forms/client-onboarding-form";
import { ProjectSummary } from "@/components/dashboard/project-summary";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, PlusCircle, FileText, Clock, BarChart, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Fetch client data
  const { data: client, isLoading: isClientLoading } = useQuery<Client>({
    queryKey: [`/api/clients/user/${user?.id}`],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch client data");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch client projects
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: [`/api/clients/${client?.id}/projects`],
    enabled: !!client?.id,
  });

  const isLoading = isClientLoading || isProjectsLoading;
  
  const needsOnboarding = client?.onboardingStatus !== "completed";
  const mainProject = projects && projects.length > 0 ? projects[0] : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <PageHeader
                title="Dashboard"
                description="Overview of your active projects and current status."
              />

              {isLoading ? (
                <LoadingState />
              ) : needsOnboarding ? (
                <OnboardingState client={client} />
              ) : !mainProject ? (
                <NoProjectsState />
              ) : (
                <ProjectOverview mainProject={mainProject} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-6 space-y-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function OnboardingState({ client }: { client?: Client }) {
  if (!client) return null;
  
  return (
    <div className="mt-6">
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to TASKR!</h2>
          <p className="text-gray-600 mb-4">
            Before we begin working on your project, we need to collect some important information.
            Please complete the onboarding process below to get started.
          </p>
        </CardContent>
      </Card>
      
      <ClientOnboardingForm clientId={client.id} />
    </div>
  );
}

function NoProjectsState() {
  const { user } = useAuth();
  const greeting = getTimeBasedGreeting();
  
  return (
    <div className="mt-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <PlusCircle className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {greeting}, {user?.name?.split(" ")[0]}!
          </h2>
          <p className="text-lg text-gray-600 max-w-md mb-8">
            Ready to begin? Start your first project to get things rolling.
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/client/projects/new">
              <span className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" /> Start a Project
              </span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get time-based greeting
function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function ProjectOverview({ mainProject }: { mainProject: Project }) {
  const { user } = useAuth();
  const greeting = getTimeBasedGreeting();
  const currentDate = new Date();
  const formattedDate = format(currentDate, "EEEE, MMMM d, yyyy");
  
  return (
    <div className="mt-6 space-y-6">
      {/* Welcome Banner with Project Status */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-100 to-transparent opacity-50"></div>
        <CardContent className="py-8 px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {greeting}, {user?.name?.split(" ")[0]}!
              </h2>
              <p className="text-gray-600 mb-4">
                {formattedDate}
              </p>
              <div className="flex items-center mt-2 mb-6">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                <p className="text-sm font-medium text-gray-700">
                  Project "{mainProject.name}" is currently active
                </p>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row items-start gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href={`/projects/${mainProject.id}`}>
                    <span className="flex items-center">
                      View Project Details
                    </span>
                  </Link>
                </Button>
                
                <Button size="lg" variant="outline">
                  <Link href="/client/projects/new">
                    <span className="flex items-center">
                      <PlusCircle className="mr-2 h-5 w-5" /> Start a Project
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:flex mt-4 md:mt-0">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart className="h-12 w-12 text-blue-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Project Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 rounded-full p-2 bg-blue-50">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">{mainProject.status}</div>
                <div className="text-sm text-gray-500">Updated {format(new Date(mainProject.updatedAt), "MMM d")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 rounded-full p-2 bg-amber-50">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">In Progress</div>
                <div className="text-sm text-gray-500">Started {format(new Date(mainProject.createdAt), "MMM d, yyyy")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 rounded-full p-2 bg-indigo-50">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">0</div>
                <div className="text-sm text-gray-500">Project Documents</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Project Summary & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
            <CardDescription>Latest information about your project</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectSummary projectId={mainProject.id} />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and communications</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline projectId={mainProject.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
