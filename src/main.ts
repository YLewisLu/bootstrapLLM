import { plannerAgent } from "./planner/planner";
import { planToStructure } from "./planner/planToStructure";
import { TaskMapper } from "./executor/mapping";
import * as readline from 'readline';

function getUserInput(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter your query (or press Enter for default "How to make a pizza?"): ', (answer) => {
      rl.close();
      resolve(answer.trim() || "How to make a pizza?");
    });
  });
}

async function plan(query: string) {
  const result = await plannerAgent(query);
  console.log(result);
  return result;
}

async function structure(query: string) {
  const planText = await plan(query);
  // Convert the planner result to structured format
  const structuredPlan = await planToStructure(planText);

  console.log("\n=== STRUCTURED PLAN ===");
  console.log(JSON.stringify(structuredPlan, null, 2));
  
  return { structuredPlan };
}

async function analyzeExecution(query: string) {
  const { structuredPlan } = await structure(query);
  
  // Initialize TaskMapper with the structured plan
  const mapper = new TaskMapper(structuredPlan);
  
  // Validate dependencies first
  const validation = mapper.validateDependencies();
  console.log("\n=== DEPENDENCY VALIDATION ===");
  if (validation.isValid) {
    console.log("✅ Task dependencies are valid - no cycles detected");
  } else {
    console.log("❌ Dependency validation failed:");
    validation.errors.forEach(error => console.log(`  - ${error}`));
    return;
  }
  
  // Generate and display execution plan
  console.log("\n=== EXECUTION PLAN ===");
  console.log(mapper.getExecutionPlanDescription());
  
  // Generate execution plan object for programmatic use
  const executionPlan = mapper.generateExecutionPlan();
  console.log("\n=== EXECUTION PLAN DATA ===");
  console.log(JSON.stringify(executionPlan, null, 2));
  
  // Generate mermaid graph
  console.log("\n=== MERMAID GRAPH ===");
  console.log(mapper.generateMermaidGraph());
  
  return { structuredPlan, executionPlan, mapper };
}

async function main() {
    const userQuery = await getUserInput();
    console.log(`\nProcessing query: "${userQuery}"\n`);
    await analyzeExecution(userQuery);
}

main().catch(console.error);