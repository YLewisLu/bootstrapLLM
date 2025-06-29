import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { conversationContext } from "../../context/conversationContext";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI();

export async function generateStructuredOutput<T>(
    prompt: string, 
    schema: z.ZodSchema<T>, 
    schemaName: string,
    model: string = "gpt-4o-mini", 
    temperature: number = 0.3,
    useContext: boolean = false
): Promise<T> {
    let messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (useContext) {
        // Get existing conversation history and convert to proper format
        const contextMessages = conversationContext.getOpenAIMessages();
        messages = contextMessages.map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content
        }));
        // Add the current prompt as a user message
        messages.push({ role: "user", content: prompt });
        // Store the user message in context
        conversationContext.addMessage("user", prompt);
    } else {
        messages = [{ role: "user", content: prompt }];
    }

    const completion = await client.chat.completions.parse({
        messages: messages,
        model: model,
        temperature: temperature,
        response_format: zodResponseFormat(schema, schemaName),
    });
    
    const result = completion.choices[0].message.parsed as T;
    
    // Store assistant response in context if using context
    if (useContext && result) {
        conversationContext.addMessage("assistant", JSON.stringify(result));
    }
    
    return result;
}

export async function webSearch(
    query: string,
    model: string = "gpt-4o-search-preview",
    useContext: boolean = false
): Promise<string> {
    let messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (useContext) {
        // Get existing conversation history and convert to proper format
        const contextMessages = conversationContext.getOpenAIMessages();
        messages = contextMessages.map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content
        }));
        // Add the current query as a user message
        messages.push({ role: "user", content: query });
        // Store the user message in context
        conversationContext.addMessage("user", query);
    } else {
        messages = [{ role: "user", content: query }];
    }

    const completion = await client.chat.completions.create({
        model: model,
        web_search_options: {},
        messages: messages,
    });
    
    const result = completion.choices[0].message.content || "";
    
    // Store assistant response in context if using context
    if (useContext && result) {
        conversationContext.addMessage("assistant", result);
    }
    
    return result;
}

