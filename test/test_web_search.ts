import { describe, it, expect, beforeAll } from '@jest/globals';
import { webSearch } from '../src/llm/providers/openai';

describe('webSearch', () => {
    beforeAll(() => {
        // Ensure OpenAI API key is available for tests
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required for tests');
        }
    });

    it('should perform a basic web search and return results', async () => {
        const query = "What is the current weather in New York?";
        
        const result = await webSearch(query);
        
        console.log('Web search result:', result);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(result.toLowerCase()).toContain('weather');
    }, 10000);

    it('should handle factual queries with web search', async () => {
        const query = "What is the latest version of Node.js?";
        
        const result = await webSearch(query);
        
        console.log('Node.js version search result:', result);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(result.toLowerCase()).toContain('node');
    }, 10000);

    it('should work with context enabled', async () => {
        const query = "Tell me about TypeScript";
        
        const result = await webSearch(query, "gpt-4o-search-preview", true);
        
        console.log('Web search with context result:', result);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(result.toLowerCase()).toContain('typescript');
    }, 10000);

    it('should handle technical queries', async () => {
        const query = "What are the latest features in JavaScript ES2024?";
        
        const result = await webSearch(query);
        
        console.log('JavaScript ES2024 search result:', result);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    }, 10000);
});
