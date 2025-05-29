import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Heart, 
  Zap, 
  Coffee, 
  Frown, 
  Meh, 
  Smile,
  Star,
  Battery
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MoodEntry {
  id: number;
  userId: number;
  moodType: string;
  intensity: number;
  note: string | null;
  date: string;
  createdAt: string;
}

const moodOptions = [
  { type: "happy", label: "Happy", icon: Smile, color: "text-green-500", bgColor: "bg-green-100 hover:bg-green-200" },
  { type: "excited", label: "Excited", icon: Zap, color: "text-yellow-500", bgColor: "bg-yellow-100 hover:bg-yellow-200" },
  { type: "focused", label: "Focused", icon: Star, color: "text-blue-500", bgColor: "bg-blue-100 hover:bg-blue-200" },
  { type: "calm", label: "Calm", icon: Heart, color: "text-purple-500", bgColor: "bg-purple-100 hover:bg-purple-200" },
  { type: "tired", label: "Tired", icon: Battery, color: "text-orange-500", bgColor: "bg-orange-100 hover:bg-orange-200" },
  { type: "bored", label: "Bored", icon: Meh, color: "text-gray-500", bgColor: "bg-gray-100 hover:bg-gray-200" },
  { type: "stressed", label: "Stressed", icon: Frown, color: "text-red-500", bgColor: "bg-red-100 hover:bg-red-200" },
  { type: "motivated", label: "Motivated", icon: Coffee, color: "text-emerald-500", bgColor: "bg-emerald-100 hover:bg-emerald-200" },
];

export const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get today's mood if already set
  const { data: todaysMood } = useQuery<MoodEntry | null>({
    queryKey: ['/api/mood-entries/today'],
  });

  const createMoodMutation = useMutation({
    mutationFn: async (data: { moodType: string; intensity: number; note?: string }) => {
      const response = await fetch("/api/mood-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create mood entry");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mood shared!",
        description: "Thanks for letting us know how you're feeling today.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mood-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mood-entries/today'] });
      setSelectedMood("");
      setNote("");
      setIntensity(3);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to save your mood. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Choose how you're feeling today first.",
        variant: "destructive",
      });
      return;
    }

    createMoodMutation.mutate({
      moodType: selectedMood,
      intensity,
      note: note.trim() || undefined,
    });
  };

  const selectedMoodOption = moodOptions.find(m => m.type === selectedMood);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          How are you feeling today?
        </CardTitle>
        <CardDescription>
          {todaysMood 
            ? `You shared that you're feeling ${todaysMood.moodType} today` 
            : "Share your mood to help your coaches understand how you're doing"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {todaysMood ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {(() => {
                const moodOption = moodOptions.find(m => m.type === todaysMood.moodType);
                const Icon = moodOption?.icon || Heart;
                return (
                  <>
                    <Icon className={cn("h-6 w-6", moodOption?.color)} />
                    <span className="text-lg font-medium capitalize">
                      {todaysMood.moodType}
                    </span>
                  </>
                );
              })()}
            </div>
            <div className="flex justify-center items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <Star
                  key={level}
                  className={cn(
                    "h-4 w-4",
                    level <= todaysMood.intensity
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            {todaysMood.note && (
              <p className="text-sm text-muted-foreground italic">
                "{todaysMood.note}"
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mood Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Pick your mood:
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {moodOptions.map((mood) => {
                  const Icon = mood.icon;
                  return (
                    <Button
                      key={mood.type}
                      variant="ghost"
                      className={cn(
                        "h-auto p-3 flex flex-col items-center gap-2",
                        mood.bgColor,
                        selectedMood === mood.type && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedMood(mood.type)}
                    >
                      <Icon className={cn("h-5 w-5", mood.color)} />
                      <span className="text-xs font-medium">{mood.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Intensity Slider */}
            {selectedMood && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  How much? (1 = a little, 5 = a lot)
                </Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Button
                      key={level}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0",
                        intensity >= level
                          ? "text-yellow-400"
                          : "text-gray-300 hover:text-gray-400"
                      )}
                      onClick={() => setIntensity(level)}
                    >
                      <Star className={cn("h-4 w-4", intensity >= level && "fill-current")} />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Note */}
            {selectedMood && (
              <div>
                <Label htmlFor="mood-note" className="text-sm font-medium mb-2 block">
                  Want to add a note? (optional)
                </Label>
                <Textarea
                  id="mood-note"
                  placeholder="Tell us more about how you're feeling..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>
            )}

            {/* Submit Button */}
            {selectedMood && (
              <Button 
                onClick={handleSubmit} 
                disabled={createMoodMutation.isPending}
                className="w-full"
              >
                {createMoodMutation.isPending ? "Sharing..." : "Share My Mood"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};