import React from 'react';
import { ChatPage } from './ChatPage';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { Bot, Sliders } from 'lucide-react';

export function AgentBuilder() {
    const { isDarkMode, toggleTheme } = useTheme();
    return (

        <div className={cn(
            "h-full flex flex-col",
            isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        )}>
            <div className="border-b px-4 py-3 flex items-center justify-between dark:border-gray-700 ">
                <h1 className="text-lg font-semibold">Agent Builder</h1>
                <Bot className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 p-4 overflow-auto">

            </div>
        </div>
    );
} 