
```javascript
const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

const client = new Anthropic();

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

// System prompt for the recipe generator
const systemPrompt = `You are a healthy recipe generator assistant. Your role is to create nutritious, delicious recipes based on user preferences.

When generating recipes, you MUST:
1. Provide the recipe name
2. List all ingredients with quantities
3. Provide step-by-step cooking instructions
4. Calculate and provide total calories for the recipe
5. Break down calories per serving (estimate servings)
6. Include nutritional highlights (protein, carbs, fats content if possible)
7. Provide health benefits of the recipe

Format your response clearly with sections for:
- Recipe Name
- Ingredients (with quantities)
- Instructions (numbered steps)
- Nutrition Information (total calories, per serving, macronutrients)
- Health Benefits

Be specific with calorie calculations and make recipes practical for home cooking.`;

interface RecipeRequest {
  dietaryRestrictions?: string[];
  cuisineType?: string;
  calorieTarget?: number;
  servings?: number;
  mainIngredients?: string[];
  cookingTime?: string;
}

async function generateRecipe(userQuery: string): Promise<string> {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userQuery,
        },
      ],
    });

    // Extract the text content from the response
    const content = message.content[0];
    if (content.type === "text") {
      return content.text;
    }
    return "Error: No text response received";
  } catch (error) {
    throw new Error(`Failed to generate recipe: ${error}`);
  }
}

function parseRecipeRequest(input: string): RecipeRequest {
  const request: RecipeRequest = {};

  // Parse dietary restrictions
  if (input.includes("vegan")) request.dietaryRestrictions = ["vegan"];
  else if (input.includes("vegetarian"))
    request.dietaryRestrictions = ["vegetarian"];
  else if (input.includes("gluten")) request.dietaryRestrictions = ["gluten-free"];
  else if (input.includes("keto"))
    request.dietaryRestrictions = ["keto"];

  // Parse cuisine type
  if (input.includes("italian")) request.cuisineType = "Italian";
  else if (input.includes("asian")) request.cuisineType = "Asian";
  else if (input.includes("mexican")) request.cuisineType = "Mexican";
  else if (input.includes("mediterranean"))
    request.cuisineType = "Mediterranean";

  // Parse calorie target
  const calorieMatch = input.match(/(\d+)\s*(?:calorie|cal|kcal)/i);
  if (calorieMatch) {
    request.calorieTarget = parseInt(calorieMatch[1]);
  }

  // Parse servings
  const servingsMatch = input.match(/(\d+)\s*(?:serving|person|people)/i);
  if (servingsMatch) {
    request.servings = parseInt(servingsMatch[1]);
  }

  // Parse cooking time
  if (input.includes("quick") || input.includes("15 min") || input.includes("20 min")) {
    request.cookingTime = "15-20 minutes";
  } else if (input.includes("30 min")) {
    request.cookingTime = "30 minutes";
  } else if (input.includes("slow") || input.includes("1 hour")) {
    request.cookingTime = "1 hour";
  }

  return request;
}

function buildRecipeQuery(input: string, parsedRequest: RecipeRequest): string {
  let query = `Generate a healthy recipe based on this request: ${input}\n\n`;

  if (parsedRequest.dietaryRestrictions) {
    query += `Dietary restrictions: ${parsedRequest.dietaryRestrictions.join(", ")}\n`;
  }
  if (parsedRequest.cuisineType) {
    query += `Cuisine type: ${parsedRequest.cuisineType}\n`;
  }
  if (parsedRequest.calorieTarget) {
    query += `Total calories per serving target: ${parsedRequest.calorieTarget} calories\n`;
  }
  if (parsedRequest.servings) {
    query += `Number of servings: ${parsedRequest.servings}\n`;
  }
  if (parsedRequest.cookingTime) {
    query += `Cooking time: ${parsedRequest.cookingTime}\n`;
  }

  query += "\nPlease provide a complete, healthy recipe with detailed calorie information.";
  return query;
}

function displayWelcome(): void {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   ${colors.yellow}🍽️  HEALTHY RECIPE GENERATOR WITH CALORIES${colors.cyan}    ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.green}Welcome to the Healthy Recipe Generator!${colors.reset}`);
  console.log(
    `${colors.blue}I can help you create nutritious recipes with calorie information.${colors.reset}\n`,
  );

  console.log(`${colors.yellow}Examples of what you can ask:${colors.reset}`);
  console.log('