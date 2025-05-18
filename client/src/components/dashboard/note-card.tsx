import { FC, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import NoteForm from "@/components/forms/note-form";
import { formatDistanceToNow } from "date-fns";

interface NoteCardProps {
  note: {
    id: number;
    title: string;
    content?: string;
    subject?: string;
    updatedAt: string;
  };
  onNoteUpdate?: () => void;
}

const NoteCard: FC<NoteCardProps> = ({ note, onNoteUpdate }) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Format time
  let updatedTimeFormatted;
  try {
    updatedTimeFormatted = formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true });
  } catch (error) {
    updatedTimeFormatted = "recently";
  }

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/notes/${note.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      if (onNoteUpdate) onNoteUpdate();
      toast({
        title: "Note deleted",
        description: "Note has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeleteNote = () => {
    deleteNoteMutation.mutate();
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    if (onNoteUpdate) onNoteUpdate();
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-medium text-gray-900">{note.title}</h4>
          <div className="flex space-x-1">
            <button 
              className="text-gray-400 hover:text-gray-600" 
              onClick={handleEditClick}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button 
              className="text-gray-400 hover:text-red-600"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {note.content || "No content"}
        </p>
        <div className="mt-3 flex items-center justify-between">
          {note.subject && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-transparent">
              {note.subject}
            </Badge>
          )}
          <span className="text-xs text-gray-500">Updated {updatedTimeFormatted}</span>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this note? This action cannot be undone.</p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteNote}
              disabled={deleteNoteMutation.isPending}
            >
              {deleteNoteMutation.isPending ? "Deleting..." : "Delete Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <NoteForm 
            note={note} 
            onSuccess={handleEditSuccess} 
            onCancel={handleEditClose} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NoteCard;
