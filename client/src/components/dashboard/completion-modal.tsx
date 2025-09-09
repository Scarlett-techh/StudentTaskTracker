import { useState, useRef, FC } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Paperclip, X, Image, FileText, Upload, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onComplete: (proofUrls: string[]) => void;
}

const CompletionModal: FC<CompletionModalProps> = ({ 
  open, 
  onOpenChange, 
  task,
  onComplete 
}) => {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      const validFiles: File[] = [];
      const newPreviewUrls: string[] = [];

      files.forEach((file) => {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is too large. Maximum file size is 10MB.`,
            variant: "destructive",
          });
          return;
        }

        validFiles.push(file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviewUrls[files.indexOf(file)] = reader.result as string;
            // Update state when all image previews are ready
            if (newPreviewUrls.filter(url => url !== undefined).length === validFiles.filter(f => f.type.startsWith('image/')).length) {
              setPreviewUrls([...previewUrls, ...newPreviewUrls.filter(url => url)]);
            }
          };
          reader.readAsDataURL(file);
        } else {
          newPreviewUrls[files.indexOf(file)] = '';
        }
      });

      setSelectedFiles([...selectedFiles, ...validFiles]);
      
      // If no images, update preview URLs immediately
      if (validFiles.every(file => !file.type.startsWith('image/'))) {
        setPreviewUrls([...previewUrls, ...newPreviewUrls]);
      }
    }
  };

  // Upload proof and complete task
  const handleCompleteTask = async () => {
    setIsUploading(true);

    try {
      const proofUrls: string[] = [];

      // Upload files if selected
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);

          const response = await apiRequest("POST", "/api/upload", formData);

          if (response && response.url) {
            proofUrls.push(response.url);
          } else {
            throw new Error(`Invalid response from server for file ${file.name} - no URL returned`);
          }
        }
      }

      // Complete task with or without proof
      onComplete(proofUrls);
      onOpenChange(false);

      toast({
        title: "Task completed!",
        description: proofUrls.length > 0 
          ? `Your task has been marked as completed with ${proofUrls.length} proof file(s).` 
          : "Your task has been marked as completed.",
      });
    } catch (error: any) {
      console.error("Proof upload error:", error);
      toast({
        title: "Error uploading proof",
        description: error.message || "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke URL to prevent memory leaks for image previews
    if (previewUrls[index] && previewUrls[index].startsWith('blob:')) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-0 rounded-xl shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Complete Task
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Mark this task as completed. You can upload proof of your work (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-blue-800 mt-1">{task.description}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Upload proof of completion (optional):</p>

            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={triggerFileInput}
            >
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB (multiple files allowed)</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf"
                multiple
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Selected files ({selectedFiles.length}):
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-red-500 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative bg-gray-50 p-2 rounded border">
                      <button 
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100 z-10"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {previewUrls[index] ? (
                        <div className="flex flex-col items-center">
                          <img 
                            src={previewUrls[index]} 
                            alt={`Preview ${index + 1}`} 
                            className="h-16 w-auto object-contain mb-1 rounded" 
                          />
                          <span className="text-xs text-gray-500 truncate w-full text-center">
                            {file.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <FileText className="h-16 w-16 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500 truncate w-full text-center">
                            {file.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="btn-bounce border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCompleteTask}
            disabled={isUploading}
            className="btn-bounce bg-emerald-600 hover:bg-emerald-700"
          >
            {isUploading ? (
              <>Uploading...</>
            ) : (
              <>Mark as Completed</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionModal;