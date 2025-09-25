// client/src/components/forms/task-form.tsx
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Extend the schema with validation
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  subject: z.string().optional(),
  resourceLink: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  status: z.enum(["pending", "in-progress", "completed"]),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  category: z.string().optional(), // Added category field for consistency with other components
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  task?: TaskFormValues & { id: number };
  initialValues?: Partial<TaskFormValues>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Predefined subjects with categories
const PREDEFINED_SUBJECTS = [
  { id: "1", name: "Mathematics", category: "Math", color: "#3B82F6" },
  {
    id: "2",
    name: "English/Language Arts",
    category: "Language",
    color: "#10B981",
  },
  { id: "3", name: "Science", category: "Science", color: "#F59E0B" },
  { id: "4", name: "History", category: "Social Studies", color: "#EF4444" },
  {
    id: "5",
    name: "Social Studies",
    category: "Social Studies",
    color: "#8B5CF6",
  },
  {
    id: "6",
    name: "Physical Education (P.E.)",
    category: "Physical Education",
    color: "#EC4899",
  },
  {
    id: "7",
    name: "Computer Science/Technology",
    category: "Technology",
    color: "#6366F1",
  },
  { id: "8", name: "Foreign Language", category: "Language", color: "#14B8A6" },
  { id: "9", name: "Art/Music", category: "Arts", color: "#F97316" },
  {
    id: "10",
    name: "Financial Literacy",
    category: "Life Skills",
    color: "#06B6D4",
  },
  { id: "11", name: "Health Education", category: "Health", color: "#84CC16" },
  { id: "12", name: "Geography", category: "Social Studies", color: "#64748B" },
];

const TaskForm: FC<TaskFormProps> = ({
  task,
  initialValues,
  onSuccess,
  onCancel,
}) => {
  const { toast } = useToast();
  const isEditing = !!task;

  // Initialize form with default values, initial values, or existing task
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      resourceLink: "",
      status: "pending",
      dueDate: "",
      dueTime: "",
      category: "",
      ...initialValues,
      ...(task
        ? {
            title: task.title,
            description: task.description,
            subject: task.subject,
            resourceLink: task.resourceLink,
            status: task.status,
            dueDate: task.dueDate,
            dueTime: task.dueTime,
            category: task.category,
          }
        : {}),
    },
  });

  // Reset form when task or initialValues change
  useEffect(() => {
    if (task || initialValues) {
      form.reset({
        title: task?.title || initialValues?.title || "",
        description: task?.description || initialValues?.description || "",
        subject: task?.subject || initialValues?.subject || "",
        resourceLink: task?.resourceLink || initialValues?.resourceLink || "",
        status: task?.status || initialValues?.status || "pending",
        dueDate: task?.dueDate || initialValues?.dueDate || "",
        dueTime: task?.dueTime || initialValues?.dueTime || "",
        category: task?.category || initialValues?.category || "",
      });
    }
  }, [task, initialValues, form]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      // Auto-set category based on subject if not provided
      const submittedData = {
        ...data,
        category:
          data.category ||
          PREDEFINED_SUBJECTS.find((sub) => sub.name === data.subject)
            ?.category ||
          "General",
      };

      if (isEditing) {
        return await apiRequest(
          "PATCH",
          `/api/tasks/${task.id}`,
          submittedData,
        );
      } else {
        return await apiRequest("POST", "/api/tasks", submittedData);
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

      // Invalidate and refetch tasks to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      // Also invalidate related queries that might be affected
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });

      toast({
        title: isEditing ? "Task updated" : "Task created",
        description: isEditing
          ? "Your task has been updated successfully."
          : "Your new task has been created successfully.",
      });

      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error("Task form error:", error);
      toast({
        title: isEditing ? "Error updating task" : "Error creating task",
        description:
          error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    createTaskMutation.mutate(data);
  };

  // Handle subject change to auto-set category
  const handleSubjectChange = (value: string) => {
    form.setValue("subject", value);
    if (value && value !== "none") {
      const selectedSubject = PREDEFINED_SUBJECTS.find(
        (sub) => sub.name === value,
      );
      if (selectedSubject && !form.getValues("category")) {
        form.setValue("category", selectedSubject.category);
      }
    }
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
                    placeholder="Add details about the task (what needs to be done, resources needed, etc.)"
                    className="resize-none h-24"
                    {...field}
                    disabled={createTaskMutation.isPending}
                  />
                </FormControl>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Optional</span>
                  <span>{field.value?.length || 0}/1000</span>
                </div>
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
                    disabled={createTaskMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select
                    onValueChange={handleSubjectChange}
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
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: subject.color }}
                            />
                            {subject.name}
                          </div>
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
                  <FormLabel>Status *</FormLabel>
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
                      <SelectItem value="pending">📝 Pending</SelectItem>
                      <SelectItem value="in-progress">
                        🔄 In Progress
                      </SelectItem>
                      <SelectItem value="completed">✅ Completed</SelectItem>
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

          {/* Hidden category field - auto-set based on subject */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input type="hidden" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4 border-t">
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
              className="min-w-[120px]"
            >
              {createTaskMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Task"
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TaskForm;
