import { tool } from "@openai/agents";
import { z } from "zod";
import { webSearch } from "../llm/providers/openai";


export const webSearchTool = tool({
  name: "webSearch",
  description: "Search the web for information",
  parameters: z.object({ query: z.string() }),
  async execute({query}) {
    const result = await webSearch(query);
    return result;
  }
});