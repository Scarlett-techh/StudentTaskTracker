import React from "react";
import { Link } from "wouter";
import { 
  LayoutDashboard, 
  BookText, 
  FileText, 
  Award, 
  BarChart2, 
  Settings, 
  Send,
  Users,
  Calendar,
  TrendingUp // Added for Analytics
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  currentPath: string;
}

const Sidebar = ({ currentPath }: SidebarProps) => {
  const { data: user } = useQuery<{ userType: string }>({
    queryKey: ["/api/user"],
  });

  const [collapsed, setCollapsed] = useState(false);

  const studentLinks = [
    { href: "/dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
    { href: "/tasks", icon: <BookText />, label: "Tasks" },
    { href: "/calendar", icon: <Calendar />, label: "Calendar" },
    { href: "/resources", icon: <BarChart2 />, label: "Learning Resources" },
    { href: "/portfolio", icon: <Award />, label: "Portfolio" },
    { href: "/analytics", icon: <TrendingUp />, label: "Analytics" }, // Added Analytics for students
    { href: "/share", icon: <Send />, label: "Share Work" },
    { href: "/settings", icon: <Settings />, label: "Settings" },
  ];

  const coachLinks = [
    { href: "/coach/dashboard", icon: <Users />, label: "Coach Dashboard" },
    { href: "/analytics", icon: <BarChart2 />, label: "Analytics" },
    { href: "/settings", icon: <Settings />, label: "Settings" },
  ];

  const linksToShow = user?.userType === "coach" ? coachLinks : studentLinks;

  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200 p-2 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-gray-800 focus:outline-none"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="space-y-1">
        {linksToShow.map((link) => {
          const iconSizeClass = collapsed ? "h-4 w-4" : "h-4 w-4";

          const linkContent = (
            <div
              className={cn(
                "flex items-center px-2 py-2 rounded-md font-medium cursor-pointer transition-colors",
                currentPath === link.href
                  ? "bg-blue-50 text-primary"
                  : "text-gray-700 hover:bg-gray-50",
                collapsed ? "justify-center" : "justify-start"
              )}
            >
              {React.cloneElement(link.icon, { className: iconSizeClass })}
              {!collapsed && <span className="ml-2">{link.label}</span>}
            </div>
          );

          return collapsed ? (
            <TooltipProvider key={link.href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={link.href}>{linkContent}</Link>
                </TooltipTrigger>
                <TooltipContent side="right">{link.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Link key={link.href} href={link.href}>
              {linkContent}
            </Link>
          );
        })}
      </nav>

      {/* Subjects for students */}
      {user?.userType === "student" && !collapsed && (
        <div className="mt-8">
          <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Current Subjects
          </h3>
          <div className="mt-2 space-y-1">
            {isLoadingSubjects ? (
              <div className="px-3 py-2 text-sm text-gray-500">Loading subjects...</div>
            ) : Array.isArray(subjects) && subjects.length > 0 ? (
              subjects.map((subject: any) => (
                <div
                  key={subject.id}
                  className="flex items-center group px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <span
                    className="w-2 h-2 rounded-full mr-3"
                    style={{ backgroundColor: subject.color }}
                  ></span>
                  <span className="font-medium">{subject.name}</span>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No subjects found</div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;