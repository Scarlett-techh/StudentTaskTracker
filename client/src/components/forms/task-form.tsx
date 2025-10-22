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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();
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

  // ✅ FIXED: Enhanced task mutation with better error handling
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      console.log('➕ [TASK FORM] Creating/updating task:', data);

      // Combine date and time if both are provided
      let dueDate = null;
      if (data.dueDate) {
        if (data.dueTime) {
          dueDate = new Date(`${data.dueDate}T${data.dueTime}`).toISOString();
        } else {
          dueDate = new Date(data.dueDate).toISOString();
        }
      }

      const taskData = {
        title: data.title,
        description: data.description || "",
        subject: data.subject || "general",
        resourceLink: data.resourceLink || "",
        status: data.status,
        dueDate: dueDate,
      };

      console.log('📤 [TASK FORM] Sending task data:', taskData);

      if (isEditing) {
        const response = await apiClient(`/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify(taskData),
        });
        return response;
      } else {
        const response = await apiClient("/tasks", {
          method: "POST",
          body: JSON.stringify(taskData),
        });
        return response;
      }
    },
    onSuccess: (data) => {
      console.log('✅ [TASK FORM] Task operation successful:', data);

      if (!data) {
        console.error('❌ [TASK FORM] No data returned from server');
        toast({
          title: "Error",
          description: "No data returned from server",
          variant: "destructive",
        });
        return;
      }

      // ✅ FIXED: Use invalidateQueries instead of refetch to handle the update
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })
        .then(() => {
          console.log('✅ [TASK FORM] Tasks query invalidated successfully');

          toast({
            title: isEditing ? "Task updated" : "Task created",
            description: isEditing 
              ? "Your task has been updated successfully." 
              : "Your new task has been created.",
          });

          if (onSuccess) {
            console.log('✅ [TASK FORM] Calling onSuccess callback');
            onSuccess();
          }
        })
        .catch((error) => {
          console.error('❌ [TASK FORM] Error invalidating tasks query:', error);
          toast({
            title: "Task created but failed to refresh list",
            description: "The task was created successfully, but we couldn't refresh the list. Please refresh the page.",
            variant: "default",
          });

          // Still call onSuccess even if refresh fails
          if (onSuccess) onSuccess();
        });
    },
    onError: (error: any) => {
      console.error('❌ [TASK FORM] Task operation failed:', error);

      let errorMessage = error.message || "An unexpected error occurred";

      // Provide more user-friendly error messages
      if (errorMessage.includes("401")) {
        errorMessage = "Your session has expired. Please log in again.";
      } else if (errorMessage.includes("Network")) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      toast({
        title: isEditing ? "Error updating task" : "Error creating task",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    console.log('📝 [TASK FORM] Form submitted:', data);
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
                <FormLabel>Task Title *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter task title" 
                    {...field} 
                    disabled={createTaskMutation.isPending}
                  />
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
                    disabled={createTaskMutation.isPending}
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
                    placeholder="https://example.com (optional)"
                    {...field} 
                    disabled={createTaskMutation.isPending}
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
                    disabled={createTaskMutation.isPending}
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
                    disabled={createTaskMutation.isPending}
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
                    <Input 
                      type="date" 
                      {...field} 
                      disabled={createTaskMutation.isPending}
                    />
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
                    <Input 
                      type="time" 
                      {...field} 
                      disabled={createTaskMutation.isPending}
                    />
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
              disabled={createTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createTaskMutation.isPending}
              className="min-w-24"
            >
              {createTaskMutation.isPending 
                ? (isEditing ? "Updating..." : "Creating...") 
                : (isEditing ? "Update Task" : "Create Task")
              }
            </Button>
          </div>

          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <div className="font-semibold">Debug Info:</div>
              <div>Mutation Status: {createTaskMutation.status}</div>
              <div>Is Pending: {createTaskMutation.isPending ? 'Yes' : 'No'}</div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default TaskForm;