import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "@/hooks/use-theme";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Star, 
  Gift, 
  PaintBucket, 
  Award, 
  Crown, 
  Sparkles, 
  Download,
  Glasses,
  Bookmark,
  UserCircle,
  GraduationCap,
  Medal
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface RewardItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'theme' | 'badge' | 'accessory' | 'certificate' | 'privilege' | 'customization';
  icon: React.ReactNode;
  unlocked: boolean;
}

export default function LearningWallet() {
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);

  // Get user stats
  const { data: stats } = useQuery({
    queryKey: ["/api/user-stats"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const points = stats?.points || 0;
  
  // Define available rewards
  const availableRewards: RewardItem[] = [
    // Themes
    {
      id: 'theme_dark',
      name: 'Dark Mode Theme',
      description: 'Switch to a sleek dark theme for the app',
      cost: 50,
      category: 'theme',
      icon: <PaintBucket className="h-5 w-5 text-purple-500" />,
      unlocked: false
    },
    {
      id: 'theme_ocean',
      name: 'Ocean Theme',
      description: 'Calming blue theme inspired by the ocean',
      cost: 75,
      category: 'theme',
      icon: <PaintBucket className="h-5 w-5 text-blue-500" />,
      unlocked: false
    },
    
    // Badges
    {
      id: 'badge_genius',
      name: 'Genius Badge',
      description: 'Show off your smarts with this special profile badge',
      cost: 100,
      category: 'badge',
      icon: <Crown className="h-5 w-5 text-yellow-500" />,
      unlocked: false
    },
    {
      id: 'badge_streaker',
      name: 'Streak Master Badge',
      description: 'Badge for maintaining your study streaks',
      cost: 150,
      category: 'badge',
      icon: <Award className="h-5 w-5 text-amber-500" />,
      unlocked: false
    },
    
    // Avatar Accessories
    {
      id: 'accessory_glasses',
      name: 'Smart Glasses',
      description: 'Add stylish glasses to your avatar',
      cost: 80,
      category: 'accessory',
      icon: <Glasses className="h-5 w-5 text-blue-500" />,
      unlocked: false
    },
    {
      id: 'accessory_hat',
      name: 'Graduation Cap',
      description: 'Show your academic spirit with this graduation cap',
      cost: 120,
      category: 'accessory',
      icon: <GraduationCap className="h-5 w-5 text-indigo-500" />,
      unlocked: false
    },
    {
      id: 'accessory_frame',
      name: 'Golden Frame',
      description: 'Elegant golden frame for your profile picture',
      cost: 200,
      category: 'accessory',
      icon: <UserCircle className="h-5 w-5 text-amber-500" />,
      unlocked: false
    },
    
    // Certificates
    {
      id: 'certificate_achievement',
      name: 'Achievement Certificate',
      description: 'Downloadable certificate celebrating your progress',
      cost: 250,
      category: 'certificate',
      icon: <Medal className="h-5 w-5 text-green-500" />,
      unlocked: false
    },
    {
      id: 'certificate_excellence',
      name: 'Excellence Certificate',
      description: 'Premium certificate recognizing your dedication to learning',
      cost: 500,
      category: 'certificate',
      icon: <Download className="h-5 w-5 text-red-500" />,
      unlocked: false
    },
    
    // Customizations
    {
      id: 'custom_avatar',
      name: 'Custom Avatar Frame',
      description: 'Unique border for your profile picture',
      cost: 180,
      category: 'customization',
      icon: <Sparkles className="h-5 w-5 text-indigo-500" />,
      unlocked: false
    },
  ];

  // Simulate user's purchased rewards
  const [purchasedRewards, setPurchasedRewards] = useState<string[]>([]);

  // Mutation for purchasing rewards
  const purchaseMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      // This would be a real API call in production
      // return apiRequest("POST", "/api/rewards/purchase", { rewardId });
      
      // For now, simulate the API call
      return new Promise((resolve) => {
        setTimeout(() => {
          const reward = availableRewards.find(r => r.id === rewardId);
          
          // For certificate rewards, create and download an actual certificate
          if (reward?.category === 'certificate') {
            // Create a simple HTML certificate that we'll convert to a data URL
            const certificateHTML = `
              <html>
                <head>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      text-align: center;
                      padding: 40px;
                      border: 15px solid #8b5cf6;
                      margin: 0;
                      height: 100vh;
                      box-sizing: border-box;
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      background-color: #f9fafb;
                    }
                    h1 {
                      color: #6d28d9;
                      font-size: 36px;
                      margin-bottom: 10px;
                    }
                    .certificate-title {
                      font-size: 24px;
                      margin-bottom: 30px;
                      color: #4c1d95;
                    }
                    .student-name {
                      font-size: 30px;
                      border-bottom: 2px solid #8b5cf6;
                      padding-bottom: 10px;
                      margin-bottom: 30px;
                      display: inline-block;
                    }
                    .description {
                      font-size: 18px;
                      margin-bottom: 30px;
                      max-width: 600px;
                      margin-left: auto;
                      margin-right: auto;
                    }
                    .date {
                      font-size: 16px;
                      margin-top: 40px;
                    }
                    .signature {
                      margin-top: 60px;
                      border-top: 1px solid #d1d5db;
                      padding-top: 10px;
                      display: inline-block;
                      width: 200px;
                    }
                  </style>
                </head>
                <body>
                  <h1>Certificate of ${reward.id.includes('excellence') ? 'Excellence' : 'Achievement'}</h1>
                  <div class="certificate-title">${reward.name}</div>
                  <div class="student-name">Emma Wilson</div>
                  <div class="description">
                    This certificate is awarded for outstanding achievements in learning and demonstrating exceptional dedication to personal development.
                  </div>
                  <div class="date">Awarded on ${new Date().toLocaleDateString()}</div>
                  <div class="signature">Aliud Learning Coach</div>
                </body>
              </html>
            `;
            
            // Convert the HTML to a data URL
            const blob = new Blob([certificateHTML], { type: 'text/html' });
            const dataUrl = URL.createObjectURL(blob);
            
            // Create a link and trigger download
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `${reward.name.replace(/\s+/g, '_')}.html`;
            a.click();
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(dataUrl), 100);
          }
          
          resolve({ success: true, reward });
        }, 500);
      });
    },
    onSuccess: (_, rewardId) => {
      setPurchasedRewards([...purchasedRewards, rewardId]);
      
      // Get the purchased reward
      const reward = availableRewards.find(r => r.id === rewardId);
      
      // Update points locally for demo
      queryClient.setQueryData(["/api/user-stats"], (oldData: any) => {
        if (!reward) return oldData;
        
        return {
          ...oldData,
          points: oldData.points - reward.cost
        };
      });
      
      // Apply theme changes if a theme was purchased
      if (reward?.category === 'theme') {
        if (reward.id === 'theme_dark') {
          setTheme('dark');
          toast({
            title: "Dark Theme Applied!",
            description: "Your new dark theme has been activated.",
            variant: "default",
          });
        } else if (reward.id === 'theme_ocean') {
          setTheme('ocean');
          toast({
            title: "Ocean Theme Applied!",
            description: "Your new ocean theme has been activated.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Reward Purchased!",
          description: "You've successfully unlocked a new reward.",
          variant: "default",
        });
      }
      
      setPurchaseDialogOpen(false);
    }
  });

  const handlePurchaseClick = (reward: RewardItem) => {
    setSelectedReward(reward);
    setPurchaseDialogOpen(true);
  };

  const handlePurchaseConfirm = () => {
    if (!selectedReward) return;
    
    if (points < selectedReward.cost) {
      toast({
        title: "Not enough points",
        description: `You need ${selectedReward.cost - points} more points to purchase this reward.`,
        variant: "destructive",
      });
      return;
    }
    
    purchaseMutation.mutate(selectedReward.id);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Wallet className="mr-2 h-5 w-5 text-yellow-500" />
            Learning Wallet
          </CardTitle>
          <CardDescription>
            Earn and spend points on rewards and customizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Star className="h-6 w-6 text-yellow-500 mr-2" />
              <span className="text-2xl font-bold">{points}</span>
              <span className="text-sm text-muted-foreground ml-2">points</span>
            </div>
          </div>
          
          <Tabs defaultValue="shop">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shop">Rewards Shop</TabsTrigger>
              <TabsTrigger value="inventory">My Rewards</TabsTrigger>
            </TabsList>
            
            <TabsContent value="shop" className="mt-4 space-y-4">
              {availableRewards
                .filter(reward => !purchasedRewards.includes(reward.id))
                .map(reward => (
                  <div 
                    key={reward.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      points >= reward.cost 
                        ? "bg-white hover:bg-gray-50 cursor-pointer" 
                        : "bg-gray-50 opacity-70"
                    )}
                    onClick={() => points >= reward.cost && handlePurchaseClick(reward)}
                  >
                    <div className="flex items-center">
                      <div className="mr-3 p-2 bg-gray-100 rounded-md">
                        {reward.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{reward.name}</h4>
                        <p className="text-xs text-muted-foreground">{reward.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge 
                        variant={points >= reward.cost ? "outline" : "secondary"}
                        className="mr-2"
                      >
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {reward.cost}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant={points >= reward.cost ? "default" : "secondary"}
                        disabled={points < reward.cost}
                      >
                        {points >= reward.cost ? "Purchase" : "Locked"}
                      </Button>
                    </div>
                  </div>
                ))}
                
              {availableRewards.filter(reward => !purchasedRewards.includes(reward.id)).length === 0 && (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">You've purchased all available rewards!</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="inventory" className="mt-4 space-y-4">
              {purchasedRewards.length > 0 ? (
                availableRewards
                  .filter(reward => purchasedRewards.includes(reward.id))
                  .map(reward => (
                    <div 
                      key={reward.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-white"
                    >
                      <div className="flex items-center">
                        <div className="mr-3 p-2 bg-primary/10 rounded-md">
                          {reward.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">{reward.name}</h4>
                          <p className="text-xs text-muted-foreground">{reward.description}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500">Unlocked</Badge>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">You haven't purchased any rewards yet.</p>
                  <p className="text-gray-500 text-sm">Complete tasks to earn points!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Purchase Confirmation Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to spend points on this reward.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="flex items-center py-4">
              <div className="mr-4 p-3 bg-primary/10 rounded-full">
                {selectedReward.icon}
              </div>
              <div>
                <h4 className="font-medium">{selectedReward.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                <Badge className="mt-2 bg-yellow-500 hover:bg-yellow-600">
                  <Star className="h-3 w-3 mr-1" />
                  {selectedReward.cost} points
                </Badge>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchaseConfirm} disabled={purchaseMutation.isPending}>
              {purchaseMutation.isPending ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}