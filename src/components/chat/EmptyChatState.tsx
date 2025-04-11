import React from 'react';
import { Bot } from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';

interface EmptyChatStateProps {
    onNewChat: () => void;
}

export function EmptyChatState({ onNewChat }: EmptyChatStateProps) {
    const { config } = useChatContext();
    const appName = config.appDefinition?.title || 'Chat';

    return (
        <div className="flex h-full flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-8 w-8 text-primary" />
            </div>

            <h2 className="mb-2 text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Welcome to {appName}
            </h2>

            <p className="mb-6 max-w-md text-muted-foreground">
                {config.appDefinition?.description ||
                    "I'm your AI assistant. How can I help you today?"}
            </p>

            <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                    <h3 className="mb-2 font-medium">Ask a question</h3>
                    <p className="text-sm text-muted-foreground">
                        "How can I get started with this application?"
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                    <h3 className="mb-2 font-medium">Get information</h3>
                    <p className="text-sm text-muted-foreground">
                        "What features are available in this app?"
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                    <h3 className="mb-2 font-medium">Solve problems</h3>
                    <p className="text-sm text-muted-foreground">
                        "I'm having trouble with this feature. Can you help?"
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                    <h3 className="mb-2 font-medium">Get recommendations</h3>
                    <p className="text-sm text-muted-foreground">
                        "What's the best way to accomplish this task?"
                    </p>
                </div>
            </div>
        </div>
    );
} 