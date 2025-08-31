import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
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
  Calendar,
  Trash2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Sample subjects data
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
  { id: "12", name: "Public Speaking/Debate", color: "#64748B" },
];

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

  // Fetch portfolio items
  const { data: portfolioItems = [], isLoading, refetch: refetchPortfolio } = useQuery({
    queryKey: ["/api/portfolio"],
    retry: 2,
  });

  // Fetch subjects for the dropdown
  const { data: subjectsData, error: subjectsError, refetch: refetchSubjects } = useQuery({
    queryKey: ["/api/subjects"],
    retry: 1,
  });

  // Set subjects data with fallback to sample data
  useEffect(() => {
    if (subjectsData && Array.isArray(subjectsData) && subjectsData.length > 0) {
      setSubjects(subjectsData);
      setConnectionError(false);
    } else if (subjectsError) {
      console.warn("Using sample subjects data due to API error:", subjectsError);
      setSubjects(SAMPLE_SUBJECTS);
      setConnectionError(true);
    } else {
      setSubjects(SAMPLE_SUBJECTS);
    }
  }, [subjectsData, subjectsError]);

  // Create portfolio item mutation
  const createPortfolioMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        setConnectionError(false);

        // For file uploads
        if ((data.type === "file" || data.type === "photo") && selectedFiles.length > 0) {
          const formData = new FormData();
          formData.append("title", data.title);
          formData.append("description", data.description || "");
          formData.append("subject", data.subject || "");
          formData.append("type", data.type);

          // Add single file (backend expects single file)
          formData.append("file", selectedFiles[0]);

          const response = await apiRequest("POST", "/api/portfolio", formData);
          return response;
        } else {
          // For links or other types
          const response = await apiRequest("POST", "/api/portfolio", {
            title: data.title,
            description: data.description,
            subject: data.subject,
            type: data.type,
            link: data.type === "link" ? data.link : null
          });
          return response;
        }
      } catch (error) {
        console.error("API request failed:", error);
        setConnectionError(true);
        throw new Error("Failed to connect to server. Please check if the server is running.");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Added to portfolio",
        description: `${formData.title} has been added to your portfolio.`,
      });
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
      console.error("Portfolio creation error:", error);
      toast({
        title: "Error adding item",
        description: error.message || "Failed to add item to portfolio. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete portfolio item mutation
  const deletePortfolioMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        setConnectionError(false);
        return await apiRequest("DELETE", `/api/portfolio/${id}`);
      } catch (error) {
        setConnectionError(true);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
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
      toast({ title: "Error", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    createPortfolioMutation.mutate(formData);
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
    if (item.type === "link" && item.link) {
      window.open(item.link, "_blank");
    } else if (item.type === "file" || item.type === "photo") {
      window.open(`/api/portfolio/file/${item.id}`, "_blank");
    }
  };

  const retryConnection = () => {
    setConnectionError(false);
    refetchPortfolio();
    refetchSubjects();
  };

  // Helper function to get image URL for an item
  const getImageUrl = (item: any) => {
    if (item.type === "link") return null;
    if (item.type === "photo" || (item.type === "file" && item.path)) {
      return `/api/portfolio/file/${item.id}`;
    }
    return null;
  };

  // Helper function to check if item has an image
  const hasImage = (item: any) => {
    if (item.type === "photo") return true;
    if (item.type === "file" && item.path) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const extension = item.path.toLowerCase().substring(item.path.lastIndexOf('.'));
      return imageExtensions.includes(extension);
    }
    return false;
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Portfolio</h1>
        <p className="text-gray-500">Showcase your learning journey, achievements, and creative work in one place.</p>
      </div>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Failed to connect to server. Please check if the server is running.</span>
          </div>
          <Button variant="outline" size="sm" onClick={retryConnection} className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      )}

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
                    accept={formData.type === "photo" ? "image/*" : ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"}
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
                        <SelectItem key={subject.id || subject.name} value={subject.id || subject.name}>
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
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48 animate-pulse">
              <CardHeader className="bg-gray-200 rounded-t-lg h-full" />
            </Card>
          ))}
        </div>
      ) : Array.isArray(portfolioItems) && portfolioItems.length === 0 ? (
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
          {Array.isArray(portfolioItems) &&
            portfolioItems.map((item: any) => {
              const imageUrl = getImageUrl(item);
              const isImage = hasImage(item);

              return (
                <Card
                  key={item.id}
                  className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 cursor-pointer h-fit"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="relative h-32 rounded-t-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {imageUrl && isImage && (
                      <img
                        src={imageUrl}
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
                    {item.type === "file" && !isImage && (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
                        <FileText className="h-12 w-12 text-green-500" />
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
                        deletePortfolioMutation.mutate(item.id);
                      }}
                      className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold line-clamp-1">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {item.description && (
                      <CardDescription className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {item.description}
                      </CardDescription>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        {item.type === "link" && <LinkIcon className="h-3 w-3" />}
                        {item.type === "file" && <FileText className="h-3 w-3" />}
                        {item.type === "photo" && <Image className="h-3 w-3" />}
                        <span className="capitalize">{item.type}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {item.createdAt ? format(new Date(item.createdAt), "MMM d") : "Unknown date"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}