import { Switch, Route } from "wouter";
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
import ClientOverview from "@/pages/client/overview";
import ClientProjects from "@/pages/client/projects";
import ClientDocuments from "@/pages/client/documents";
import ClientMessages from "@/pages/client/messages";

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
      <ProtectedRoute path="/client/overview" component={ClientOverview} />
      <ProtectedRoute path="/client/projects" component={ClientProjects} />
      <ProtectedRoute path="/client/documents" component={ClientDocuments} />
      <ProtectedRoute path="/client/messages" component={ClientMessages} />
      
      {/* Shared Routes */}
      <ProtectedRoute path="/settings" component={Settings} />
      
      {/* Default Routes */}
      <Route path="/" component={() => {
        // Redirect to appropriate dashboard based on user role (handled by protected route)
        return (
          <ProtectedRoute 
            path="/" 
            component={() => <div>Redirecting...</div>} 
          />
        );
      }} />
      
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
