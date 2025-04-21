import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { ClientList } from "@/components/dashboard/client-list";
import { ProjectAnalytics } from "@/lib/types";

import {
  Users,
  FolderOpen,
  TrendingUp,
  DollarSign,
  Plus,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery<ProjectAnalytics>({
    queryKey: ["/api/analytics/projects"],
  });

  // Count queries for dashboard metrics
  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const { data: projects } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

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
                title="Admin Dashboard"
                description="A comprehensive overview of all clients, projects, and sales pipeline metrics."
                action={{
                  label: "Add client",
                  href: "/admin/clients/new",
                }}
              />

              {/* Dashboard Stats */}
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardCard
                  title="Active Clients"
                  value={clients?.length || 0}
                  icon={<Users className="h-8 w-8" />}
                  iconColor="text-blue-600"
                  footer={{ label: "View all", href: "/admin/clients" }}
                />

                <DashboardCard
                  title="Active Projects"
                  value={projects?.length || 0}
                  icon={<FolderOpen className="h-8 w-8" />}
                  iconColor="text-purple-600"
                  footer={{ label: "View all", href: "/admin/projects" }}
                />

                <DashboardCard
                  title="Win Rate"
                  value={`${Math.round(analytics?.completionRate || 0)}%`}
                  icon={<TrendingUp className="h-8 w-8" />}
                  iconColor="text-green-600"
                  footer={{ label: "View details", href: "/admin/analytics" }}
                />

                <DashboardCard
                  title="Avg Contract Value"
                  value="$24,500"
                  icon={<DollarSign className="h-8 w-8" />}
                  iconColor="text-amber-600"
                  footer={{ label: "View details", href: "/admin/analytics" }}
                />
              </div>

              {/* Sales Pipeline */}
              <div className="mt-8">
                <PipelineChart />
              </div>

              {/* Recent Clients */}
              <div className="mt-8">
                <ClientList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
