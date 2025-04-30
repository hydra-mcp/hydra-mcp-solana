import React from 'react';
import { cn } from '@/lib/utils';
import { StreamingStage, StageStatus, MCPToolCallDetail, WalletProgressDetail } from '@/lib/streaming/types';
import {
    Loader2,
    CheckCircle,
    XCircle,
    BrainCircuit,
    Sparkles,
    Wallet,
    Activity,
    AlertTriangle,
    TerminalSquare
} from 'lucide-react';

interface StageDisplayProps {
    stages: StreamingStage[];
    className?: string;
}

// Type guards for detail types
const isWalletProgressDetail = (detail: any): detail is WalletProgressDetail => {
    return detail &&
        'current' in detail &&
        'total' in detail &&
        'wallet' in detail;
};

const isWalletCompletedDetail = (detail: any): detail is WalletProgressDetail => {
    return detail &&
        'high_value_count' in detail &&
        'total' in detail &&
        'processed' in detail;
};

const isMcpToolCallDetail = (detail: any): detail is MCPToolCallDetail => {
    return detail &&
        'server_name' in detail &&
        'tool_name' in detail &&
        'call_id' in detail;
};

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
                const isCompleted = stage.status === StageStatus.Completed;
                const isError = stage.status === StageStatus.Error;
                const isWarning = stage.status === StageStatus.Warning;
                const stageText = stage.message.trim() || stage.content.trim();
                const stageDetail = stage.detail;

                // Use type guards for each detail type
                const isWalletProgress = stageDetail && isWalletProgressDetail(stageDetail);
                const isWalletCompleted = stageDetail && isWalletCompletedDetail(stageDetail);
                const isMcpToolCall = stageDetail && isMcpToolCallDetail(stageDetail);

                // This check should be redundant now due to our filtering above
                if (!stageText) return null;

                return (
                    <div key={stage.id} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 pl-1">
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
                            ) : isWarning ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            ) : isCompleted ? (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            ) : (
                                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                            )}

                            <span className={cn(
                                "transition-all duration-300",
                                isError
                                    ? 'text-red-600 font-medium'
                                    : isWarning
                                        ? 'text-amber-600 font-medium'
                                        : isCompleted
                                            ? 'text-green-600 font-medium'
                                            : stage.content === ''
                                                ? 'text-indigo-500 font-medium'
                                                : 'text-muted-foreground'
                            )}>
                                {stageText}
                                {!isCompleted && !isError && !isWarning ? '...' : ''}
                            </span>
                        </div>

                        {/* Wallet Analysis Progress */}
                        {isWalletProgress && (
                            <div className="ml-8 mt-1 mb-2">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5 text-xs text-indigo-600">
                                        <Wallet className="h-3 w-3" />
                                        <span className="font-medium">
                                            {stageDetail.is_high_value ? (
                                                <span className="text-amber-500 flex items-center gap-1">
                                                    <span>Smart Wallet Detected</span>
                                                    <span className="animate-pulse">✨</span>
                                                </span>
                                            ) : (
                                                "Analyzing Wallets"
                                            )}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 ml-2">
                                        <span className="font-medium text-indigo-600">
                                            [{stageDetail.current} / {stageDetail.total}]
                                        </span>
                                        <span className="ml-2 text-amber-500 font-medium">
                                            {stageDetail.high_value_count} smart wallets found
                                        </span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500 ease-out relative",
                                            stageDetail.is_high_value
                                                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                                : isWarning
                                                    ? "bg-gradient-to-r from-amber-300 to-orange-400"
                                                    : "bg-gradient-to-r from-indigo-400 to-purple-500"
                                        )}
                                        style={{
                                            width: `${Math.min(100, (stageDetail.current / stageDetail.total) * 100)}%`
                                        }}
                                    >
                                        {/* Animated glow effect */}
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="absolute inset-y-0 -inset-x-1/2 w-1/2 bg-white/30 skew-x-12 animate-shimmer"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Wallet address */}
                                {stageDetail.wallet && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                                        <div className="text-slate-400 truncate max-w-[240px]">
                                            {stageDetail.is_high_value ? (
                                                <span className="text-amber-500 font-medium truncate">{stageDetail.wallet}</span>
                                            ) : isWarning ? (
                                                <span className="text-amber-600 truncate">{stageDetail.wallet}</span>
                                            ) : (
                                                <span className="truncate">{stageDetail.wallet}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MCP Tool Call Status */}
                        {isMcpToolCall && (
                            <div className="ml-8 mt-1 mb-2">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5 text-xs text-cyan-600">
                                        <TerminalSquare className="h-3 w-3" />
                                        <span className="font-medium">
                                            {stageDetail.server_name}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 ml-2">
                                        <span className="font-medium text-cyan-600">
                                            {stageDetail.tool_name}
                                        </span>
                                    </div>
                                </div>

                                {/* Tool Call Info */}
                                <div className="mt-1 p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-md border border-cyan-100 dark:border-cyan-800">
                                    <div className="text-xs text-slate-600 dark:text-slate-300">
                                        <span className="font-medium">Arguments:</span>
                                        <div className="mt-1 font-mono text-xs bg-white/50 dark:bg-slate-800/50 p-1.5 rounded border border-slate-200 dark:border-slate-700 overflow-x-auto">
                                            {stageDetail.arguments && (
                                                <pre className="whitespace-pre-wrap break-words">
                                                    {typeof stageDetail.arguments === 'string'
                                                        ? stageDetail.arguments
                                                        : JSON.stringify(stageDetail.arguments, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status indicator */}
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn(
                                                "h-2 w-2 rounded-full",
                                                isCompleted
                                                    ? "bg-green-500"
                                                    : isError
                                                        ? "bg-red-500"
                                                        : "bg-cyan-500 animate-pulse"
                                            )}></div>
                                            <span className={cn(
                                                "text-xs font-medium",
                                                isCompleted
                                                    ? "text-green-600"
                                                    : isError
                                                        ? "text-red-600"
                                                        : "text-cyan-600"
                                            )}>
                                                {isCompleted
                                                    ? "Completed"
                                                    : isError
                                                        ? "Failed"
                                                        : "Processing..."}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            <span className="font-mono text-slate-400">ID: {stageDetail.call_id.substring(0, 8)}...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Wallet Analysis Completed */}
                        {isWalletCompleted && (
                            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                                <div className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Wallet Analysis Completed</span>
                                </div>
                                <div className="mt-1.5 grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Smart Wallets Detected</span>
                                        <span className="text-sm font-medium text-amber-500">{stageDetail.high_value_count}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Processed Wallets</span>
                                        <span className="text-sm font-medium">{stageDetail.processed}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
} 