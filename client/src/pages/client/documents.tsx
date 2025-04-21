import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Client } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentList } from "@/components/forms/document-list";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileTextIcon } from "lucide-react";

export default function ClientDocuments() {
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

  const isLoading = isClientLoading;

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
                title="Documents"
                description="View and manage all your project documents, contracts, and invoices."
              />

              {isLoading ? (
                <div className="mt-6">
                  <Skeleton className="h-96 w-full" />
                </div>
              ) : client ? (
                <div className="mt-6">
                  <DocumentList clientId={client.id} />
                </div>
              ) : (
                <div className="mt-6">
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No client data available</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        We were unable to load your client information.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
