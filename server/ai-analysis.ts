// server/ai-analysis.ts
export function generateAIAnalysis(data: any) {
  const { tasks, completedTasks, user, skillMetrics } = data;
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Analyze subjects
  const subjectMap = new Map();
  tasks.forEach((task: any) => {
    if (task.subject) {
      if (!subjectMap.has(task.subject)) {
        subjectMap.set(task.subject, { completed: 0, total: 0 });
      }
      const subjectData = subjectMap.get(task.subject);
      subjectData.total++;
      if (task.status === 'completed') {
        subjectData.completed++;
      }
    }
  });

  // Determine strongest/weakest subjects
  let strongestSubject = 'None';
  let weakestSubject = 'None';
  let highestCompletion = 0;
  let lowestCompletion = 100;

  subjectMap.forEach((data, subject) => {
    const rate = data.total > 0 ? (data.completed / data.total) * 100 : 0;
    if (rate > highestCompletion) {
      highestCompletion = rate;
      strongestSubject = subject;
    }
    if (rate < lowestCompletion && data.total >= 3) {
      lowestCompletion = rate;
      weakestSubject = subject;
    }
  });

  // Generate AI-like analysis
  let analysis = "";
  let strengths = [];
  let recommendations = [];
  let achievements = [];

  // Generate analysis based on performance
  if (completionRate >= 80) {
    analysis += "Demonstrates excellent consistency and commitment to learning tasks. ";
    strengths.push("High completion rate", "Strong task management");
    achievements.push("Consistent high performer");
  } else if (completionRate >= 50) {
    analysis += "Shows good engagement with room for improvement in consistency. ";
    strengths.push("Moderate engagement", "Varied subject interest");
  } else {
    analysis += "Has potential for growth in task completion and consistency. ";
    recommendations.push("Focus on completing at least one task daily");
  }

  if (user.streak >= 7) {
    analysis += `Maintains an impressive ${user.streak}-day active streak, showing remarkable dedication. `;
    achievements.push(`${user.streak}-day learning streak`);
    strengths.push("Daily consistency", "Strong learning habits");
  } else if (user.streak >= 3) {
    analysis += `Shows good consistency with a ${user.streak}-day streak. `;
    strengths.push("Developing consistency");
  }

  if (strongestSubject !== 'None') {
    analysis += `Shows particular strength in ${strongestSubject}, suggesting aptitude or strong interest in this area. `;
    strengths.push(`Strength in ${strongestSubject}`);
    achievements.push(`Excel in ${strongestSubject}`);
  }

  if (weakestSubject !== 'None' && weakestSubject !== strongestSubject) {
    analysis += `May need additional support or alternative learning approaches in ${weakestSubject}. `;
    recommendations.push(`Request extra help with ${weakestSubject}`);
    recommendations.push(`Try different learning resources for ${weakestSubject}`);
  }

  // Add skill-based insights
  if (skillMetrics.criticalThinking >= 70) {
    strengths.push("Strong analytical skills");
    analysis += "Demonstrates strong critical thinking abilities in problem-solving tasks. ";
  }

  if (skillMetrics.creativity >= 70) {
    strengths.push("Creative thinker");
    analysis += "Shows creativity in approaching tasks and generating ideas. ";
  }

  if (skillMetrics.selfDirection >= 70) {
    strengths.push("Self-directed learner");
    analysis += "Exhibits strong self-direction in managing learning activities. ";
  }

  if (totalTasks < 5) {
    analysis += "Still in early stages of using the platform - encourage exploration of different features and task types. ";
    recommendations.push("Explore different types of learning tasks");
    recommendations.push("Try adding tasks from various subjects");
  }

  // Ensure we have recommendations
  if (recommendations.length === 0) {
    recommendations.push("Continue current learning patterns");
    recommendations.push("Set personal challenge goals");
    recommendations.push("Explore advanced topics in strongest subjects");
  }

  // Determine learning style based on patterns
  let learningStyle = "Balanced learner";
  if (skillMetrics.criticalThinking > skillMetrics.creativity + 20) {
    learningStyle = "Analytical and logical learner";
  } else if (skillMetrics.creativity > skillMetrics.criticalThinking + 20) {
    learningStyle = "Creative and innovative learner";
  } else if (skillMetrics.collaboration > 70) {
    learningStyle = "Social and collaborative learner";
  } else if (skillMetrics.selfDirection > 70) {
    learningStyle = "Independent and self-directed learner";
  }

  return {
    analysis: analysis || "Learning patterns are still emerging. Continue engaging with diverse tasks to generate personalized insights.",
    strengths: strengths.length > 0 ? strengths : ["Developing foundational skills"],
    recommendations,
    achievements: achievements.length > 0 ? achievements : ["New learner on platform"],
    learningStyle
  };
}