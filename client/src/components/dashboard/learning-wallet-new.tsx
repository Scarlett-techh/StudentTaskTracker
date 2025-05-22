import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Award, 
  Crown, 
  Sparkles, 
  Download,
  Bookmark,
  GraduationCap,
  Medal
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface CertificateReward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
  unlocked: boolean;
}

export default function LearningWallet() {
  const { toast } = useToast();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<CertificateReward | null>(null);

  // Get user stats
  const { data: stats } = useQuery({
    queryKey: ["/api/user-stats"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const points = stats?.points || 0;
  
  // Define available certificate rewards
  const availableCertificates: CertificateReward[] = [
    {
      id: 'certificate_academic_achievement',
      name: 'Academic Achievement Certificate',
      description: 'Shareable certificate recognizing your academic progress',
      cost: 100,
      icon: <Medal className="h-5 w-5 text-green-500" />,
      unlocked: false
    },
    {
      id: 'certificate_excellence',
      name: 'Excellence Certificate',
      description: 'Premium certificate recognizing your dedication to learning',
      cost: 200,
      icon: <Award className="h-5 w-5 text-red-500" />,
      unlocked: false
    },
    {
      id: 'certificate_minecraft_builder',
      name: 'Master Builder Certificate',
      description: 'Certificate honoring your Minecraft architectural achievements',
      cost: 150,
      icon: <Crown className="h-5 w-5 text-amber-500" />,
      unlocked: false
    },
    {
      id: 'certificate_science_explorer',
      name: 'Science Explorer Certificate',
      description: 'Certificate recognizing your scientific curiosity and achievements',
      cost: 175,
      icon: <Sparkles className="h-5 w-5 text-blue-500" />,
      unlocked: false
    },
    {
      id: 'certificate_language_arts',
      name: 'Language Arts Certificate',
      description: 'Certificate celebrating your reading and writing accomplishments',
      cost: 175,
      icon: <Bookmark className="h-5 w-5 text-purple-500" />,
      unlocked: false
    },
    {
      id: 'certificate_100days',
      name: '100 Days of Learning Certificate',
      description: 'Special certificate for maintaining a 100-day learning streak',
      cost: 300,
      icon: <GraduationCap className="h-5 w-5 text-indigo-500" />,
      unlocked: false
    },
    {
      id: 'certificate_innovation',
      name: 'Innovation Award Certificate',
      description: 'Certificate recognizing your creative problem-solving abilities',
      cost: 250,
      icon: <Download className="h-5 w-5 text-yellow-500" />,
      unlocked: false
    },
  ];

  // Simulate user's purchased rewards
  const [purchasedRewards, setPurchasedRewards] = useState<string[]>([]);

  // Mutation for purchasing certificates
  const purchaseMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      // This would be a real API call in production
      // return apiRequest("POST", "/api/rewards/purchase", { rewardId });
      
      // For now, simulate the API call
      return new Promise((resolve) => {
        setTimeout(() => {
          const reward = availableCertificates.find(r => r.id === rewardId);
          
          // Create and download a certificate
          if (reward) {
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
                    .share-button {
                      margin-top: 20px;
                      background-color: #4c1d95;
                      color: white;
                      border: none;
                      padding: 10px 20px;
                      border-radius: 5px;
                      cursor: pointer;
                      font-size: 16px;
                    }
                    .share-button:hover {
                      background-color: #6d28d9;
                    }
                    .logo {
                      position: absolute;
                      bottom: 20px;
                      right: 20px;
                      width: 100px;
                    }
                    .award-icon {
                      font-size: 48px;
                      color: #8b5cf6;
                      margin-bottom: 20px;
                    }
                    .certificate-border {
                      position: absolute;
                      top: 0;
                      left: 0;
                      right: 0;
                      bottom: 0;
                      border: 15px solid #8b5cf6;
                      pointer-events: none;
                      z-index: -1;
                    }
                  </style>
                </head>
                <body>
                  <div class="certificate-border"></div>
                  <div class="award-icon">🏆</div>
                  <h1>Certificate of Achievement</h1>
                  <div class="certificate-title">${reward.name}</div>
                  <div class="student-name">Emma Wilson</div>
                  <div class="description">
                    This certificate is awarded for outstanding achievements in learning and demonstrating exceptional dedication to personal development.
                  </div>
                  <div class="date">Awarded on ${new Date().toLocaleDateString()}</div>
                  <div class="signature">Aliud Learning Coach</div>
                  <button class="share-button" onclick="window.print()">Share Certificate</button>
                  <img src="/src/assets/aliud-logo.png" class="logo" alt="Aliud Learning Logo" />
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
      const reward = availableCertificates.find(r => r.id === rewardId);
      
      // Update points locally for demo
      queryClient.setQueryData(["/api/user-stats"], (oldData: any) => {
        if (!reward) return oldData;
        
        return {
          ...oldData,
          points: oldData.points - reward.cost
        };
      });
      
      toast({
        title: "Certificate Purchased!",
        description: "Your certificate has been generated and downloaded. You can now share it with others!",
        variant: "default",
      });
      
      setPurchaseDialogOpen(false);
    }
  });

  const handlePurchaseClick = (reward: CertificateReward) => {
    setSelectedReward(reward);
    setPurchaseDialogOpen(true);
  };

  const handlePurchaseConfirm = () => {
    if (!selectedReward) return;
    
    if (points < selectedReward.cost) {
      toast({
        title: "Not enough points",
        description: `You need ${selectedReward.cost - points} more points to purchase this certificate.`,
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
            Earn points by completing tasks and redeem them for shareable certificates
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
              <TabsTrigger value="shop">Certificate Shop</TabsTrigger>
              <TabsTrigger value="inventory">My Certificates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="shop" className="mt-4 space-y-4">
              {availableCertificates
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
                
              {availableCertificates.filter(reward => !purchasedRewards.includes(reward.id)).length === 0 && (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">You've purchased all available certificates!</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="inventory" className="mt-4 space-y-4">
              {purchasedRewards.length > 0 ? (
                availableCertificates
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => {
                          // Re-download the certificate
                          purchaseMutation.mutate(reward.id);
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">You haven't purchased any certificates yet.</p>
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
            <DialogTitle>Confirm Certificate Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase a shareable certificate.
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
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="font-medium">{selectedReward.cost} points</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              disabled={purchaseMutation.isPending}
              onClick={handlePurchaseConfirm}
            >
              {purchaseMutation.isPending ? "Processing..." : "Purchase Certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}