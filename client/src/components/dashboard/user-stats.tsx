import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Zap, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Achievement {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  pointsRequired: number;
  badgeImageUrl: string | null;
  createdAt: string;
}

interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  achievedAt: string;
  achievement: Achievement;
}

interface UserStats {
  points: number;
  level: number;
  streak: number;
}

export default function UserStats() {
  // Fetch user's stats
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user-stats"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch user's achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery<UserAchievement[]>({
    queryKey: ["/api/user-achievements"],
  });

  // Calculate points to next level
  const pointsToNextLevel = stats ? (stats.level * 100) : 100;
  const currentPoints = stats?.points || 0;
  const progressPercentage = stats ? Math.min(100, Math.round((currentPoints % 100) * 100 / 100)) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Star className="mr-2 h-5 w-5 text-yellow-500" />
            Progress & Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Level {stats?.level}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentPoints} points earned
                  </p>
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                  <span className="text-sm font-medium">{stats?.streak || 0} day streak</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Progress to Level {stats ? stats.level + 1 : 1}</span>
                  <span>{currentPoints % 100}/{pointsToNextLevel} points</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-amber-500" />
            Achievements 
            {achievements && <span className="ml-2 text-sm font-normal text-muted-foreground">({achievements.length} earned)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievementsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : achievements && achievements.length > 0 ? (
            <div className="space-y-2">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{achievement.achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-sm text-muted-foreground">Complete tasks to earn achievements!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}