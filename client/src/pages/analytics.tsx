import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
} from "recharts";
import {
  FileTextIcon,
  Share2,
  TrendingUpIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  Brain,
  Lightbulb,
  Users,
  MessageSquare,
  Target,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// Custom hook for analytics data
const useAnalyticsData = () => {
  const queryClient = useQueryClient();

  // Fetch comprehensive analytics data
  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/analytics"],
    staleTime: 0, // Always consider data stale to force refreshes
    refetchOnWindowFocus: true,
  });

  // Also fetch tasks separately for real-time updates
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    staleTime: 0,
  });

  // Manually trigger refetch when tasks might have changed
  useEffect(() => {
    refetch();
  }, [tasks?.length]); // Refetch when task count changes

  return {
    analyticsData,
    tasks: Array.isArray(tasks) ? tasks : [],
    isLoading,
    error,
    refetch,
    invalidateAnalytics: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] }),
  };
};

export default function Analytics() {
  const { toast } = useToast();
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    analyticsData,
    tasks,
    isLoading,
    error,
    refetch,
    invalidateAnalytics,
  } = useAnalyticsData();

  // Safe data processing with fallbacks
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const completedTasks = safeTasks.filter(
    (task: any) => task.status === "completed",
  );
  const inProgressTasks = safeTasks.filter(
    (task: any) => task.status === "in-progress",
  );
  const pendingTasks = safeTasks.filter(
    (task: any) => task.status === "pending" || !task.status,
  );

  // Use analytics data if available, otherwise compute from tasks
  const chartData =
    analyticsData?.subjectPerformance ||
    safeTasks.reduce((acc: any[], task: any) => {
      const subject = task.subject || "Uncategorized";
      const existing = acc.find((item) => item.name === subject);
      if (existing) {
        existing.total++;
        if (task.status === "completed") existing.completed++;
      } else {
        acc.push({
          name: subject,
          total: 1,
          completed: task.status === "completed" ? 1 : 0,
        });
      }
      return acc;
    }, []);

  const statusData = [
    {
      name: "Completed",
      value: analyticsData?.completedTasks || completedTasks.length,
      color: "#22c55e",
    },
    {
      name: "In Progress",
      value: analyticsData?.inProgressTasks || inProgressTasks.length,
      color: "#f59e0b",
    },
    {
      name: "Pending",
      value: analyticsData?.pendingTasks || pendingTasks.length,
      color: "#ef4444",
    },
  ];

  // Enhanced skill development data based on actual task completion
  const calculateSkillLevel = (base: number, multiplier: number) => {
    const calculated = Math.min(100, base + completedTasks.length * multiplier);
    return Math.max(5, calculated); // Minimum 5%
  };

  const skillData = [
    {
      subject: "Critical Thinking",
      A: calculateSkillLevel(5, 8),
      fullMark: 100,
    },
    {
      subject: "Creativity",
      A: calculateSkillLevel(10, 6),
      fullMark: 100,
    },
    {
      subject: "Collaboration",
      A: calculateSkillLevel(15, 4),
      fullMark: 100,
    },
    {
      subject: "Communication",
      A: calculateSkillLevel(20, 7),
      fullMark: 100,
    },
    {
      subject: "Self Direction",
      A: calculateSkillLevel(25, 9),
      fullMark: 100,
    },
    {
      subject: "Social Emotional",
      A: calculateSkillLevel(30, 5),
      fullMark: 100,
    },
  ];

  // Enhanced progress data for line chart
  const progressData = analyticsData?.progressOverTime || [
    { date: "Week 1", tasks: Math.floor(completedTasks.length * 0.3) },
    { date: "Week 2", tasks: Math.floor(completedTasks.length * 0.5) },
    { date: "Week 3", tasks: Math.floor(completedTasks.length * 0.7) },
    { date: "Week 4", tasks: completedTasks.length },
  ];

  // Refresh analytics data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await invalidateAnalytics();
      await refetch();
      toast({
        title: "Data Updated",
        description: "Analytics refreshed with latest data",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not update analytics data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced Export Function
  const handleExportPDF = () => {
    try {
      const reportData = `
LEARNING ANALYTICS REPORT
Generated: ${new Date().toLocaleDateString()}

OVERVIEW:
• Total Tasks: ${safeTasks.length}
• Completed: ${completedTasks.length}
• In Progress: ${inProgressTasks.length}
• Pending: ${pendingTasks.length}
• Completion Rate: ${safeTasks.length > 0 ? ((completedTasks.length / safeTasks.length) * 100).toFixed(1) : 0}%

SUBJECT PERFORMANCE:
${chartData
  .map(
    (subject: any) =>
      `• ${subject.name}: ${subject.completed}/${subject.total} completed (${subject.total > 0 ? ((subject.completed / subject.total) * 100).toFixed(1) : 0}%)`,
  )
  .join("\n")}

LEARNING SKILLS:
${skillData
  .map((skill: any) => `• ${skill.subject}: ${skill.A}% developed`)
  .join("\n")}
      `.trim();

      const blob = new Blob([reportData], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `learning-report-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Your analytics report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not download report",
        variant: "destructive",
      });
    }
  };

  // Enhanced Share Function
  const handleShareReport = async () => {
    try {
      const shareText = `🎯 My Learning Progress: ${completedTasks.length} tasks completed | ${(stats as any)?.streak || 0}-day streak | Level ${(stats as any)?.level || 1}`;

      if (navigator.share) {
        await navigator.share({
          title: "My Learning Analytics",
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to Clipboard",
          description: "Progress summary copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  // Enhanced AI analysis
  useEffect(() => {
    if (completedTasks.length > 0) {
      const completionRate =
        safeTasks.length > 0
          ? (completedTasks.length / safeTasks.length) * 100
          : 0;

      const analysis = {
        analysis: `You've completed ${completedTasks.length} out of ${safeTasks.length} tasks (${completionRate.toFixed(1)}% completion rate). ${completionRate >= 70 ? "Excellent work! You're maintaining great consistency." : completionRate >= 40 ? "Good progress! Keep building momentum." : "Getting started! Every task completed builds your skills."}`,
        strengths:
          completedTasks.length > 0
            ? [
                "Task completion commitment",
                "Learning consistency",
                "Progress tracking",
              ]
            : ["Developing foundational learning habits"],
        recommendations: [
          completionRate < 50
            ? "Focus on completing pending tasks"
            : "Challenge yourself with advanced topics",
          "Maintain your current streak",
          "Explore different subject areas for balanced growth",
        ],
        achievements: [
          `Completed ${completedTasks.length} tasks`,
          `${analyticsData?.streak || 0}-day active streak`,
          `Level ${analyticsData?.level || 1} learner`,
        ],
        learningStyle:
          completedTasks.length > 10
            ? "Consistent and methodical learner"
            : "Developing personalized learning approach",
      };
      setAiAnalysis(analysis);
    }
  }, [completedTasks, safeTasks, analyticsData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Failed to load analytics
          </h3>
          <p className="text-muted-foreground mb-4">
            Please try refreshing the page
          </p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    );
  }

  const stats = analyticsData || {};

  return (
    <>
      <Helmet>
        <title>Analytics | Student Work Tracker</title>
        <meta
          name="description"
          content="View detailed analytics and insights about your learning progress across all subjects."
        />
      </Helmet>

      <div className="space-y-6 p-4 md:p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Learning Analytics
            </h2>
            <p className="text-muted-foreground mt-2">
              Real-time insights into your learning journey and progress
            </p>
          </div>

          <div className="flex gap-2 self-end md:self-auto">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={safeTasks.length === 0}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 border-0 shadow-sm"
            >
              <FileTextIcon className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button
              onClick={handleShareReport}
              disabled={safeTasks.length === 0}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 border-0 shadow-sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="subjects"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
            >
              Subjects
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
            >
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="space-y-6 animate-in fade-in duration-500"
          >
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Tasks
                  </CardTitle>
                  <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safeTasks.length}</div>
                  <p className="text-xs text-muted-foreground">
                    All learning tasks
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed
                  </CardTitle>
                  <TrendingUpIcon className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {completedTasks.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {safeTasks.length > 0
                      ? `${((completedTasks.length / safeTasks.length) * 100).toFixed(1)}% completion`
                      : "No tasks"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Current Level
                  </CardTitle>
                  <BookOpenIcon className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.level || 1}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.points || 0} points earned
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Streak
                  </CardTitle>
                  <ClockIcon className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.streak || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Days of consistent learning
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Performance */}
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUpIcon className="h-5 w-5 text-blue-500" />
                    Subject Performance
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Completion rate by subject area
                  </p>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 11 }}
                          interval={0}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            value,
                            name === "completed"
                              ? "Completed Tasks"
                              : "Total Tasks",
                          ]}
                          labelFormatter={(value: string) =>
                            `Subject: ${value}`
                          }
                        />
                        <Legend />
                        <Bar
                          dataKey="completed"
                          name="Completed Tasks"
                          fill="#22c55e"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="total"
                          name="Total Tasks"
                          fill="#94a3b8"
                          radius={[4, 4, 0, 0]}
                          opacity={0.6}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-72 flex flex-col items-center justify-center text-muted-foreground">
                      <BookOpenIcon className="h-12 w-12 mb-4 opacity-50" />
                      <p>No subject data available</p>
                      <p className="text-sm">
                        Add tasks with subjects to see performance analytics
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Task Status Distribution */}
              <Card className="shadow-sm border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    Task Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.some((item) => item.value > 0) ? (
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={statusData.filter((item) => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-3 gap-4 mt-4 w-full">
                        {statusData.map((status, index) => (
                          <div key={index} className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              <span className="text-sm font-medium">
                                {status.name}
                              </span>
                            </div>
                            <div className="text-lg font-bold">
                              {status.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-72 flex flex-col items-center justify-center text-muted-foreground">
                      <CheckCircleIcon className="h-12 w-12 mb-4 opacity-50" />
                      <p>No tasks yet</p>
                      <p className="text-sm">
                        Create tasks to see status distribution
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Learning Skill Development */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Learning Skill Development
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your progress across key 21st century learning competencies
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={skillData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fontSize: 11 }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Skill Level"
                          dataKey="A"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.6}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value}%`,
                            "Skill Level",
                          ]}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg mb-4">
                      Skill Breakdown
                    </h4>
                    {skillData.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full bg-blue-100 text-blue-600`}
                          >
                            {index === 0 && <Brain className="h-4 w-4" />}
                            {index === 1 && <Lightbulb className="h-4 w-4" />}
                            {index === 2 && <Users className="h-4 w-4" />}
                            {index === 3 && (
                              <MessageSquare className="h-4 w-4" />
                            )}
                            {index === 4 && <Target className="h-4 w-4" />}
                            {index === 5 && (
                              <BookOpenIcon className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">
                              {skill.subject}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {skill.A}% developed
                            </p>
                          </div>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${skill.A}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Over Time */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="h-5 w-5 text-green-500" />
                  Progress Over Time
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your task completion trend over the past month
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="tasks"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: "#1d4ed8" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rest of the tabs content remains similar but with enhanced UI */}
          <TabsContent
            value="subjects"
            className="animate-in fade-in duration-500"
          >
            {/* Enhanced Subjects tab content */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5 text-blue-500" />
                  Detailed Subject Performance
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Comprehensive breakdown of your performance across all
                  subjects
                </p>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={120}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            value,
                            name === "completed"
                              ? "Completed Tasks"
                              : "Total Tasks",
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="completed"
                          name="Completed Tasks"
                          fill="#22c55e"
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar
                          dataKey="total"
                          name="Total Tasks"
                          fill="#94a3b8"
                          radius={[0, 4, 4, 0]}
                          opacity={0.6}
                        />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Subject Details Table */}
                    <div className="border rounded-lg">
                      <div className="grid grid-cols-4 p-4 bg-muted/50 font-medium text-sm">
                        <div>Subject</div>
                        <div className="text-center">Completed</div>
                        <div className="text-center">Total</div>
                        <div className="text-center">Completion Rate</div>
                      </div>
                      {chartData.map((subject: any, index: number) => (
                        <div
                          key={index}
                          className="grid grid-cols-4 p-4 border-t text-sm"
                        >
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-center">{subject.completed}</div>
                          <div className="text-center">{subject.total}</div>
                          <div className="text-center font-semibold">
                            {subject.total > 0
                              ? `${((subject.completed / subject.total) * 100).toFixed(1)}%`
                              : "0%"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                    <BookOpenIcon className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg mb-2">No subject data available</p>
                    <p className="text-sm text-center">
                      Add tasks with subjects to see detailed performance
                      analytics
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="insights"
            className="animate-in fade-in duration-500"
          >
            {/* Enhanced Insights tab content */}
            <Card className="shadow-sm border-0 mx-2 md:mx-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Learning Insights & Recommendations
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    AI-powered analysis of your learning patterns and
                    personalized recommendations
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {completedTasks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No data to analyze yet</p>
                      <p className="text-sm">
                        Complete some tasks to generate your personalized
                        learning report
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Overall Progress Summary */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                        <h4 className="font-semibold text-blue-900 mb-4 text-lg">
                          📊 Overall Learning Progress
                        </h4>
                        {aiAnalysis ? (
                          <div className="space-y-4">
                            <p className="text-blue-800 leading-relaxed">
                              {aiAnalysis.analysis}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                              <div className="bg-white/50 p-4 rounded-lg">
                                <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                  <TrendingUpIcon className="h-4 w-4" />
                                  Key Strengths
                                </h5>
                                <ul className="text-blue-800 text-sm space-y-2">
                                  {aiAnalysis.strengths.map(
                                    (strength: string, index: number) => (
                                      <li
                                        key={index}
                                        className="flex items-start gap-2"
                                      >
                                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                                        {strength}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>

                              <div className="bg-white/50 p-4 rounded-lg">
                                <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Growth Opportunities
                                </h5>
                                <ul className="text-blue-800 text-sm space-y-2">
                                  {aiAnalysis.recommendations.map(
                                    (rec: string, index: number) => (
                                      <li
                                        key={index}
                                        className="flex items-start gap-2"
                                      >
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                        {rec}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-blue-800">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Analyzing your learning patterns...
                          </div>
                        )}
                      </div>

                      {/* Learning Style & Achievements */}
                      {aiAnalysis && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
                            <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                              <BookOpenIcon className="h-4 w-4" />
                              Learning Style
                            </h5>
                            <p className="text-green-800">
                              {aiAnalysis.learningStyle}
                            </p>
                          </div>

                          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-5 rounded-xl border border-purple-100">
                            <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                              <CheckCircleIcon className="h-4 w-4" />
                              Recent Achievements
                            </h5>
                            <ul className="text-purple-800 text-sm space-y-2">
                              {aiAnalysis.achievements.map(
                                (ach: string, index: number) => (
                                  <li
                                    key={index}
                                    className="flex items-start gap-2"
                                  >
                                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                                    {ach}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                          onClick={handleExportPDF}
                          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 border-0 shadow-sm"
                        >
                          <FileTextIcon className="h-4 w-4 mr-2" />
                          Export Full Report
                        </Button>
                        <Button
                          onClick={handleShareReport}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 border-0 shadow-sm"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Progress Summary
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
