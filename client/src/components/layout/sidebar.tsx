import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  BarChart3,
  Home,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className={cn("hidden lg:flex lg:flex-shrink-0", className)}>
      <div className="flex w-64 flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto py-4">
            <nav className="flex-1 space-y-1 px-4">
              {/* Admin Navigation */}
              {isAdmin && (
                <div className="space-y-1 pb-2">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Admin
                  </h3>

                  <NavItem
                    href="/admin/dashboard"
                    icon={<LayoutDashboard className="mr-3 h-5 w-5" />}
                    label="Dashboard"
                    isActive={location === "/admin/dashboard"}
                  />

                  <NavItem
                    href="/admin/clients"
                    icon={<Users className="mr-3 h-5 w-5" />}
                    label="Clients"
                    isActive={location === "/admin/clients"}
                  />

                  <NavItem
                    href="/admin/projects"
                    icon={<FolderOpen className="mr-3 h-5 w-5" />}
                    label="Projects"
                    isActive={location === "/admin/projects"}
                  />

                  <NavItem
                    href="/admin/analytics"
                    icon={<BarChart3 className="mr-3 h-5 w-5" />}
                    label="Analytics"
                    isActive={location === "/admin/analytics"}
                  />
                </div>
              )}

              {/* Client Navigation */}
              {!isAdmin && (
                <div className="space-y-1 pb-2">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    TASKR
                  </h3>

                  <NavItem
                    href="/client/dashboard"
                    icon={<Home className="mr-3 h-5 w-5" />}
                    label="Dashboard"
                    isActive={location === "/client/dashboard"}
                  />

                  <NavItem
                    href="/client/projects"
                    icon={<FolderOpen className="mr-3 h-5 w-5" />}
                    label="My Projects"
                    isActive={location.startsWith("/client/projects")}
                  />

                  <NavItem
                    href="/client/documents"
                    icon={<FileText className="mr-3 h-5 w-5" />}
                    label="Documents"
                    isActive={location === "/client/documents"}
                  />

                  <NavItem
                    href="/client/messages"
                    icon={<MessageSquare className="mr-3 h-5 w-5" />}
                    label="Messages"
                    isActive={location === "/client/messages"}
                  />
                </div>
              )}

              {/* Shared Navigation */}
              <div className="space-y-1 pt-4">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Account
                </h3>

                <NavItem
                  href="/settings"
                  icon={<Settings className="mr-3 h-5 w-5" />}
                  label="Settings"
                  isActive={location === "/settings"}
                />

                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-blue-700 hover:bg-gray-50 group flex w-full items-center px-3 py-2 text-sm font-medium rounded-md"
                >
                  <LogOut className="mr-3 h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                  Log out
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
        )}
      >
        <span
          className={cn(
            isActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"
          )}
        >
          {icon}
        </span>
        {label}
      </div>
    </Link>
  );
}
