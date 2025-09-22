import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FileText,
  Image,
  Link as LinkIcon,
  Upload,
  Calendar,
  Trash2,
  AlertCircle,
  X,
  Download,
  ExternalLink,
  File,
  FileImage,
  FileVideo,
  FileCode,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Text,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Sample subjects data with the requested additional subjects
const SAMPLE_SUBJECTS = [
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
  // Add the subjects from your task form
  { id: "13", name: "Physical Activity", color: "#EC4899" },
  { id: "14", name: "Life Skills", color: "#F97316" },
  { id: "15", name: "Interest / Passion", color: "#14B8A6" },
  { id: "16", name: "Art", color: "#EF4444" },
  { id: "17", name: "Game Design", color: "#8B5CF6" },
  { id: "18", name: "Coding", color: "#059669" },
];

// Preview Modal Component
function PreviewModal({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Handle multiple files if they exist
  const files = item.files || [item];
  const currentFile = files[currentFileIndex];

  // Function to get proof URL for task items
  const getProofUrl = (fileUrl: string) => {
    if (!fileUrl) return null;

    // If it's already a full URL or data URL, use it directly
    if (fileUrl.startsWith('http') || fileUrl.startsWith('data:') || fileUrl.startsWith('/')) {
      return fileUrl;
    }

    // Otherwise, assume it's a relative path from the server
    return `/${fileUrl}`;
  };

  const renderPreview = () => {
    // Handle task items with different proof types
    if (currentFile.type === "task") {
      // Text proof
      if (currentFile.proofText) {
        return (
          <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-2">Text Proof:</h4>
            <p className="whitespace-pre-wrap">{currentFile.proofText}</p>
          </div>
        );
      }

      // Link proof
      if (currentFile.proofLink) {
        return (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold mb-2">Link Proof:</h4>
            <a 
              href={currentFile.proofLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {currentFile.proofLink}
            </a>
          </div>
        );
      }

      // File proof
      if (currentFile.proofFiles && currentFile.proofFiles.length > 0) {
        const proofUrl = getProofUrl(currentFile.proofFiles[currentFileIndex]);

        if (proofUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(proofUrl)) {
          return (
            <div className="flex justify-center">
              <img 
                src={proofUrl} 
                alt={`Proof ${currentFileIndex + 1}`} 
                className="max-h-96 max-w-full object-contain rounded-md border"
              />
            </div>
          );
        } else if (proofUrl && /\.(pdf)$/i.test(proofUrl)) {
          return (
            <div className="h-96">
              <iframe 
                src={proofUrl} 
                className="w-full h-full border rounded-md"
                title={currentFile.title}
              />
              <div className="mt-2 text-sm text-gray-500">
                PDF preview powered by browser's built-in PDF viewer
              </div>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-md">
              <File className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No preview available for this file type</p>
              <p className="text-sm text-gray-400">Click download to access the file</p>
            </div>
          );
        }
      }

      // Default for task items with no proof
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-md">
          <CheckCircle className="h-16 w-16 text-green-400 mb-4" />
          <p className="text-gray-500">Task completed with no proof attached</p>
        </div>
      );
    }

    if (currentFile.type === "link") {
      return (
        <div className="h-96">
          <iframe 
            src={currentFile.link} 
            className="w-full h-full border rounded-md"
            title={currentFile.title}
            sandbox="allow-same-origin allow-scripts"
          />
          <div className="mt-2 text-sm text-gray-500">
            Embedded preview of {currentFile.link}
          </div>
        </div>
      );
    }

    if (currentFile.type === "file" || currentFile.type === "photo") {
      // Determine file type for preview
      if (currentFile.fileType === "pdf" || currentFile.proofUrl?.endsWith('.pdf')) {
        return (
          <div className="h-96">
            <iframe 
              src={currentFile.fileUrl || currentFile.proofUrl} 
              className="w-full h-full border rounded-md"
              title={currentFile.title}
            />
            <div className="mt-2 text-sm text-gray-500">
              PDF preview powered by browser's built-in PDF viewer
            </div>
          </div>
        );
      } else if (currentFile.fileType === "image" || 
                 (currentFile.proofUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(currentFile.proofUrl))) {
        return (
          <div className="flex justify-center">
            <img 
              src={currentFile.fileUrl || currentFile.proofUrl} 
              alt={currentFile.title}
              className="max-h-96 max-w-full object-contain rounded-md border"
            />
          </div>
        );
      } else {
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-md">
            <File className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">No preview available for this file type</p>
            <p className="text-sm text-gray-400">Click download to access the file</p>
          </div>
        );
      }
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-md">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-500">No preview available for this item</p>
      </div>
    );
  };

  const handleDownload = () => {
    if (currentFile.type === "link") {
      window.open(currentFile.link, "_blank");
    } else if (currentFile.type === "file" || currentFile.type === "photo") {
      // Create a temporary anchor element to trigger download
      const url = currentFile.fileUrl || currentFile.proofUrl;
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFile.fileName || currentFile.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast({
          title: "Download Started",
          description: `Downloading ${currentFile.fileName || currentFile.title}`,
        });
      }
    } else if (currentFile.type === "task") {
      // Handle download for task proofs
      if (currentFile.proofFiles && currentFile.proofFiles.length > 0) {
        const proofUrl = getProofUrl(currentFile.proofFiles[currentFileIndex]);
        if (proofUrl) {
          const a = document.createElement('a');
          a.href = proofUrl;
          a.download = `proof-${currentFileIndex + 1}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          toast({
            title: "Download Started",
            description: "Downloading proof file",
          });
        }
      } else if (currentFile.proofText) {
        // Download text proof as a text file
        const blob = new Blob([currentFile.proofText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentFile.title}-proof.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Download Started",
          description: "Downloading text proof",
        });
      }
    }
  };

  const handleOpenExternal = () => {
    if (currentFile.type === "link") {
      window.open(currentFile.link, "_blank");
    } else if (currentFile.type === "file" || currentFile.type === "photo") {
      const url = currentFile.fileUrl || currentFile.proofUrl;
      if (url) window.open(url, "_blank");
    } else if (currentFile.type === "task") {
      // Handle external opening for task proofs
      if (currentFile.proofLink) {
        window.open(currentFile.proofLink, "_blank");
      } else if (currentFile.proofFiles && currentFile.proofFiles.length > 0) {
        const proofUrl = getProofUrl(currentFile.proofFiles[currentFileIndex]);
        if (proofUrl) window.open(proofUrl, "_blank");
      }
    }
  };

  const handleNextFile = () => {
    if (currentFileIndex < files.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    }
  };

  const handlePrevFile = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentFile.type === "link" && <LinkIcon className="h-5 w-5" />}
            {(currentFile.type === "file" || currentFile.type === "task") && <FileText className="h-5 w-5" />}
            {currentFile.type === "photo" && <Image className="h-5 w-5" />}
            {currentFile.title}
            {files.length > 1 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({currentFileIndex + 1} of {files.length})
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentFile.description || "No description provided"}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 relative">
          {files.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80"
                onClick={handlePrevFile}
                disabled={currentFileIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80"
                onClick={handleNextFile}
                disabled={currentFileIndex === files.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          {renderPreview()}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-1">Details</h4>
            <div className="space-y-1">
              <p><span className="text-gray-500">Type:</span> {currentFile.type}</p>
              {currentFile.subject && <p><span className="text-gray-500">Subject:</span> {currentFile.subject}</p>}
              <p><span className="text-gray-500">Added:</span> {format(new Date(currentFile.createdAt), "PP")}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-1">Proof Info</h4>
            <div className="space-y-1">
              {currentFile.fileName && <p><span className="text-gray-500">Filename:</span> {currentFile.fileName}</p>}
              {currentFile.fileType && <p><span className="text-gray-500">Filetype:</span> {currentFile.fileType}</p>}
              {currentFile.link && <p><span className="text-gray-500">URL:</span> <span className="truncate">{currentFile.link}</span></p>}
              {currentFile.proofUrl && <p><span className="text-gray-500">Proof URL:</span> <span className="truncate">{currentFile.proofUrl}</span></p>}
              {currentFile.proofText && <p><span className="text-gray-500">Text Proof:</span> <span className="truncate">{currentFile.proofText.substring(0, 50)}...</span></p>}
              {currentFile.proofLink && <p><span className="text-gray-500">Link Proof:</span> <span className="truncate">{currentFile.proofLink}</span></p>}
              {currentFile.proofFiles && currentFile.proofFiles.length > 0 && (
                <p><span className="text-gray-500">Files:</span> {currentFile.proofFiles.length} file(s)</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2">
          <Button variant="outline" onClick={handleOpenExternal}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Externally
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Portfolio() {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    link: "",
    type: "file" as "file" | "link" | "photo",
  });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch portfolio items from API
  const { data: serverPortfolioItems = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/portfolio"],
  });

  // Load manually added portfolio items from localStorage
  const [manualPortfolioItems, setManualPortfolioItems] = useState<any[]>([]);

  useEffect(() => {
    const savedItems = localStorage.getItem('manualPortfolioItems');
    if (savedItems) {
      try {
        setManualPortfolioItems(JSON.parse(savedItems));
      } catch (e) {
        console.error("Failed to parse manual portfolio items from localStorage", e);
        setManualPortfolioItems([]);
      }
    }
  }, []);

  // Save manual portfolio items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('manualPortfolioItems', JSON.stringify(manualPortfolioItems));
  }, [manualPortfolioItems]);

  // Combine server items and manual items
  const portfolioItems = [...serverPortfolioItems, ...manualPortfolioItems];

  // Set subjects data with fallback to sample data
  useEffect(() => {
    // Always use the full sample subjects list for portfolio
    setSubjects(SAMPLE_SUBJECTS);
  }, []);

  // Create portfolio item mutation for manual uploads
  const createPortfolioMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create portfolio items for each selected file
      const newItems = selectedFiles.map((file, index) => {
        const fileType = file.type.startsWith('image/') ? 'image' : 
                        file.type === 'application/pdf' ? 'pdf' : 'other';

        return {
          id: Date.now() + index, // Generate unique IDs
          title: selectedFiles.length > 1 ? `${formData.title} (${index + 1})` : formData.title,
          description: formData.description,
          subject: formData.subject,
          type: formData.type,
          link: formData.type === "link" ? formData.link : null,
          fileType,
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          createdAt: new Date().toISOString(),
          source: "manual" // Mark as manually added
        };
      });

      // For link type, create a single item
      if (formData.type === "link") {
        return [{
          id: Date.now(),
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          type: "link",
          link: formData.link,
          createdAt: new Date().toISOString(),
          source: "manual" // Mark as manually added
        }];
      }

      return newItems;
    },
    onSuccess: (newItems) => {
      // Add the new items to the manual portfolio items state
      setManualPortfolioItems(prevItems => [...prevItems, ...newItems]);

      toast({
        title: "Added to portfolio",
        description: `${newItems.length} item(s) have been added to your portfolio.`,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        subject: "",
        link: "",
        type: "file",
      });
      setSelectedFiles([]);
      setPreviewUrls([]);
      setAddDialogOpen(false);
      setConnectionError(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error adding item",
        description: error.message || "Failed to add item to portfolio. Please try again.",
        variant: "destructive",
      });
      setConnectionError(true);
    },
  });

  // Delete portfolio item mutation
  const deletePortfolioMutation = useMutation({
    mutationFn: async (item: any) => {
      if (item.source === "manual") {
        // For manual items, just return the ID for local deletion
        return item.id;
      } else {
        // For server items, make API call to delete
        await apiRequest("DELETE", `/api/portfolio/${item.id}`);
        return item.id;
      }
    },
    onSuccess: (id, item) => {
      if (item.source === "manual") {
        // Remove the item from manual items state
        setManualPortfolioItems(prevItems => prevItems.filter(item => item.id !== id));
      } else {
        // Refetch server items after deletion
        refetch();
      }

      toast({
        title: "Removed from portfolio",
        description: "Item has been removed from your portfolio.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error removing item",
        description: error.message || "Failed to remove item from portfolio",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Please enter a title.", variant: "destructive" });
      return;
    }
    if (formData.type === "link" && !formData.link.trim()) {
      toast({ title: "Error", description: "Please enter a link URL.", variant: "destructive" });
      return;
    }
    if ((formData.type === "file" || formData.type === "photo") && selectedFiles.length === 0) {
      toast({ title: "Error", description: "Please select at least one file.", variant: "destructive" });
      return;
    }
    const portfolioData = { ...formData, link: formData.type === "link" ? formData.link : null };
    createPortfolioMutation.mutate(portfolioData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      const urls = files.map((file) => (file.type.startsWith("image/") ? URL.createObjectURL(file) : ""));
      setPreviewUrls(urls);
      if (!formData.title && files[0]) {
        setFormData((prev) => ({ ...prev, title: files[0].name.split(".")[0] }));
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    if (previewUrls[index]) URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const handleItemClick = (item: any) => {
    // Check if this item is part of a multi-file upload
    const baseTitle = item.title.replace(/\s*\(\d+\)$/, '');
    const relatedItems = portfolioItems.filter(i => 
      i.title.replace(/\s*\(\d+\)$/, '') === baseTitle && 
      i.type === item.type &&
      i.source === item.source
    );

    if (relatedItems.length > 1) {
      // Group related items for carousel view
      setPreviewItem({
        ...item,
        files: relatedItems
      });
    } else {
      setPreviewItem(item);
    }
    setPreviewOpen(true);
  };

  const getFileIcon = (item: any) => {
    if (item.type === "link") return <LinkIcon className="h-5 w-5 text-blue-500" />;
    if (item.type === "photo") return <Image className="h-5 w-5 text-green-500" />;
    if (item.type === "task") return <CheckCircle className="h-5 w-5 text-purple-500" />;

    // For file types
    if (item.fileType === "pdf") return <FileText className="h-5 w-5 text-red-500" />;
    if (item.fileType === "image") return <FileImage className="h-5 w-5 text-purple-500" />;
    if (item.fileType === "video") return <FileVideo className="h-5 w-5 text-orange-500" />;
    if (item.fileType === "code") return <FileCode className="h-5 w-5 text-yellow-500" />;

    return <File className="h-5 w-5 text-gray-500" />;
  };

  // Determine file type for task items
  const getFileTypeForTask = (item: any) => {
    if (item.proofUrl) {
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(item.proofUrl)) return "image";
      if (/\.(pdf)$/i.test(item.proofUrl)) return "pdf";
      if (/\.(mp4|mov|avi|wmv)$/i.test(item.proofUrl)) return "video";
    }
    return "task";
  };

  // Function to get proof URL for task items
  const getProofUrl = (fileUrl: string) => {
    if (!fileUrl) return null;

    // If it's already a full URL or data URL, use it directly
    if (fileUrl.startsWith('http') || fileUrl.startsWith('data:') || fileUrl.startsWith('/')) {
      return fileUrl;
    }

    // Otherwise, assume it's a relative path from the server
    return `/${fileUrl}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading portfolio items...</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Portfolio</h1>
        <p className="text-gray-500">Showcase your learning journey, achievements, and creative work in one place.</p>
      </div>

      {/* Add to Portfolio Button */}
      <div className="flex justify-center mb-6">
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              <Plus className="h-5 w-5 mr-2" /> Add to Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add to Portfolio</DialogTitle>
              <DialogDescription>Add a file, link, or photo to your portfolio</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "file" | "link" | "photo") =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">📄 File</SelectItem>
                    <SelectItem value="link">🔗 Link</SelectItem>
                    <SelectItem value="photo">📸 Photo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a title for your work"
                  required
                />
              </div>

              {(formData.type === "file" || formData.type === "photo") && (
                <div>
                  <Label>Choose File(s)</Label>
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    accept={formData.type === "photo" ? "image/*" : "*"}
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected ({selectedFiles.length}):</p>
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            {previewUrls[index] && (
                              <img
                                src={previewUrls[index]}
                                alt={file.name}
                                className="w-full h-16 object-cover rounded border"
                              />
                            )}
                            <div className="text-xs truncate text-gray-700">{file.name}</div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData.type === "link" && (
                <div>
                  <Label>Link URL</Label>
                  <Input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                    placeholder="https://example.com"
                    required
                  />
                  {formData.link && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-blue-600 truncate">
                      {formData.link}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label>Subject (Optional)</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {subjects.length > 0 ? (
                      subjects.map((subject: any) => (
                        <SelectItem key={subject.id || subject.name} value={subject.name}>
                          <div className="flex items-center">
                            <span
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: subject.color || "#6B7280" }}
                            ></span>
                            {subject.name}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-subjects" disabled>
                        No subjects available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your work..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPortfolioMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {createPortfolioMutation.isPending ? "Adding..." : "Add to Portfolio"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portfolio Items Grid with Scroll */}
      {portfolioItems.length === 0 ? (
        <div className="text-center py-16 flex-grow flex flex-col items-center justify-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
            <FileText className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">Your Portfolio is Empty</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start building your portfolio by adding your work, projects, and achievements.
          </p>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Your First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow overflow-y-auto pb-6">
          {portfolioItems.map((item: any) => (
            <Card
              key={item.id}
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 cursor-pointer h-fit"
              onClick={() => handleItemClick(item)}
            >
              <div className="relative h-32 rounded-t-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {/* For task items, show appropriate preview based on proof type */}
                {item.type === "task" && (
                  <>
                    {item.proofFiles && item.proofFiles.length > 0 && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.proofFiles[0]) && (
                      <img
                        src={getProofUrl(item.proofFiles[0])}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    )}
                    {item.proofText && (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                        <Text className="h-12 w-12 text-purple-500" />
                      </div>
                    )}
                    {item.proofLink && (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                        <LinkIcon className="h-12 w-12 text-blue-500" />
                      </div>
                    )}
                    {(!item.proofFiles || item.proofFiles.length === 0) && !item.proofText && !item.proofLink && (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                      </div>
                    )}
                  </>
                )}

                {(item.type === "photo" || (item.type === "file" && item.fileType === "image")) && (
                  <img
                    src={item.fileUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                )}
                {item.type === "link" && item.link && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                    <LinkIcon className="h-12 w-12 text-blue-500" />
                  </div>
                )}
                {(item.type === "file" && item.fileType !== "image") && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
                    {getFileIcon(item)}
                  </div>
                )}

                {item.subject && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 text-xs font-medium bg-white/90 text-gray-700 rounded-full shadow-sm">
                      {item.subject}
                    </span>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePortfolioMutation.mutate(item);
                  }}
                  className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold line-clamp-1">{item.title}</CardTitle>
                {item.source === "manual" && (
                  <div className="text-xs text-gray-500">Manually added</div>
                )}
                {item.type === "task" && (
                  <div className="text-xs text-blue-500">From completed task</div>
                )}
              </CardHeader>
              <CardContent className="pt-2">
                {item.description && (
                  <CardDescription className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {item.description}
                  </CardDescription>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    {getFileIcon(item)}
                    <span className="capitalize">{item.type}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(item.createdAt), "MMM d")}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleItemClick(item)}
                >
                  Preview Item
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <PreviewModal 
          item={previewItem} 
          open={previewOpen} 
          onOpenChange={setPreviewOpen} 
        />
      )}

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg shadow-lg flex items-center max-w-md">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>Working in demo mode. Some features may be limited without a server connection.</span>
        </div>
      )}
    </div>
  );
}