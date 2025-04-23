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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

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
  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Welcome to TASKR!</h3>
          <p className="mt-2 text-base text-gray-600 max-w-md mx-auto">
            Your centralized platform for seamless project management and collaboration. 
            Get started by submitting your first project.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/projects/new">
                <span className="flex items-center">
                  Submit Your First Project <ArrowRight className="ml-2 h-5 w-5" />
                </span>
              </Link>
            </Button>
            
            <Button size="lg" variant="outline">
              <Link href="/client/messages">
                <span className="flex items-center">
                  Contact Us
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What happens after project submission?</h3>
          <ol className="space-y-4">
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-sm font-medium text-blue-800">1</span>
              </div>
              <p className="text-gray-600">Our team will review your project details</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-sm font-medium text-blue-800">2</span>
              </div>
              <p className="text-gray-600">We'll schedule an initial consultation to discuss requirements</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                <span className="text-sm font-medium text-blue-800">3</span>
              </div>
              <p className="text-gray-600">You'll receive a proposal with timeline and cost estimates</p>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectOverview({ mainProject }: { mainProject: Project }) {
  return (
    <div className="mt-6 space-y-6">
      <ProjectSummary projectId={mainProject.id} />
      <ActivityTimeline projectId={mainProject.id} />
    </div>
  );
}
