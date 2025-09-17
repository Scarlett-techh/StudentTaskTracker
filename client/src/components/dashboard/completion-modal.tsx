import { useState, useRef, FC, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Paperclip, X, Image, FileText, Upload, CheckCircle, Link, Text } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onComplete: (proofUrls: string[], previews: string[]) => void;
}

interface FileWithPreview {
  file: File;
  previewUrl: string;
}

// Second Navigation Tabs
const TABS = [
  { id: 'files', label: 'Files', icon: Paperclip },
  { id: 'text', label: 'Text', icon: Text },
  { id: 'links', label: 'Links', icon: Link }
];

const CompletionModal: FC<CompletionModalProps> = ({ 
  open, 
  onOpenChange, 
  task,
  onComplete 
}) => {
  const { toast } = useToast();
  const [filesWithPreviews, setFilesWithPreviews] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('files');
  const [textProof, setTextProof] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const proofSectionRef = useRef<HTMLDivElement>(null);

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

  // Handle adding new link field
  const addLinkField = () => {
    setLinks(prev => [...prev, '']);
  };

  // Handle removing link field
  const removeLinkField = (index: number) => {
    if (links.length === 1) {
      setLinks(['']);
    } else {
      setLinks(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Handle link input change
  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  // Upload proof and complete task
  const handleCompleteTask = async () => {
    setIsUploading(true);

    try {
      const proofUrls: string[] = [];
      const previewUrls: string[] = [];

      // Handle different proof types based on active tab
      if (activeTab === 'files' && filesWithPreviews.length > 0) {
        // Upload files if selected
        for (const { file, previewUrl } of filesWithPreviews) {
          const formData = new FormData();
          formData.append("file", file);

          const response = await apiRequest("POST", "/api/upload", formData);

          if (response && response.url) {
            proofUrls.push(response.url);
            previewUrls.push(previewUrl);
          } else {
            throw new Error(`Invalid response from server for file ${file.name} - no URL returned`);
          }
        }
      } else if (activeTab === 'text' && textProof.trim()) {
        // For text proof, we'll store it as a text file or in the database
        // This is a placeholder implementation
        proofUrls.push(`text-proof:${btoa(textProof)}`);
        previewUrls.push('');
      } else if (activeTab === 'links') {
        // For links, filter out empty ones
        const validLinks = links.filter(link => link.trim());
        if (validLinks.length > 0) {
          proofUrls.push(...validLinks);
          previewUrls.push(...Array(validLinks.length).fill(''));
        }
      }

      // Complete task with or without proof
      onComplete(proofUrls, previewUrls);
      onOpenChange(false);

      toast({
        title: "Task completed!",
        description: proofUrls.length > 0 
          ? `Your task has been marked as completed with ${proofUrls.length} proof item(s).` 
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-0 rounded-xl shadow-lg sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Complete Task
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Mark this task as completed. You can upload proof of your work (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-shrink-0">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-blue-800 mt-1">{task.description}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Upload proof of completion (optional):</p>

            {/* Second Navigation - Horizontal Scroll */}
            <div className="overflow-x-auto whitespace-nowrap scrollbar-hide mb-4">
              <div className="inline-flex space-x-1 p-1 bg-gray-100 rounded-lg">
                {TABS.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-1 transition-colors ${
                        activeTab === tab.id
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Proof Section */}
        <div 
          ref={proofSectionRef}
          className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          {/* Files Tab Content */}
          {activeTab === 'files' && (
            <>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors mb-4"
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
                <div className="space-y-3">
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
                  <div className="grid grid-cols-2 gap-3">
                    {filesWithPreviews.map(({ file, previewUrl }, index) => (
                      <div key={index} className="relative bg-gray-50 p-2 rounded border">
                        <button 
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100 z-10"
                        >
                          <X className="h-3 w-3" />
                        </button>

                        {previewUrl ? (
                          <div className="flex flex-col items-center">
                            <img 
                              src={previewUrl} 
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
            </>
          )}

          {/* Text Tab Content */}
          {activeTab === 'text' && (
            <div className="border border-gray-300 rounded-lg p-4 mb-4">
              <textarea
                value={textProof}
                onChange={(e) => setTextProof(e.target.value)}
                placeholder="Enter your proof text here..."
                className="w-full h-40 p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                Describe your work or paste any text-based proof of completion.
              </p>
            </div>
          )}

          {/* Links Tab Content */}
          {activeTab === 'links' && (
            <div className="space-y-3 mb-4">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    placeholder="Paste a link to your work"
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {links.length > 1 && (
                    <button
                      onClick={() => removeLinkField(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLinkField}
                className="mt-2"
              >
                + Add Another Link
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 mt-2 flex-shrink-0">
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