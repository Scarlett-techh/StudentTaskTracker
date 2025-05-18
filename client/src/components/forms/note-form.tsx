import { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extend the schema with validation
const noteFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  subject: z.string().optional(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  note?: NoteFormValues & { id: number };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const NoteForm: FC<NoteFormProps> = ({ note, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const isEditing = !!note;

  // Get subjects for dropdown
  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  // Initialize form with default values or existing note
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: note?.title || "",
      content: note?.content || "",
      subject: note?.subject || "",
    },
  });

  // Create/update note mutation
  const noteFormMutation = useMutation({
    mutationFn: async (data: NoteFormValues) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/notes/${note.id}`, data);
      } else {
        return apiRequest("POST", "/api/notes", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: isEditing ? "Note updated" : "Note created",
        description: isEditing 
          ? "Your note has been updated successfully." 
          : "Your new note has been created.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: isEditing ? "Error updating note" : "Error creating note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NoteFormValues) => {
    noteFormMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter note title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Write your note here..." 
                  className="note-editor min-h-[150px]"
                  {...field} 
                />
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
              <Select 
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {subjects?.map((subject: any) => (
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
            disabled={noteFormMutation.isPending}
          >
            {noteFormMutation.isPending 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update Note" : "Create Note")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NoteForm;
