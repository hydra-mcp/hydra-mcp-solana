import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HistoryIcon, CheckCircle, XCircle, RotateCcw, ShoppingCart, Zap, Globe } from 'lucide-react';
import { getConsumptionHistory, formatSolAmount } from '@/lib/walletService';
import { ConsumptionRecord, ConsumptionStatus, ConsumptionType } from '@/types/wallet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConsumptionHistoryProps {
    walletAddress?: string;
    limit?: number;
    className?: string;
}

export const ConsumptionHistory: React.FC<ConsumptionHistoryProps> = ({
    walletAddress,
    limit = 5,
    className
}) => {
    const [records, setRecords] = useState<ConsumptionRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [offset, setOffset] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);
    const [selectedType, setSelectedType] = useState<ConsumptionType | "ALL">("ALL");

    // Load consumption history
    const loadHistory = async (resetOffset = false) => {
        if (!walletAddress) {
            setRecords([]);
            return;
        }

        const newOffset = resetOffset ? 0 : offset;

        setIsLoading(true);
        setError(null);

        try {
            const result = await getConsumptionHistory(
                limit,
                newOffset,
                selectedType !== "ALL" ? selectedType as ConsumptionType : undefined
            );

            if (resetOffset) {
                setRecords(result.data);
            } else {
                setRecords(prev => [...prev, ...result.data]);
            }

            setHasMore(result.meta.has_more);
            setOffset(newOffset + limit);
            setTotal(result.meta.total);
        } catch (err) {
            console.error("Failed to load consumption history:", err);
            setError("Failed to load consumption history");
        } finally {
            setIsLoading(false);
        }
    };

    // Load more history records
    const handleLoadMore = () => {
        loadHistory();
    };

    // Refresh history records
    const handleRefresh = () => {
        setOffset(0);
        loadHistory(true);
    };

    // Handle type filter change
    const handleTypeChange = (value: string) => {
        setSelectedType(value as ConsumptionType | "ALL");
        setOffset(0);
        setTimeout(() => {
            loadHistory(true);
        }, 0);
    };

    // Get status icon
    const getStatusIcon = (status: ConsumptionStatus) => {
        switch (status) {
            case ConsumptionStatus.SUCCESS:
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case ConsumptionStatus.FAILED:
                return <XCircle className="h-4 w-4 text-red-500" />;
            case ConsumptionStatus.REFUNDED:
                return <RotateCcw className="h-4 w-4 text-blue-500" />;
            default:
                return <XCircle className="h-4 w-4 text-gray-400" />;
        }
    };

    // Get status text
    const getStatusText = (status: ConsumptionStatus) => {
        switch (status) {
            case ConsumptionStatus.SUCCESS:
                return "Success";
            case ConsumptionStatus.FAILED:
                return "Failed";
            case ConsumptionStatus.REFUNDED:
                return "Refunded";
            default:
                return "Unknown";
        }
    };

    // Get type icon
    const getTypeIcon = (type: ConsumptionType) => {
        switch (type) {
            case ConsumptionType.WALLET_FINDER:
                return <Zap className="h-4 w-4 text-purple-500" />;
            case ConsumptionType.CA_ANALYSIS:
                return <Globe className="h-4 w-4 text-blue-500" />;
            case ConsumptionType.PREMIUM_FEATURE:
                return <ShoppingCart className="h-4 w-4 text-amber-500" />;
            default:
                return <ShoppingCart className="h-4 w-4 text-gray-400" />;
        }
    };

    // Get type text
    const getTypeText = (type: ConsumptionType) => {
        switch (type) {
            case ConsumptionType.WALLET_FINDER:
                return "Wallet Finder";
            case ConsumptionType.CA_ANALYSIS:
                return "CA Analysis";
            case ConsumptionType.PREMIUM_FEATURE:
                return "Premium Feature";
            default:
                return "Unknown";
        }
    };

    // Format time
    const formatTime = (isoDateString: string) => {
        return new Date(isoDateString).toLocaleString();
    };

    // Initial load and address change update
    useEffect(() => {
        handleRefresh();
    }, [walletAddress]);

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center">
                        <HistoryIcon className="mr-2 h-5 w-5" />
                        Consumption History
                    </div>
                    <div className="flex items-center space-x-2">
                        <Select
                            value={selectedType}
                            onValueChange={handleTypeChange}
                        >
                            <SelectTrigger className="w-[140px] h-8">
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All types</SelectItem>
                                <SelectItem value={ConsumptionType.WALLET_FINDER}>Wallet Finder</SelectItem>
                                <SelectItem value={ConsumptionType.CA_ANALYSIS}>CA Analysis</SelectItem>
                                <SelectItem value={ConsumptionType.PREMIUM_FEATURE}>Premium Feature</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={handleRefresh}
                            disabled={isLoading}
                        >
                            <span className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}>↻</span>
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!walletAddress ? (
                    <div className="text-center py-2">
                        <p className="text-sm text-gray-500">Please connect your wallet first</p>
                    </div>
                ) : isLoading && records.length === 0 ? (
                    <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm">Loading...</span>
                    </div>
                ) : error ? (
                    <div className="text-sm text-red-500 py-2">
                        {error}
                    </div>
                ) : records.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No consumption records yet</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[460px] pr-4 overflow-y-auto">
                        <div className="space-y-3">
                            {records.map((record, index) => (
                                <div
                                    key={index}
                                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center space-x-1.5">
                                                {getStatusIcon(record.status)}
                                                <span className="font-medium">{formatSolAmount(record.amount)} SOL</span>
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                                    {getStatusText(record.status)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatTime(record.created_at)}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-1.5">
                                            {getTypeIcon(record.consumption_type)}
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                                {getTypeText(record.consumption_type)}
                                            </span>
                                        </div>
                                    </div>

                                    {record.description && (
                                        <div className="mt-1.5 text-xs text-gray-500">
                                            {record.description} {record.quantity > 1 ? `(×${record.quantity})` : ''}
                                        </div>
                                    )}

                                    {record.feature_id && (
                                        <div className="mt-0.5 text-xs text-gray-400">
                                            ID: {record.feature_id}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {hasMore && (
                                <div className="flex justify-center pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleLoadMore}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Loading...' : 'Load more'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}; 