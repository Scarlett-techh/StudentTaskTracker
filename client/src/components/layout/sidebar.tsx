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
  Calendar
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentPath: string;
}

const Sidebar = ({ currentPath }: SidebarProps) => {
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const mainLinks = [
    { href: "/", icon: <LayoutDashboard className="mr-3 h-5 w-5" />, label: "Dashboard" },
    { href: "/tasks", icon: <BookText className="mr-3 h-5 w-5" />, label: "Tasks" },
    { href: "/calendar", icon: <Calendar className="mr-3 h-5 w-5" />, label: "Calendar" },
    { href: "/notes", icon: <FileText className="mr-3 h-5 w-5" />, label: "Notes" },
    { href: "/resources", icon: <BarChart2 className="mr-3 h-5 w-5" />, label: "Learning Resources" },
    { href: "/portfolio", icon: <Award className="mr-3 h-5 w-5" />, label: "Portfolio" },
    { href: "/share", icon: <Send className="mr-3 h-5 w-5" />, label: "Share Work" },
    { href: "/parent", icon: <Users className="mr-3 h-5 w-5" />, label: "Parent Access" },
    { href: "/settings", icon: <Settings className="mr-3 h-5 w-5" />, label: "Settings" },
  ];

  return (
    <aside className="sidebar w-64 bg-white border-r border-gray-200 p-4 hidden md:block">
      <nav className="space-y-1">
        {mainLinks.map((link) => (
          <Link 
            key={link.href} 
            href={link.href}
          >
            <div 
              className={cn(
                "flex items-center px-3 py-2 rounded-md font-medium cursor-pointer",
                currentPath === link.href
                  ? "bg-blue-50 text-primary"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              {link.icon}
              {link.label}
            </div>
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Subjects</h3>
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
    </aside>
  );
};

export default Sidebar;
