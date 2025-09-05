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
import { ThemeProvider } from "@/hooks/use-theme"; // Import ThemeProvider

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();

  // ✅ Redirect users to correct dashboard after login (only from public pages)
  useEffect(() => {
    if (isAuthenticated && user && (location === "/" || location === "/login" || location === "/student-login" || location === "/coach/login")) {
      if (user.userType === "coach") {
        setLocation("/coach/dashboard");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [isAuthenticated, user, location, setLocation]);

  // ✅ Show a loading screen while auth is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 text-lg">Loading...</p>
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
      <Route path="/coach/dashboard" component={CoachDashboard} />

      {/* Student routes with layout */}
      <Route path="/dashboard">
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar currentPath={location} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
              <Dashboard />
            </main>
          </div>
          <Footer />
          <MobileNav currentPath={location} />
        </div>
      </Route>

      <Route path="/tasks">
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar currentPath={location} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
              <Tasks />
            </main>
          </div>
          <Footer />
          <MobileNav currentPath={location} />
        </div>
      </Route>

      <Route path="/calendar">
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar currentPath={location} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
              <Calendar />
            </main>
          </div>
          <Footer />
          <MobileNav currentPath={location} />
        </div>
      </Route>

      <Route path="/resources">
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar currentPath={location} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
              <Resources />
            </main>
          </div>
          <Footer />
          <MobileNav currentPath={location} />
        </div>
      </Route>

      <Route path="/portfolio">
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar currentPath={location} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
              <Portfolio />
            </main>
          </div>
          <Footer />
          <MobileNav currentPath={location} />
        </div>
      </Route>

      <Route path="/analytics">
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar currentPath={location} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
              <Analytics />
            </main>
          </div>
          <Footer />
          <MobileNav currentPath={location} />
        </div>
      </Route>

      <Route path="/share">
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar currentPath={location} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
              <Share />
            </main>
          </div>
          <Footer />
          <MobileNav currentPath={location} />
        </div>
      </Route>

      <Route path="/parent">
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar currentPath={location} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
              <Parent />
            </main>
          </div>
          <Footer />
          <MobileNav currentPath={location} />
        </div>
      </Route>

      <Route path="/profile">
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar currentPath={location} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
              <Profile />
            </main>
          </div>
          <Footer />
          <MobileNav currentPath={location} />
        </div>
      </Route>

      <Route path="/settings">
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1">
            <Sidebar currentPath={location} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
              <Settings />
            </main>
          </div>
          <Footer />
          <MobileNav currentPath={location} />
        </div>
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
          <ThemeProvider> {/* Wrap with ThemeProvider */}
            <Toaster />
            <Router />
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;