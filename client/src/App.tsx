import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";


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
import Analytics from "@/pages/analytics-new";
import CoachLogin from "@/pages/coach-login";
import CoachDashboard from "@/pages/coach-dashboard";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import Footer from "@/components/layout/footer";

function Router() {
  const [location] = useLocation();
  
  // Coach routes (no layout)
  if (location.startsWith('/coach')) {
    return (
      <Switch>
        <Route path="/coach/login" component={CoachLogin} />
        <Route path="/coach/dashboard" component={CoachDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // Student routes (with layout)
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar currentPath={location} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/resources" component={Resources} />
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/share" component={Share} />
            <Route path="/parent" component={Parent} />
            <Route path="/profile" component={Profile} />
            <Route path="/settings" component={Settings} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password/:token" component={ResetPassword} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      
      <Footer />
      <MobileNav currentPath={location} />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;