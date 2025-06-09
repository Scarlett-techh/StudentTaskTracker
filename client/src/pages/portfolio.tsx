import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  FileText, 
  Image, 
  Link as LinkIcon,
  Upload,
  Calendar,
  Trash2
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
    type: "file" as "file" | "link" | "photo"
  });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch portfolio items
  const { data: portfolioItems = [], isLoading } = useQuery({ 
    queryKey: ['/api/portfolio']
  });

  // Fetch subjects for the dropdown
  const { data: subjects = [] } = useQuery({ 
    queryKey: ['/api/subjects']
  });

  // Create portfolio item mutation
  const createPortfolioMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.type === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', data.title);
        formData.append('description', data.description || '');
        formData.append('subject', data.subject || '');
        formData.append('type', 'file');
        
        return apiRequest("POST", "/api/portfolio", formData);
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
        type: "file"
      });
      setSelectedFile(null);
      setAddDialogOpen(false);
    }
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
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your portfolio item.",
        variant: "destructive"
      });
      return;
    }

    if (formData.type === 'link' && !formData.link.trim()) {
      toast({
        title: "Error",
        description: "Please enter a link URL.",
        variant: "destructive"
      });
      return;
    }

    if (formData.type === 'file' && !selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }

    const portfolioData = {
      ...formData,
      link: formData.type === 'link' ? formData.link : null
    };

    createPortfolioMutation.mutate(portfolioData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: file.name.split('.')[0]
        }));
      }
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'file': return <FileText className="h-5 w-5" />;
      case 'photo': return <Image className="h-5 w-5" />;
      case 'link': return <LinkIcon className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'file': return 'bg-blue-100 text-blue-800';
      case 'photo': return 'bg-green-100 text-green-800';
      case 'link': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleItemClick = (item: any) => {
    if (item.type === 'link' && item.link) {
      window.open(item.link, '_blank');
    } else if ((item.type === 'file' || item.type === 'photo') && item.filePath) {
      window.open(`/api/portfolio/file/${item.id}`, '_blank');
    }
  };

  const getThumbnail = (item: any) => {
    if (item.type === 'photo' && item.filePath) {
      return (
        <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-3">
          <img 
            src={`/api/portfolio/file/${item.id}`}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    } else if (item.type === 'file' && item.filePath) {
      const fileExt = item.title.split('.').pop()?.toLowerCase();
      const isPDF = fileExt === 'pdf';
      const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '');
      
      if (isImage) {
        return (
          <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-3">
            <img 
              src={`/api/portfolio/file/${item.id}`}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        );
      } else {
        return (
          <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-3">
            <div className="text-center">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-blue-800 font-medium">
                {fileExt?.toUpperCase() || 'FILE'}
              </p>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Helmet>
        <title>Portfolio - Student Learning Platform</title>
        <meta name="description" content="Showcase your learning achievements, projects, and progress in your personal portfolio." />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text"></div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              My Portfolio
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Showcase your learning journey, achievements, and creative work in one place.
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
                      setFormData(prev => ({ ...prev, type: value }))
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
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a title for your work"
                    required
                  />
                </div>

                {formData.type === 'file' && (
                  <div>
                    <Label htmlFor="file">Choose File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-600 mt-1">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                )}

                {formData.type === 'link' && (
                  <div>
                    <Label htmlFor="link">Link URL</Label>
                    <Input
                      id="link"
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                )}

                {formData.type === 'photo' && (
                  <div>
                    <Label htmlFor="photo">Choose Photo</Label>
                    <Input
                      id="photo"
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-600 mt-1">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="subject">Subject (Optional)</Label>
                  <Select 
                    value={formData.subject} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                    {createPortfolioMutation.isPending ? 'Adding...' : 'Add to Portfolio'}
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
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">Your Portfolio is Empty</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start building your portfolio by adding your work, projects, and achievements.
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
                className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getItemIcon(item.type)}
                      <CardTitle className="text-lg font-semibold line-clamp-1">
                        {item.title}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePortfolioMutation.mutate(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getItemTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                    {item.subject && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.subject}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {item.description && (
                    <CardDescription className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {item.description}
                    </CardDescription>
                  )}
                  {item.link && (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1 mb-3"
                    >
                      <LinkIcon className="h-3 w-3" />
                      <span>View Link</span>
                    </a>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(item.createdAt), 'MMM d, yyyy')}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}