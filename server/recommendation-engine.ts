import { storage } from './storage';
import { Task } from '@shared/schema';

/**
 * Types of recommendations we can generate
 */
export enum RecommendationType {
  SUBJECT_EXPLORATION = "subject_exploration",
  SKILL_DEVELOPMENT = "skill_development",
  KNOWLEDGE_BUILDING = "knowledge_building",
  BALANCE = "balance",
  CHALLENGE = "challenge"
}

/**
 * Interface for recommendation objects
 */
export interface LearningRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  reason: string;
  suggestedTask?: string;
  relatedSubject?: string;
  priority: number; // 1-10, with 10 being highest priority
  resources?: Array<{
    title: string;
    url: string;
    description: string;
  }>;
}

/**
 * Analyzes a user's completed tasks and generates personalized learning recommendations
 */
export async function generateRecommendations(userId: number): Promise<LearningRecommendation[]> {
  // Get completed tasks for this user
  const tasks = await storage.getTasksByStatus(userId, "completed");
  
  // Get all subjects with their colors
  const subjects = await storage.getSubjects(userId);
  
  // Generate different types of recommendations
  const recommendations: LearningRecommendation[] = [
    ...await generateSubjectExplorationRecommendations(userId, tasks, subjects),
    ...await generateSkillDevelopmentRecommendations(userId, tasks),
    ...await generateBalanceRecommendations(userId, tasks),
    ...await generateChallengeRecommendations(userId, tasks)
  ];
  
  // Sort by priority
  return recommendations.sort((a, b) => b.priority - a.priority);
}

/**
 * Generates recommendations for subjects the user hasn't explored much
 */
async function generateSubjectExplorationRecommendations(
  userId: number, 
  completedTasks: Task[], 
  subjects: any[]
): Promise<LearningRecommendation[]> {
  const recommendations: LearningRecommendation[] = [];
  
  // Count tasks by subject
  const taskCountBySubject: Record<string, number> = {};
  completedTasks.forEach(task => {
    if (task.subject) {
      taskCountBySubject[task.subject] = (taskCountBySubject[task.subject] || 0) + 1;
    }
  });
  
  // Find underexplored subjects
  const underexploredSubjects = subjects
    .filter(subject => {
      // Consider a subject underexplored if it has less than 2 completed tasks
      return !taskCountBySubject[subject.name] || taskCountBySubject[subject.name] < 2;
    })
    .map(subject => subject.name);
  
  // Create recommendations for underexplored subjects
  for (const subject of underexploredSubjects) {
    const recommendationText = getSubjectRecommendationText(subject);
    
    recommendations.push({
      id: `subject_exploration_${subject.toLowerCase().replace(/\s+/g, '_')}`,
      type: RecommendationType.SUBJECT_EXPLORATION,
      title: `Explore ${subject}`,
      description: recommendationText.description,
      reason: recommendationText.reason,
      suggestedTask: recommendationText.suggestedTask,
      relatedSubject: subject,
      priority: 8,
      resources: getSubjectResources(subject)
    });
  }
  
  return recommendations;
}

/**
 * Generates recommendations for skill development based on task patterns
 */
async function generateSkillDevelopmentRecommendations(
  userId: number, 
  completedTasks: Task[]
): Promise<LearningRecommendation[]> {
  const recommendations: LearningRecommendation[] = [];
  
  // Group tasks by subject
  const tasksBySubject: Record<string, Task[]> = {};
  completedTasks.forEach(task => {
    if (task.subject) {
      if (!tasksBySubject[task.subject]) {
        tasksBySubject[task.subject] = [];
      }
      tasksBySubject[task.subject].push(task);
    }
  });
  
  // Identify subjects where the user has shown consistent interest
  const consistentSubjects = Object.entries(tasksBySubject)
    .filter(([_, tasks]) => tasks.length >= 3)
    .map(([subject, _]) => subject);
  
  // For each subject of consistent interest, suggest skill development
  for (const subject of consistentSubjects) {
    const recommendationText = getSkillRecommendationText(subject);
    
    recommendations.push({
      id: `skill_development_${subject.toLowerCase().replace(/\s+/g, '_')}`,
      type: RecommendationType.SKILL_DEVELOPMENT,
      title: `Develop Your ${subject} Skills`,
      description: recommendationText.description,
      reason: recommendationText.reason,
      suggestedTask: recommendationText.suggestedTask,
      relatedSubject: subject,
      priority: 7,
      resources: getSubjectResources(subject)
    });
  }
  
  return recommendations;
}

/**
 * Generates recommendations to balance different learning areas
 */
async function generateBalanceRecommendations(
  userId: number, 
  completedTasks: Task[]
): Promise<LearningRecommendation[]> {
  const recommendations: LearningRecommendation[] = [];
  
  // Define learning categories
  const categories = {
    knowledge: ["Mathematics", "Science", "History", "English"],
    skills: ["Life Skills", "Physical Activity"],
    interests: ["Interest / Passion"]
  };
  
  // Count tasks in each category
  const categoryCounts = {
    knowledge: 0,
    skills: 0,
    interests: 0
  };
  
  completedTasks.forEach(task => {
    if (task.subject) {
      if (categories.knowledge.includes(task.subject)) {
        categoryCounts.knowledge++;
      } else if (categories.skills.includes(task.subject)) {
        categoryCounts.skills++;
      } else if (categories.interests.includes(task.subject)) {
        categoryCounts.interests++;
      }
    }
  });
  
  // Calculate total tasks
  const totalTasks = categoryCounts.knowledge + categoryCounts.skills + categoryCounts.interests;
  
  // If we have enough tasks to analyze
  if (totalTasks >= 5) {
    // Calculate percentages
    const knowledgePercent = categoryCounts.knowledge / totalTasks * 100;
    const skillsPercent = categoryCounts.skills / totalTasks * 100;
    const interestsPercent = categoryCounts.interests / totalTasks * 100;
    
    // Check for imbalances
    if (knowledgePercent < 20) {
      recommendations.push({
        id: "balance_knowledge",
        type: RecommendationType.BALANCE,
        title: "Balance Your Learning: Knowledge Focus",
        description: "You've been focusing on practical skills and interests, which is great! Consider adding some academic subjects to round out your learning.",
        reason: "Only " + Math.round(knowledgePercent) + "% of your completed tasks are in knowledge areas.",
        suggestedTask: "Try a math puzzle, science experiment, or reading assignment.",
        priority: 6
      });
    }
    
    if (skillsPercent < 20) {
      recommendations.push({
        id: "balance_skills",
        type: RecommendationType.BALANCE,
        title: "Balance Your Learning: Practical Skills",
        description: "You've been doing well with academic subjects! Consider adding some practical life skills to your learning.",
        reason: "Only " + Math.round(skillsPercent) + "% of your completed tasks involve practical skills.",
        suggestedTask: "Try a cooking project, budgeting exercise, or physical activity.",
        priority: 6
      });
    }
    
    if (interestsPercent < 10) {
      recommendations.push({
        id: "balance_interests",
        type: RecommendationType.BALANCE,
        title: "Balance Your Learning: Personal Interests",
        description: "Learning is more engaging when you include topics you're passionate about! Try adding some interest-driven activities.",
        reason: "Only " + Math.round(interestsPercent) + "% of your completed tasks are based on personal interests.",
        suggestedTask: "Add a task related to a hobby, creative project, or topic you're curious about.",
        priority: 5
      });
    }
  }
  
  return recommendations;
}

/**
 * Generates recommendations to challenge the student based on their patterns
 */
async function generateChallengeRecommendations(
  userId: number, 
  completedTasks: Task[]
): Promise<LearningRecommendation[]> {
  const recommendations: LearningRecommendation[] = [];
  
  // For users who have completed at least 10 tasks
  if (completedTasks.length >= 10) {
    // Find the most common subject
    const subjectCounts: Record<string, number> = {};
    
    completedTasks.forEach(task => {
      if (task.subject) {
        subjectCounts[task.subject] = (subjectCounts[task.subject] || 0) + 1;
      }
    });
    
    let mostCommonSubject = '';
    let highestCount = 0;
    
    Object.entries(subjectCounts).forEach(([subject, count]) => {
      if (count > highestCount) {
        mostCommonSubject = subject;
        highestCount = count;
      }
    });
    
    // Generate a challenge in their strongest subject
    if (mostCommonSubject) {
      const challengeText = getChallengeRecommendationText(mostCommonSubject);
      
      recommendations.push({
        id: `challenge_${mostCommonSubject.toLowerCase().replace(/\s+/g, '_')}`,
        type: RecommendationType.CHALLENGE,
        title: `${mostCommonSubject} Challenge`,
        description: challengeText.description,
        reason: `You've completed ${highestCount} tasks in ${mostCommonSubject}, showing strong progress in this area!`,
        suggestedTask: challengeText.suggestedTask,
        relatedSubject: mostCommonSubject,
        priority: 9
      });
    }
  }
  
  return recommendations;
}

/**
 * Helper function to get text content for subject exploration recommendations
 */
function getSubjectRecommendationText(subject: string): { 
  description: string, 
  reason: string, 
  suggestedTask: string 
} {
  const subjectRecommendations: Record<string, any> = {
    "Mathematics": {
      description: "Explore math concepts through engaging activities and problems.",
      reason: "Adding mathematical thinking to your learning routine helps develop logical reasoning skills.",
      suggestedTask: "Try a Khan Academy math lesson or solve a logic puzzle."
    },
    "Science": {
      description: "Discover scientific concepts through experiments and observations.",
      reason: "Scientific exploration helps develop critical thinking and analytical skills.",
      suggestedTask: "Conduct a simple home experiment or watch an educational science video."
    },
    "History": {
      description: "Explore historical events and their impact on our world today.",
      reason: "Understanding history helps develop perspective and critical analysis of current events.",
      suggestedTask: "Read about a historical figure or event that interests you."
    },
    "English": {
      description: "Develop reading and writing skills through engaging with stories and communication.",
      reason: "Strong language skills are fundamental to success in all areas of learning.",
      suggestedTask: "Read a short story or write in a journal for 15 minutes."
    },
    "Physical Activity": {
      description: "Get moving with physical activities that build strength, endurance, and coordination.",
      reason: "Physical activity improves brain function, mood, and overall health.",
      suggestedTask: "Try a 20-minute workout, yoga session, or outdoor walk."
    },
    "Life Skills": {
      description: "Develop practical skills that prepare you for daily life and independence.",
      reason: "Life skills build confidence and prepare you for real-world challenges.",
      suggestedTask: "Learn a basic cooking recipe or create a personal budget."
    },
    "Interest / Passion": {
      description: "Explore topics that spark your curiosity and creativity.",
      reason: "Following your interests increases motivation and makes learning more enjoyable.",
      suggestedTask: "Spend time on a hobby or creative project that excites you."
    }
  };
  
  // Default if subject isn't in our map
  const defaultRecommendation = {
    description: `Explore ${subject} through engaging activities and projects.`,
    reason: `Adding ${subject} to your learning routine will broaden your knowledge and skills.`,
    suggestedTask: `Try a beginner-friendly ${subject} activity or lesson.`
  };
  
  return subjectRecommendations[subject] || defaultRecommendation;
}

/**
 * Helper function to get text content for skill development recommendations
 */
function getSkillRecommendationText(subject: string): {
  description: string, 
  reason: string, 
  suggestedTask: string 
} {
  const skillRecommendations: Record<string, any> = {
    "Mathematics": {
      description: "Take your math skills to the next level with more challenging problems.",
      reason: "You've shown consistent interest in mathematics. Developing advanced skills will help with complex problem-solving.",
      suggestedTask: "Try a challenging math problem set or explore a new mathematical concept."
    },
    "Science": {
      description: "Deepen your understanding of scientific concepts with more advanced experiments and studies.",
      reason: "Your consistent work in science shows you're ready to tackle more complex scientific thinking.",
      suggestedTask: "Design your own experiment or dive into a specific scientific field that interests you."
    },
    "History": {
      description: "Develop deeper historical analysis skills by exploring connections between different time periods.",
      reason: "Your history work shows you're ready to understand more complex historical relationships.",
      suggestedTask: "Compare two historical events or research primary sources about a historical topic."
    },
    "English": {
      description: "Enhance your language and communication skills through more advanced reading and writing.",
      reason: "Your consistent English practice shows you're ready for more complex language challenges.",
      suggestedTask: "Read a challenging article or book, or write a persuasive essay on a topic you care about."
    },
    "Physical Activity": {
      description: "Progress in your physical activities by setting new goals and challenges.",
      reason: "Your consistent physical activity shows you're ready to take on new physical challenges.",
      suggestedTask: "Try increasing the intensity of your workouts or learn a new sport or physical skill."
    },
    "Life Skills": {
      description: "Build on your practical skills with more advanced projects and responsibilities.",
      reason: "You've mastered basic life skills and are ready for more complex challenges.",
      suggestedTask: "Take on a multi-step cooking project or create a more detailed financial plan."
    },
    "Interest / Passion": {
      description: "Take your personal interests to a deeper level with more advanced projects.",
      reason: "Your consistent work in this area shows you're ready to develop more specialized skills.",
      suggestedTask: "Create a more ambitious project related to your interests or share your knowledge with others."
    }
  };
  
  // Default if subject isn't in our map
  const defaultRecommendation = {
    description: `Enhance your ${subject} skills with more advanced challenges.`,
    reason: `Your consistent work in ${subject} shows you're ready for the next level.`,
    suggestedTask: `Try a more challenging ${subject} activity or project.`
  };
  
  return skillRecommendations[subject] || defaultRecommendation;
}

/**
 * Helper function to get text content for challenge recommendations
 */
/**
 * Returns curated educational resources for a given subject
 */
function getSubjectResources(subject: string): Array<{ title: string, url: string, description: string }> {
  const resourceMap: Record<string, Array<{ title: string, url: string, description: string }>> = {
    "Mathematics": [
      {
        title: "Khan Academy - Mathematics",
        url: "https://www.khanacademy.org/math",
        description: "Free interactive lessons covering everything from basic arithmetic to calculus"
      },
      {
        title: "Desmos Graphing Calculator",
        url: "https://www.desmos.com/calculator",
        description: "Interactive graphing calculator for exploring mathematical concepts visually"
      },
      {
        title: "Brilliant.org - Math Courses",
        url: "https://brilliant.org/courses/#math-foundational",
        description: "Interactive courses that build problem-solving skills through challenges"
      }
    ],
    "Science": [
      {
        title: "Khan Academy - Science",
        url: "https://www.khanacademy.org/science",
        description: "Comprehensive lessons covering physics, chemistry, biology, and more"
      },
      {
        title: "NASA STEM Engagement",
        url: "https://www.nasa.gov/stem/",
        description: "Educational resources from NASA for exploring space science"
      },
      {
        title: "PhET Interactive Simulations",
        url: "https://phet.colorado.edu/",
        description: "Interactive science simulations that make learning through exploration"
      }
    ],
    "History": [
      {
        title: "Khan Academy - History",
        url: "https://www.khanacademy.org/humanities/world-history",
        description: "Comprehensive world history lessons and resources"
      },
      {
        title: "Crash Course History",
        url: "https://www.youtube.com/playlist?list=PL8dPuuaLjXtMwmepBjTSG593eG7ObzO7s",
        description: "Engaging video series covering major historical topics"
      },
      {
        title: "National Geographic History",
        url: "https://www.nationalgeographic.com/history",
        description: "Articles and resources exploring various historical topics and cultures"
      }
    ],
    "English": [
      {
        title: "Purdue Online Writing Lab",
        url: "https://owl.purdue.edu/",
        description: "Comprehensive writing resources covering grammar, style, and more"
      },
      {
        title: "CommonLit",
        url: "https://www.commonlit.org/",
        description: "Free collection of fiction and nonfiction texts for reading practice"
      },
      {
        title: "Grammarly",
        url: "https://www.grammarly.com/",
        description: "Tool for improving writing with grammar and style suggestions"
      }
    ],
    "Physical Activity": [
      {
        title: "Darebee Fitness",
        url: "https://darebee.com/",
        description: "Free visual workouts, fitness programs, and challenges"
      },
      {
        title: "Yoga With Adriene",
        url: "https://yogawithadriene.com/",
        description: "Free yoga videos for all levels and wellness practices"
      },
      {
        title: "NHS Physical Activity Guidelines",
        url: "https://www.nhs.uk/live-well/exercise/",
        description: "Evidence-based guidelines for physical activity and exercise"
      }
    ],
    "Life Skills": [
      {
        title: "Practical Money Skills",
        url: "https://www.practicalmoneyskills.com/",
        description: "Financial literacy resources for budgeting and money management"
      },
      {
        title: "AllRecipes",
        url: "https://www.allrecipes.com/recipes/1642/everyday-cooking/quick-and-easy/",
        description: "Collection of simple recipes for beginners learning to cook"
      },
      {
        title: "Ted Talks - Life Skills",
        url: "https://www.ted.com/topics/life",
        description: "Inspiring talks on various aspects of life skills and personal development"
      }
    ],
    "Interest / Passion": [
      {
        title: "Coursera",
        url: "https://www.coursera.org/",
        description: "Online courses covering virtually any subject of interest"
      },
      {
        title: "Instructables",
        url: "https://www.instructables.com/",
        description: "DIY project tutorials for creative hobbies and interests"
      },
      {
        title: "edX",
        url: "https://www.edx.org/",
        description: "Free courses from top universities on a wide variety of subjects"
      }
    ]
  };

  return resourceMap[subject] || [
    {
      title: "Khan Academy",
      url: "https://www.khanacademy.org/",
      description: "Free educational resources covering a wide range of subjects"
    },
    {
      title: "YouTube Learning",
      url: "https://www.youtube.com/learning",
      description: "Educational videos on virtually any topic"
    }
  ];
}

function getChallengeRecommendationText(subject: string): {
  description: string, 
  suggestedTask: string 
} {
  const challengeRecommendations: Record<string, any> = {
    "Mathematics": {
      description: "Challenge yourself with an advanced mathematical concept or problem-solving task.",
      suggestedTask: "Try solving a challenging math puzzle or exploring a new area of mathematics."
    },
    "Science": {
      description: "Take on a more complex scientific challenge that tests your understanding and creativity.",
      suggestedTask: "Design and conduct an experiment to test a hypothesis you've formed."
    },
    "History": {
      description: "Challenge yourself with a deeper historical analysis that connects multiple time periods or perspectives.",
      suggestedTask: "Research and analyze a historical event from multiple perspectives."
    },
    "English": {
      description: "Push your language and communication skills with a challenging writing or analysis project.",
      suggestedTask: "Write a short story or essay that incorporates advanced literary techniques."
    },
    "Physical Activity": {
      description: "Set a challenging physical goal that will push your limits and build new skills.",
      suggestedTask: "Create and complete a personal fitness challenge that extends your current abilities."
    },
    "Life Skills": {
      description: "Take on a more complex life skill project that combines multiple areas of expertise.",
      suggestedTask: "Plan and execute a multi-day project that requires planning, budgeting, and hands-on skills."
    },
    "Interest / Passion": {
      description: "Challenge yourself to take your personal interests to a new level of expertise or creativity.",
      suggestedTask: "Create something that showcases your skills and knowledge in your area of interest."
    }
  };
  
  // Default if subject isn't in our map
  const defaultRecommendation = {
    description: `Challenge yourself with an advanced ${subject} project that pushes your boundaries.`,
    suggestedTask: `Set a challenging ${subject} goal that builds on your current knowledge and skills.`
  };
  
  return challengeRecommendations[subject] || defaultRecommendation;
}