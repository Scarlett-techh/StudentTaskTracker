import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { 
  Book, 
  Brain, 
  CircleCheckBig, 
  Compass, 
  ExternalLink, 
  Lightbulb, 
  Trophy 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define types based on our API
interface Resource {
  title: string;
  url: string;
  description: string;
}

enum RecommendationType {
  SUBJECT_EXPLORATION = "subject_exploration",
  SKILL_DEVELOPMENT = "skill_development",
  KNOWLEDGE_BUILDING = "knowledge_building",
  BALANCE = "balance",
  CHALLENGE = "challenge"
}

interface LearningRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  reason: string;
  suggestedTask?: string;
  relatedSubject?: string;
  priority: number;
  resources?: Resource[];
}

// Helper function to get the right icon for each recommendation type
const getRecommendationIcon = (type: RecommendationType) => {
  switch (type) {
    case RecommendationType.SUBJECT_EXPLORATION:
      return <Compass className="h-5 w-5" />;
    case RecommendationType.SKILL_DEVELOPMENT:
      return <Brain className="h-5 w-5" />;
    case RecommendationType.KNOWLEDGE_BUILDING:
      return <Book className="h-5 w-5" />;
    case RecommendationType.BALANCE:
      return <Lightbulb className="h-5 w-5" />;
    case RecommendationType.CHALLENGE:
      return <Trophy className="h-5 w-5" />;
    default:
      return <Lightbulb className="h-5 w-5" />;
  }
};

// Helper function to get the right color for each recommendation type
const getRecommendationColor = (type: RecommendationType) => {
  switch (type) {
    case RecommendationType.SUBJECT_EXPLORATION:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case RecommendationType.SKILL_DEVELOPMENT:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case RecommendationType.KNOWLEDGE_BUILDING:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case RecommendationType.BALANCE:
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
    case RecommendationType.CHALLENGE:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300";
  }
};

// The main recommendation component
export const LearningRecommendations = () => {
  const { data: recommendations, isLoading, error } = useQuery<LearningRecommendation[]>({
    queryKey: ['/api/recommendations'],
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Learning Recommendations</CardTitle>
          <CardDescription>Personalizing your learning path...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations || recommendations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Learning Recommendations</CardTitle>
          <CardDescription>Complete tasks to get personalized recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>We'll provide personalized learning suggestions as you complete more tasks.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort recommendations by priority (highest first)
  const sortedRecommendations = [...recommendations].sort((a, b) => b.priority - a.priority);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Learning Recommendations
        </CardTitle>
        <CardDescription>Personalized suggestions based on your learning activity</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {sortedRecommendations.map((recommendation) => (
            <AccordionItem key={recommendation.id} value={recommendation.id}>
              <AccordionTrigger className="hover:no-underline group">
                <div className="flex flex-1 items-center gap-3 text-left">
                  <div className={cn("p-2 rounded-full", getRecommendationColor(recommendation.type))}>
                    {getRecommendationIcon(recommendation.type)}
                  </div>
                  <div>
                    <div className="font-medium">{recommendation.title}</div>
                    <div className="text-sm text-muted-foreground hidden md:block">
                      {recommendation.description.length > 75 
                        ? `${recommendation.description.substring(0, 75)}...` 
                        : recommendation.description}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-12 pr-4 pb-2 space-y-4">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {recommendation.relatedSubject || "General"}
                    </Badge>
                    <p className="mb-2">{recommendation.description}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      <strong>Why this matters:</strong> {recommendation.reason}
                    </p>
                    
                    {recommendation.suggestedTask && (
                      <div className="flex items-start gap-2 p-3 bg-muted rounded-md mb-4">
                        <CircleCheckBig className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Suggested Activity</p>
                          <p className="text-sm">{recommendation.suggestedTask}</p>
                        </div>
                      </div>
                    )}
                    
                    {recommendation.resources && recommendation.resources.length > 0 && (
                      <div className="mt-4">
                        <p className="font-medium mb-2">Helpful Resources</p>
                        <div className="space-y-2">
                          {recommendation.resources.map((resource, index) => (
                            <a 
                              key={index}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 border rounded-md hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{resource.title}</div>
                                <ExternalLink className="h-4 w-4" />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-4">
                      <Button variant="ghost" size="sm">
                        Add to tasks
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default LearningRecommendations;