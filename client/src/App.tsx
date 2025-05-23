import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminClients from "@/pages/admin/clients";
import AdminProjects from "@/pages/admin/projects";
import AdminAnalytics from "@/pages/admin/analytics";

// Client Pages
import ClientDashboard from "@/pages/client/dashboard";
import ClientProjects from "@/pages/client/projects";
import ClientDocuments from "@/pages/client/documents";
import ClientMessages from "@/pages/client/messages";
import ProjectsPage from "@/pages/client/projects-page";
import ProjectDetailPage from "@/pages/client/project-detail-page";
import NewProjectPage from "@/pages/client/project-new";

// Shared Pages
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      {/* Auth Page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminOnly />
      <ProtectedRoute path="/admin/clients" component={AdminClients} adminOnly />
      <ProtectedRoute path="/admin/projects" component={AdminProjects} adminOnly />
      <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} adminOnly />
      
      {/* Client Routes */}
      <ProtectedRoute path="/client/dashboard" component={ClientDashboard} />
      <Route path="/client/overview">
        <Redirect to="/client/dashboard" />
      </Route>
      <ProtectedRoute path="/client/projects/list" component={ClientProjects} />
      <ProtectedRoute path="/client/documents" component={ClientDocuments} />
      <ProtectedRoute path="/client/messages" component={ClientMessages} />
      
      {/* Projects Routes */}
      <ProtectedRoute path="/projects/new" component={NewProjectPage} />
      <ProtectedRoute path="/client/projects/new" component={NewProjectPage} />
      <ProtectedRoute path="/projects/:id" component={ProjectDetailPage} />
      <ProtectedRoute path="/client/projects/:id" component={ProjectDetailPage} />
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <ProtectedRoute path="/client/projects" component={ProjectsPage} />
      
      {/* Shared Routes */}
      <ProtectedRoute path="/settings" component={Settings} />
      
      {/* Default Routes */}
      <Route path="/">
        <Redirect to="/client/dashboard" />
      </Route>
      
      {/* Dashboard shortcut */}
      <Route path="/dashboard">
        <Redirect to="/client/dashboard" />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
