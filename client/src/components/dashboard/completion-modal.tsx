import { useState, useRef, FC, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Paperclip, X, Image, FileText, Upload, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onComplete: (proofUrls: string[], previewUrls: string[]) => void;
}

interface FileWithPreview {
  file: File;
  previewUrl: string;
}

const CompletionModal: FC<CompletionModalProps> = ({ 
  open, 
  onOpenChange, 
  task,
  onComplete 
}) => {
  const { toast } = useToast();
  const [filesWithPreviews, setFilesWithPreviews] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      filesWithPreviews.forEach(({ previewUrl }) => {
        if (previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setFilesWithPreviews([]);
      setCurrentPreviewIndex(0);
    }
  }, [open]);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const newFiles: FileWithPreview[] = [];

    Array.from(event.target.files).forEach((file) => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum file size is 10MB.`,
          variant: "destructive",
        });
        return;
      }

      // Create preview for images
      let previewUrl = '';
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      newFiles.push({ file, previewUrl });
    });

    setFilesWithPreviews(prev => [...prev, ...newFiles]);
  };

  // Upload proof and complete task
  const handleCompleteTask = async () => {
    setIsUploading(true);

    try {
      const proofUrls: string[] = [];
      const previewUrls: string[] = [];

      // Upload files if selected
      if (filesWithPreviews.length > 0) {
        for (const { file, previewUrl } of filesWithPreviews) {
          const formData = new FormData();
          formData.append("file", file);

          const response = await apiRequest("POST", "/api/upload", formData);

          if (response && response.url) {
            proofUrls.push(response.url);
            previewUrls.push(previewUrl); // Store preview URLs for immediate display
          } else {
            throw new Error(`Invalid response from server for file ${file.name} - no URL returned`);
          }
        }
      }

      // Complete task with or without proof
      onComplete(proofUrls, previewUrls);
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
    // Revoke all object URLs
    filesWithPreviews.forEach(({ previewUrl }) => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    });

    setFilesWithPreviews([]);
    setCurrentPreviewIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = filesWithPreviews[index];

    // Revoke URL to prevent memory leaks for image previews
    if (fileToRemove.previewUrl && fileToRemove.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }

    setFilesWithPreviews(prev => prev.filter((_, i) => i !== index));

    // Adjust current preview index if needed
    if (currentPreviewIndex >= index && currentPreviewIndex > 0) {
      setCurrentPreviewIndex(prev => prev - 1);
    }
  };

  const handleNextPreview = () => {
    if (currentPreviewIndex < filesWithPreviews.length - 1) {
      setCurrentPreviewIndex(currentPreviewIndex + 1);
    }
  };

  const handlePrevPreview = () => {
    if (currentPreviewIndex > 0) {
      setCurrentPreviewIndex(currentPreviewIndex - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-0 rounded-xl shadow-lg sm:max-w-2xl">
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

            {filesWithPreviews.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Selected files ({filesWithPreviews.length}):
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

                {/* Large Preview Area */}
                <div className="bg-gray-100 rounded-lg p-4 relative">
                  {filesWithPreviews.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80"
                        onClick={handlePrevPreview}
                        disabled={currentPreviewIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80"
                        onClick={handleNextPreview}
                        disabled={currentPreviewIndex === filesWithPreviews.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {filesWithPreviews[currentPreviewIndex].previewUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={filesWithPreviews[currentPreviewIndex].previewUrl} 
                        alt={`Preview ${currentPreviewIndex + 1}`} 
                        className="h-40 w-auto object-contain mb-2 rounded" 
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        {filesWithPreviews[currentPreviewIndex].file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({currentPreviewIndex + 1} of {filesWithPreviews.length})
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FileText className="h-24 w-24 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-700 font-medium">
                        {filesWithPreviews[currentPreviewIndex].file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({currentPreviewIndex + 1} of {filesWithPreviews.length})
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Grid */}
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {filesWithPreviews.map(({ file, previewUrl }, index) => (
                    <div 
                      key={index} 
                      className={`relative bg-gray-50 p-1 rounded border cursor-pointer ${index === currentPreviewIndex ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setCurrentPreviewIndex(index)}
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm hover:bg-gray-100 z-10"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt={`Thumbnail ${index + 1}`} 
                          className="h-12 w-full object-cover rounded" 
                        />
                      ) : (
                        <div className="h-12 w-full flex items-center justify-center bg-gray-100 rounded">
                          <FileText className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="text-xs text-gray-500 truncate text-center mt-1">
                        {file.name.length > 12 ? file.name.substring(0, 9) + '...' : file.name}
                      </div>
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