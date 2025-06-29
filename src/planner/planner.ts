import { Agent, Runner, webSearchTool } from "@openai/agents";
import { PLANNER_PROMPT } from "../llm/prompts/planning";

import dotenv from "dotenv";

dotenv.config();

const plannerAgentBase = new Agent({
  name: "Planner Agent",
  instructions: PLANNER_PROMPT,
  model: "gpt-4o-mini",
  tools: [webSearchTool()],
  modelSettings: { toolChoice: "required"}
});

const plannerAgentRunner = new Runner()

export async function plannerAgent(input: string) {
  const result = await plannerAgentRunner.run(plannerAgentBase, input);
  
  // Parse the result to extract plan text
  const currentStep = result.state._currentStep;
  const planText = currentStep?.type === "next_step_final_output" ? currentStep.output : "";
  
  return planText;
}

