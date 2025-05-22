import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Medal, Download } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const queryClient = useQueryClient();

  // Get user stats for points
  const { data: userStats } = useQuery({
    queryKey: ["/api/user-stats"],
  });

  const points = userStats?.points || 0;

  // Simple milestone certificates - exactly what you wanted!
  const availableCertificates: CertificateReward[] = [
    {
      id: 'aliud_100_points',
      name: '100 Points Achievement',
      description: 'Congratulations on earning your first 100 points!',
      cost: 0, // Auto-awarded
      icon: <Award className="h-5 w-5 text-blue-500" />,
      unlocked: points >= 100
    },
    {
      id: 'aliud_250_points',
      name: '250 Points Milestone', 
      description: 'Amazing progress - you\'ve reached 250 points!',
      cost: 0, // Auto-awarded
      icon: <Star className="h-5 w-5 text-purple-500" />,
      unlocked: points >= 250
    },
    {
      id: 'aliud_400_points',
      name: '400 Points Excellence',
      description: 'Outstanding achievement - 400 points earned!',
      cost: 0, // Auto-awarded
      icon: <Medal className="h-5 w-5 text-yellow-500" />,
      unlocked: points >= 400
    },
    {
      id: '100_days_learning',
      name: '100 Days of Learning',
      description: 'Celebrate completing 100 days of continuous learning',
      cost: 0, // Special milestone
      icon: <Star className="h-5 w-5 text-green-500" />,
      unlocked: false // Will be unlocked when streak reaches 100
    }
  ];

  // Test functionality to add points
  const addPointsMutation = useMutation({
    mutationFn: async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: () => {
      // Update points locally for demo
      queryClient.setQueryData(["/api/user-stats"], (oldData: any) => ({
        ...oldData,
        points: (oldData?.points || 0) + 50
      }));
      
      toast({
        title: "Points Added!",
        description: "You earned 50 points for testing the certificate system!",
        variant: "default",
      });
    },
  });

  // Certificate download mutation
  const downloadCertificateMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      return new Promise<{ success: boolean }>((resolve) => {
        const certificate = availableCertificates.find(c => c.id === certificateId);
        if (!certificate) throw new Error("Certificate not found");
        
        setTimeout(() => {
          // Generate your beautiful Aliud certificate HTML
          const certificateHTML = `
            <html>
              <head>
                <style>
                  body {
                    margin: 0;
                    padding: 40px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #3b82f615, #3b82f635);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                  }
                  .certificate-container {
                    background: white;
                    border-radius: 20px;
                    padding: 60px 80px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    text-align: center;
                    max-width: 800px;
                    width: 100%;
                    position: relative;
                    border: 3px solid #3b82f6;
                  }
                  .decorative-elements {
                    font-size: 24px;
                    margin-bottom: 30px;
                    color: #3b82f6;
                  }
                  .aliud-logo {
                    font-size: 32px;
                    font-weight: bold;
                    color: #3b82f6;
                    letter-spacing: 3px;
                    margin-bottom: 30px;
                  }
                  .certificate-title-main {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2d3748;
                    margin-bottom: 40px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                  }
                  .awarded-to {
                    font-size: 18px;
                    color: #4a5568;
                    margin-bottom: 20px;
                  }
                  .student-name {
                    font-size: 42px;
                    font-weight: bold;
                    color: #3b82f6;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #3b82f6;
                    padding-bottom: 10px;
                    display: inline-block;
                  }
                  .achievement-text {
                    font-size: 20px;
                    color: #2d3748;
                    margin-bottom: 30px;
                    font-weight: 600;
                  }
                  .award-icon {
                    font-size: 48px;
                    color: #3b82f6;
                    margin-bottom: 20px;
                  }
                  .description {
                    font-size: 16px;
                    color: #4a5568;
                    line-height: 1.6;
                    margin-bottom: 40px;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                  }
                  .date-signature {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 50px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 30px;
                  }
                  .date {
                    font-size: 14px;
                    color: #4a5568;
                  }
                  .signature {
                    font-size: 16px;
                    color: #2d3748;
                    font-weight: 600;
                  }
                  .share-button {
                    margin-top: 20px;
                    background: linear-gradient(135deg, #3b82f6, #3b82f6cc);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    box-shadow: 0 4px 15px #3b82f640;
                    transition: all 0.3s ease;
                  }
                  .share-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px #3b82f660;
                  }
                </style>
              </head>
              <body>
                <div class="certificate-container">
                  <div class="decorative-elements">🎓✨🌟</div>
                  
                  <div class="aliud-logo">ALIUD</div>
                  
                  <div class="certificate-title-main">CERTIFICATE OF ACHIEVEMENT</div>
                  
                  <div class="awarded-to">This is awarded to</div>
                  
                  <div class="student-name">Emma Wilson</div>
                  
                  <div class="achievement-text">You are a MASTER of your own EDUCATION</div>
                  
                  <div class="award-icon">🏆</div>
                  
                  <div class="description">
                    ${certificate.description}
                  </div>
                  
                  <div class="date-signature">
                    <div class="date">Awarded on ${new Date().toLocaleDateString()}</div>
                    <div class="signature">Aliud Learning Coach</div>
                  </div>
                  
                  <button class="share-button" onclick="window.print()">Share Certificate</button>
                </div>
              </body>
            </html>
          `;
          
          // Convert to blob and download
          const blob = new Blob([certificateHTML], { type: 'text/html' });
          const dataUrl = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${certificate.name.replace(/\s+/g, '_')}_Certificate.html`;
          a.click();
          
          // Clean up
          setTimeout(() => URL.revokeObjectURL(dataUrl), 100);
          
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: () => {
      toast({
        title: "Certificate Downloaded!",
        description: "Your beautiful Aliud certificate has been downloaded!",
        variant: "default",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Learning Wallet - Certificate Milestones
          </CardTitle>
          <CardDescription>
            Earn beautiful Aliud certificates automatically as you reach learning milestones!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-2xl font-bold">{points} Points</p>
              <p className="text-sm text-gray-600">Total earned</p>
            </div>
            <Button 
              onClick={() => addPointsMutation.mutate()}
              disabled={addPointsMutation.isPending}
              variant="outline"
            >
              {addPointsMutation.isPending ? "Adding..." : "Add 50 Points (Testing)"}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {availableCertificates.map((certificate) => (
              <Card key={certificate.id} className={`relative ${certificate.unlocked ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {certificate.icon}
                      <CardTitle className="text-lg">{certificate.name}</CardTitle>
                    </div>
                    {certificate.unlocked && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Unlocked!
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{certificate.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {certificate.unlocked ? (
                    <Button 
                      onClick={() => downloadCertificateMutation.mutate(certificate.id)}
                      disabled={downloadCertificateMutation.isPending}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadCertificateMutation.isPending ? "Generating..." : "Download Certificate"}
                    </Button>
                  ) : (
                    <div className="text-center text-gray-500">
                      {certificate.id === '100_days_learning' 
                        ? "Complete 100 days of learning to unlock"
                        : `Reach ${certificate.id.includes('100') ? '100' : certificate.id.includes('250') ? '250' : '400'} points to unlock`
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}