import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Project, Client } from "@/lib/types";
import { formatDate, getStatusColor, getStatusText } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectSummary } from "@/components/dashboard/project-summary";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon,
  ClockIcon,
  FolderOpenIcon,
  CheckCircle2Icon
} from "lucide-react";

export default function ClientProjects() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // First get client data
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

  // Then fetch projects for this client
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: [`/api/clients/${client?.id}/projects`],
    enabled: !!client?.id,
  });

  const isLoading = isClientLoading || isProjectsLoading;

  // Set the selected project to the first one if none is selected
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const handleProjectClick = (projectId: number) => {
    setSelectedProjectId(projectId);
  };

  const selectedProject = projects?.find(project => project.id === selectedProjectId);

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
                title="My Projects"
                description="View and manage all your ongoing projects"
              />

              {isLoading ? (
                <LoadingState />
              ) : !projects || projects.length === 0 ? (
                <NoProjectsState />
              ) : (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Project List */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-200">
                          {projects.map((project) => (
                            <button
                              key={project.id}
                              className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors ${
                                selectedProjectId === project.id ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => handleProjectClick(project.id)}
                            >
                              <div className="flex flex-col space-y-2">
                                <div className="flex justify-between items-start">
                                  <h3 className={`font-medium ${
                                    selectedProjectId === project.id ? 'text-blue-600' : 'text-gray-900'
                                  }`}>
                                    {project.name}
                                  </h3>
                                  <Badge 
                                    variant="outline" 
                                    className={`bg-${getStatusColor(project.status)}-100 text-${getStatusColor(project.status)}-800 border-${getStatusColor(project.status)}-200`}
                                  >
                                    {getStatusText(project.status)}
                                  </Badge>
                                </div>
                                
                                <div className="text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                    <span>Started {formatDate(project.createdAt)}</span>
                                  </div>
                                </div>
                                
                                <div className="w-full">
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>Progress</span>
                                    <span>{project.progressPercentage}%</span>
                                  </div>
                                  <Progress value={project.progressPercentage} className="h-2 mt-1" />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Project Details */}
                  <div className="lg:col-span-2">
                    {selectedProject ? (
                      <ProjectSummary projectId={selectedProject.id} />
                    ) : (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <p className="text-gray-500">Select a project to view details</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
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
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-96 w-full lg:col-span-2" />
    </div>
  );
}

function NoProjectsState() {
  return (
    <div className="mt-6">
      <Card>
        <CardContent className="py-12 text-center">
          <FolderOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any active projects at the moment.
          </p>
          <div className="mt-6">
            <Button>
              <Link href="/client/projects/new">
                <span className="flex items-center">
                  Start a Project
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
