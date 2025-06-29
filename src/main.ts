import { plannerAgent } from "./planner/planner";
import { planToStructure } from "./planner/planToStructure";
import { TaskMapper } from "./executor/mapping";
import { TaskExecutor } from "./executor/execution";
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

async function executeWorkflow(query: string) {
  console.log("\n🎯 Starting complete workflow execution...");
  
  // Step 1: Get structured plan
  const { structuredPlan } = await structure(query);
  console.log(`📋 Plan created with ${structuredPlan.length} steps`);
  
  // Step 2: Analyze execution plan
  const mapper = new TaskMapper(structuredPlan);
  const validation = mapper.validateDependencies();
  
  if (!validation.isValid) {
    console.log("❌ Dependency validation failed:");
    validation.errors.forEach(error => console.log(`  - ${error}`));
    return;
  }
  
  const executionPlan = mapper.generateExecutionPlan();
  console.log(`📊 Execution plan: ${executionPlan.totalLevels} levels, ${executionPlan.parallelGroups} parallel groups`);
  
  // Step 3: Execute the plan
  const executor = new TaskExecutor(structuredPlan);
  const result = await executor.execute();
  
  // Step 4: Display results
  console.log(executor.getExecutionReport(result));
  
  return result;
}

async function main() {
  const query = await getUserInput();
  console.log(`Processing query: "${query}"`);
  
  try {
    console.log("\n" + "=".repeat(50));
    console.log("Choose execution mode:");
    console.log("1. Plan only");
    console.log("2. Structure analysis only"); 
    console.log("3. Complete workflow execution");
    console.log("=".repeat(50));
    
    const mode = await getUserChoice();
    
    switch(mode) {
      case "1":
        await plan(query);
        break;
      case "2":
        await analyzeExecution(query);
        break;
      case "3":
        await executeWorkflow(query);
        break;
      default:
        console.log("Invalid choice, defaulting to complete workflow execution");
        await executeWorkflow(query);
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

function getUserChoice(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter your choice (1-3): ', (answer) => {
      rl.close();
      resolve(answer.trim() || "3");
    });
  });
}

main().catch(console.error);