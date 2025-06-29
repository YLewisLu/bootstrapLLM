import {Agent, Runner, tool, webSearchTool } from "@openai/agents";
import { EXECUTION_PROMPT } from "../llm/prompts/execution";
import { z } from "zod";

import dotenv from "dotenv";

dotenv.config();

export const toolAgentTool = tool({
  name: "Tool Agent",
  description: "Use this tool to execute a task",
  parameters: z.object({ query: z.string() }),
  async execute({query}) {
    const result = await toolAgent(query);
    return result;
  }
})

const toolAgentBase = new Agent({
  name: "Tool Agent",
  instructions: EXECUTION_PROMPT,
  model: "gpt-4o-mini",
  tools: [webSearchTool()],
  modelSettings: { toolChoice: "required"}
});

const toolAgentRunner = new Runner()

export async function toolAgent(input: string) {
  const result = await toolAgentRunner.run(toolAgentBase, input);
  
  // Parse the result to extract plan text
  const currentStep = result.state._currentStep;
  const toolResult = currentStep?.type === "next_step_final_output" ? currentStep.output : "";
  
  return toolResult;
}

