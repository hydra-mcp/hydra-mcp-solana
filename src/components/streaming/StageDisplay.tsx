import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { motion } from 'framer-motion';
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
    TerminalSquare,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StageDisplayProps {
    stages: StreamingStage[];
    className?: string;
    maxHeight?: string | number;
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

// Animation Variants
const stageVariants = {
    initial: { opacity: 0, y: 30, scale: 0.95 }, // Start hidden, slightly down, and smaller
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.3, ease: "easeOut" }
    }, // Animate to visible, original position/size
    exit: {
        opacity: 0,
        y: 20,
        scale: 0.95,
        transition: { duration: 0.2, ease: "easeIn" }
    } // Animate to hidden, slightly down, and smaller
};

// Use forwardRef
export const StageDisplay = forwardRef<HTMLDivElement, StageDisplayProps>(
    ({ stages, className, maxHeight = 300 }, ref) => {
        const [expanded, setExpanded] = useState(true);
        const autoCollapseRef = useRef(false);
        const userManuallyExpanded = useRef(false);
        const [allCompleted, setAllCompleted] = useState(false);
        const [validStages, setValidStages] = useState<StreamingStage[]>([]);

        // Process stages and check completion status
        useEffect(() => {
            const filteredStages = stages.filter(stage => {
                const hasMessage = stage.message && stage.message.trim() !== '';
                const hasContent = stage.content && stage.content.trim() !== '';
                return hasMessage || hasContent;
            });

            setValidStages(filteredStages);

            if (!filteredStages.length) {
                setAllCompleted(false);
                return;
            }

            const allStagesFinished = filteredStages.every(
                stage => stage.status === StageStatus.Completed ||
                    stage.status === StageStatus.Error ||
                    stage.status === StageStatus.Warning
            );

            setAllCompleted(allStagesFinished);

            if (!allStagesFinished) {
                autoCollapseRef.current = false;
                userManuallyExpanded.current = false;
                if (!expanded) setExpanded(true);
            }
        }, [stages, expanded]);

        // Separate effect for handling auto-collapse logic
        useEffect(() => {
            let timer: NodeJS.Timeout | undefined; // Declare timer outside the if

            if (allCompleted && expanded && !autoCollapseRef.current && !userManuallyExpanded.current) {
                autoCollapseRef.current = true;
                timer = setTimeout(() => { // Assign to the outer timer
                    if (allCompleted && expanded && autoCollapseRef.current) {
                        setExpanded(false);
                    }
                }, 3000);
            }

            // Cleanup function
            return () => {
                if (timer) { // Check if timer was actually set before clearing
                    clearTimeout(timer);
                }
            };
        }, [allCompleted, expanded]);

        if (!validStages.length) return null;

        const toggleExpanded = () => {
            const collapsing = expanded;
            setExpanded(prev => !prev);
            if (!collapsing) {
                userManuallyExpanded.current = true;
                autoCollapseRef.current = false;
            } else {
                userManuallyExpanded.current = false;
            }
        };

        const maxHeightValue = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;

        return (
            <motion.div
                ref={ref}
                layout="position"
                variants={stageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                    "fixed z-50",
                    allCompleted && !expanded
                        ? "bottom-20 right-6"
                        : "bottom-20 right-6 max-w-[40%] w-auto min-w-[350px]",
                    className
                )}
            >
                {allCompleted && !expanded ? (
                    // Collapsed view (Icon)
                    <motion.div
                        key="collapsed-icon"
                        className={cn(
                            "bg-white dark:bg-slate-800 rounded-full shadow-lg p-2 cursor-pointer hover:shadow-xl"
                        )}
                        onClick={toggleExpanded}
                        title="Show AI processing stages"
                    >
                        <div className="relative h-10 w-10 flex items-center justify-center overflow-hidden rounded-full group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-indigo-500/15 to-blue-500/10 rounded-full shadow-inner"></div>
                            <BrainCircuit className="h-5 w-5 text-green-500 relative z-10" />
                            <div className="absolute top-0 right-0">
                                <div className="h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // Expanded view
                    <motion.div
                        key="expanded-view"
                        className={cn(
                            "bg-background/85 backdrop-blur-sm",
                            "border border-primary/10 shadow-md rounded-lg",
                            "flex flex-col gap-2 text-xs py-3 px-4",
                            "overflow-hidden"
                        )}
                    >
                        {/* Header */}
                        <div className="text-primary font-medium mb-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
                                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                    AI Processing Stage
                                </span>
                            </div>
                            <button
                                onClick={toggleExpanded}
                                className="p-1 rounded-md text-slate-500 hover:text-indigo-500 hover:bg-primary/10 bg-slate-100 dark:bg-slate-700 transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-opacity-50"
                                aria-label="Collapse details"
                            >
                                <ChevronUp className="h-4 w-4" />
                            </button>

                        </div>

                        {/* Scrollable Content Area */}
                        <ScrollArea
                            className="overflow-y-auto pr-2 -mr-2"
                            style={{ maxHeight: maxHeightValue }}
                        >
                            <div className="space-y-2 pr-1">
                                {validStages.map((stage) => {
                                    const isCompleted = stage.status === StageStatus.Completed;
                                    const isError = stage.status === StageStatus.Error;
                                    const isWarning = stage.status === StageStatus.Warning;
                                    const stageText = stage.message.trim() || stage.content.trim();
                                    const stageDetail = stage.detail;

                                    const isWalletProgress = stageDetail && isWalletProgressDetail(stageDetail);
                                    const isWalletCompleted = stageDetail && isWalletCompletedDetail(stageDetail);
                                    const isMcpToolCall = stageDetail && isMcpToolCallDetail(stageDetail);

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
                                                    isError ? 'text-red-600 font-medium' : isWarning ? 'text-amber-600 font-medium' : isCompleted ? 'text-green-600 font-medium' : stage.content === '' ? 'text-indigo-500 font-medium' : 'text-muted-foreground'
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
                                                            <div className="absolute inset-0 overflow-hidden">
                                                                <div className="absolute inset-y-0 -inset-x-1/2 w-1/2 bg-white/30 skew-x-12 animate-shimmer"></div>
                                                            </div>
                                                        </div>
                                                    </div>
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
                        </ScrollArea>
                    </motion.div>
                )}
            </motion.div>
        );
    }
);

// Add display name for DevTools
StageDisplay.displayName = "StageDisplay"; 