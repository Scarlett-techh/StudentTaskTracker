import { FC } from "react";
import { cn } from "@/lib/utils";

interface AvatarFallbackProps {
  name: string;
  className?: string;
}

const AvatarFallback: FC<AvatarFallbackProps> = ({ name, className }) => {
  // Generate initials from name
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Generate a deterministic color based on the name
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-yellow-500", 
    "bg-red-500", "bg-purple-500", "bg-pink-500"
  ];
  
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div 
      className={cn(
        "flex items-center justify-center text-white font-medium rounded-full", 
        bgColor, 
        className
      )}
    >
      {initials}
    </div>
  );
};

export default AvatarFallback;
