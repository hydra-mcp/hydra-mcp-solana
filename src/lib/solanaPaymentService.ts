import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { apiRequest } from '@/lib/api';
import { PhantomProvider, PhantomWindow } from '@/types/phantom';

export interface PaymentRequest {
    amount_lamports: number;
    order_id: string;
    payer_wallet: string;
    network?: string;
}

export interface PaymentVerification {
    payment_id: string;
    transaction_signature: string;
    order_id: string;
    network?: string;
}

export interface PaymentData {
    payment_id: string;
    receiver: string;
    amount: number;
    order_id: string;
    recentBlockhash: string;
    networkEndpoint: string;
}

export interface VerificationResult {
    success: boolean;
    data?: {
        verified?: boolean;
        payment_id?: string;
        order_id?: string;
        amount?: number;
        transaction?: string;
        confirmations?: number;
        expected?: number;
        actual?: number;
        error?: string;
        blockTime?: number;
        currentTime?: number;
    };
    message?: string;
    errors?: Record<string, string>;
}

// create payment request
export const createPaymentRequest = async (
    amount: number,
    payerWallet: string,
    network: string = 'mainnet-beta'
): Promise<PaymentData> => {
    try {
        const result = await apiRequest<{ success: boolean; message?: string; data: PaymentData }>('/web3/solana/create-payment', {
            method: 'POST',
            body: JSON.stringify({
                amount_lamports: amount,
                payer_wallet: payerWallet,
                network
            })
        });

        if (!result.success) {
            throw new Error(result.message || 'Failed to create payment request');
        }

        return result.data;
    } catch (error) {
        console.error('Failed to create payment request:', error);
        throw error;
    }
};

// verify payment
export const verifyPayment = async (
    paymentId: string,
    signature: string,
    orderId: string,
    network: string = 'mainnet-beta'
): Promise<VerificationResult> => {
    try {
        return await apiRequest<VerificationResult>('/web3/solana/verify-payment', {
            method: 'POST',
            body: JSON.stringify({
                payment_id: paymentId,
                transaction_signature: signature,
                order_id: orderId,
                network
            })
        });
    } catch (error) {
        console.error('Failed to verify payment:', error);
        throw error;
    }
};

// complete payment process
export const processPayment = async (
    amountSol: number,
    onStatusChange?: (status: string) => void,
    maxAttempts: number = 20
): Promise<{ verified: boolean; signature?: string; verifyResult?: VerificationResult; orderId?: string }> => {
    try {
        onStatusChange?.('Preparing to pay...');

        // 1. check if wallet is available
        if (!(window as unknown as PhantomWindow).phantom?.solana) {
            throw new Error('Phantom wallet not detected, please install Phantom wallet extension');
        }

        // 2. connect wallet
        const provider = (window as unknown as PhantomWindow).phantom!.solana as PhantomProvider;
        const connection = await provider.connect();
        const publicKey = connection.publicKey;
        const payerWallet = publicKey.toString();

        // 3. convert SOL to lamports
        const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

        // 4. create payment request
        onStatusChange?.('Creating payment request...');
        const paymentData = await createPaymentRequest(amountLamports, payerWallet);
        const { payment_id, receiver, recentBlockhash, order_id } = paymentData;

        onStatusChange?.('Creating transaction...');

        // 5. create transaction object
        const transaction = new Transaction();
        transaction.recentBlockhash = recentBlockhash;
        transaction.feePayer = new PublicKey(payerWallet);

        // 6. add transfer instruction
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: new PublicKey(payerWallet),
            toPubkey: new PublicKey(receiver),
            lamports: amountLamports
        });

        transaction.add(transferInstruction);

        // 7. sign and send transaction
        onStatusChange?.('Please confirm the transaction in your wallet...');
        const { signature } = await provider.signAndSendTransaction(transaction);

        onStatusChange?.(`Transaction sent, waiting for confirmation...`);
        // console.log('Transaction signature:', signature);

        // 8. wait for transaction confirmation (polling)
        let verifyResult: VerificationResult | null = null;
        let verified = false;
        let attempts = 0;

        while (!verified && attempts < maxAttempts) {
            try {
                onStatusChange?.(`Verifying transaction... (${attempts + 1}/${maxAttempts})`);
                verifyResult = await verifyPayment(payment_id, signature, order_id);

                if (verifyResult.success && verifyResult.data?.verified) {
                    verified = true;
                    break;
                }

                // if transaction failed, do not retry
                if (verifyResult.errors && (verifyResult.errors.execution || verifyResult.errors.amount)) {
                    break;
                }

                // wait 2 seconds and retry
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempts++;
            } catch (error) {
                console.warn('Verification attempt failed, retrying:', error);
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempts++;
            }
        }

        // 9. show final result
        if (verified) {
            onStatusChange?.('Payment successful!');
        } else {
            // payment failed
            let errorMessage = 'Payment verification failed';

            if (verifyResult && verifyResult.message) {
                errorMessage = verifyResult.message;
            }

            onStatusChange?.(`Payment failed: ${errorMessage}`);
        }

        return { verified, signature, verifyResult: verifyResult || undefined, orderId: order_id };

    } catch (error: any) {
        onStatusChange?.(`Payment process error: ${error.message}`);
        console.error('Payment process error:', error);
        throw error;
    }
};