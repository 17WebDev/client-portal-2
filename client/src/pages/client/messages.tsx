import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Project, Client } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageHeader } from "@/components/layout/page-header";
import { MessagesPanel } from "@/components/forms/messages-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquareIcon } from "lucide-react";

export default function ClientMessages() {
  const { user } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

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

  // Fetch projects for this client
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: [`/api/clients/${client?.id}/projects`],
    enabled: !!client?.id,
  });

  const isLoading = isClientLoading || isProjectsLoading;

  // Set the selected project to the first one if none is selected
  React.useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

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
                title="Messages"
                description="Communicate with your project team and keep track of important updates."
              />

              {isLoading ? (
                <div className="mt-6">
                  <Skeleton className="h-96 w-full" />
                </div>
              ) : !projects || projects.length === 0 ? (
                <NoProjectsState />
              ) : (
                <div className="mt-6">
                  <Tabs 
                    defaultValue={selectedProjectId?.toString()} 
                    onValueChange={(value) => setSelectedProjectId(parseInt(value))}
                    className="w-full"
                  >
                    <TabsList className="w-full mb-6">
                      {projects.map((project) => (
                        <TabsTrigger key={project.id} value={project.id.toString()}>
                          {project.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {projects.map((project) => (
                      <TabsContent key={project.id} value={project.id.toString()}>
                        <Card className="h-[calc(100vh-280px)]">
                          <MessagesPanel projectId={project.id} />
                        </Card>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NoProjectsState() {
  return (
    <div className="mt-6">
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any active projects with communication channels.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
