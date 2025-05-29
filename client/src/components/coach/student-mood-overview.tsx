import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Zap, 
  Coffee, 
  Frown, 
  Meh, 
  Smile,
  Star,
  Battery,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentMood {
  id: number;
  userId: number;
  moodType: string;
  intensity: number;
  note: string | null;
  date: string;
  createdAt: string;
  studentName: string;
}

const moodConfig = {
  happy: { icon: Smile, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
  excited: { icon: Zap, color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
  focused: { icon: Star, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  calm: { icon: Heart, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  tired: { icon: Battery, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  bored: { icon: Meh, color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
  stressed: { icon: Frown, color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
  motivated: { icon: Coffee, color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
};

export const StudentMoodOverview = () => {
  const { data: studentsMoods, isLoading } = useQuery<StudentMood[]>({
    queryKey: ['/api/coach/students-moods'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Student Moods Today
          </CardTitle>
          <CardDescription>Loading student moods...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!studentsMoods || studentsMoods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Student Moods Today
          </CardTitle>
          <CardDescription>No students have shared their mood today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Students will appear here when they share how they're feeling today.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group moods by type for quick overview
  const moodSummary = studentsMoods.reduce((acc, mood) => {
    acc[mood.moodType] = (acc[mood.moodType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Student Moods Today
        </CardTitle>
        <CardDescription>
          {studentsMoods.length} student{studentsMoods.length !== 1 ? 's' : ''} shared their mood today
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mood Summary */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(moodSummary).map(([moodType, count]) => {
            const config = moodConfig[moodType as keyof typeof moodConfig];
            if (!config) return null;
            
            return (
              <Badge 
                key={moodType} 
                variant="outline" 
                className={cn("gap-1", config.color, config.borderColor)}
              >
                <config.icon className="h-3 w-3" />
                {count} {moodType}
              </Badge>
            );
          })}
        </div>

        {/* Individual Student Moods */}
        <div className="space-y-3">
          {studentsMoods.map((mood) => {
            const config = moodConfig[mood.moodType as keyof typeof moodConfig];
            const Icon = config?.icon || Heart;
            
            return (
              <div 
                key={mood.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border-2",
                  config?.bgColor,
                  config?.borderColor
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full bg-white", config?.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{mood.studentName}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      Feeling {mood.moodType}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Intensity stars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Star
                        key={level}
                        className={cn(
                          "h-3 w-3",
                          level <= mood.intensity
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  
                  {/* Note indicator */}
                  {mood.note && (
                    <div className="text-xs text-muted-foreground bg-white px-2 py-1 rounded">
                      Has note
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notes section if any students left notes */}
        {studentsMoods.some(mood => mood.note) && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Student Notes:</h4>
            <div className="space-y-2">
              {studentsMoods
                .filter(mood => mood.note)
                .map((mood) => (
                  <div key={mood.id} className="p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">{mood.studentName}:</span> "{mood.note}"
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};