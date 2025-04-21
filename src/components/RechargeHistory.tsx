import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HistoryIcon, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { getRechargeHistory, formatSolAmount, formatShortAddress } from '@/lib/walletService';
import { RechargeOrder, OrderStatus } from '@/types/wallet';
import { ScrollArea } from "@/components/ui/scroll-area";

interface RechargeHistoryProps {
    walletAddress?: string;
    limit?: number;
    className?: string;
}

export const RechargeHistory: React.FC<RechargeHistoryProps> = ({
    walletAddress,
    limit = 5,
    className
}) => {
    const [orders, setOrders] = useState<RechargeOrder[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [offset, setOffset] = useState<number>(0);
    const [total, setTotal] = useState<number>(0);

    // Load recharge history
    const loadHistory = async (resetOffset = false) => {
        if (!walletAddress) {
            setOrders([]);
            return;
        }

        const newOffset = resetOffset ? 0 : offset;

        setIsLoading(true);
        setError(null);

        try {
            const result = await getRechargeHistory(limit, newOffset);

            if (resetOffset) {
                setOrders(result.data);
            } else {
                setOrders(prev => [...prev, ...result.data]);
            }

            setHasMore(result.meta.has_more);
            setOffset(newOffset + limit);
            setTotal(result.meta.total);
        } catch (err) {
            console.error("Failed to load recharge history:", err);
            setError("Failed to load recharge history");
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

    // Get status icon
    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PAID:
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case OrderStatus.CANCELLED:
                return <XCircle className="h-4 w-4 text-red-500" />;
            case OrderStatus.PENDING:
                return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
            case OrderStatus.EXPIRED:
                return <AlertCircle className="h-4 w-4 text-gray-400" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-400" />;
        }
    };

    // Get status text
    const getStatusText = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PAID:
                return "Paid";
            case OrderStatus.CANCELLED:
                return "Cancelled";
            case OrderStatus.PENDING:
                return "Pending";
            case OrderStatus.EXPIRED:
                return "Expired";
            default:
                return "Unknown status";
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
                        Recharge History
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <span className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}>↻</span>
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!walletAddress ? (
                    <div className="text-center py-2">
                        <p className="text-sm text-gray-500">Please connect your wallet first</p>
                    </div>
                ) : isLoading && orders.length === 0 ? (
                    <div className="flex justify-center items-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm">Loading...</span>
                    </div>
                ) : error ? (
                    <div className="text-sm text-red-500 py-2">
                        {error}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No recharge records yet</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[460px] pr-4 overflow-y-auto">
                        <div className="space-y-3">
                            {orders.map((order) => (
                                <div
                                    key={order.order_id}
                                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center space-x-1.5">
                                                {getStatusIcon(order.status)}
                                                <span className="font-medium">{formatSolAmount(order.amount)} SOL</span>
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                                    {getStatusText(order.status)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatTime(order.created_at)}
                                            </div>
                                        </div>

                                        {order.transaction_signature && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 -mt-1"
                                                onClick={() => window.open(`https://explorer.solana.com/tx/${order.transaction_signature}`, '_blank')}
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="mt-1.5 text-xs text-gray-500">
                                        Order Number: {order.order_number}
                                    </div>
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