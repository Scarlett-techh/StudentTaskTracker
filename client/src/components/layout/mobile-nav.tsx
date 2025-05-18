import { Link } from "wouter";
import { LayoutDashboard, BookText, FileText, Image, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  currentPath: string;
}

const MobileNav = ({ currentPath }: MobileNavProps) => {
  const navItems = [
    { href: "/", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
    { href: "/tasks", icon: <BookText className="h-5 w-5" />, label: "Tasks" },
    { href: "/notes", icon: <FileText className="h-5 w-5" />, label: "Notes" },
    { href: "/photos", icon: <Image className="h-5 w-5" />, label: "Photos" },
    { href: "/more", icon: <Menu className="h-5 w-5" />, label: "More" },
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
