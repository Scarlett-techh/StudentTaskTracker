import { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import TaskForm from '@/components/forms/task-form';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    description?: string;
    status: string;
    subject?: string;
    taskId: number;
  };
}

export default function Calendar() {
  const { toast } = useToast();
  const calendarRef = useRef<FullCalendar>(null);
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [viewTaskDialogOpen, setViewTaskDialogOpen] = useState(false);
  
  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  // Fetch subjects for the color mapping
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
  });

  // Helper to get subject color
  const getSubjectColor = (subjectName?: string) => {
    if (!subjectName) return '#6366f1'; // Default indigo color
    
    const subject = subjects.find((s: any) => s.name === subjectName);
    return subject?.color || '#6366f1';
  };

  // Generate status-based colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'in-progress':
        return '#6366f1'; // indigo
      default:
        return '#f59e0b'; // amber for pending
    }
  };

  // Transform tasks into calendar events
  const events: CalendarEvent[] = Array.isArray(tasks) ? tasks
    .filter((task: any) => task.dueDate) // Only include tasks with due dates
    .map((task: any) => {
      const color = getStatusColor(task.status);
      
      return {
        id: `task-${task.id}`,
        title: task.title,
        start: task.dueDate, // Using the due date as the event date
        backgroundColor: `${color}20`, // Light background
        borderColor: color,
        textColor: color,
        extendedProps: {
          description: task.description,
          status: task.status,
          subject: task.subject,
          taskId: task.id
        }
      };
    }) : [];

  // Handle date click to create a new task
  const handleDateClick = (info: any) => {
    setClickedDate(info.dateStr);
    setNewTaskDialogOpen(true);
  };

  // Handle event click to view task details
  const handleEventClick = (info: any) => {
    const taskId = info.event.extendedProps.taskId;
    const task = tasks.find((t: any) => t.id === taskId);
    
    if (task) {
      setSelectedEvent(task);
      setViewTaskDialogOpen(true);
    }
  };

  return (
    <>
      <Helmet>
        <title>Calendar - Student Task Tracker</title>
        <meta 
          name="description" 
          content="Visualize your tasks on a calendar. Easily track due dates and plan your schedule."
        />
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-heading">Calendar View</h2>
        </div>

        <div className="bg-white rounded-xl card-shadow p-4 sm:p-6">
          {isLoading ? (
            <div className="h-[600px] flex justify-center items-center">
              <div className="animate-pulse">
                <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-96 w-full bg-gray-100 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="calendar-container">
              <FullCalendar 
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth'
                }}
                height="auto"
                aspectRatio={1.7}
                expandRows={true}
                dayMaxEvents={3} // Limit events shown per day
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short'
                }}
                eventDidMount={(info) => {
                  // Add tooltip
                  const tooltip = document.createElement('div');
                  tooltip.className = 'calendar-tooltip';
                  tooltip.innerHTML = `
                    <div class="calendar-tooltip-content">
                      <div><strong>${info.event.title}</strong></div>
                      ${info.event.extendedProps.status ? `<div>Status: ${info.event.extendedProps.status}</div>` : ''}
                      ${info.event.extendedProps.subject ? `<div>Subject: ${info.event.extendedProps.subject}</div>` : ''}
                    </div>
                  `;
                  
                  info.el.addEventListener('mouseover', () => {
                    document.body.appendChild(tooltip);
                    const rect = info.el.getBoundingClientRect();
                    tooltip.style.position = 'absolute';
                    tooltip.style.left = `${rect.left + window.scrollX}px`;
                    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
                    tooltip.style.backgroundColor = 'white';
                    tooltip.style.padding = '8px';
                    tooltip.style.borderRadius = '4px';
                    tooltip.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                    tooltip.style.zIndex = '1000';
                    tooltip.style.maxWidth = '250px';
                  });
                  
                  info.el.addEventListener('mouseout', () => {
                    if (document.body.contains(tooltip)) {
                      document.body.removeChild(tooltip);
                    }
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* New Task Dialog */}
      <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white border-0 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-heading">Add New Task</DialogTitle>
            <DialogDescription className="text-gray-600">
              Create a new task for {clickedDate ? new Date(clickedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'the selected date'}
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            initialValues={clickedDate ? { dueDate: clickedDate } : undefined}
            onSuccess={() => {
              setNewTaskDialogOpen(false);
              toast({
                title: "Task created",
                description: "Your task has been added to the calendar"
              });
            }} 
            onCancel={() => {
              setNewTaskDialogOpen(false);
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={viewTaskDialogOpen} onOpenChange={setViewTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white border-0 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gradient-heading">Task Details</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="pb-2 border-b">
                <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                {selectedEvent.description && (
                  <p className="mt-1 text-gray-600">{selectedEvent.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedEvent.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : selectedEvent.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedEvent.status === 'completed' 
                        ? 'Completed' 
                        : selectedEvent.status === 'in-progress'
                          ? 'In Progress'
                          : 'Pending'
                      }
                    </span>
                  </div>
                </div>
                
                {selectedEvent.subject && (
                  <div>
                    <p className="text-sm text-gray-500">Subject</p>
                    <p className="mt-1 font-medium">{selectedEvent.subject}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="mt-1 font-medium">
                    {selectedEvent.dueDate 
                      ? new Date(selectedEvent.dueDate).toLocaleDateString() 
                      : 'Not set'}
                  </p>
                </div>
                
                {selectedEvent.dueTime && (
                  <div>
                    <p className="text-sm text-gray-500">Due Time</p>
                    <p className="mt-1 font-medium">{selectedEvent.dueTime}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => {
                    setViewTaskDialogOpen(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        .fc-daygrid-day.fc-day-today {
          background-color: rgba(99, 102, 241, 0.1);
        }
        .fc-header-toolbar {
          margin-bottom: 1.5em !important;
        }
        .fc-toolbar-title {
          font-size: 1.25em !important;
          font-weight: 600;
        }
        .fc th {
          padding: 10px 0;
        }
        .fc .fc-day-other .fc-daygrid-day-top {
          opacity: 0.5;
        }
        .fc-theme-standard .fc-scrollgrid {
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .fc-event {
          cursor: pointer;
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.8em;
        }
      `}</style>
    </>
  );
}