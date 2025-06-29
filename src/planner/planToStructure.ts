import { generateStructuredOutput } from "../llm/providers/openai";
import { PlanSchema, Plan, PlanStep } from "../llm/schema/planStructure";

export async function planToStructure(textInput: string): Promise<PlanStep[]> {
    const prompt = `
Extract a structured plan from the following text input. Break down the text into sequential steps with clear actions and parameters.

For each step, identify:
- The step number (sequential)
- The action to be performed
- Parameters needed for the action (with name and value, or the source step number and the name of the parameter)
- Dependencies on other steps (if any, otherwise null)

Text input:
${textInput}

Please structure this as a plan with numbered steps, where each step has a clear action and any required parameters.
`;

    const result = await generateStructuredOutput(
        prompt,
        PlanSchema,
        "plan",
        "gpt-4.1-mini",
        0.0
    );
    
    return result.steps;
}
