import React from 'react';
import { cn } from '@/lib/utils';
import { StreamingStage } from '@/lib/streaming/types';
import {
    Loader2,
    CheckCircle,
    XCircle,
    BrainCircuit,
    Sparkles
} from 'lucide-react';

interface StageDisplayProps {
    stages: StreamingStage[];
    className?: string;
}

export function StageDisplay({ stages, className }: StageDisplayProps) {
    // Filter out stages without any actual content
    const validStages = stages.filter(stage => {
        const hasMessage = stage.message && stage.message.trim() !== '';
        const hasContent = stage.content && stage.content.trim() !== '';
        return hasMessage || hasContent;
    });

    // Don't render anything if no valid stages
    if (!validStages.length) return null;

    return (
        <div className={cn(
            "flex flex-col gap-2 text-xs py-3 px-4",
            className
        )}>
            <div className="text-primary font-medium mb-1.5 flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">AI Processing Stage</span>
            </div>

            {validStages.map((stage) => {
                // Calculate status
                const isCompleted = stage.status === 1;
                const isError = stage.status === 2;
                const stageText = stage.message.trim() || stage.content.trim();

                // This check should be redundant now due to our filtering above
                if (!stageText) return null;

                return (
                    <div key={stage.id} className="flex items-center gap-2 pl-1">
                        {stage.content === '' ? (
                            <div className="relative w-7 h-7 flex items-center justify-center overflow-hidden rounded-full group">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-indigo-500/15 to-blue-500/10 rounded-full shadow-inner"></div>
                                <div className="absolute inset-0 rounded-full opacity-70 mix-blend-overlay bg-gradient-radial from-indigo-200/20 via-transparent to-transparent"></div>
                                <Sparkles className="h-3.5 w-3.5 text-indigo-400 relative z-10 transition-all duration-700 transform group-hover:scale-110 group-hover:text-indigo-300 animate-pulse-gentle" />
                                <div className="absolute inset-0 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_18px_rgba(99,102,241,0.5)] transition-shadow duration-500"></div>
                                <div className="absolute inset-0 w-full h-full overflow-hidden rounded-full">
                                    <div className="absolute inset-y-0 w-2/3 animate-light-sweep"></div>
                                </div>
                            </div>
                        ) : isError ? (
                            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        ) : isCompleted ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                        )}

                        <span className={cn(
                            "transition-all duration-300",
                            isError
                                ? 'text-red-600 font-medium'
                                : isCompleted
                                    ? 'text-green-600 font-medium'
                                    : stage.content === ''
                                        ? 'text-indigo-500 font-medium'
                                        : 'text-muted-foreground'
                        )}>
                            {stageText}
                            {!isCompleted && !isError ? '...' : ''}
                        </span>
                    </div>
                );
            })}
        </div>
    );
} 