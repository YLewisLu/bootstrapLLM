export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

export class ConversationContext {
    private messages: ChatMessage[] = [];

    addMessage(role: ChatMessage['role'], content: string): void {
        this.messages.push({
            role,
            content,
            timestamp: new Date()
        });
    }

    getMessages(): ChatMessage[] {
        return [...this.messages];
    }

    getLastMessage(): ChatMessage | undefined {
        return this.messages[this.messages.length - 1];
    }

    getMessagesByRole(role: ChatMessage['role']): ChatMessage[] {
        return this.messages.filter(msg => msg.role === role);
    }

    clearHistory(): void {
        this.messages = [];
    }

    getConversationLength(): number {
        return this.messages.length;
    }

    // Get messages in OpenAI API format (without timestamp)
    getOpenAIMessages(): { role: string; content: string }[] {
        return this.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }
}

// Singleton instance for global access
export const conversationContext = new ConversationContext(); 