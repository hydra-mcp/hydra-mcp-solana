import React, { useState, useEffect, useRef } from 'react';
import { SolanaPayment } from '@/components/SolanaPayment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, CheckCircle2, Wallet, History, ExternalLink, Zap, ShoppingCart } from 'lucide-react';
import { WalletInfoCard, WalletInfoCardRef } from '@/components/WalletInfoCard';
import { RechargeHistory } from '@/components/RechargeHistory';
import { ConsumptionHistory } from '@/components/ConsumptionHistory';
import { connectWallet, disconnectWallet, getCurrentWalletAddress } from '@/lib/walletService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/PageHeader';
import { SolanaCard } from '@/components/SolanaCard';
import { AnimatedSolButton } from '@/components/AnimatedSolButton';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export const SolanaPaymentPage: React.FC = () => {
    const [amountSol, setAmountSol] = useState<number>(0.5);
    const [showPayment, setShowPayment] = useState<boolean>(false);
    const [paymentResult, setPaymentResult] = useState<{
        success: boolean;
        signature?: string;
        orderId?: string;
        error?: string;
    } | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [connectError, setConnectError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("recharge");

    // Add ref for accessing WalletInfoCard methods
    const walletInfoCardRef = useRef<WalletInfoCardRef>(null);

    // Check wallet connection status when initializing
    useEffect(() => {
        const storedWalletAddress = getCurrentWalletAddress();
        if (storedWalletAddress) {
            setWalletAddress(storedWalletAddress);
        }
    }, []);

    // Handle wallet connection
    const handleConnectWallet = async () => {
        setIsConnecting(true);
        setConnectError(null);

        try {
            const address = await connectWallet();
            if (address) {
                setWalletAddress(address);
            }
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            setConnectError(error instanceof Error ? error.message : "Failed to connect wallet");
        } finally {
            setIsConnecting(false);
        }
    };

    // Handle wallet disconnection
    const handleDisconnectWallet = async () => {
        try {
            await disconnectWallet();
            setWalletAddress(null);

            // If payment is in progress, return to initial state
            if (showPayment || paymentResult) {
                handleNewPayment();
            }
        } catch (error) {
            console.error("Failed to disconnect wallet:", error);
        }
    };

    const handleNewPayment = () => {
        setPaymentResult(null);
        setShowPayment(false);
    };

    const handlePaymentSuccess = (signature: string, orderId: string) => {
        setPaymentResult({
            success: true,
            signature,
            orderId
        });

        // After payment success, refresh wallet information
        setTimeout(() => {
            walletInfoCardRef.current?.refreshWalletInfo();
        }, 1000); // Delay 1 second to ensure blockchain transaction is completed
    };

    const handlePaymentError = (error: Error) => {
        setPaymentResult({
            success: false,
            error: error.message
        });
    };

    const handlePaymentCancel = () => {
        setShowPayment(false);
    };

    return (
        <AnimatedBackground className="min-h-screen py-8">
            <div className="container mx-auto pb-10 px-4">
                <PageHeader
                    title="Solana Recharge"
                    subtitle="Use Solana blockchain to recharge your account quickly and securely"
                    className="mb-8"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Wallet information */}
                    <div className="lg:col-span-1 space-y-6">
                        <WalletInfoCard
                            ref={walletInfoCardRef}
                            walletAddress={walletAddress || undefined}
                            onRefresh={() => { }}
                            showConnect={!walletAddress}
                            onConnectClick={handleConnectWallet}
                        />

                        {walletAddress && (
                            <div className="flex justify-between">
                                <AnimatedSolButton
                                    variant="outline"
                                    onClick={handleDisconnectWallet}
                                    className="w-full"
                                >
                                    Disconnect Wallet
                                </AnimatedSolButton>
                            </div>
                        )}
                    </div>

                    {/* Right: Recharge form/history */}
                    <div className="lg:col-span-2">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid grid-cols-3 mb-6">
                                <TabsTrigger value="recharge" className="flex items-center">
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Recharge
                                </TabsTrigger>
                                <TabsTrigger value="history" className="flex items-center">
                                    <History className="mr-2 h-4 w-4" />
                                    Recharge History
                                </TabsTrigger>
                                <TabsTrigger value="consumption" className="flex items-center">
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Consumption History
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="recharge" className="space-y-4">
                                {!walletAddress ? (
                                    <SolanaCard
                                        title="Connect Wallet"
                                        icon={<Wallet className="w-5 h-5 text-[#F7931A]" />}
                                        footer={
                                            <AnimatedSolButton
                                                onClick={handleConnectWallet}
                                                disabled={isConnecting}
                                                loading={isConnecting}
                                                className="w-full"
                                            >
                                                Connect Wallet
                                            </AnimatedSolButton>
                                        }
                                    >
                                        <div className="flex flex-col items-center py-6">
                                            <p className="mb-4 text-center text-gray-500">
                                                Use Phantom wallet for quick and easy SOL recharges and payments.
                                            </p>

                                            {connectError && (
                                                <div className="mt-1 text-sm text-red-500">
                                                    {connectError}
                                                </div>
                                            )}
                                        </div>
                                    </SolanaCard>
                                ) : !showPayment && !paymentResult ? (
                                    <SolanaCard
                                        title="Create Recharge Order"
                                        icon={<Zap className="w-5 h-5 text-[#F7931A]" />}
                                        footer={
                                            <AnimatedSolButton
                                                onClick={() => setShowPayment(true)}
                                                className="w-full"
                                            >
                                                Start Recharge
                                            </AnimatedSolButton>
                                        }
                                    >
                                        <div className="space-y-4 py-2">
                                            <p className="text-sm text-gray-500">
                                                Select the amount you want to recharge and start the process
                                            </p>
                                            <div className="space-y-2">
                                                <label htmlFor="amount" className="text-sm font-medium">Recharge amount (SOL)</label>
                                                <input
                                                    id="amount"
                                                    type="number"
                                                    value={amountSol}
                                                    onChange={(e) => setAmountSol(parseFloat(e.target.value))}
                                                    min="0.1"
                                                    step="0.1"
                                                    className="w-full p-2 border rounded bg-white/70"
                                                />
                                            </div>
                                        </div>
                                    </SolanaCard>
                                ) : showPayment && !paymentResult ? (
                                    <div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mb-4"
                                            onClick={() => setShowPayment(false)}
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Back
                                        </Button>

                                        <SolanaPayment
                                            amountSol={amountSol}
                                            onSuccess={handlePaymentSuccess}
                                            onError={handlePaymentError}
                                            onCancel={handlePaymentCancel}
                                            productName="Hydra AI"
                                            description="Complete recharge using Solana Blockchain"
                                        />
                                    </div>
                                ) : paymentResult ? (
                                    <SolanaCard
                                        title={paymentResult.success ? "Payment Successful" : "Payment Failed"}
                                        icon={paymentResult.success ?
                                            <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                                            <AlertCircle className="w-5 h-5 text-red-500" />}
                                        variant={paymentResult.success ? "success" : "error"}
                                        footer={
                                            <AnimatedSolButton
                                                onClick={handleNewPayment}
                                                className="w-full"
                                                variant={paymentResult.success ? "default" : "outline"}
                                            >
                                                Create New Order
                                            </AnimatedSolButton>
                                        }
                                    >
                                        <div className="space-y-4">
                                            {paymentResult.orderId && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">Order ID</span>
                                                    <span className="text-sm">{paymentResult.orderId}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">Amount</span>
                                                <span className="text-sm">{amountSol} SOL</span>
                                            </div>

                                            {paymentResult.success && paymentResult.signature && (
                                                <div className="space-y-2">
                                                    <span className="text-sm font-medium">Transaction signature</span>
                                                    <div className="p-2 border rounded bg-white/50 text-xs break-all">
                                                        {paymentResult.signature}
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => window.open(`https://explorer.solana.com/tx/${paymentResult.signature}`, '_blank')}
                                                        >
                                                            <ExternalLink className="mr-1 h-3 w-3" />
                                                            View in Explorer
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        You can view this transaction on Solana blockchain explorer
                                                    </p>
                                                </div>
                                            )}

                                            {!paymentResult.success && paymentResult.error && (
                                                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                                                    {paymentResult.error}
                                                </div>
                                            )}
                                        </div>
                                    </SolanaCard>
                                ) : null}
                            </TabsContent>

                            <TabsContent value="history">
                                <RechargeHistory walletAddress={walletAddress || undefined} limit={10} />
                            </TabsContent>

                            <TabsContent value="consumption">
                                <ConsumptionHistory walletAddress={walletAddress || undefined} limit={10} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>This application uses Solana blockchain for recharge processing</p>
                    <p>Please ensure you have installed and unlocked Phantom wallet</p>
                </div>
            </div>
        </AnimatedBackground>
    );
};