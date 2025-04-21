import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/lib/types";
import { formatDate, getStatusColor, getStatusText } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, BarChart2 } from "lucide-react";

export function ClientList() {
  const [, navigate] = useLocation();
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const handleClientClick = (clientId: number) => {
    navigate(`/admin/clients/${clientId}`);
  };

  if (isLoading) {
    return <ClientListSkeleton />;
  }

  if (!clients || clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-6 text-gray-500">No clients found</p>
        </CardContent>
      </Card>
    );
  }

  // Show the 5 most recent clients
  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Clients</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul role="list" className="divide-y divide-gray-200">
          {recentClients.map((client) => (
            <li key={client.id}>
              <button
                onClick={() => handleClientClick(client.id)}
                className="block w-full text-left hover:bg-gray-50"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <div className="flex text-sm">
                        <p className="font-medium text-blue-600 truncate">
                          {client.companyName}
                        </p>
                        <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                          <Badge 
                            variant="outline" 
                            className={`bg-${getStatusColor(client.onboardingStatus)}-100 text-${getStatusColor(client.onboardingStatus)}-800 border-${getStatusColor(client.onboardingStatus)}-200`}
                          >
                            {getStatusText(client.onboardingStatus)}
                          </Badge>
                        </p>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>{client.userInfo?.name || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>Added {formatDate(client.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <BarChart2 className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>{getStatusText(client.pipelineStage)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ClientListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="p-0">
        <ul role="list" className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div>
                  <Skeleton className="h-4 w-36 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
