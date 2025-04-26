import React, { Dispatch, SetStateAction } from 'react';
import { Bot, HelpCircle, Info, Puzzle, Lightbulb } from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';
import { cn } from '@/lib/utils';

interface EmptyChatStateProps {
    onNewChat: () => void;
    setInputValue: Dispatch<SetStateAction<string>>;
}

// default modules
const DEFAULT_MODULES = [
    {
        title: "Ask a question",
        content: "How can I get started with this application?",
        icon: <HelpCircle className="h-5 w-5" />
    },
    {
        title: "Get information",
        content: "What features are available in this app?",
        icon: <Info className="h-5 w-5" />
    },
    {
        title: "Solve problems",
        content: "I'm having trouble with this feature. Can you help?",
        icon: <Puzzle className="h-5 w-5" />
    },
    {
        title: "Get recommendations",
        content: "What's the best way to accomplish this task?",
        icon: <Lightbulb className="h-5 w-5" />
    }
];

// background colors array, for module gradient
const GRADIENT_COLORS = [
    'from-blue-500/10 to-indigo-500/10',
    'from-purple-500/10 to-pink-500/10',
    'from-amber-500/10 to-orange-500/10',
    'from-emerald-500/10 to-teal-500/10',
    'from-sky-500/10 to-cyan-500/10',
    'from-rose-500/10 to-red-500/10',
];

export function EmptyChatState({ onNewChat, setInputValue }: EmptyChatStateProps) {
    const { config } = useChatContext();
    const appName = config.appDefinition?.title || 'Chat';

    // use custom texts, if not provided, use default texts
    const moduleTexts = config.appDefinition?.chatModuleTexts || {};
    const welcomeTitle = moduleTexts.welcomeTitle || `Welcome to ${appName}`;
    const welcomeDescription = moduleTexts.welcomeDescription ||
        (config.appDefinition?.description || "I'm your AI assistant. How can I help you today?");

    // use configured modules or default modules
    const modulesData = moduleTexts.modules || DEFAULT_MODULES;

    // add default icon to each module, if not provided
    const modules = modulesData.map((module, index) => {
        return {
            ...module,
            icon: module.icon || DEFAULT_MODULES[index % DEFAULT_MODULES.length].icon,
        };
    });

    const fillTextarea = (content: string) => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
            const cleanedContent = content.replace(/"/g, '');
            setInputValue(cleanedContent);

            // Focus the textarea
            textarea.focus();
        }
    };

    return (
        <div className="flex h-full flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-purple-600/30 shadow-lg">
                <Bot className="h-10 w-10 text-primary" />
            </div>

            <h2 className="mb-3 text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {welcomeTitle}
            </h2>

            <p className="mb-10 max-w-2xl text-muted-foreground text-lg">
                {welcomeDescription}
            </p>

            <div className="grid max-w-3xl gap-6 sm:grid-cols-2 pb-16">
                {modules.map((module, index) => (
                    <div
                        key={index}
                        className={cn(
                            "rounded-xl border p-5 shadow-sm transition-all",
                            "bg-gradient-to-br bg-opacity-10 backdrop-blur-sm",
                            "hover:shadow-md hover:scale-105 hover:bg-opacity-20 cursor-pointer",
                            "dark:bg-opacity-20 dark:border-gray-700",
                            GRADIENT_COLORS[index % GRADIENT_COLORS.length]
                        )}
                        tabIndex={0}
                        onClick={() => fillTextarea(module.content)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                fillTextarea(module.content);
                            }
                        }}
                    >
                        <div className="flex items-start">
                            <div className={cn(
                                "mr-4 flex h-10 w-10 items-center justify-center rounded-full",
                                "bg-white dark:bg-gray-800 shadow-sm",
                                index % 2 === 0 ? "text-primary" : "text-purple-500",
                            )}>
                                {module.icon}
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="mb-2 font-semibold text-lg">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    "{module.content}"
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 