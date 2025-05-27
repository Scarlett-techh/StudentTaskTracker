import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Video, 
  Film, 
  Database, 
  Compass, 
  PlusCircle, 
  ExternalLink,
  Star,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  icon: React.ReactNode;
}

const Resources = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [newResourceDialog, setNewResourceDialog] = useState(false);
  const [savedResources, setSavedResources] = useState<Resource[]>([]);
  
  // Default educational resources
  const defaultResources: Resource[] = [
    {
      id: "khan-math",
      title: "Khan Academy - Mathematics",
      description: "Free world-class education in mathematics with personalized learning resources for all ages.",
      url: "https://www.khanacademy.org/math",
      category: "mathematics",
      tags: ["algebra", "calculus", "geometry", "trigonometry"],
      icon: <Database className="h-10 w-10 text-blue-500" />
    },
    {
      id: "khan-science",
      title: "Khan Academy - Science",
      description: "Science concepts explained through videos and practice exercises across physics, chemistry, and biology.",
      url: "https://www.khanacademy.org/science",
      category: "science",
      tags: ["physics", "chemistry", "biology", "astronomy"],
      icon: <Compass className="h-10 w-10 text-green-500" />
    },
    {
      id: "youtube-crash",
      title: "CrashCourse on YouTube",
      description: "Educational YouTube channel featuring fast-paced courses on various subjects.",
      url: "https://www.youtube.com/user/crashcourse",
      category: "video",
      tags: ["history", "science", "literature", "psychology"],
      icon: <Video className="h-10 w-10 text-red-500" />
    },
    {
      id: "tvo-learn",
      title: "TVO Learn",
      description: "Ontario's educational content aligned with curriculum for K-12 students.",
      url: "https://tvolearn.com/",
      category: "curriculum",
      tags: ["ontario", "k-12", "elementary", "secondary"],
      icon: <BookOpen className="h-10 w-10 text-purple-500" />
    },
    {
      id: "coursera",
      title: "Coursera",
      description: "Access courses from top universities and organizations worldwide.",
      url: "https://www.coursera.org/",
      category: "courses",
      tags: ["university", "professional", "certificates", "degrees"],
      icon: <BookOpen className="h-10 w-10 text-blue-600" />
    },
    {
      id: "edx",
      title: "edX",
      description: "Free online courses from institutions like Harvard, MIT, and more.",
      url: "https://www.edx.org/",
      category: "courses",
      tags: ["university", "professional", "certificates", "micromasters"],
      icon: <BookOpen className="h-10 w-10 text-red-600" />
    },
    {
      id: "national-geo",
      title: "National Geographic Kids",
      description: "Fun, educational content about animals, science, and history for younger students.",
      url: "https://kids.nationalgeographic.com/",
      category: "kids",
      tags: ["animals", "science", "geography", "games"],
      icon: <Compass className="h-10 w-10 text-yellow-500" />
    },
    {
      id: "bbc-bitesize",
      title: "BBC Bitesize",
      description: "Free study resources for UK students, covering various subjects and age groups.",
      url: "https://www.bbc.co.uk/bitesize",
      category: "curriculum",
      tags: ["uk", "primary", "secondary", "exam prep"],
      icon: <BookOpen className="h-10 w-10 text-red-500" />
    },
    {
      id: "mit-opencourseware",
      title: "MIT OpenCourseWare",
      description: "Free access to MIT course materials for learners around the world.",
      url: "https://ocw.mit.edu/",
      category: "courses",
      tags: ["university", "engineering", "science", "humanities"],
      icon: <BookOpen className="h-10 w-10 text-gray-600" />
    },
    {
      id: "youtube-edu",
      title: "YouTube Learning",
      description: "Curated educational content across various subjects on YouTube.",
      url: "https://www.youtube.com/learning",
      category: "video",
      tags: ["tutorials", "lectures", "how-to", "explanations"],
      icon: <Video className="h-10 w-10 text-red-500" />
    },
    {
      id: "practical-money-skills",
      title: "Practical Money Skills",
      description: "Real-world math activities for budgeting, banking, and financial planning with interactive calculators.",
      url: "https://www.practicalmoneyskills.com/",
      category: "life-skills",
      tags: ["budgeting", "math", "finance", "calculator", "real-world"],
      icon: <Database className="h-10 w-10 text-green-600" />
    },
    {
      id: "cooking-math",
      title: "Math in the Kitchen - Exploratorium",
      description: "Learn fractions, ratios, and conversions through cooking and baking activities.",
      url: "https://www.exploratorium.edu/cooking/",
      category: "life-skills",
      tags: ["cooking", "fractions", "ratios", "measurements", "practical"],
      icon: <BookOpen className="h-10 w-10 text-orange-500" />
    },
    {
      id: "consumer-math",
      title: "Consumer Math - Smart Shopping",
      description: "Calculate discounts, compare prices, and understand sales tax with interactive activities.",
      url: "https://www.practicalmoneyskills.com/learn/lesson_plans/teens",
      category: "life-skills",
      tags: ["shopping", "discounts", "percentages", "taxes", "real-world"],
      icon: <Database className="h-10 w-10 text-purple-600" />
    },
    {
      id: "statistics-daily-life",
      title: "Statistics for Everyday Life",
      description: "Understanding data, graphs, and probability in daily decision-making with Khan Academy.",
      url: "https://www.khanacademy.org/math/statistics-probability",
      category: "mathematics",
      tags: ["statistics", "data", "graphs", "probability", "daily-life"],
      icon: <Database className="h-10 w-10 text-blue-600" />
    }
  ];

  // Combined resources (default + saved)
  const allResources = [...defaultResources, ...savedResources];
  
  // Filter resources based on active tab and search query
  const filteredResources = allResources.filter(resource => {
    const matchesTab = activeTab === "all" || resource.category === activeTab;
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });
  
  // Add a new custom resource
  const handleAddResource = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newResource: Resource = {
      id: `custom-${Date.now()}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      url: formData.get('url') as string,
      category: formData.get('category') as string,
      tags: (formData.get('tags') as string).split(',').map(tag => tag.trim()),
      icon: <ExternalLink className="h-10 w-10 text-gray-500" />
    };
    
    setSavedResources(prev => [...prev, newResource]);
    setNewResourceDialog(false);
    
    toast({
      title: "Resource Added",
      description: `${newResource.title} has been added to your resources.`,
    });
    
    // Reset the form
    (event.target as HTMLFormElement).reset();
  };

  // Open resource in new tab
  const openResource = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Save resource to favorites (placeholder functionality)
  const saveResource = (id: string) => {
    toast({
      title: "Resource Saved",
      description: "This resource has been saved to your favorites.",
    });
  };
  
  return (
    <>
      <Helmet>
        <title>Learning Resources | Student Work Tracker</title>
        <meta name="description" content="Access educational resources and learning materials from Khan Academy, YouTube Education, TVO Learn and more." />
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Learning Resources</h1>
            <p className="text-muted-foreground">
              Discover and save educational resources to enhance your learning.
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search resources..."
                className="pl-8 w-[200px] sm:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setNewResourceDialog(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mathematics">Math</TabsTrigger>
            <TabsTrigger value="science">Science</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.length > 0 ? (
                filteredResources.map((resource) => (
                  <Card key={resource.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="mr-4">{resource.icon}</div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">
                            {resource.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-wrap gap-1 mt-1">
                        {resource.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Button variant="ghost" size="sm" onClick={() => saveResource(resource.id)}>
                        <Star className="mr-1 h-4 w-4" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openResource(resource.url)}>
                        <ExternalLink className="mr-1 h-4 w-4" />
                        Visit
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-muted-foreground">No resources found. Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add New Resource Dialog */}
      <Dialog open={newResourceDialog} onOpenChange={setNewResourceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Learning Resource</DialogTitle>
            <DialogDescription>
              Add a new educational resource to your collection.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddResource}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Resource title" required />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Brief description" required />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="url">Website URL</Label>
                <Input id="url" name="url" placeholder="https://example.com" required type="url" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category" 
                  name="category" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="mathematics">Mathematics</option>
                  <option value="science">Science</option>
                  <option value="video">Video</option>
                  <option value="curriculum">Curriculum</option>
                  <option value="courses">Courses</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="tags">
                  Tags (comma separated)
                </Label>
                <Input 
                  id="tags" 
                  name="tags" 
                  placeholder="math, algebra, interactive" 
                  required 
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setNewResourceDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Resource</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Resources;