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
import { 
  Star, 
  Plus, 
  FileText, 
  Image, 
  Award, 
  Book, 
  Trash2, 
  Edit, 
  CheckCircle,
  BarChart 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Portfolio item interface
interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  type: 'achievement' | 'task' | 'note' | 'photo' | 'test';
  score?: string;
  subject?: string;
  date: string;
  sourceId?: number;
  thumbnail?: string;
  featured: boolean;
}

// Mock portfolio data - this would be replaced with real API data
const mockPortfolioItems: PortfolioItem[] = [
  {
    id: 1,
    title: "Math Final Exam",
    description: "Scored 95% on the final algebra exam",
    type: "test",
    score: "95%",
    subject: "Mathematics",
    date: "2025-04-15",
    featured: true
  },
  {
    id: 2,
    title: "Science Project: Photosynthesis",
    description: "Built a model demonstrating the process of photosynthesis in plants",
    type: "task",
    subject: "Science",
    date: "2025-03-20",
    sourceId: 3,
    featured: true
  },
  {
    id: 3,
    title: "History Essay: World War II",
    description: "Researched and wrote a comprehensive essay on the causes and effects of World War II",
    type: "note",
    subject: "History",
    date: "2025-02-10",
    sourceId: 2,
    featured: false
  }
];

const Portfolio = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const [newTestDialogOpen, setNewTestDialogOpen] = useState(false);
  const [addExistingWorkDialogOpen, setAddExistingWorkDialogOpen] = useState(false);
  
  // Form state for new portfolio item
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    score: "",
    type: "achievement" as "achievement" | "test"
  });
  
  // Fetch portfolio items from completed tasks, photos, and achievements
  const { data: tasks = [] } = useQuery({ 
    queryKey: ['/api/tasks']
  });
  
  const { data: achievements = [] } = useQuery({ 
    queryKey: ['/api/user-achievements']
  });
  
  // Convert real data to portfolio items
  const portfolioItems = [
    // Add completed tasks to portfolio
    ...Array.isArray(tasks) ? tasks
      .filter((task: any) => task.status === 'completed')
      .map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || "",
        type: 'task' as const,
        subject: task.subject,
        date: task.updatedAt || task.createdAt,
        sourceId: task.id,
        featured: false
      })) : [],
    
    // Add achievements to portfolio
    ...Array.isArray(achievements) ? achievements.map((userAchievement: any) => ({
      id: `achievement-${userAchievement.id}`,
      title: userAchievement.achievement?.title || "Achievement",
      description: userAchievement.achievement?.description || "",
      type: 'achievement' as const,
      date: userAchievement.earnedAt,
      featured: true
    })) : []
  ];
  
  const isLoading = false;
  
  // Fetch tasks, notes, and photos for adding to portfolio
  const { data: availableTasks = [] } = useQuery({ 
    queryKey: ['/api/tasks'],
    select: (data) => data.filter((task: any) => task.status === 'completed')
  });
  
  const { data: notes = [] } = useQuery({ 
    queryKey: ['/api/notes'] 
  });
  
  const { data: photos = [] } = useQuery({ 
    queryKey: ['/api/photos'] 
  });
  
  // Add to portfolio mutation 
  // This would add an existing task, note, or photo to the portfolio
  const addToPortfolioMutation = useMutation({
    mutationFn: async (item: any) => {
      // This would be a real API call to add an item to the portfolio
      // return apiRequest("POST", "/api/portfolio", item);
      
      toast({
        title: "Added to portfolio",
        description: `${item.title} has been added to your portfolio.`,
      });
      
      return {
        id: Math.floor(Math.random() * 1000),
        title: item.title,
        description: item.description || "",
        type: item.type,
        subject: item.subject,
        date: new Date().toISOString(),
        sourceId: item.id,
        featured: false
      };
    },
    onSuccess: () => {
      // This would invalidate the portfolio query cache
      // queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    }
  });
  
  // Create new portfolio item mutation
  const createPortfolioItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // This would be a real API call to create a new portfolio item
      // return apiRequest("POST", "/api/portfolio", data);
      
      toast({
        title: "Portfolio item created",
        description: `${data.title} has been added to your portfolio.`,
      });
      
      return {
        id: Math.floor(Math.random() * 1000),
        title: data.title,
        description: data.description,
        type: data.type,
        subject: data.subject,
        score: data.score,
        date: new Date().toISOString(),
        featured: false
      };
    },
    onSuccess: () => {
      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        subject: "",
        score: "",
        type: "achievement"
      });
      setNewItemDialogOpen(false);
      setNewTestDialogOpen(false);
      
      // This would invalidate the portfolio query cache
      // queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    }
  });
  
  // Remove from portfolio mutation
  const removeFromPortfolioMutation = useMutation({
    mutationFn: async (id: number) => {
      // This would be a real API call to remove an item from the portfolio
      // return apiRequest("DELETE", `/api/portfolio/${id}`);
      
      toast({
        title: "Removed from portfolio",
        description: "Item has been removed from your portfolio.",
      });
      
      return id;
    },
    onSuccess: () => {
      // This would invalidate the portfolio query cache
      // queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    }
  });
  
  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async (item: PortfolioItem) => {
      // This would be a real API call to update the featured status
      // return apiRequest("PATCH", `/api/portfolio/${item.id}`, { featured: !item.featured });
      
      toast({
        title: item.featured ? "Unfeatured" : "Featured",
        description: `${item.title} has been ${item.featured ? "removed from" : "added to"} featured items.`,
      });
      
      return {...item, featured: !item.featured};
    },
    onSuccess: () => {
      // This would invalidate the portfolio query cache
      // queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    }
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPortfolioItemMutation.mutate(formData);
  };
  
  // Filter items based on active tab
  const filteredItems = portfolioItems.filter(item => {
    if (activeTab === "all") return true;
    if (activeTab === "featured") return item.featured;
    return item.type === activeTab;
  });
  
  // Render icon based on item type
  const renderIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Award className="h-10 w-10 text-yellow-500" />;
      case 'task':
        return <CheckCircle className="h-10 w-10 text-green-500" />;
      case 'note':
        return <FileText className="h-10 w-10 text-blue-500" />;
      case 'photo':
        return <Image className="h-10 w-10 text-purple-500" />;
      case 'test':
        return <BarChart className="h-10 w-10 text-red-500" />;
      default:
        return <Book className="h-10 w-10 text-gray-500" />;
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Portfolio | Student Work Tracker</title>
        <meta 
          name="description" 
          content="Showcase your best work, achievements, and test scores in your student portfolio."
        />
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your Portfolio</h2>
            <p className="text-muted-foreground">
              Showcase your achievements, best work, and test scores
            </p>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <Button variant="outline" onClick={() => setNewItemDialogOpen(true)}>
              <Award className="mr-2 h-4 w-4" />
              Add Achievement
            </Button>
            <Button variant="outline" onClick={() => setNewTestDialogOpen(true)}>
              <BarChart className="mr-2 h-4 w-4" />
              Add Test Score
            </Button>
            <Button onClick={() => setAddExistingWorkDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Existing Work
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="achievement">Achievements</TabsTrigger>
            <TabsTrigger value="test">Test Scores</TabsTrigger>
            <TabsTrigger value="task">Tasks</TabsTrigger>
            <TabsTrigger value="note">Notes</TabsTrigger>
            <TabsTrigger value="photo">Photos</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="text-center py-8">Loading portfolio items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 border rounded-md bg-muted/50">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Book className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No portfolio items yet</h3>
                <p className="text-muted-foreground mt-1 mb-4">Add your achievements, test scores, or best work to your portfolio.</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setNewItemDialogOpen(true)}>
                    Add Achievement
                  </Button>
                  <Button size="sm" onClick={() => setNewTestDialogOpen(true)}>
                    Add Test Score
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {renderIcon(item.type)}
                          <div>
                            <CardTitle className="text-base">{item.title}</CardTitle>
                            {item.subject && (
                              <CardDescription className="text-xs">
                                {item.subject}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${item.featured ? 'text-yellow-500' : 'text-muted-foreground'}`}
                          onClick={() => toggleFeaturedMutation.mutate(item)}
                          title={item.featured ? "Unfeature" : "Feature"}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {item.type === 'photo' && item.thumbnail && (
                        <div className="mb-3 rounded-md overflow-hidden aspect-video bg-muted flex items-center justify-center">
                          <img 
                            src={item.thumbnail} 
                            alt={item.title} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}
                      
                      {item.score && (
                        <div className="mb-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                          Score: {item.score}
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                    </CardContent>
                    
                    <CardFooter className="border-t pt-3 flex justify-between">
                      <div className="text-xs text-muted-foreground">
                        Added: {new Date(item.date).toLocaleDateString()}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeFromPortfolioMutation.mutate(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialog for adding a new achievement */}
      <Dialog open={newItemDialogOpen} onOpenChange={setNewItemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Achievement</DialogTitle>
            <DialogDescription>
              Record a new achievement or milestone to your portfolio.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Achievement Title</Label>
              <Input 
                id="title"
                name="title"
                placeholder="e.g., First Place in Science Fair"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                name="description"
                placeholder="Describe your achievement..."
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Area (Optional)</Label>
              <Input 
                id="subject"
                name="subject"
                placeholder="e.g., Science, Art, Sports"
                value={formData.subject}
                onChange={handleInputChange}
              />
            </div>
            
            <input type="hidden" name="type" value="achievement" />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewItemDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add to Portfolio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding a test score */}
      <Dialog open={newTestDialogOpen} onOpenChange={setNewTestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Test Score</DialogTitle>
            <DialogDescription>
              Record a test score or assessment result to your portfolio.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="test-title">Test Name</Label>
              <Input 
                id="test-title"
                name="title"
                placeholder="e.g., Math Final Exam, SAT, Science Quiz"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="score">Score / Grade</Label>
              <Input 
                id="score"
                name="score"
                placeholder="e.g., 95%, A+, 1250"
                value={formData.score}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-subject">Subject</Label>
              <Input 
                id="test-subject"
                name="subject"
                placeholder="e.g., Mathematics, Science, English"
                value={formData.subject}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-description">Additional Notes</Label>
              <Textarea 
                id="test-description"
                name="description"
                placeholder="Any additional details about the test..."
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            
            <input type="hidden" name="type" value="test" />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewTestDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Test Score
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding existing work to portfolio */}
      <Dialog open={addExistingWorkDialogOpen} onOpenChange={setAddExistingWorkDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add to Portfolio</DialogTitle>
            <DialogDescription>
              Select completed work to add to your portfolio.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="tasks">
            <TabsList className="mb-4">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks">
              {tasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No completed tasks available.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {tasks.map((task: any) => (
                    <Card key={task.id} className="p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          {task.subject && <p className="text-xs text-muted-foreground">{task.subject}</p>}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => addToPortfolioMutation.mutate({
                        ...task,
                        type: 'task'
                      })}>
                        Add
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes">
              {notes.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No notes available.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {notes.map((note: any) => (
                    <Card key={note.id} className="p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">{note.title}</p>
                          {note.subject && <p className="text-xs text-muted-foreground">{note.subject}</p>}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => addToPortfolioMutation.mutate({
                        ...note,
                        type: 'note'
                      })}>
                        Add
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="photos">
              {photos.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No photos available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {photos.map((photo: any) => (
                    <Card key={photo.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted">
                        {photo.fileData && (
                          <img 
                            src={`data:${photo.mimeType};base64,${photo.fileData}`} 
                            alt={photo.title} 
                            className="w-full h-full object-cover" 
                          />
                        )}
                      </div>
                      <div className="p-2 flex justify-between items-center">
                        <p className="font-medium text-xs truncate">{photo.title}</p>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => addToPortfolioMutation.mutate({
                          ...photo,
                          type: 'photo',
                          thumbnail: photo.fileData ? `data:${photo.mimeType};base64,${photo.fileData}` : undefined
                        })}>
                          Add
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExistingWorkDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Portfolio;