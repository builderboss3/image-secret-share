import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import ComposePage from "@/pages/compose";
import DecodePage from "@/pages/decode";
import SignInPage from "@/pages/sign-in";
import NotFound from "@/pages/not-found";

const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") || "/";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthorized } = useAuth();
  if (!isAuthorized) return <Redirect to="/sign-in" />;
  return <Component />;
}

function HomeRedirect() {
  const { isAuthorized } = useAuth();
  if (isAuthorized) return <Redirect to="/dashboard" />;
  return <LandingPage />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/compose" component={() => <ProtectedRoute component={ComposePage} />} />
      <Route path="/decode" component={DecodePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <TooltipProvider>
      <WouterRouter base={basePath === "/" ? "" : basePath}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </QueryClientProvider>
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
