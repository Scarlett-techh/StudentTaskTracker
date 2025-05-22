import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import ProgressCard from "@/components/dashboard/progress-card";
import TaskCard from "@/components/dashboard/task-card";
import NoteCard from "@/components/dashboard/note-card";
import PhotoThumbnail from "@/components/dashboard/photo-thumbnail";
import UserStats from "@/components/dashboard/user-stats";
import LearningWallet from "@/components/dashboard/learning-wallet-new";
import LearningRecommendations from "@/components/dashboard/learning-recommendations";
import TaskForm from "@/components/forms/task-form";
import NoteForm from "@/components/forms/note-form";
import PhotoUpload from "@/components/forms/photo-upload";
import { Helmet } from "react-helmet-async";

const Dashboard = () => {
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false);
  const [photoUploadDialogOpen, setPhotoUploadDialogOpen] = useState(false);

  // Get current date
  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy");

  // Fetch tasks, notes, and photos
  const { data: tasks, isLoading: isLoadingTasks, refetch: refetchTasks } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: notes, isLoading: isLoadingNotes, refetch: refetchNotes } = useQuery({
    queryKey: ["/api/notes"],
  });

  const { data: photos, isLoading: isLoadingPhotos, refetch: refetchPhotos } = useQuery({
    queryKey: ["/api/photos"],
  });

  // Get user
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  // Calculate task stats
  const taskStats = {
    total: tasks?.length || 0,
    completed: tasks?.filter((t: any) => t.status === "completed").length || 0,
    inProgress: tasks?.filter((t: any) => t.status === "in-progress").length || 0,
    pending: tasks?.filter((t: any) => t.status === "pending").length || 0,
    upcoming: 4 // This would normally be calculated based on due dates
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Student Task Tracker</title>
        <meta 
          name="description" 
          content="View your daily progress, manage tasks, take notes, and organize your academic life all in one place."
        />
      </Helmet>
      
      <div className="space-y-6">
        {/* Date & Quick Actions */}
        <div className="flex justify-between items-center flex-col sm:flex-row space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{currentDate}</h2>
            <p className="text-gray-600">
              Welcome back, <span>{user?.name?.split(' ')[0] || 'Student'}</span>! Here's your daily overview.
            </p>
          </div>
          <div>
            <Button onClick={() => setNewTaskDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ProgressCard 
              label="Completed" 
              value={taskStats.completed} 
              total={taskStats.total} 
              type="completed" 
            />
            <ProgressCard 
              label="In Progress" 
              value={taskStats.inProgress} 
              total={taskStats.total} 
              type="in-progress" 
            />
            <ProgressCard 
              label="Pending" 
              value={taskStats.pending} 
              total={taskStats.total} 
              type="pending" 
            />
            <ProgressCard 
              label="Upcoming" 
              value={taskStats.upcoming} 
              type="upcoming" 
            />
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Today's Tasks</h3>
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
          
          {/* Task List */}
          <div className="p-6">
            {isLoadingTasks ? (
              <div className="text-center py-8">Loading tasks...</div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.slice(0, 3).map((task: any) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onTaskUpdate={refetchTasks}
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                  ></path>
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No tasks for today</h3>
                <p className="text-gray-500 mt-1">Add a new task to get started</p>
                <Button 
                  onClick={() => setNewTaskDialogOpen(true)}
                  className="mt-4"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Learning Recommendations Section */}
        <div className="bg-white rounded-lg shadow">
          <LearningRecommendations />
        </div>

        {/* Notes, Photos, and Rewards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes Section */}
          <div className="bg-white rounded-lg shadow lg:col-span-1">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Recent Notes</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewNoteDialogOpen(true)}
                >
                  <PlusIcon className="mr-1 h-4 w-4" />
                  New Note
                </Button>
              </div>
            </div>
            <div className="p-6">
              {isLoadingNotes ? (
                <div className="text-center py-8">Loading notes...</div>
              ) : notes && notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.slice(0, 2).map((note: any) => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      onNoteUpdate={refetchNotes}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No notes yet. Create your first note!</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Photos Section */}
          <div className="bg-white rounded-lg shadow lg:col-span-1">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Recent Photos</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPhotoUploadDialogOpen(true)}
                >
                  <PlusIcon className="mr-1 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
            <div className="p-6">
              {isLoadingPhotos ? (
                <div className="text-center py-8">Loading photos...</div>
              ) : photos && photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {photos.slice(0, 4).map((photo: any) => (
                    <PhotoThumbnail 
                      key={photo.id} 
                      photo={photo} 
                      onPhotoUpdate={refetchPhotos}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No photos yet. Upload your first photo!</p>
                </div>
              )}
            </div>
          </div>

          {/* User Stats & Achievements Section */}
          <div className="lg:col-span-1 space-y-6">
            <UserStats />
            <LearningWallet />
          </div>
        </div>
      </div>

      {/* New Task Dialog */}
      <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <TaskForm 
            onSuccess={() => {
              setNewTaskDialogOpen(false);
              refetchTasks();
            }} 
            onCancel={() => setNewTaskDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* New Note Dialog */}
      <Dialog open={newNoteDialogOpen} onOpenChange={setNewNoteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
          </DialogHeader>
          <NoteForm 
            onSuccess={() => {
              setNewNoteDialogOpen(false);
              refetchNotes();
            }} 
            onCancel={() => setNewNoteDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={photoUploadDialogOpen} onOpenChange={setPhotoUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
          </DialogHeader>
          <PhotoUpload 
            onSuccess={() => {
              setPhotoUploadDialogOpen(false);
              refetchPhotos();
            }} 
            onCancel={() => setPhotoUploadDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;
