import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Subject categories
const SUBJECT_CATEGORIES = [
  "Mathematics",
  "Science",
  "History",
  "English",
  "Physical Activity",
  "Life Skills",
  "Interest / Passion"
];

/**
 * Uses AI to determine the most appropriate subject for a task
 * based on its title and description.
 */
export async function categorizeTask(title: string, description: string | null): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set. Automatic task categorization disabled.");
    return null;
  }

  try {
    const taskContent = `Title: ${title}${description ? `\nDescription: ${description}` : ''}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a task categorization assistant for a student learning platform. 
          Your job is to assign the most appropriate subject category to a given task.
          Available categories are: ${SUBJECT_CATEGORIES.join(", ")}.
          Respond ONLY with the category name. If none of the categories fit well, respond with "Unassigned".`
        },
        {
          role: "user",
          content: taskContent
        }
      ],
      temperature: 0.3, // Lower temperature for more deterministic responses
      max_tokens: 20 // We only need a short response
    });

    const suggestedCategory = response.choices[0].message.content?.trim();
    
    // Validate that the suggested category is in our list
    if (suggestedCategory && SUBJECT_CATEGORIES.includes(suggestedCategory)) {
      return suggestedCategory;
    } else if (suggestedCategory === "Unassigned") {
      return null;
    }
    
    // Fallback to keyword matching if AI categorization failed or gave invalid result
    return keywordBasedCategorization(title, description);
    
  } catch (error) {
    console.error("Error in AI task categorization:", error);
    // Fallback to keyword matching if AI categorization failed
    return keywordBasedCategorization(title, description);
  }
}

/**
 * Simple fallback function that uses keyword matching to categorize tasks
 */
function keywordBasedCategorization(title: string, description: string | null): string | null {
  const content = `${title} ${description || ''}`.toLowerCase();
  
  const keywordMap: Record<string, string[]> = {
    "Mathematics": ["math", "algebra", "calculus", "geometry", "equation", "number", "arithmetic", "statistics", "probability", "khan academy"],
    "Science": ["science", "biology", "chemistry", "physics", "experiment", "lab", "hypothesis", "scientific", "molecule", "atom", "cell"],
    "History": ["history", "historical", "civilization", "century", "ancient", "medieval", "modern", "war", "revolution", "empire", "president", "kingdom"],
    "English": ["english", "essay", "writing", "read", "book", "literature", "grammar", "vocabulary", "spelling", "story", "novel", "poem", "author"],
    "Physical Activity": ["physical", "exercise", "sport", "run", "swim", "gym", "fitness", "workout", "training", "walk", "jog", "bike", "hiking", "yoga", "stretch", "walk dog"],
    "Life Skills": ["cooking", "clean", "organize", "budget", "finance", "shop", "laundry", "schedule", "plan", "time management", "responsibility", "adulting", "chore", "life skill", "driving", "driver", "house"],
    "Interest / Passion": ["hobby", "interest", "passion", "creative", "art", "music", "instrument", "craft", "project", "design", "coding", "program", "game", "paint", "draw", "create", "build"]
  };
  
  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      return category;
    }
  }
  
  return null; // Return null for "Unassigned"
}