import { FC, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud } from "lucide-react";

const photoFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().optional(),
  taskId: z.string().optional(),
});

type PhotoFormValues = z.infer<typeof photoFormSchema>;

interface PhotoUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PhotoUpload: FC<PhotoUploadProps> = ({ onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get subjects for dropdown
  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
  });

  // Get tasks for dropdown (optional, for associating photos with tasks)
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
  });

  // Initialize form
  const form = useForm<PhotoFormValues>({
    resolver: zodResolver(photoFormSchema),
    defaultValues: {
      title: "",
      subject: "",
      taskId: "",
    },
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "The maximum file size is 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Update form title with filename if empty
      if (!form.getValues("title")) {
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        form.setValue("title", fileName);
      }
    }
  };

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Sending photo data:", {
        title: data.get('title'),
        subject: data.get('subject'),
        taskId: data.get('taskId'),
        fileExists: data.get('file') !== null
      });
      
      const response = await fetch("/api/photos", {
        method: "POST",
        body: data,
        // Don't set Content-Type header, let the browser set it with the boundary
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Photo upload error:", errorText);
        throw new Error(errorText || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({
        title: "Photo uploaded",
        description: "Your photo has been uploaded successfully.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error uploading photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PhotoFormValues) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", data.title);
    
    if (data.subject) {
      formData.append("subject", data.subject);
    }
    
    if (data.taskId) {
      formData.append("taskId", data.taskId);
    }
    
    uploadPhotoMutation.mutate(formData);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div 
          className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
            selectedFile ? "border-primary" : "border-gray-300"
          }`}
          onClick={triggerFileInput}
        >
          <div className="space-y-1 text-center">
            {previewUrl ? (
              <div className="flex flex-col items-center">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="mx-auto h-32 w-auto object-contain" 
                />
                <p className="text-sm text-gray-500 mt-2">{selectedFile?.name}</p>
              </div>
            ) : (
              <>
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photo Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter photo title" {...field} />
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
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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

          <FormField
            control={form.control}
            name="taskId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Task (Optional)</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {tasks?.map((task: any) => (
                      <SelectItem key={task.id} value={String(task.id)}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            disabled={uploadPhotoMutation.isPending || !selectedFile}
          >
            {uploadPhotoMutation.isPending ? "Uploading..." : "Upload Photo"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PhotoUpload;
