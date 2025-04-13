import React, { useState } from 'react';
import { SolanaPayment } from '@/components/SolanaPayment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const SolanaPaymentPage: React.FC = () => {
    const [amountSol, setAmountSol] = useState<number>(0.1);
    const [showPayment, setShowPayment] = useState<boolean>(false);
    const [paymentResult, setPaymentResult] = useState<{
        success: boolean;
        signature?: string;
        orderId?: string;
        error?: string;
    } | null>(null);

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
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8 pt-10">Solana Payment Demo</h1>

            {!showPayment && !paymentResult && (
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Create payment order</CardTitle>
                        <CardDescription>Select payment amount and start payment process</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="amount" className="text-sm font-medium">Payment amount (SOL)</label>
                                <input
                                    id="amount"
                                    type="number"
                                    value={amountSol}
                                    onChange={(e) => setAmountSol(parseFloat(e.target.value))}
                                    min="0.001"
                                    step="0.001"
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter>
                        <Button
                            onClick={() => setShowPayment(true)}
                            className="w-full"
                        >
                            Start payment
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {showPayment && !paymentResult && (
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
                        productName="Product example"
                        description="Complete payment using Solana Blockchain"
                    />
                </div>
            )}

            {paymentResult && (
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader>
                        {paymentResult.success ? (
                            <div className="flex items-center text-green-600">
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                <CardTitle>Payment successful</CardTitle>
                            </div>
                        ) : (
                            <div className="flex items-center text-red-600">
                                <AlertCircle className="mr-2 h-5 w-5" />
                                <CardTitle>Payment failed</CardTitle>
                            </div>
                        )}
                    </CardHeader>

                    <CardContent>
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
                                    <div className="p-2 border rounded bg-gray-50 text-xs break-all">
                                        {paymentResult.signature}
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
                    </CardContent>

                    <CardFooter>
                        <Button
                            onClick={handleNewPayment}
                            className="w-full"
                        >
                            Create new order
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <div className="mt-8 text-center text-sm text-gray-500">
                <p>This demo application uses Solana blockchain for payment processing</p>
                <p>Please ensure you have installed and unlocked Phantom wallet</p>
            </div>
        </div>
    );
};

export default SolanaPaymentPage; 