import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import PropertyDetails from "@/pages/PropertyDetails";
import SettingsPage from "@/pages/Settings";
import ProjectsPage from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import ReleaseNotes from "@/pages/ReleaseNotes";
import Landing from "@/pages/Landing";
import DevPasswordGate from "@/pages/DevPasswordGate";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/">{() => <ErrorBoundary section="Dashboard"><Dashboard /></ErrorBoundary>}</Route>
      <Route path="/property/:id">{() => <ErrorBoundary section="Property Details"><PropertyDetails /></ErrorBoundary>}</Route>
      <Route path="/settings">{() => <ErrorBoundary section="Settings"><SettingsPage /></ErrorBoundary>}</Route>
      <Route path="/projects">{() => <ErrorBoundary section="Projects"><ProjectsPage /></ErrorBoundary>}</Route>
      <Route path="/projects/:id">{() => <ErrorBoundary section="Project Detail"><ProjectDetail /></ErrorBoundary>}</Route>
      <Route path="/release-notes">{() => <ErrorBoundary section="Release Notes"><ReleaseNotes /></ErrorBoundary>}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated, needsDevPassword } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsDevPassword) {
    return <DevPasswordGate />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
