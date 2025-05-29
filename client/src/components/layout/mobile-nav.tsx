import { Link } from "wouter";
import { 
  LayoutDashboard, 
  BookText, 
  FileText, 
  BarChart2, 
  Award, 
  Send, 
  Users,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  currentPath: string;
}

const MobileNav = ({ currentPath }: MobileNavProps) => {
  const navItems = [
    { href: "/", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
    { href: "/tasks", icon: <BookText className="h-5 w-5" />, label: "Tasks" },
    { href: "/calendar", icon: <Calendar className="h-5 w-5" />, label: "Calendar" },
    { href: "/resources", icon: <BarChart2 className="h-5 w-5" />, label: "Resources" },
    { href: "/portfolio", icon: <Award className="h-5 w-5" />, label: "Portfolio" },
    { href: "/coach/login", icon: <Users className="h-5 w-5" />, label: "Coach" },
  ];

  return (
    <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 md:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div 
              className={cn(
                "flex flex-col items-center py-2 px-3 cursor-pointer",
                currentPath === item.href ? "text-primary" : "text-gray-600"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
