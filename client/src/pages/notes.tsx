import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import NoteCard from "@/components/dashboard/note-card";
import NoteForm from "@/components/forms/note-form";
import { Helmet } from "react-helmet-async";

const Notes = () => {
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false);

  // Fetch notes
  const { data: notes, isLoading, refetch } = useQuery({
    queryKey: ["/api/notes"],
  });

  return (
    <>
      <Helmet>
        <title>Notes - Student Task Tracker</title>
        <meta 
          name="description" 
          content="Keep track of important class notes, research findings, and study materials in one organized location."
        />
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Notes</h2>
          <Button onClick={() => setNewNoteDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">All Notes</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <span className="mr-1 text-sm">Filter</span>
                </Button>
                <Button variant="outline" size="sm">
                  <span className="mr-1 text-sm">Sort</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Notes List */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">Loading notes...</div>
            ) : notes && notes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.map((note: any) => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onNoteUpdate={refetch}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg 
                  className="mx-auto h-12 w-12 text-gray-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  ></path>
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No notes yet</h3>
                <p className="text-gray-500 mt-1">Add a new note to get started</p>
                <Button 
                  onClick={() => setNewNoteDialogOpen(true)}
                  className="mt-4"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Note Dialog */}
      <Dialog open={newNoteDialogOpen} onOpenChange={setNewNoteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
          </DialogHeader>
          <NoteForm 
            onSuccess={() => {
              setNewNoteDialogOpen(false);
              refetch();
            }} 
            onCancel={() => setNewNoteDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Notes;
