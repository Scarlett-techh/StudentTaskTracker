// client/src/components/forms/task-form.tsx
import { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extend the schema with validation
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subject: z.string().optional(),
  resourceLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  status: z.enum(["pending", "in-progress", "completed"]),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  task?: TaskFormValues & { id: number };
  initialValues?: Partial<TaskFormValues>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Predefined subjects
const PREDEFINED_SUBJECTS = [
  { id: "1", name: "Mathematics", color: "#3B82F6" },
  { id: "2", name: "English/Language Arts", color: "#10B981" },
  { id: "3", name: "Science", color: "#F59E0B" },
  { id: "4", name: "History", color: "#EF4444" },
  { id: "5", name: "Social Studies", color: "#8B5CF6" },
  { id: "6", name: "Physical Education (P.E.)", color: "#EC4899" },
  { id: "7", name: "Computer Science/Technology", color: "#6366F1" },
  { id: "8", name: "Foreign Language", color: "#14B8A6" },
  { id: "9", name: "Art/Music", color: "#F97316" },
  { id: "10", name: "Financial Literacy", color: "#06B6D4" },
  { id: "11", name: "Health Education", color: "#84CC16" },
  { id: "12", name: "Geography", color: "#64748B" },
];

const TaskForm: FC<TaskFormProps> = ({ task, initialValues, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const isEditing = !!task;

  // Initialize form with default values, initial values, or existing task
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || initialValues?.title || "",
      description: task?.description || initialValues?.description || "",
      subject: task?.subject || initialValues?.subject || "",
      resourceLink: task?.resourceLink || initialValues?.resourceLink || "",
      status: task?.status || initialValues?.status || "pending",
      dueDate: task?.dueDate || initialValues?.dueDate || "",
      dueTime: task?.dueTime || initialValues?.dueTime || "",
    },
  });

  // Create task mutation - FIXED
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/tasks/${task.id}`, data);
      } else {
        return await apiRequest("POST", "/api/tasks", data);
      }
    },
    onSuccess: (data) => {
      if (!data) {
        toast({
          title: "Error",
          description: "No data returned from server",
          variant: "destructive",
        });
        return;
      }

      // Update the query cache with the new task
      queryClient.setQueryData(["/api/tasks"], (oldData: any[] | undefined) => {
        if (isEditing) {
          return oldData ? oldData.map(task => task.id === data.id ? data : task) : [data];
        } else {
          // Ensure we're not adding undefined values
          return oldData ? [...oldData.filter(Boolean), data] : [data];
        }
      });

      toast({
        title: isEditing ? "Task updated" : "Task created",
        description: isEditing 
          ? "Your task has been updated successfully." 
          : "Your new task has been created.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Error updating task" : "Error creating task",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    createTaskMutation.mutate(data);
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add details about the task" 
                  className="resize-none h-20"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resourceLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resource Link</FormLabel>
              <FormControl>
                <Input 
                  type="url"
                  placeholder="https://example.com - Website or resource used for this task (optional)"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {PREDEFINED_SUBJECTS.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="flex justify-end space-x-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={createTaskMutation.isPending}
          >
            {createTaskMutation.isPending 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update Task" : "Create Task")
            }
          </Button>
        </div>
        </form>
      </Form>
    </div>
  );
};

export default TaskForm;