import { z } from "zod";

export const PlanStepSchema = z.object({
    step: z.number(),
    action: z.string(),
    param: z.array(z.object({
        name: z.string(),
        value: z.string()
    })),
    dependencies: z.array(z.number()).nullable()
});

export const PlanSchema = z.object({
    steps: z.array(PlanStepSchema)
});

export type PlanStep = z.infer<typeof PlanStepSchema>;
export type Plan = z.infer<typeof PlanSchema>;
