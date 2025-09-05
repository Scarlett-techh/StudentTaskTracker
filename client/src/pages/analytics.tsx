import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  FileTextIcon, 
  Share2, 
  TrendingUpIcon, 
  BookOpenIcon, 
  CheckCircleIcon, 
  ClockIcon
} from "lucide-react";

export default function Analytics() {
  const { toast } = useToast();
  
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
  
  // Handle export functionality
  const handleExportPDF = () => {
    const reportData = `Learning Analytics Report
Generated: ${new Date().toLocaleDateString()}

Summary:
- Total Tasks: ${safeTasks.length}
- Completed Tasks: ${completedTasks.length}
- Current Level: ${(stats as any)?.level || 1}
- Current Points: ${(stats as any)?.points || 0}
- Streak: ${(stats as any)?.streak || 0} days

This report shows progress across all learning activities.`;
    
    const blob = new Blob([reportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-analytics-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Your analytics report has been downloaded.",
    });
  };

  const handleShareReport = () => {
    const reportData = `My Learning Progress: ${completedTasks.length} tasks completed, Level ${(stats as any)?.level || 1}, ${(stats as any)?.points || 0} points earned!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Learning Analytics Report',
        text: reportData,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(reportData);
      toast({
        title: "Report Copied",
        description: "Report data copied to clipboard for sharing",
      });
    }
  };

  // Chart data
  const chartData = safeSubjects.map((subject: any) => ({
    name: subject.name,
    completed: completedTasks.filter((task: any) => task.subject === subject.name).length,
    total: safeTasks.filter((task: any) => task.subject === subject.name).length
  }));

  const statusData = [
    { name: 'Completed', value: completedTasks.length, color: '#22c55e' },
    { name: 'In Progress', value: safeTasks.filter((t: any) => t.status === 'in-progress').length, color: '#f59e0b' },
    { name: 'Pending', value: safeTasks.filter((t: any) => t.status === 'pending').length, color: '#ef4444' }
  ];

  return (
    <>
      <Helmet>
        <title>Analytics | Student Work Tracker</title>
        <meta 
          name="description" 
          content="View detailed analytics and insights about your learning progress across all subjects."
        />
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Learning Analytics</h2>
            <p className="text-muted-foreground">
              Track your progress and get insights into your learning journey
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
            >
              <FileTextIcon className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShareReport}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Progress
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
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
          
          <Card>
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
          
          <Card>
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
          
          <Card>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                  <Bar dataKey="total" fill="#e5e7eb" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Task Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Learning Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedTasks.length === 0 ? (
                <p className="text-muted-foreground">Complete some tasks to see personalized insights about your learning patterns.</p>
              ) : (
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-blue-900 mb-2">Progress Analysis</h4>
                    <p className="text-blue-800">
                      You've completed {completedTasks.length} tasks so far. 
                      {completedTasks.length >= 5 ? " Great consistency in your learning!" : " Keep going to build momentum!"}
                    </p>
                  </div>
                  
                  {safeSubjects.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <h4 className="font-medium text-green-900 mb-2">Subject Focus</h4>
                      <p className="text-green-800">
                        You're working across {safeSubjects.length} different subjects. 
                        This shows good learning diversity!
                      </p>
                    </div>
                  )}
                  
                  {stats && (stats as any).streak > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <h4 className="font-medium text-purple-900 mb-2">Consistency</h4>
                      <p className="text-purple-800">
                        Your {(stats as any).streak}-day streak shows excellent consistency. 
                        Keep up the daily learning habit!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}