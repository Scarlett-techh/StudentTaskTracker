import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Resources from "@/pages/resources";
import Portfolio from "@/pages/portfolio";
import Share from "@/pages/share";
import Parent from "@/pages/parent";
import Calendar from "@/pages/calendar";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Analytics from "@/pages/analytics";
import StudentLogin from "@/pages/student-login";
import CoachLogin from "@/pages/coach-login";
import CoachDashboard from "@/pages/coach-dashboard";
import { Landing } from "@/pages/Landing";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import Footer from "@/components/layout/footer";
import { ThemeProvider } from "@/hooks/use-theme";

// Layout component for authenticated routes
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar currentPath={location} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
          {children}
        </main>
      </div>
      <Footer />
      <MobileNav currentPath={location} />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user, refetch } = useAuth();
  const [location, setLocation] = useLocation();

  // ✅ Enhanced redirect logic with immediate refetch
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // If we're on an auth page and not authenticated, stay
      const authPages = ["/", "/login", "/student-login", "/coach/login"];
      const isAuthPage = authPages.includes(location);

      if (isAuthPage && !isAuthenticated && !isLoading) {
        return; // Stay on auth page
      }

      // If authenticated and on auth page, redirect to appropriate dashboard
      if (isAuthenticated && user && isAuthPage) {
        if (user.userType === "coach") {
          setLocation("/coach/dashboard");
        } else {
          setLocation("/dashboard");
        }
      }

      // If not authenticated and trying to access protected route, redirect to login
      if (!isAuthenticated && !isLoading && !isAuthPage) {
        setLocation("/");
      }
    };

    checkAuthAndRedirect();
  }, [isAuthenticated, user, isLoading, location, setLocation]);

  // ✅ Manually refetch auth state when on auth pages to catch immediate login changes
  useEffect(() => {
    const authPages = ["/", "/login", "/student-login", "/coach/login"];
    if (authPages.includes(location)) {
      // Refetch auth state immediately when on login pages
      refetch();
    }
  }, [location, refetch]);

  // ✅ Show a loading screen while auth is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // ✅ Show public routes only if NOT authenticated
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={StudentLogin} />
        <Route path="/student-login" component={StudentLogin} />
        <Route path="/coach/login" component={CoachLogin} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password/:token" component={ResetPassword} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // ✅ Authenticated user routes
  return (
    <Switch>
      {/* Coach routes */}
      <Route path="/coach/dashboard">
        <AuthenticatedLayout>
          <CoachDashboard />
        </AuthenticatedLayout>
      </Route>

      {/* Student routes with layout */}
      <Route path="/dashboard">
        <AuthenticatedLayout>
          <Dashboard />
        </AuthenticatedLayout>
      </Route>

      <Route path="/tasks">
        <AuthenticatedLayout>
          <Tasks />
        </AuthenticatedLayout>
      </Route>

      <Route path="/calendar">
        <AuthenticatedLayout>
          <Calendar />
        </AuthenticatedLayout>
      </Route>

      <Route path="/resources">
        <AuthenticatedLayout>
          <Resources />
        </AuthenticatedLayout>
      </Route>

      <Route path="/portfolio">
        <AuthenticatedLayout>
          <Portfolio />
        </AuthenticatedLayout>
      </Route>

      <Route path="/analytics">
        <AuthenticatedLayout>
          <Analytics />
        </AuthenticatedLayout>
      </Route>

      <Route path="/share">
        <AuthenticatedLayout>
          <Share />
        </AuthenticatedLayout>
      </Route>

      <Route path="/parent">
        <AuthenticatedLayout>
          <Parent />
        </AuthenticatedLayout>
      </Route>

      <Route path="/profile">
        <AuthenticatedLayout>
          <Profile />
        </AuthenticatedLayout>
      </Route>

      <Route path="/settings">
        <AuthenticatedLayout>
          <Settings />
        </AuthenticatedLayout>
      </Route>

      {/* Root route for authenticated users - redirect to appropriate dashboard */}
      <Route path="/">
        <AuthenticatedLayout>
          {user?.userType === "coach" ? <CoachDashboard /> : <Dashboard />}
        </AuthenticatedLayout>
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <Toaster />
            <Router />
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
