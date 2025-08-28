import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  FileText, 
  BarChart, 
  Award, 
  Clock, 
  AlertCircle,
  CalendarClock,
  BookOpen,
  GraduationCap,
  CircleCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

// Parent Dashboard Component
const ParentDashboard = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', accessCode: '' });
  
  // Parent access credentials (would be stored on server in real implementation)
  const validCredentials = {
    email: 'parent@example.com',
    accessCode: '123456'
  };
  
  // Mock data for student activity (would come from backend API in real implementation)
  const { data: tasks = [] } = useQuery({ 
    queryKey: ['/api/tasks'],
    enabled: isAuthenticated
  });
  
  const { data: notes = [] } = useQuery({ 
    queryKey: ['/api/notes'],
    enabled: isAuthenticated
  });
  
  const { data: portfolioItems = [] } = useQuery({ 
    queryKey: ['/api/portfolio'],
    enabled: isAuthenticated,
    // This is a mock implementation since we don't have a real portfolio API yet
    queryFn: () => {
      return Promise.resolve([
        {
          id: 1,
          title: "Math Final Exam",
          description: "Scored 95% on the final algebra exam",
          type: "test",
          score: "95%",
          subject: "Mathematics",
          date: "2025-04-15"
        },
        {
          id: 2,
          title: "Science Project: Photosynthesis",
          description: "Built a model demonstrating the process of photosynthesis in plants",
          type: "task",
          subject: "Science",
          date: "2025-03-20"
        }
      ]);
    }
  });
  
  // Time spent data (would come from backend in real implementation)
  const timeSpentData = {
    brain: 12.5, // hours
    body: 8.2,
    space: 5.3,
    total: 26.0
  };
  
  // Calculated progress/completion rates
  const completionRates = {
    tasks: tasks.filter((t: any) => t.status === 'completed').length / (tasks.length || 1) * 100,
    brain: tasks.filter((t: any) => t.category === 'brain' && t.status === 'completed').length / 
           (tasks.filter((t: any) => t.category === 'brain').length || 1) * 100,
    body: tasks.filter((t: any) => t.category === 'body' && t.status === 'completed').length / 
          (tasks.filter((t: any) => t.category === 'body').length || 1) * 100,
    space: tasks.filter((t: any) => t.category === 'space' && t.status === 'completed').length / 
           (tasks.filter((t: any) => t.category === 'space').length || 1) * 100
  };
  
  // Recent activity (tasks, notes, portfolio combined)
  const recentActivity = [
    ...tasks.map((task: any) => ({
      id: `task-${task.id}`,
      title: task.title,
      type: 'task',
      status: task.status,
      category: task.category,
      date: new Date(task.updatedAt || task.createdAt).toISOString(),
      icon: <CheckCircle className={task.status === 'completed' ? 'text-green-500' : 'text-blue-500'} />
    })),
    ...notes.map((note: any) => ({
      id: `note-${note.id}`,
      title: note.title,
      type: 'note',
      date: new Date(note.updatedAt || note.createdAt).toISOString(),
      icon: <FileText className="text-amber-500" />
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 5);
  
  // Handle login form changes
  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value
    });
  };
  
  // Handle login submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginData.email === validCredentials.email && 
        loginData.accessCode === validCredentials.accessCode) {
      setIsAuthenticated(true);
      setLoginDialogOpen(false);
      toast({
        title: "Login successful",
        description: "Welcome to the parent dashboard.",
      });
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or access code. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginDialogOpen(true);
    setLoginData({ email: '', accessCode: '' });
  };
  
  if (!isAuthenticated) {
    return (
      <>
        
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Parent Access</h1>
            <p className="text-muted-foreground">
              Monitor your student's progress and achievements
            </p>
          </div>
          
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Parent Login</CardTitle>
              <CardDescription>
                Enter your email and access code provided by your student.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    placeholder="youremail@example.com"
                    value={loginData.email}
                    onChange={handleLoginInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Access Code</Label>
                  <Input 
                    id="accessCode"
                    name="accessCode"
                    type="text"
                    placeholder="Enter the 6-digit code"
                    value={loginData.accessCode}
                    onChange={handleLoginInputChange}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col">
              <p className="text-xs text-muted-foreground text-center">
                For demonstration purposes, use:<br />
                Email: parent@example.com<br />
                Access Code: 123456
              </p>
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }
  
  return (
    <>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Parent Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor your student's progress and achievements
            </p>
          </div>
          
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
        
        {/* Progress Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasks.filter((t: any) => t.status === 'completed').length}/{tasks.length}
              </div>
              <Progress value={completionRates.tasks} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {completionRates.tasks.toFixed(0)}% completion rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Time Spent This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {timeSpentData.total.toFixed(1)} hrs
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                <div className="flex justify-between">
                  <span>Brain (Mental):</span>
                  <span>{timeSpentData.brain.toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Body (Physical):</span>
                  <span>{timeSpentData.body.toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Space (Environment):</span>
                  <span>{timeSpentData.space.toFixed(1)} hrs</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portfolioItems.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {portfolioItems.length > 0 ? (
                  <p>Latest: {portfolioItems[0].title}</p>
                ) : (
                  <p>No achievements recorded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Notes Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notes.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {notes.length > 0 ? (
                  <p>Most recent: {new Date(notes[0].updatedAt || notes[0].createdAt).toLocaleDateString()}</p>
                ) : (
                  <p>No notes created yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No recent activity found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className="mt-0.5">
                        {activity.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{activity.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded-sm">
                            {activity.type}
                          </span>
                          {activity.status && (
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded-sm">
                              {activity.status}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Activity</Button>
            </CardFooter>
          </Card>
          
          {/* Category Breakdown */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Progress By Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Brain (Mental)</span>
                  </div>
                  <span className="text-sm">{completionRates.brain.toFixed(0)}%</span>
                </div>
                <Progress value={completionRates.brain} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">Body (Physical)</span>
                  </div>
                  <span className="text-sm">{completionRates.body.toFixed(0)}%</span>
                </div>
                <Progress value={completionRates.body} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-sm">Space (Environment)</span>
                  </div>
                  <span className="text-sm">{completionRates.space.toFixed(0)}%</span>
                </div>
                <Progress value={completionRates.space} className="h-2" />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Detailed Analytics</Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Portfolio & Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio & Achievements</CardTitle>
          </CardHeader>
          
          <CardContent>
            {portfolioItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No portfolio items or achievements found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolioItems.map((item: any) => (
                  <Card key={item.id} className="border shadow-none">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start gap-3">
                        {item.type === 'test' ? (
                          <BarChart className="h-5 w-5 text-red-500 mt-0.5" />
                        ) : (
                          <Award className="h-5 w-5 text-amber-500 mt-0.5" />
                        )}
                        <div>
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          {item.subject && (
                            <CardDescription className="text-xs">
                              {item.subject}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-2">
                      {item.score && (
                        <div className="mb-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                          Score: {item.score}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                    
                    <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
                      Added: {new Date(item.date).toLocaleDateString()}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button variant="outline" className="w-full">View Full Portfolio</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default ParentDashboard;