import { useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { School, ChevronDown, Settings, LogOut, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AvatarFallback from "@/components/ui/avatar-fallback";

const Header = () => {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
  });

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <School className="text-primary mr-2 h-6 w-6" />
            <h1 className="text-xl font-semibold">Student Task Tracker</h1>
          </div>
          
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 focus:outline-none">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  {!isLoading && user?.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name || "User"} />
                  ) : !isLoading && user?.name ? (
                    <AvatarFallback name={user.name} />
                  ) : (
                    <UserIcon className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <span className="hidden md:block font-medium text-gray-700">
                  {!isLoading && user ? user.name : "Loading..."}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
