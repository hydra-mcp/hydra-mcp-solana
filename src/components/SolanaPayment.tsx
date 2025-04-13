import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { processPayment } from '@/lib/solanaPaymentService';
import { Loader2, Wallet, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface SolanaPaymentProps {
    amountSol: number;
    onSuccess?: (signature: string, orderId: string) => void;
    onError?: (error: Error) => void;
    onCancel?: () => void;
    productName?: string;
    description?: string;
}

export const SolanaPayment: React.FC<SolanaPaymentProps> = ({
    amountSol,
    onSuccess,
    onError,
    onCancel,
    productName = "Product",
    description = "Complete your purchase with Solana"
}) => {
    const [status, setStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [paymentAttempt, setPaymentAttempt] = useState<number>(0);
    const [orderId, setOrderId] = useState<string | null>(null);

    const handlePayment = async () => {
        try {
            setIsProcessing(true);
            setError(null);
            setSuccess(false);
            setPaymentAttempt(prev => prev + 1);

            // Use custom status processing function
            const updateStatus = (status: string) => {
                setStatus(status);

                // Update progress bar based on status
                if (status.includes('Preparing to pay')) {
                    setProgress(10);
                    setStatus('Preparing to pay...');
                } else if (status.includes('Creating payment request')) {
                    setProgress(20);
                    setStatus('Creating payment request...');
                } else if (status.includes('Creating transaction')) {
                    setProgress(30);
                    setStatus('Creating transaction...');
                } else if (status.includes('Please confirm the transaction in your wallet')) {
                    setProgress(40);
                    setStatus('Please confirm the transaction in your wallet...');
                } else if (status.includes('Transaction sent')) {
                    setProgress(60);
                    setStatus('Transaction sent, waiting for confirmation...');
                } else if (status.includes('Verifying transaction')) {
                    // Extract verification progress
                    const match = status.match(/\((\d+)\/(\d+)\)/);
                    if (match && match.length === 3) {
                        const current = parseInt(match[1]);
                        const total = parseInt(match[2]);
                        const progressValue = 60 + Math.floor((current / total) * 30);
                        setProgress(progressValue);
                        setStatus(`Verifying transaction (${current}/${total})...`);
                    }
                } else if (status.includes('Payment successful')) {
                    setProgress(100);
                    setStatus('Payment successful!');
                } else {
                    // If it's other English status, try to translate common information
                    if (status.includes('failed')) {
                        setStatus('Payment failed: ' + status.replace('Payment failed:', ''));
                    } else if (status.includes('error')) {
                        setStatus('Payment process error: ' + status.replace('Payment process error:', ''));
                    } else {
                        setStatus(status);
                    }
                }
            };

            // @ts-ignore - ignore type check, the actual function signature is correct
            const result = await processPayment(amountSol, updateStatus);

            if (result.verified && result.signature && result.orderId) {
                setSuccess(true);
                setOrderId(result.orderId);
                onSuccess?.(result.signature, result.orderId);
            } else {
                setError(`Payment failed: ${result.verifyResult?.message || 'Verification failed'}`);
                onError?.(new Error(result.verifyResult?.message || 'Payment verification failed'));
            }
        } catch (error: any) {
            setError(`Payment error: ${error.message}`);
            onError?.(error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Format SOL amount for display
    const formatSol = (amount: number): string => {
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 6
        });
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <div className="flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-blue-500" />
                    <CardTitle>Confirm payment</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    {orderId && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Order ID</span>
                            <span className="text-sm">{orderId}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Project</span>
                        <span className="text-sm">{productName}</span>
                    </div>

                    <div className="flex justify-between items-center font-bold">
                        <span>Amount</span>
                        <span className="text-xl">{formatSol(amountSol)} SOL</span>
                    </div>

                    {isProcessing && (
                        <div className="space-y-2 mt-4">
                            <div className="flex justify-between items-center text-sm">
                                <span>Processing...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-sm text-gray-500 mt-2">{status}</p>

                            {/* Add payment step instructions */}
                            {status.includes('Please confirm the transaction in your wallet') && (
                                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start">
                                        <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-700">Please pay attention to wallet notifications</p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                Phantom wallet will pop up a confirmation window, please click confirm to complete the transaction.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTitle>Payment failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mt-4 bg-green-50 border-green-200 text-green-800">
                            <AlertTitle>Payment successful</AlertTitle>
                            <AlertDescription>Your payment has been successfully processed</AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex justify-between flex-wrap gap-2">
                <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
                    Cancel
                </Button>

                <Button
                    onClick={handlePayment}
                    disabled={isProcessing || success}
                    className="min-w-32"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : success ? (
                        'Completed'
                    ) : paymentAttempt > 0 ? (
                        'Retry payment'
                    ) : (
                        'Confirm payment'
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}; 