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
  onComplete: (proofUrl: string) => void;
}

const CompletionModal: FC<CompletionModalProps> = ({ 
  open, 
  onOpenChange, 
  task,
  onComplete 
}) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Create preview for images
      if (file.type.startsWith('image/')) {
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

  // Upload proof and complete task
  const handleCompleteTask = async () => {
    setIsUploading(true);

    try {
      let proofUrl = "";

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        // Use the correct endpoint /api/upload instead of /api/upload/proof
        const response = await apiRequest("POST", "/api/upload", formData);

        if (response && response.url) {
          proofUrl = response.url;
        } else {
          throw new Error("Invalid response from server - no URL returned");
        }
      }

      // Complete task with or without proof
      onComplete(proofUrl);
      onOpenChange(false);

      toast({
        title: "Task completed!",
        description: selectedFile 
          ? "Your task has been marked as completed with proof." 
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
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

            {!selectedFile ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={triggerFileInput}
              >
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,application/pdf"
                />
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-md relative">
                <button 
                  onClick={clearSelection}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>

                {previewUrl ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="h-28 w-auto object-contain mb-2 rounded" 
                    />
                    <span className="text-xs text-gray-500">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <FileText className="h-20 w-20 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">{selectedFile.name}</span>
                  </div>
                )}
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