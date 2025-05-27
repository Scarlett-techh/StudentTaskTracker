import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { apiRequest } from "@/lib/queryClient";
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
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { 
  DownloadIcon, 
  TrendingUpIcon, 
  BookOpenIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  BrainIcon, 
  Share2, 
  PlusIcon, 
  SendIcon, 
  FileTextIcon, 
  PenToolIcon,
  School,
  TargetIcon,
  ActivityIcon
} from "lucide-react";

export default function Analytics() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [parentInsightsLoading, setParentInsightsLoading] = useState<boolean>(false);
  
  // Get user stats
  const { data: stats } = useQuery({
    queryKey: ["/api/user-stats"],
  });
  
  // Get tasks
  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
  });
  
  // Get subjects
  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });
  
  // Get notes 
  const { data: notes } = useQuery({
    queryKey: ["/api/notes"],
  });
  
  // Simulate AI-generated insights based on student data
  const generateParentInsights = () => {
    setParentInsightsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setParentInsightsLoading(false);
    }, 1500);
  };
  
  // Filter completed tasks
  const completedTasks = tasks ? tasks.filter((task: any) => task.status === 'completed') : [];
  
  // Group tasks by subject - this will be used across the component
  const tasksBySubject = completedTasks.reduce((acc: any, task: any) => {
    const subject = task.subject || 'Unassigned';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(task);
    return acc;
  }, {});
  
  // Calculate average time to complete tasks
  const tasksWithDate = completedTasks.filter((task: any) => task.completedAt);
  const averageCompletionTime = tasksWithDate.length > 0 
    ? tasksWithDate.reduce((acc: number, task: any) => {
        const createdDate = new Date(task.createdAt);
        const completedDate = new Date(task.completedAt);
        return acc + (completedDate.getTime() - createdDate.getTime());
      }, 0) / tasksWithDate.length / (1000 * 60 * 60) // convert to hours
    : 0;
  
  // Calculate subject distribution for pie chart
  const subjectDistribution = Object.keys(tasksBySubject).map(subject => ({
    name: subject,
    value: tasksBySubject[subject].length,
    color: getSubjectColor(subject, subjects)
  }));
  
  // Calculate weekly progress
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  const weeklyProgress = daysOfWeek.map((day, index) => {
    const date = new Date();
    date.setDate(today.getDate() - (dayOfWeek - index));
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    
    const tasksCompleted = completedTasks.filter((task: any) => {
      const taskDate = new Date(task.updatedAt);
      return taskDate >= date && taskDate < nextDate;
    }).length;
    
    return {
      name: day.substring(0, 3),
      tasks: tasksCompleted,
    };
  });
  
  // Calculate subject performance
  const subjectPerformance = Object.keys(tasksBySubject).map(subject => {
    return {
      name: subject,
      completed: tasksBySubject[subject].length,
      target: 10, // Example target
      color: getSubjectColor(subject, subjects)
    };
  });
  
  // Get most productive day
  const productiveDay = weeklyProgress.reduce(
    (max, day) => day.tasks > max.tasks ? day : max, 
    { name: '', tasks: 0 }
  );
  
  // Get favorite subject
  const favoriteSubject = subjectPerformance.reduce(
    (max, subject) => subject.completed > max.completed ? subject : max,
    { name: 'None', completed: 0, target: 0, color: '#cccccc' }
  );
  
  // Function to get subject color
  function getSubjectColor(subjectName: string, subjects: any[]) {
    if (!subjects) return '#cccccc';
    
    const subject = subjects.find(s => s.name === subjectName);
    if (subject && subject.color) {
      return subject.color;
    }
    
    // Default colors for common subjects
    const colorMap: Record<string, string> = {
      'Mathematics': '#3B82F6',
      'Science': '#8B5CF6',
      'English': '#10B981',
      'History': '#F59E0B',
      'Physical Activity': '#EC4899',
      'Life Skills': '#F97316',
      'Interest / Passion': '#14B8A6',
      'Unassigned': '#94A3B8'
    };
    
    return colorMap[subjectName] || '#94A3B8';
  }
  
  // We're already using the tasksBySubject mapping defined above
  // No need to create it again
  


  return (
    <>
      <Helmet>
        <title>Analytics | Student Dashboard</title>
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold gradient-heading">Student Analytics</h1>
          
          <div className="flex items-center space-x-4">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-[400px]"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="subjects">Subjects</TabsTrigger>
                <TabsTrigger value="parent-report">Parent Report</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="time-range">Time Range</Label>
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger id="time-range" className="w-32">
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Completed Tasks Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <div className="text-2xl font-bold">{completedTasks.length}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedTasks.length > 0 
                  ? `${Math.round((completedTasks.length / (tasks?.length || 1)) * 100)}% completion rate` 
                  : 'No tasks completed yet'}
              </p>
            </CardContent>
          </Card>
          
          {/* Streak Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUpIcon className="h-5 w-5 text-amber-500 mr-2" />
                <div className="text-2xl font-bold">{stats?.streak || 0} days</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.streak ? 'Keep going!' : 'Complete a task today to start a streak!'}
              </p>
            </CardContent>
          </Card>
          
          {/* Most Productive Day */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Most Productive Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                <div className="text-2xl font-bold">
                  {productiveDay.tasks > 0 ? productiveDay.name : 'N/A'}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {productiveDay.tasks > 0 
                  ? `${productiveDay.tasks} tasks completed` 
                  : 'No data available yet'}
              </p>
            </CardContent>
          </Card>
          
          {/* Favorite Subject */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Favorite Subject
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BookOpenIcon className="h-5 w-5" style={{ color: favoriteSubject.color }} />
                <div className="text-2xl font-bold ml-2">
                  {favoriteSubject.name !== 'None' ? favoriteSubject.name : 'N/A'}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {favoriteSubject.name !== 'None' 
                  ? `${favoriteSubject.completed} tasks completed` 
                  : 'Add subjects to your tasks'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Distribution */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Subject Distribution</CardTitle>
              <CardDescription>Breakdown of completed tasks by subject</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {subjectDistribution.length > 0 ? (
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {subjectDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-72 flex items-center justify-center">
                  <p className="text-muted-foreground">No task data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Weekly Progress */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
              <CardDescription>Tasks completed per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tasks" name="Tasks Completed" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Detailed breakdown by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Subjects</TabsTrigger>
                {subjects?.map((subject: any) => (
                  <TabsTrigger key={subject.id} value={subject.name}>
                    {subject.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="all">
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Subject</th>
                        <th className="text-left py-3 px-4">Completed Tasks</th>
                        <th className="text-left py-3 px-4">Progress</th>
                        <th className="text-left py-3 px-4">Average Time to Complete</th>
                        <th className="text-left py-3 px-4">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(tasksBySubject).map((subject, index) => {
                        const subjectTasks = tasksBySubject[subject];
                        const lastTask = subjectTasks.sort((a: any, b: any) => {
                          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                        })[0];
                        
                        return (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: getSubjectColor(subject, subjects) }}
                                />
                                {subject}
                              </div>
                            </td>
                            <td className="py-3 px-4">{subjectTasks.length}</td>
                            <td className="py-3 px-4">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="h-2.5 rounded-full" 
                                  style={{
                                    width: `${Math.min(100, (subjectTasks.length / 10) * 100)}%`,
                                    backgroundColor: getSubjectColor(subject, subjects)
                                  }}
                                ></div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {calculateAverageTime(subjectTasks)}
                            </td>
                            <td className="py-3 px-4">
                              {lastTask?.updatedAt 
                                ? formatDate(new Date(lastTask.updatedAt))
                                : 'N/A'
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              {subjects?.map((subject: any) => (
                <TabsContent key={subject.id} value={subject.name}>
                  <SubjectDetailView 
                    subject={subject.name}
                    tasks={tasksBySubject[subject.name] || []}
                    color={getSubjectColor(subject.name, subjects)}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Cognitive Load Analysis</CardTitle>
            <CardDescription>Track how you're distributing your learning efforts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="mb-2 p-2 bg-blue-100 rounded-full">
                  <BrainIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium mb-1">Knowledge Tasks</h3>
                <p className="text-sm text-gray-600 mb-3 text-center">
                  Facts, concepts, principles you've mastered
                </p>
                <div className="text-3xl font-bold text-blue-700">
                  {Math.round(completedTasks.filter((t: any) => 
                    ['Mathematics', 'Science', 'History', 'English'].includes(t.subject)
                  ).length / Math.max(1, completedTasks.length) * 100)}%
                </div>
              </div>
              
              <div className="flex flex-col items-center bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="mb-2 p-2 bg-purple-100 rounded-full">
                  <BookOpenIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium mb-1">Skills Development</h3>
                <p className="text-sm text-gray-600 mb-3 text-center">
                  Practical abilities you've been working on
                </p>
                <div className="text-3xl font-bold text-purple-700">
                  {Math.round(completedTasks.filter((t: any) => 
                    ['Life Skills', 'Physical Activity'].includes(t.subject)
                  ).length / Math.max(1, completedTasks.length) * 100)}%
                </div>
              </div>
              
              <div className="flex flex-col items-center bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="mb-2 p-2 bg-green-100 rounded-full">
                  <DownloadIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-1">Personal Growth</h3>
                <p className="text-sm text-gray-600 mb-3 text-center">
                  Interest-driven and passion projects
                </p>
                <div className="text-3xl font-bold text-green-700">
                  {Math.round(completedTasks.filter((t: any) => 
                    ['Interest / Passion'].includes(t.subject)
                  ).length / Math.max(1, completedTasks.length) * 100)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Parent Report Section */}
        {activeTab === 'parent-report' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl text-primary">Learning Progress Report</CardTitle>
                    <CardDescription>
                      AI-Generated insights about Emma's learning journey and progress
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <FileTextIcon className="h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Share2 className="h-4 w-4" />
                      Share Report
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Overall Progress Insights */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <School className="mr-2 h-5 w-5 text-primary" />
                        Overall Learning Progress
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <h4 className="font-medium text-gray-700 mb-2">Key Strengths</h4>
                          <p className="text-gray-600">{studentLearningReport.overall_progress.strengths}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-medium text-gray-700 mb-2">Learning Style</h4>
                            <p className="text-gray-600">{studentLearningReport.overall_progress.learning_style}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-medium text-gray-700 mb-2">Engagement Patterns</h4>
                            <p className="text-gray-600">{studentLearningReport.overall_progress.engagement}</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <h4 className="font-medium text-gray-700 mb-2">Growth Opportunities</h4>
                          <p className="text-gray-600">{studentLearningReport.overall_progress.growth_areas}</p>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <h4 className="font-medium text-blue-800 mb-2">Recommendations for Parents</h4>
                          <p className="text-blue-700">{studentLearningReport.overall_progress.recommendations}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <TargetIcon className="mr-2 h-5 w-5 text-primary" />
                        Learning Skill Development
                      </h3>
                      
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart outerRadius={90} data={studentLearningReport.learning_patterns}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="name" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar
                              name="Skills"
                              dataKey="value"
                              stroke="#8884d8"
                              fill="#8884d8"
                              fillOpacity={0.6}
                            />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subject Breakdown */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <BookOpenIcon className="mr-2 h-5 w-5 text-primary" />
                      Subject Insights
                    </h3>
                    
                    <div className="space-y-4">
                      {Object.entries(studentLearningReport.subjects).map(([subject, data]: [string, any]) => (
                        <Card key={subject} className="overflow-hidden">
                          <CardHeader className="py-3 px-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: getSubjectColor(subject, subjects || []) }}
                                />
                                <CardTitle className="text-md">{subject}</CardTitle>
                              </div>
                              <Badge variant="outline">{
                                tasksBySubject[subject]?.length || 0
                              } tasks</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 text-sm space-y-2">
                            <div>
                              <h4 className="font-medium mb-1">Strengths:</h4>
                              <p className="text-gray-600">{data.strengths}</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Areas for Growth:</h4>
                              <p className="text-gray-600">{data.areas_for_growth}</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Subject Connections:</h4>
                              <p className="text-gray-600">{data.connections}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="border-t p-4 bg-gray-50">
                <div className="flex justify-between items-center w-full">
                  <div className="text-sm text-gray-500">
                    <p>Generated on {new Date().toLocaleDateString()}</p>
                    <p>This report combines task data with AI analysis to provide educational insights</p>
                  </div>
                  <Button
                    onClick={generateParentInsights}
                    disabled={parentInsightsLoading}
                    size="sm"
                  >
                    {parentInsightsLoading ? (
                      <>Generating... <ActivityIcon className="ml-2 h-4 w-4 animate-spin" /></>
                    ) : (
                      <>Refresh Insights <PenToolIcon className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cross-Subject Connections</CardTitle>
                <CardDescription>
                  AI-detected patterns showing how skills in one subject transfer to others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Mathematics → Science</h3>
                    <p className="text-blue-700">Strong mathematical skills are directly enhancing data analysis and interpretation in science tasks. Algebraic problem-solving translates well to scientific hypothesis testing.</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <h3 className="text-lg font-medium text-purple-800 mb-2">Physical Activity → Focus & Attention</h3>
                    <p className="text-purple-700">Regular engagement in physical activities correlates with improved focus during academic tasks. Task completion rates are 23% higher on days with physical activity.</p>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <h3 className="text-lg font-medium text-amber-800 mb-2">Life Skills → Organization</h3>
                    <p className="text-amber-700">Time management practice in Life Skills subjects is positively impacting organization across all academic areas, resulting in more consistent task completion patterns.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

// Helper component for subject detail view
function SubjectDetailView({ subject, tasks, color }: { subject: string, tasks: any[], color: string }) {
  // No tasks
  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center">
        <BookOpenIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500">No tasks completed for {subject} yet</p>
        <p className="text-gray-400 text-sm">Complete tasks with this subject to see analytics</p>
      </div>
    );
  }
  
  // Weekly distribution
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  const weeklyProgress = daysOfWeek.map((day, index) => {
    const date = new Date();
    date.setDate(today.getDate() - (dayOfWeek - index));
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    
    const tasksCompleted = tasks.filter((task: any) => {
      const taskDate = new Date(task.updatedAt);
      return taskDate >= date && taskDate < nextDate;
    }).length;
    
    return {
      name: day.substring(0, 3),
      tasks: tasksCompleted,
    };
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: color }} />
        <h3 className="text-xl font-semibold">{subject} Performance</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calculateAverageTime(tasks)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatDate(new Date(tasks[0].updatedAt))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" name="Tasks Completed" fill={color} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.slice(0, 5).map((task: any, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3">
                <div>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-gray-500">
                    {formatDate(new Date(task.updatedAt))}
                  </div>
                </div>
                <div>
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate average time
function calculateAverageTime(tasks: any[]) {
  const tasksWithDates = tasks.filter(t => t.createdAt && t.completedAt);
  if (tasksWithDates.length === 0) return 'N/A';
  
  const totalMs = tasksWithDates.reduce((acc, task) => {
    const created = new Date(task.createdAt).getTime();
    const completed = new Date(task.completedAt || task.updatedAt).getTime();
    return acc + (completed - created);
  }, 0);
  
  const avgMs = totalMs / tasksWithDates.length;
  const hours = Math.floor(avgMs / (1000 * 60 * 60));
  const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Helper function to format date
function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric'
  }).format(date);
}