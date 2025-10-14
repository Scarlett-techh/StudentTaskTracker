import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Target,
  Trophy,
  Users,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { useLocation } from "wouter";

export function Landing() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/student-login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Student Learning Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track your learning journey, manage tasks, build portfolios, and
            achieve your goals with gamified progress tracking.
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="text-lg px-8 py-3"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Target className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Task Management</CardTitle>
              <CardDescription>
                Organize your learning tasks with smart categorization and
                deadline tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Digital Portfolio</CardTitle>
              <CardDescription>
                Showcase your work with photos, notes, and project documentation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Trophy className="h-12 w-12 text-yellow-600 mb-4" />
              <CardTitle>Achievements</CardTitle>
              <CardDescription>
                Earn points, level up, and unlock achievements as you complete
                tasks
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Coach Dashboard</CardTitle>
              <CardDescription>
                Educators can assign tasks and monitor student progress
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-emerald-600 mb-4" />
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Visual analytics and streak tracking to keep you motivated
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>AI-Powered</CardTitle>
              <CardDescription>
                Smart task categorization and personalized learning
                recommendations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl">
                Ready to Start Learning?
              </CardTitle>
              <CardDescription className="text-lg">
                Join thousands of students already using our platform to achieve
                their learning goals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="text-lg px-8 py-3"
              >
                Get Started Now
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                Create your free account and start your learning journey today
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
