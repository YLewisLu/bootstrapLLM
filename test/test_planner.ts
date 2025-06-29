import { describe, it, expect, beforeAll } from '@jest/globals';
import { planToStructure } from '../src/planner/planToStructure';
import { Plan, PlanStep } from '../src/llm/schema/planStructure';

describe('planToStructure', () => {
    beforeAll(() => {
        // Ensure OpenAI API key is available for tests
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required for tests');
        }
    });

    it('should convert simple text input to structured plan', async () => {
        const textInput = "First, prepare the ingredients. Then, heat the pan. Finally, cook the food.";
        
        const result = await planToStructure(textInput);
        
        console.log('Simple text input result:', JSON.stringify(result, null, 2));
        
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        
        // Check that each step has required properties
        result.forEach((step: PlanStep, index: number) => {
            expect(step.step).toBe(index + 1);
            expect(typeof step.action).toBe('string');
            expect(step.action.length).toBeGreaterThan(0);
            expect(Array.isArray(step.param)).toBe(true);
        });
    });

    it('should handle complex multi-step process with dependencies', async () => {
        const textInput = `
        To build a web application:
        1. Set up the development environment with Node.js and npm
        2. Create the project structure and initialize package.json
        3. Install required dependencies like Express and React
        4. Build the backend API endpoints
        5. Create the frontend components
        6. Connect frontend to backend
        7. Test the application
        8. Deploy to production
        `;
        
        const result = await planToStructure(textInput);
        
        console.log('Complex multi-step process result:', JSON.stringify(result, null, 2));
        
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThanOrEqual(5);
        
        // Verify structure of steps
        result.forEach((step: PlanStep) => {
            expect(step.step).toBeGreaterThan(0);
            expect(step.action).toBeTruthy();
            expect(Array.isArray(step.param)).toBe(true);
            
            // Check parameter structure if present
            step.param.forEach(param => {
                expect(param.name).toBeTruthy();
                expect(param.value).toBeTruthy();
            });
            
            // Dependencies should be array of numbers if present
            if (step.dependencies) {
                expect(Array.isArray(step.dependencies)).toBe(true);
                step.dependencies.forEach(dep => {
                    expect(typeof dep).toBe('number');
                });
            }
        });
    });

    it('should handle single step input', async () => {
        const textInput = "Download the file from the server";
        
        const result = await planToStructure(textInput);
        
        console.log('Single step input result:', JSON.stringify(result, null, 2));
        
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result[0].step).toBe(1);
        expect(result[0].action.toLowerCase()).toContain('download');
    });

    it('should extract parameters from detailed instructions', async () => {
        const textInput = "Connect to database using username 'admin' and password from environment variable, then query the users table for active users";
        
        const result = await planToStructure(textInput);
        
        console.log('Parameter extraction result:', JSON.stringify(result, null, 2));
        
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
        
        // Should have some parameters extracted
        const hasParameters = result.some(step => step.param.length > 0);
        expect(hasParameters).toBe(true);
    });

    it('should handle empty or minimal input gracefully', async () => {
        const textInput = "Do something";
        
        const result = await planToStructure(textInput);
        
        console.log('Minimal input result:', JSON.stringify(result, null, 2));
        
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(1);
    });
});
