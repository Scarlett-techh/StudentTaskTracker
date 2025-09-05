import { useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

  // Fetch portfolio items
  const { data: portfolioItems = [], isLoading } = useQuery({
    queryKey: ["/api/portfolio"],
  });

  // Fetch subjects for the dropdown
  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
  });

  // Create portfolio item mutation
  const createPortfolioMutation = useMutation({
    mutationFn: async (data: any) => {
      if ((data.type === "file" || data.type === "photo") && selectedFiles.length > 0) {
        // Upload files one by one to maintain individual portfolio items
        const uploadPromises = selectedFiles.map(async (file, index) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("title", index === 0 ? data.title : file.name.split(".")[0]);
          formData.append("description", data.description || "");
          formData.append("subject", data.subject || "");
          formData.append("type", data.type);

          return apiRequest("POST", "/api/portfolio", formData);
        });
        
        return Promise.all(uploadPromises);
      } else {
        return apiRequest("POST", "/api/portfolio", data);
      }
    },
    onSuccess: () => {
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
    },
  });

  // Delete portfolio item mutation
  const deletePortfolioMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/portfolio/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Removed from portfolio",
        description: "Item has been removed from your portfolio.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your portfolio item.",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "link" && !formData.link.trim()) {
      toast({
        title: "Error",
        description: "Please enter a link URL.",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "file" && selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    const portfolioData = {
      ...formData,
      link: formData.type === "link" ? formData.link : null,
    };

    createPortfolioMutation.mutate(portfolioData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      
      // Generate preview URLs for images
      const urls: string[] = [];
      files.forEach((file) => {
        if (file.type.startsWith('image/')) {
          urls.push(URL.createObjectURL(file));
        } else {
          urls.push('');
        }
      });
      setPreviewUrls(urls);
      
      // Set title from first file if empty
      if (!formData.title && files[0]) {
        setFormData((prev) => ({
          ...prev,
          title: files[0].name.split(".")[0],
        }));
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke URL to prevent memory leaks
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
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

  return (
    <div className="p-6">

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">My Portfolio</h1>
        <p className="text-gray-500">
          Showcase your learning journey, achievements, and creative work in one
          place.
        </p>
      </div>

      {/* Add to Portfolio Button */}
      <div className="flex justify-center mb-8">
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add to Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add to Portfolio</DialogTitle>
              <DialogDescription>
                Add a file, link, or photo to your portfolio
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
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
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Enter a title for your work"
                  required
                />
              </div>

              {formData.type === "file" && (
                <div>
                  <Label htmlFor="file">Choose File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    multiple
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Selected files ({selectedFiles.length}):
                      </p>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                            <div className="flex items-center space-x-2 min-w-0">
                              {previewUrls[index] ? (
                                <img 
                                  src={previewUrls[index]} 
                                  alt={file.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ) : (
                                <FileText className="w-8 h-8 text-gray-400" />
                              )}
                              <span className="text-xs text-gray-600 truncate">
                                {file.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
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
                  <Label htmlFor="link">Link URL</Label>
                  <Input
                    id="link"
                    type="url"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        link: e.target.value,
                      }))
                    }
                    placeholder="https://example.com"
                    required
                  />
                </div>
              )}

              {formData.type === "photo" && (
                <div>
                  <Label htmlFor="photo">Choose Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Selected photos ({selectedFiles.length}):
                      </p>
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

              <div>
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, subject: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject: any) => (
                      <SelectItem key={subject.name} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe your work..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPortfolioMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {createPortfolioMutation.isPending
                    ? "Adding..."
                    : "Add to Portfolio"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portfolio Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48 animate-pulse">
              <CardHeader className="bg-gray-200 rounded-t-lg h-full" />
            </Card>
          ))}
        </div>
      ) : portfolioItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
            <FileText className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">
            Your Portfolio is Empty
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start building your portfolio by adding your work, projects, and
            achievements.
          </p>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item: any) => (
            <Card
              key={item.id}
              className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              {/* Thumbnail Background */}
              <div className="relative h-32 rounded-t-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {(item.type === "photo" || (item.type === "file" && item.filePath && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.filePath))) && (
                  <img 
                    src={`/api/portfolio/file/${item.id}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                {item.type === "link" && item.link && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                    <LinkIcon className="h-12 w-12 text-blue-500" />
                  </div>
                )}
                {item.type === "file" && (!item.filePath || !/\.(jpg|jpeg|png|gif|webp)$/i.test(item.filePath)) && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
                    <FileText className="h-12 w-12 text-green-500" />
                  </div>
                )}
                {/* Subject Badge */}
                {item.subject && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 text-xs font-medium bg-white/90 text-gray-700 rounded-full shadow-sm">
                      {item.subject}
                    </span>
                  </div>
                )}
                {/* Delete Button */}
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
                <CardTitle className="text-lg font-semibold line-clamp-1">
                  {item.title}
                </CardTitle>
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
                    {format(new Date(item.createdAt), "MMM d")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}