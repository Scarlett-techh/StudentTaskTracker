import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Paperclip, Image, X, Upload, FileText } from "lucide-react";

interface TaskAttachmentSectionProps {
  taskId: number;
}

const TaskAttachmentSection = ({ taskId }: TaskAttachmentSectionProps) => {
  const { toast } = useToast();
  const [showAttachForm, setShowAttachForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing attachments for this task
  const {
    data: attachments = [],
    isLoading: isLoadingAttachments,
    refetch: refetchAttachments,
  } = useQuery({
    queryKey: [`/api/tasks/${taskId}/attachments`],
    enabled: !!taskId,
  });

  // Get photo details if needed
  const { data: photos = [] } = useQuery({
    queryKey: ["/api/photos"],
  });

  // Get note details if needed
  const { data: notes = [] } = useQuery({
    queryKey: ["/api/notes"],
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
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  // Upload attachment mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) return null;

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", selectedFile.name.split(".")[0] || "Attachment");
      formData.append("taskId", String(taskId));

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/tasks/${taskId}/attachments`],
      });
      refetchAttachments();

      toast({
        title: "File attached",
        description: "Your file has been attached to the task.",
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowAttachForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error attaching file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete attachment mutation
  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      const response = await fetch(`/api/task-attachments/${attachmentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tasks/${taskId}/attachments`],
      });
      refetchAttachments();

      toast({
        title: "Attachment removed",
        description: "The attachment has been removed from the task.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing attachment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAttach = () => {
    uploadMutation.mutate();
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowAttachForm(false);
  };

  // Find the associated photo or note for an attachment
  const getAttachmentDetails = (attachment: any) => {
    if (attachment.attachmentType === "photo" && attachment.photoId) {
      return photos.find((p: any) => p.id === attachment.photoId);
    } else if (attachment.attachmentType === "note" && attachment.noteId) {
      return notes.find((n: any) => n.id === attachment.noteId);
    }
    return null;
  };

  if (isLoadingAttachments) {
    return (
      <div className="mt-4 space-y-3">
        <div className="text-sm font-medium text-gray-700">Attachments</div>
        <div className="text-xs text-gray-500 italic">
          Loading attachments...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Attachments</h4>

        {!showAttachForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAttachForm(true)}
            className="h-7 px-2"
          >
            <Paperclip className="h-4 w-4 mr-1" />
            Attach
          </Button>
        )}
      </div>

      {/* Attachment form */}
      {showAttachForm && (
        <div className="border rounded-md p-3 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerFileInput}
              className="h-7 px-2"
            >
              <Image className="h-4 w-4 mr-1" />
              Select File
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />

            <div className="text-xs text-gray-500 flex-1 truncate">
              {selectedFile ? selectedFile.name : "No file selected"}
            </div>
          </div>

          {previewUrl && (
            <div className="mb-3">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-24 w-auto object-contain border rounded"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-7 px-2"
            >
              Cancel
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleAttach}
              disabled={!selectedFile || uploadMutation.isPending}
              className="h-7 px-2"
            >
              {uploadMutation.isPending ? "Attaching..." : "Attach File"}
            </Button>
          </div>
        </div>
      )}

      {/* Attachments list */}
      {Array.isArray(attachments) && attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment: any) => {
            const details = getAttachmentDetails(attachment);
            return (
              <div
                key={attachment.id}
                className="flex items-center justify-between border rounded-md p-2 text-sm"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {attachment.attachmentType === "photo" ? (
                    <Image className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}

                  <span className="truncate">
                    {details
                      ? details.title
                      : `${attachment.attachmentType} #${attachment.photoId || attachment.noteId}`}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(attachment.id)}
                  disabled={deleteMutation.isPending}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-gray-500 italic">No attachments yet</div>
      )}
    </div>
  );
};

export default TaskAttachmentSection;
