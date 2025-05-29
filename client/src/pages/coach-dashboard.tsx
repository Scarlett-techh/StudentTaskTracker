import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, BookOpen, CheckCircle, Clock, Target } from "lucide-react";

const assignTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  subject: z.string().optional(),
  resourceLink: z.string().url().optional().or(z.literal("")),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  selectedStudents: z.array(z.string()).min(1, "Please select at least one student"),
});

type AssignTaskForm = z.infer<typeof assignTaskSchema>;

const CoachDashboard = () => {
  const { toast } = useToast();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const form = useForm<AssignTaskForm>({
    resolver: zodResolver(assignTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      resourceLink: "",
      dueDate: "",
      dueTime: "",
      selectedStudents: [],
    },
  });

  // Query for coach's students and their tasks
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/coach/students'],
    retry: false,
  });

  const { data: coachStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/coach/stats'],
    retry: false,
  });

  const assignTaskMutation = useMutation({
    mutationFn: async (data: AssignTaskForm) => {
      const response = await apiRequest('POST', '/api/coach/assign-task', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task assigned successfully!",
        description: "The task has been sent to the student.",
      });
      setIsAssignDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/coach/students'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign task",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssignTaskForm) => {
    assignTaskMutation.mutate(data);
  };

  const subjects = [
    "Mathematics", "Science", "English", "History", 
    "Physical Activity", "Life Skills", "Interest / Passion", 
    "Art", "Game Design", "Coding"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Helmet>
        <title>Coach Dashboard | Student Tracker</title>
        <meta name="description" content="Learning coach dashboard to assign tasks and track student progress." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
            <p className="text-gray-600 mt-2">Assign tasks and track your students' progress</p>
          </div>
          
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Assign Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign New Task</DialogTitle>
                <DialogDescription>
                  Create and assign a task to a student. They'll receive it in their task list.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Task Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="What should the student do?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="selectedStudents"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Select Students *</FormLabel>
                          <FormControl>
                            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                              {studentsLoading ? (
                                <p className="text-gray-500">Loading students...</p>
                              ) : students && students.length > 0 ? (
                                students.map((student: any) => (
                                  <div key={student.email} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={student.email}
                                      checked={field.value?.includes(student.email) || false}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...(field.value || []), student.email]
                                          : (field.value || []).filter((email: string) => email !== student.email);
                                        field.onChange(updatedValue);
                                        setSelectedStudents(updatedValue);
                                      }}
                                    />
                                    <Label htmlFor={student.email} className="text-sm font-normal">
                                      {student.name || student.username} ({student.email})
                                    </Label>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500">No students available. Students will appear here once you assign them tasks.</p>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject} value={subject}>
                                  {subject}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional details or instructions..." 
                            className="resize-none" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dueTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="resourceLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resource Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/resource" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAssignDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={assignTaskMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {assignTaskMutation.isPending ? "Assigning..." : "Assign Task"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : (coachStats?.totalStudents || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Assigned</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : (coachStats?.tasksAssigned || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : (coachStats?.completedToday || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : (coachStats?.pendingTasks || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Students</CardTitle>
            <CardDescription>
              View and manage your students' progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : !students || students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No students yet</h3>
                <p>Students will appear here when they join your coaching program.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {student.name?.[0] || student.username[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{student.name || student.username}</h4>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="text-center">
                        <div className="font-medium">{student.stats?.tasksCompleted || 0}</div>
                        <div>Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{student.stats?.points || 0}</div>
                        <div>Points</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{student.stats?.streak || 0}</div>
                        <div>Streak</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoachDashboard;