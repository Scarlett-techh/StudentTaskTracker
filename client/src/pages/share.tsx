import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  DialogTitle,
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
  ArrowUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Item type for all work items (tasks, notes, photos)
interface WorkItem {
  id: number;
  title: string;
  type: "task" | "note" | "photo";
  category?: string;
  subject?: string;
  preview?: string;
  date: string;
  thumbnail?: string;
  status?: string;
  description?: string;
  content?: string;
  fileData?: string;
  mimeType?: string;
}

const SharePage = () => {
  const { toast } = useToast();

  // State for selected work items
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // State for sharing dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [coachEmail, setCoachEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // Filter state
  const [filter, setFilter] = useState("all");

  // Get all tasks, notes, and photos
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["/api/notes"],
  });

  const { data: photos = [], isLoading: isLoadingPhotos } = useQuery({
    queryKey: ["/api/photos"],
  });

  // Format tasks, notes and photos as work items
  const taskItems: WorkItem[] = tasks.map((task: any) => ({
    id: task.id,
    title: task.title,
    type: "task",
    category: task.category,
    subject: task.subject,
    preview: task.description,
    description: task.description,
    date: new Date(task.updatedAt || task.createdAt).toLocaleDateString(),
    status: task.status,
  }));

  const noteItems: WorkItem[] = notes.map((note: any) => ({
    id: note.id,
    title: note.title,
    type: "note",
    subject: note.subject,
    preview:
      note.content?.substring(0, 100) +
      (note.content?.length > 100 ? "..." : ""),
    content: note.content,
    date: new Date(note.updatedAt || note.createdAt).toLocaleDateString(),
  }));

  const photoItems: WorkItem[] = photos.map((photo: any) => ({
    id: photo.id,
    title: photo.title,
    type: "photo",
    subject: photo.subject,
    date: new Date(photo.createdAt).toLocaleDateString(),
    thumbnail: photo.fileData
      ? `data:${photo.mimeType};base64,${photo.fileData}`
      : undefined,
    fileData: photo.fileData,
    mimeType: photo.mimeType,
  }));

  // Combine and sort all items
  const allItems = [...taskItems, ...noteItems, ...photoItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Filter items based on current filter
  const filteredItems = allItems.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  // Toggle item selection
  const toggleItemSelection = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Select/Deselect all items
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item.id));
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
    setSendError("");
  };

  // Send to learning coach - ACTUAL IMPLEMENTATION
  const handleSendToCoach = async () => {
    if (!coachEmail) {
      toast({
        title: "Email required",
        description: "Please enter your learning coach's email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coachEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendError("");

    try {
      // Get the selected work items with full details
      const itemsToShare = allItems.filter((item) =>
        selectedItems.includes(item.id),
      );

      console.log("Sending share request for items:", itemsToShare.length);
      console.log("Recipient:", coachEmail);

      // Make API call to backend share endpoint
      const response = await fetch("/api/share/send-to-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coachEmail,
          message: shareMessage,
          items: itemsToShare.map((item) => ({
            id: item.id,
            type: item.type,
            title: item.title,
            subject: item.subject,
            category: item.category,
            description: item.description,
            content: item.content,
            preview: item.preview,
            date: item.date,
            status: item.status,
            // For photos, include thumbnail info
            thumbnail: item.thumbnail,
            hasFileData: !!item.fileData,
          })),
          totalItems: itemsToShare.length,
        }),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Share successful:", result);

        toast({
          title: "Work shared successfully!",
          description: `${selectedItems.length} items sent to ${coachEmail}`,
        });

        // Close dialog and reset selection
        setShareDialogOpen(false);
        setSelectedItems([]);
        setCoachEmail("");
        setShareMessage("");
      } else {
        const errorData = await response.json().catch(() => ({
          message: `Server error: ${response.status}`,
        }));
        console.error("Server error:", errorData);
        throw new Error(
          errorData.message || `Failed to send: ${response.status}`,
        );
      }
    } catch (error: any) {
      console.error("Error sending share request:", error);
      setSendError(
        error.message ||
          "Failed to send email. Please check backend configuration.",
      );

      toast({
        title: "Sharing Failed",
        description: error.message || "Failed to send items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Render the appropriate icon for the item type
  const renderItemIcon = (item: WorkItem) => {
    switch (item.type) {
      case "task":
        return (
          <CheckCircle
            className={`h-5 w-5 ${item.status === "completed" ? "text-green-500" : "text-blue-500"}`}
          />
        );
      case "note":
        return <FileText className="h-5 w-5 text-amber-500" />;
      case "photo":
        return <Image className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const isLoading = isLoadingTasks || isLoadingNotes || isLoadingPhotos;

  return (
    <>
      <Helmet>
        <title>Share Work | Student Work Tracker</title>
        <meta
          name="description"
          content="Share your work with learning coaches, parents, and teachers."
        />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Share Your Work
            </h2>
            <p className="text-muted-foreground">
              Select items to share with your learning coach
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <div className="flex items-center gap-2 border rounded-md p-2">
              <Label htmlFor="filter" className="whitespace-nowrap">
                Filter by:
              </Label>
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
                checked={
                  selectedItems.length > 0 &&
                  selectedItems.length === filteredItems.length
                }
                onCheckedChange={toggleSelectAll}
              />
              <Label htmlFor="select-all">Select All</Label>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredItems.length} items • {selectedItems.length} selected
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading your work...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <p>
                No items found. Create some tasks, notes, or upload photos
                first.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    id={`item-${item.type}-${item.id}`}
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                  />

                  <div className="flex-1 min-w-0 flex gap-3">
                    <div className="pt-0.5">{renderItemIcon(item)}</div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          {item.subject && (
                            <p className="text-xs text-muted-foreground">
                              {item.subject}
                            </p>
                          )}
                          {item.category && (
                            <p className="text-xs text-blue-600">
                              {item.category}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                          {item.date}
                        </div>
                      </div>

                      {item.preview && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.preview}
                        </p>
                      )}

                      {item.type === "photo" && item.thumbnail && (
                        <div className="mt-2">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="h-16 w-16 object-cover rounded-sm border"
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
            {sendError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{sendError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="coach-email">Learning Coach Email *</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="coach-email"
                  placeholder="coach@example.com"
                  type="email"
                  value={coachEmail}
                  onChange={(e) => setCoachEmail(e.target.value)}
                  required
                  disabled={isSending}
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
                disabled={isSending}
              />
            </div>

            <div className="rounded-md border p-4 bg-muted/50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Selected Items</span>
                <span className="text-sm font-medium">
                  {selectedItems.length} items
                </span>
              </div>
              <ul className="max-h-[120px] overflow-y-auto space-y-1">
                {allItems
                  .filter((item) => selectedItems.includes(item.id))
                  .map((item) => (
                    <li
                      key={`summary-${item.type}-${item.id}`}
                      className="text-sm py-1 flex items-center gap-2"
                    >
                      {renderItemIcon(item)}
                      <span className="truncate">{item.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto capitalize">
                        {item.type}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendToCoach}
              disabled={isSending || !coachEmail}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Coach
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SharePage;
