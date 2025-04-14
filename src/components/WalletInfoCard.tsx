import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Wallet, ExternalLink, RefreshCw, CreditCard, ArrowDownUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWalletInfo, formatSolAmount, formatUsdAmount, formatShortAddress } from '@/lib/walletService';
import { UserWalletInfo } from '@/types/wallet';
import { motion } from 'framer-motion';
import { ReusableBalanceCard } from './ReusableBalanceCard';

interface WalletInfoCardProps {
    walletAddress?: string;
    onRefresh?: () => void;
    showConnect?: boolean;
    onConnectClick?: () => void;
    className?: string;
}

export interface WalletInfoCardRef {
    refreshWalletInfo: () => Promise<void>;
}

export const WalletInfoCard = forwardRef<WalletInfoCardRef, WalletInfoCardProps>(({
    walletAddress,
    onRefresh,
    showConnect = false,
    onConnectClick,
    className
}, ref) => {
    const [walletInfo, setWalletInfo] = useState<UserWalletInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Load wallet information
    const loadWalletInfo = async () => {
        if (!walletAddress) {
            setWalletInfo(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const info = await getWalletInfo(walletAddress);
            setWalletInfo(info);
        } catch (err) {
            console.error("Failed to load wallet info:", err);
            setError("Failed to load wallet information");
        } finally {
            setIsLoading(false);
        }
    };

    // Expose the refresh method to the parent component
    useImperativeHandle(ref, () => ({
        refreshWalletInfo: loadWalletInfo
    }));

    // Refresh wallet information
    const handleRefresh = () => {
        loadWalletInfo();
        onRefresh?.();
    };

    // Initial load and address change update
    useEffect(() => {
        loadWalletInfo();
    }, [walletAddress]);

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                    <Wallet className="mr-2 h-5 w-5" />
                    Wallet Information
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!walletAddress && showConnect ? (
                    <div className="flex flex-col items-center justify-center py-4">
                        <p className="text-sm text-gray-500 mb-3">Please connect your wallet to continue</p>
                        <Button onClick={onConnectClick}>
                            Connect Wallet
                        </Button>
                    </div>
                ) : !walletAddress ? (
                    <div className="text-center py-2">
                        <p className="text-sm text-gray-500">Wallet not connected</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Connected Wallet Address</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={() => window.open(`https://explorer.solana.com/address/${walletAddress}`, '_blank')}
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto break-all">
                                {walletAddress}
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center items-center py-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                <span className="ml-2 text-sm">Loading...</span>
                            </div>
                        ) : error ? (
                            <div className="text-sm text-red-500 py-2">
                                {error}
                            </div>
                        ) : walletInfo ? (
                            <div className="space-y-5 pt-2">
                                {/* Refresh button for all balances */}
                                <div className="flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs flex items-center"
                                        onClick={handleRefresh}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Refresh Balances
                                    </Button>
                                </div>

                                {/* Wallet balance card */}
                                <ReusableBalanceCard
                                    icon={<Wallet />}
                                    title="Account Balance"
                                    balance={walletInfo.user_sol_balance}
                                    description="Available Solana balance in your account"
                                    color="#F7931A"
                                />

                                {/* Divider with arrow */}
                                <div className="flex items-center justify-center py-1">
                                    <motion.div
                                        animate={{ y: [0, -3, 0] }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        <ArrowDownUp className="w-4 h-4 text-gray-400 rotate-90" />
                                    </motion.div>
                                </div>

                                {/* Recharged balance card */}
                                <ReusableBalanceCard
                                    icon={<CreditCard />}
                                    title="Wallet Balance"
                                    balance={walletInfo.wallet_balance}
                                    description="Available in your connected Solana wallet"
                                    color="#9945FF"
                                />
                            </div>
                        ) : null}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}); 