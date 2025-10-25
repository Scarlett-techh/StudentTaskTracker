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
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch user's achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery<
    UserAchievement[]
  >({
    queryKey: ["/api/user-achievements"],
  });

  // Calculate level and progress properly
  const calculateLevelAndProgress = () => {
    if (!stats)
      return {
        level: 1,
        progress: 0,
        pointsToNextLevel: 100,
        currentLevelPoints: 0,
      };

    // Each level requires 100 points
    const level = Math.floor(stats.points / 100) + 1;
    const currentLevelPoints = stats.points % 100;
    const pointsToNextLevel = 100;
    const progress = Math.min(
      100,
      (currentLevelPoints / pointsToNextLevel) * 100,
    );

    return { level, progress, pointsToNextLevel, currentLevelPoints };
  };

  const { level, progress, pointsToNextLevel, currentLevelPoints } =
    calculateLevelAndProgress();
  const currentPoints = stats?.points || 0;

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
                    Level {level}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentPoints} total points earned
                  </p>
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                  <span className="text-sm font-medium">
                    {stats?.streak || 0} day streak
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Progress to Level {level + 1}</span>
                  <span>
                    {currentLevelPoints}/{pointsToNextLevel} points
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Earn 10 points per completed task
                </p>
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
            {achievements && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({achievements.length} earned)
              </span>
            )}
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
                <div
                  key={achievement.id}
                  className="flex items-center space-x-2"
                >
                  <Award className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {achievement.achievement.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {achievement.achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-sm text-muted-foreground">
                Complete tasks to earn achievements!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
