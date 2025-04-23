import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  BarChart3,
  Home,
  MessageSquare,
  Settings,
  X,
} from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose}></div>

      {/* Sidebar */}
      <div className="relative flex flex-col w-full max-w-xs pb-12 overflow-y-auto bg-white">
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <div className="text-xl font-bold text-slate-900">TASKR</div>
          <button
            type="button"
            className="-mr-2 inline-flex items-center justify-center rounded-md p-2 text-gray-500"
            onClick={onClose}
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav className="mt-5 flex-1 space-y-1 px-4">
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
                onClick={onClose}
              />

              <NavItem
                href="/admin/clients"
                icon={<Users className="mr-3 h-5 w-5" />}
                label="Clients"
                isActive={location === "/admin/clients"}
                onClick={onClose}
              />

              <NavItem
                href="/admin/projects"
                icon={<FolderOpen className="mr-3 h-5 w-5" />}
                label="Projects"
                isActive={location === "/admin/projects"}
                onClick={onClose}
              />

              <NavItem
                href="/admin/analytics"
                icon={<BarChart3 className="mr-3 h-5 w-5" />}
                label="Analytics"
                isActive={location === "/admin/analytics"}
                onClick={onClose}
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
                href="/client/overview"
                icon={<Home className="mr-3 h-5 w-5" />}
                label="Overview"
                isActive={location === "/client/overview"}
                onClick={onClose}
              />

              <NavItem
                href="/client/projects"
                icon={<FolderOpen className="mr-3 h-5 w-5" />}
                label="My Projects"
                isActive={location === "/client/projects"}
                onClick={onClose}
              />

              <NavItem
                href="/client/documents"
                icon={<FileText className="mr-3 h-5 w-5" />}
                label="Documents"
                isActive={location === "/client/documents"}
                onClick={onClose}
              />

              <NavItem
                href="/client/messages"
                icon={<MessageSquare className="mr-3 h-5 w-5" />}
                label="Messages"
                isActive={location === "/client/messages"}
                onClick={onClose}
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
              onClick={onClose}
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ href, icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
        )}
        onClick={onClick}
      >
        <span
          className={cn(
            isActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"
          )}
        >
          {icon}
        </span>
        {label}
      </a>
    </Link>
  );
}
