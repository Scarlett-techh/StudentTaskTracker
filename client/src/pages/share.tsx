import { useState } from "react";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Mail, 
  FileText, 
  Image, 
  Send, 
  Filter, 
  ArrowUp 
} from "lucide-react";

// Item type for all work items (tasks, notes, photos)
interface WorkItem {
  id: number;
  title: string;
  type: 'task' | 'note' | 'photo';
  category?: string;
  subject?: string;
  preview?: string;
  date: string;
  thumbnail?: string;
  status?: string;
}

const SharePage = () => {
  const { toast } = useToast();
  
  // State for selected work items
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  // State for sharing dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [coachEmail, setCoachEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  
  // Filter state
  const [filter, setFilter] = useState('all');
  
  // Get all tasks, notes, and photos
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({ 
    queryKey: ['/api/tasks'] 
  });
  
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({ 
    queryKey: ['/api/notes'] 
  });
  
  const { data: photos = [], isLoading: isLoadingPhotos } = useQuery({ 
    queryKey: ['/api/photos'] 
  });

  // Format tasks, notes and photos as work items
  const taskItems: WorkItem[] = tasks.map((task: any) => ({
    id: task.id,
    title: task.title,
    type: 'task',
    category: task.category,
    subject: task.subject,
    preview: task.description,
    date: new Date(task.updatedAt || task.createdAt).toLocaleDateString(),
    status: task.status
  }));

  const noteItems: WorkItem[] = notes.map((note: any) => ({
    id: note.id,
    title: note.title,
    type: 'note',
    subject: note.subject,
    preview: note.content,
    date: new Date(note.updatedAt || note.createdAt).toLocaleDateString()
  }));

  const photoItems: WorkItem[] = photos.map((photo: any) => ({
    id: photo.id,
    title: photo.title,
    type: 'photo',
    subject: photo.subject,
    date: new Date(photo.createdAt).toLocaleDateString(),
    thumbnail: photo.fileData ? `data:${photo.mimeType};base64,${photo.fileData}` : undefined
  }));

  // Combine and sort all items
  const allItems = [...taskItems, ...noteItems, ...photoItems]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter items based on current filter
  const filteredItems = allItems.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  // Toggle item selection
  const toggleItemSelection = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Select/Deselect all items
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  // Open share dialog
  const handleShareClick = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to share.",
        variant: "destructive",
      });
      return;
    }
    setShareDialogOpen(true);
  };

  // Send to learning coach
  const handleSendToCoach = () => {
    if (!coachEmail) {
      toast({
        title: "Email required",
        description: "Please enter your learning coach's email address.",
        variant: "destructive",
      });
      return;
    }

    // Get the selected work items
    const itemsToShare = allItems.filter(item => selectedItems.includes(item.id));
    
    // Here you would implement actual sending logic
    // For now, we'll just show a success toast
    toast({
      title: "Work shared successfully",
      description: `${selectedItems.length} items sent to ${coachEmail}`,
    });
    
    // Close dialog and reset selection
    setShareDialogOpen(false);
    setSelectedItems([]);
    setCoachEmail('');
    setShareMessage('');
  };

  // Render the appropriate icon for the item type
  const renderItemIcon = (item: WorkItem) => {
    switch (item.type) {
      case 'task':
        return <CheckCircle className={`h-5 w-5 ${item.status === 'completed' ? 'text-green-500' : 'text-blue-500'}`} />;
      case 'note':
        return <FileText className="h-5 w-5 text-amber-500" />;
      case 'photo':
        return <Image className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const isLoading = isLoadingTasks || isLoadingNotes || isLoadingPhotos;

  return (
    <>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Share Your Work</h2>
            <p className="text-muted-foreground">
              Select items to share with your learning coach
            </p>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <div className="flex items-center gap-2 border rounded-md p-2">
              <Label htmlFor="filter" className="whitespace-nowrap">Filter by:</Label>
              <select 
                id="filter"
                className="p-1 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Work</option>
                <option value="task">Tasks</option>
                <option value="note">Notes</option>
                <option value="photo">Photos</option>
              </select>
              <Filter className="h-4 w-4 text-gray-500" />
            </div>
            
            <Button 
              onClick={handleShareClick}
              disabled={selectedItems.length === 0}
            >
              <Send className="mr-2 h-4 w-4" />
              Share Selected ({selectedItems.length})
            </Button>
          </div>
        </div>

        <div className="border rounded-md">
          <div className="bg-muted p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all" 
                checked={selectedItems.length > 0 && selectedItems.length === filteredItems.length}
                onCheckedChange={toggleSelectAll}
              />
              <Label htmlFor="select-all">Select All</Label>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredItems.length} items
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <p>Loading your work...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <p>No items found. Create some tasks, notes, or upload photos first.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="p-4 flex items-start gap-4">
                  <Checkbox 
                    id={`item-${item.type}-${item.id}`}
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                  />
                  
                  <div className="flex-1 min-w-0 flex gap-3">
                    <div className="pt-0.5">
                      {renderItemIcon(item)}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          {item.subject && (
                            <p className="text-xs text-muted-foreground">{item.subject}</p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground ml-2">{item.date}</div>
                      </div>
                      
                      {item.preview && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {item.preview}
                        </p>
                      )}
                      
                      {item.type === 'photo' && item.thumbnail && (
                        <div className="mt-2">
                          <img 
                            src={item.thumbnail} 
                            alt={item.title} 
                            className="h-16 object-cover rounded-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share with Learning Coach</DialogTitle>
            <DialogDescription>
              Send your selected work to your learning coach for review.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coach-email">Learning Coach Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input 
                  id="coach-email"
                  placeholder="coach@example.com"
                  type="email"
                  value={coachEmail}
                  onChange={(e) => setCoachEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="share-message">Message (Optional)</Label>
              <Textarea 
                id="share-message"
                placeholder="Add a message to your learning coach..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="rounded-md border p-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="font-medium">Selected Items</span>
                <span className="text-sm">{selectedItems.length} items</span>
              </div>
              <ul className="mt-2 max-h-[120px] overflow-y-auto">
                {allItems
                  .filter(item => selectedItems.includes(item.id))
                  .map(item => (
                    <li key={`summary-${item.type}-${item.id}`} className="text-sm py-1 flex items-center gap-2">
                      {renderItemIcon(item)}
                      <span>{item.title}</span>
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendToCoach}>
              <Send className="mr-2 h-4 w-4" />
              Send to Coach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SharePage;