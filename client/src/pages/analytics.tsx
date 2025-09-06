import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  PolarRadiusAxis
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
  Target
} from "lucide-react";

// Helper functions for subject analysis
const findStrongestSubject = (data: any[]) => {
  if (!data || data.length === 0) return 'N/A';
  const validData = data.filter(item => item.completed > 0);
  if (validData.length === 0) return 'N/A';
  return validData.reduce((max, subject) => 
    subject.completed > max.completed ? subject : max
  ).name;
};

const findWeakestSubject = (data: any[]) => {
  if (!data || data.length === 0) return 'N/A';
  const validData = data.filter(item => item.total > 0);
  if (validData.length === 0) return 'N/A';
  return validData.reduce((min, subject) => 
    subject.completed < min.completed ? subject : min
  ).name;
};

export default function Analytics() {
  const { toast } = useToast();
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Get data
  const { data: stats } = useQuery({
    queryKey: ["/api/user-stats"],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
  });

  // Safe data processing
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const completedTasks = safeTasks.filter((task: any) => task.status === 'completed');

  // Chart data - ensure we have valid data
  const chartData = safeSubjects
    .map((subject: any) => ({
      name: subject.name || 'Unnamed',
      completed: completedTasks.filter((task: any) => task.subject === subject.name).length,
      total: safeTasks.filter((task: any) => task.subject === subject.name).length
    }))
    .filter(item => item.total > 0);

  const statusData = [
    { name: 'Completed', value: completedTasks.length, color: '#22c55e' },
    { name: 'In Progress', value: safeTasks.filter((t: any) => t.status === 'in-progress').length, color: '#f59e0b' },
    { name: 'Pending', value: safeTasks.filter((t: any) => t.status === 'pending').length, color: '#ef4444' }
  ];

  // Skill development data
  const skillData = [
    { subject: 'Critical Thinking', A: completedTasks.length > 0 ? Math.min(100, completedTasks.length * 8) : 5, fullMark: 100 },
    { subject: 'Creativity', A: completedTasks.length > 0 ? Math.min(100, completedTasks.length * 6) : 10, fullMark: 100 },
    { subject: 'Collaboration', A: completedTasks.length > 0 ? Math.min(100, completedTasks.length * 4) : 15, fullMark: 100 },
    { subject: 'Communication', A: completedTasks.length > 0 ? Math.min(100, completedTasks.length * 7) : 20, fullMark: 100 },
    { subject: 'Self Direction', A: completedTasks.length > 0 ? Math.min(100, completedTasks.length * 9) : 25, fullMark: 100 },
    { subject: 'Social Emotional', A: completedTasks.length > 0 ? Math.min(100, completedTasks.length * 5) : 30, fullMark: 100 },
  ];

  // Simple Export Function
  const handleExportPDF = () => {
    console.log("Export button clicked");

    try {
      // Create a very simple report
      const reportData = `Learning Report\nDate: ${new Date().toLocaleDateString()}\nTotal Tasks: ${safeTasks.length}\nCompleted: ${completedTasks.length}`;

      // Create and download file
      const blob = new Blob([reportData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'learning-report.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Use a more direct approach to show toast
      const toastEvent = new CustomEvent('show-toast', {
        detail: {
          title: "Report Downloaded",
          description: "Your report has been downloaded.",
        }
      });
      window.dispatchEvent(toastEvent);
    } catch (error) {
      console.error('Export error:', error);
      const toastEvent = new CustomEvent('show-toast', {
        detail: {
          title: "Export Failed",
          description: "Could not download report.",
          variant: "destructive"
        }
      });
      window.dispatchEvent(toastEvent);
    }
  };

  // Simple Share Function
  const handleShareReport = () => {
    console.log("Share button clicked");

    try {
      const shareText = `I've completed ${completedTasks.length} learning tasks!`;

      // Try to use the Web Share API first
      if (navigator.share) {
        navigator.share({
          title: 'My Learning Progress',
          text: shareText,
        }).catch(() => {
          // Fallback to clipboard
          copyToClipboard(shareText);
        });
      } else {
        // Fallback to clipboard
        copyToClipboard(shareText);
      }
    } catch (error) {
      console.error('Share error:', error);
      const toastEvent = new CustomEvent('show-toast', {
        detail: {
          title: "Share Failed",
          description: "Could not share report.",
          variant: "destructive"
        }
      });
      window.dispatchEvent(toastEvent);
    }
  };

  // Helper function for clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      const toastEvent = new CustomEvent('show-toast', {
        detail: {
          title: "Copied to Clipboard",
          description: "Progress summary copied to clipboard.",
        }
      });
      window.dispatchEvent(toastEvent);
    }).catch((err) => {
      console.error('Clipboard error:', err);
      // Final fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      const toastEvent = new CustomEvent('show-toast', {
        detail: {
          title: "Copied to Clipboard",
          description: "Progress summary copied to clipboard.",
        }
      });
      window.dispatchEvent(toastEvent);
    });
  };

  // Generate AI analysis based on available data
  useEffect(() => {
    if (completedTasks.length > 0) {
      const analysis = {
        analysis: `Based on your learning patterns, you've completed ${completedTasks.length} out of ${safeTasks.length} tasks. ${completedTasks.length >= 5 ? "Great job maintaining consistency!" : "Keep going to build momentum!"}`,
        strengths: completedTasks.length > 0 ? ["Task completion", "Learning engagement"] : ["Developing foundational skills"],
        recommendations: completedTasks.length > 0 ? [
          "Try to complete at least one task daily",
          "Explore different subject areas",
          "Set personal challenge goals"
        ] : ["Start by completing your first task"],
        achievements: completedTasks.length > 0 ? [
          `Completed ${completedTasks.length} tasks`,
          `${(stats as any)?.streak || 0}-day streak`
        ] : ["New to the platform"],
        learningStyle: "Developing learning style"
      };
      setAiAnalysis(analysis);
    }
  }, [completedTasks, safeTasks, stats]);

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Learning Analytics</h2>
            <p className="text-muted-foreground">
              Track your progress and get insights into your learning journey
            </p>
          </div>

          <div className="flex gap-2 self-end md:self-auto">
            <Button 
              onClick={handleExportPDF}
              disabled={completedTasks.length === 0}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 border-0"
            >
              <FileTextIcon className="h-4 w-4 mr-2" />
              <span>Export Report</span>
            </Button>
            <Button 
              onClick={handleShareReport}
              disabled={completedTasks.length === 0}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 border-0"
            >
              <Share2 className="h-4 w-4 mr-2" />
              <span>Share Progress</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safeTasks.length}</div>
                  <p className="text-xs text-muted-foreground">
                    All created tasks
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedTasks.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Tasks finished
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                  <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats as any)?.level || 1}</div>
                  <p className="text-xs text-muted-foreground">
                    {(stats as any)?.points || 0} points earned
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Streak</CardTitle>
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats as any)?.streak || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Days in a row
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tasks completed by subject area
                  </p>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={60}
                          tick={{ fontSize: 10 }}
                          interval={0}
                        />
                        <YAxis 
                          allowDecimals={false}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value} tasks`, 'Completed']}
                          labelFormatter={(value: string) => `Subject: ${value}`}
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
                          fill="#e5e7eb" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-72 flex items-center justify-center text-muted-foreground">
                      No subject data available. Add tasks with subjects to see performance analytics.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.some(item => item.value > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData.filter(item => item.value > 0)}
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
                  ) : (
                    <div className="h-72 flex items-center justify-center text-muted-foreground">
                      No tasks yet. Create some tasks to see status distribution.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Skill Development Section - Added back */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Skill Development</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your progress across key learning competencies
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={skillData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Skills"
                        dataKey="A"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Critical Thinking</h4>
                        <p className="text-sm text-muted-foreground">
                          Analyzing information and making connections
                        </p>
                        <p className="text-sm font-medium">{skillData[0].A}%</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Creativity</h4>
                        <p className="text-sm text-muted-foreground">
                          Generating innovative ideas and solutions
                        </p>
                        <p className="text-sm font-medium">{skillData[1].A}%</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Collaboration</h4>
                        <p className="text-sm text-muted-foreground">
                          Working effectively with others
                        </p>
                        <p className="text-sm font-medium">{skillData[2].A}%</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Communication</h4>
                        <p className="text-sm text-muted-foreground">
                          Expressing ideas clearly and listening actively
                        </p>
                        <p className="text-sm font-medium">{skillData[3].A}%</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Self Direction</h4>
                        <p className="text-sm text-muted-foreground">
                          Managing your own learning process
                        </p>
                        <p className="text-sm font-medium">{skillData[4].A}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Detailed breakdown of tasks by subject area
                </p>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} tasks`, 'Completed']}
                        labelFormatter={(value: string) => `Subject: ${value}`}
                      />
                      <Legend />
                      <Bar 
                        dataKey="completed" 
                        name="Completed Tasks" 
                        fill="#22c55e" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    No subject data available. Add tasks with subjects to see detailed analytics.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card className="mx-2 md:mx-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Learning Insights</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Analysis of your learning patterns
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Complete some tasks to generate your personalized learning report</p>
                      <p className="text-sm mt-2">Your analysis will appear here after task completion</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Overall Progress Summary */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="font-medium text-blue-900 mb-3">Overall Learning Progress</h4>
                        {aiAnalysis ? (
                          <div className="space-y-3">
                            <p className="text-blue-800">{aiAnalysis.analysis}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <h5 className="font-medium text-blue-900 mb-2">Key Strengths</h5>
                                <ul className="text-blue-800 text-sm space-y-1">
                                  {aiAnalysis.strengths.map((strength: string, index: number) => (
                                    <li key={index}>• {strength}</li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h5 className="font-medium text-blue-900 mb-2">Growth Opportunities</h5>
                                <ul className="text-blue-800 text-sm space-y-1">
                                  {aiAnalysis.recommendations.map((rec: string, index: number) => (
                                    <li key={index}>• {rec}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-blue-800">Analyzing your learning patterns...</p>
                        )}
                      </div>

                      {/* Learning Style & Achievements */}
                      {aiAnalysis && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <h5 className="font-medium text-green-900 mb-2">Learning Style</h5>
                            <p className="text-green-800">{aiAnalysis.learningStyle}</p>
                          </div>

                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <h5 className="font-medium text-purple-900 mb-2">Recent Achievements</h5>
                            <ul className="text-purple-800 text-sm space-y-1">
                              {aiAnalysis.achievements.map((ach: string, index: number) => (
                                <li key={index}>• {ach}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button 
                          onClick={handleExportPDF}
                          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 border-0"
                        >
                          <FileTextIcon className="h-4 w-4 mr-2" />
                          Export Full Report
                        </Button>
                        <Button 
                          onClick={handleShareReport}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 border-0"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Summary
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