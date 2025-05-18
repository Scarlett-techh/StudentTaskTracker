import { FC } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle, Calendar } from "lucide-react";

interface ProgressCardProps {
  label: string;
  value: number;
  total?: number;
  type: "completed" | "in-progress" | "pending" | "upcoming";
  icon?: React.ReactNode;
}

const ProgressCard: FC<ProgressCardProps> = ({ 
  label, 
  value, 
  total, 
  type,
  icon 
}) => {
  // Define styles based on type
  const styles = {
    completed: {
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
      textColor: "text-green-800",
      valueColor: "text-green-700",
      totalColor: "text-green-600",
      iconColor: "text-green-500",
      progressBg: "bg-green-200",
      progressFill: "bg-green-500",
      icon: icon || <CheckCircle className="h-6 w-6 text-green-500" />
    },
    "in-progress": {
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-100", 
      textColor: "text-yellow-800",
      valueColor: "text-yellow-700",
      totalColor: "text-yellow-600",
      iconColor: "text-yellow-500",
      progressBg: "bg-yellow-200",
      progressFill: "bg-yellow-500",
      icon: icon || <AlertCircle className="h-6 w-6 text-yellow-500" />
    },
    pending: {
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      textColor: "text-gray-800",
      valueColor: "text-gray-700",
      totalColor: "text-gray-600", 
      iconColor: "text-gray-500",
      progressBg: "bg-gray-200",
      progressFill: "bg-gray-500",
      icon: icon || <Clock className="h-6 w-6 text-gray-500" />
    },
    upcoming: {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      textColor: "text-blue-800",
      valueColor: "text-blue-700",
      totalColor: "text-blue-600",
      iconColor: "text-blue-500",
      icon: icon || <Calendar className="h-6 w-6 text-blue-500" />
    }
  };

  const style = styles[type];
  const percentage = total ? (value / total) * 100 : 0;

  return (
    <div className={`rounded-lg p-4 border ${style.bgColor} ${style.borderColor}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-sm font-medium ${style.textColor}`}>{label}</p>
          <p className={`mt-1 text-3xl font-semibold ${style.valueColor}`}>
            {value}
            {total && <span className={`text-sm ${style.totalColor} font-normal`}> / {total}</span>}
          </p>
        </div>
        {style.icon}
      </div>
      
      {type !== 'upcoming' && total ? (
        <div className={`mt-3 w-full ${style.progressBg} rounded-full h-2.5`}>
          <div 
            className={`${style.progressFill} h-2.5 rounded-full`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      ) : type === 'upcoming' && (
        <p className="mt-3 text-sm text-blue-600">Due tomorrow or later</p>
      )}
    </div>
  );
};

export default ProgressCard;
