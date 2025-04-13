import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { processPayment } from '@/lib/solanaPaymentService';
import { Loader2 } from 'lucide-react';
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

            // use custom status handler function
            const updateStatus = (status: string) => {
                setStatus(status);

                // update progress bar based on status
                if (status.includes('Preparing to pay')) {
                    setProgress(10);
                } else if (status.includes('Creating payment request')) {
                    setProgress(20);
                } else if (status.includes('Creating transaction')) {
                    setProgress(30);
                } else if (status.includes('Please confirm the transaction in your wallet')) {
                    setProgress(40);
                } else if (status.includes('Transaction sent')) {
                    setProgress(60);
                } else if (status.includes('Verifying transaction')) {
                    // extract verification progress
                    const match = status.match(/\((\d+)\/(\d+)\)/);
                    if (match && match.length === 3) {
                        const current = parseInt(match[1]);
                        const total = parseInt(match[2]);
                        setProgress(60 + Math.floor((current / total) * 30));
                    }
                } else if (status.includes('Payment successful')) {
                    setProgress(100);
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

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Confirm payment</CardTitle>
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
                        <span className="text-sm font-medium">Product</span>
                        <span className="text-sm">{productName}</span>
                    </div>

                    <div className="flex justify-between items-center font-bold">
                        <span>Amount</span>
                        <span className="text-xl">{amountSol} SOL</span>
                    </div>

                    {isProcessing && (
                        <div className="space-y-2 mt-4">
                            <div className="flex justify-between items-center text-sm">
                                <span>Processing...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-sm text-gray-500 mt-2">{status}</p>
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