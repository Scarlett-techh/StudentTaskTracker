import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Medal, Download } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
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

  // Get user stats for points
  const { data: userStats } = useQuery({
    queryKey: ["/api/user-stats"],
  });

  const points = userStats?.points || 0;

  // Milestone certificates - auto-awarded based on points
  const availableCertificates: CertificateReward[] = [
    {
      id: "aliud_50_points",
      name: "50 Points Starter",
      description: "Great start! You've earned your first 50 learning points.",
      cost: 0,
      icon: <Award className="h-5 w-5 text-blue-500" />,
      unlocked: points >= 50,
    },
    {
      id: "aliud_100_points",
      name: "100 Points Achievement",
      description: "Congratulations on earning your first 100 points!",
      cost: 0,
      icon: <Star className="h-5 w-5 text-purple-500" />,
      unlocked: points >= 100,
    },
    {
      id: "aliud_250_points",
      name: "250 Points Milestone",
      description: "Amazing progress - you've reached 250 points!",
      cost: 0,
      icon: <Medal className="h-5 w-5 text-yellow-500" />,
      unlocked: points >= 250,
    },
    {
      id: "aliud_500_points",
      name: "500 Points Excellence",
      description: "Outstanding achievement - 500 points earned!",
      cost: 0,
      icon: <Award className="h-5 w-5 text-green-500" />,
      unlocked: points >= 500,
    },
    {
      id: "aliud_1000_points",
      name: "1000 Points Master",
      description: "Incredible dedication - you are a learning master!",
      cost: 0,
      icon: <Star className="h-5 w-5 text-red-500" />,
      unlocked: points >= 1000,
    },
    {
      id: "100_days_learning",
      name: "100 Days of Learning",
      description: "Celebrate completing 100 days of continuous learning",
      cost: 0,
      icon: <Medal className="h-5 w-5 text-indigo-500" />,
      unlocked: userStats?.streak >= 100 || false,
    },
  ];

  // Count unlocked certificates
  const unlockedCount = availableCertificates.filter(
    (cert) => cert.unlocked,
  ).length;

  // Certificate download mutation
  const downloadCertificateMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      return new Promise<{ success: boolean }>((resolve) => {
        const certificate = availableCertificates.find(
          (c) => c.id === certificateId,
        );
        if (!certificate) throw new Error("Certificate not found");

        setTimeout(() => {
          // Generate beautiful Aliud certificate HTML
          const certificateHTML = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>${certificate.name} - Aliud Learning</title>
                <style>
                  body {
                    margin: 0;
                    padding: 40px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #1e40af, #3b82f6);
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
                  .points-earned {
                    font-size: 18px;
                    color: #3b82f6;
                    font-weight: bold;
                    margin-bottom: 20px;
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
                  @media print {
                    body {
                      background: white !important;
                      padding: 0;
                    }
                    .certificate-container {
                      box-shadow: none;
                      border: 3px solid #3b82f6;
                    }
                    .share-button {
                      display: none;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="certificate-container">
                  <div class="aliud-logo">ALIUD LEARNING</div>

                  <div class="certificate-title-main">CERTIFICATE OF ACHIEVEMENT</div>

                  <div class="awarded-to">This certificate is proudly awarded to</div>

                  <div class="student-name">${userStats?.firstName || "Student"} ${userStats?.lastName || ""}</div>

                  <div class="achievement-text">${certificate.name}</div>

                  <div class="points-earned">${points} Total Learning Points Earned</div>

                  <div class="description">
                    ${certificate.description}
                  </div>

                  <div class="date-signature">
                    <div class="date">Awarded on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
                    <div class="signature">Aliud Learning Platform</div>
                  </div>

                  <button class="share-button" onclick="window.print()">Print Certificate</button>
                </div>
              </body>
            </html>
          `;

          // Convert to blob and download
          const blob = new Blob([certificateHTML], { type: "text/html" });
          const dataUrl = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `${certificate.name.replace(/\s+/g, "_")}_Certificate.html`;
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
    onError: () => {
      toast({
        title: "Download Failed",
        description: "Could not download certificate. Please try again.",
        variant: "destructive",
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
            Earn beautiful Aliud certificates automatically as you reach
            learning milestones!
            {unlockedCount > 0 && (
              <span className="ml-2 text-green-600 font-medium">
                {unlockedCount} certificate{unlockedCount !== 1 ? "s" : ""}{" "}
                unlocked!
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{points} Points</p>
                <p className="text-sm text-gray-600">
                  Total earned from completed tasks
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  Earn 10 points per completed task
                </p>
                <p className="text-xs text-gray-500">
                  {Math.floor((points % 100) / 10)}/10 tasks toward next level
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {availableCertificates.map((certificate) => (
              <Card
                key={certificate.id}
                className={`relative transition-all duration-300 ${
                  certificate.unlocked
                    ? "border-green-200 bg-green-50 hover:shadow-lg hover:border-green-300"
                    : "border-gray-200 bg-gray-50 opacity-75"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {certificate.icon}
                      <CardTitle className="text-lg">
                        {certificate.name}
                      </CardTitle>
                    </div>
                    {certificate.unlocked ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 text-xs px-2 py-1"
                      >
                        Unlocked ✅
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-gray-500 text-xs px-2 py-1"
                      >
                        Locked
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{certificate.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {certificate.unlocked ? (
                    <Button
                      onClick={() =>
                        downloadCertificateMutation.mutate(certificate.id)
                      }
                      disabled={downloadCertificateMutation.isPending}
                      className="w-full text-sm px-2 py-2 bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {downloadCertificateMutation.isPending
                          ? "Generating..."
                          : "Download Certificate"}
                      </span>
                    </Button>
                  ) : (
                    <div className="text-center text-gray-500 text-sm p-2">
                      {certificate.id === "100_days_learning"
                        ? "Complete 100 days of learning to unlock"
                        : `Reach ${certificate.id.split("_")[2]} points to unlock`}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">
              How to earn certificates:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Complete tasks to earn 10 points each</li>
              <li>• Maintain your learning streak for special achievements</li>
              <li>
                • Certificates are automatically awarded when you reach
                milestones
              </li>
              <li>
                • Download and share your certificates with family and friends
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
