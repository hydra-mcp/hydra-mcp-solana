import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// import Phantom type definition
import { PhantomProvider, PhantomWindow } from '@/types/phantom';

type SolanaTransferProps = {
    walletAddress: string;
};

const SolanaTransfer = ({ walletAddress }: SolanaTransferProps) => {
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [txSignature, setTxSignature] = useState('');

    // Create and send transaction
    const createTransaction = async () => {
        if (!walletAddress) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (!recipientAddress) {
            toast.error('Please enter recipient address');
            return;
        }

        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            setIsLoading(true);

            // Calculate lamports (1 SOL = 1,000,000,000 lamports)
            const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

            // call backend API to create transaction
            const response = await fetch('/api/solana/transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from_pubkey: walletAddress,
                    to_pubkey: recipientAddress,
                    amount_lamports: lamports,
                    // network: 'devnet' // use devnet for testing
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create transaction');
            }

            const { data } = await response.json();

            // use Phantom wallet to sign and send transaction
            const provider = (window as unknown as PhantomWindow).phantom?.solana as PhantomProvider;
            if (!provider) throw new Error('Phantom wallet not connected');

            // call request method correctly, according to PhantomProvider interface definition
            const signResult = await provider.request('signAndSendTransaction', {
                message: data.transaction
            });

            // handle return result
            let signature = '';
            if (typeof signResult === 'object' && signResult !== null && 'signature' in signResult) {
                signature = String(signResult.signature);
            } else if (typeof signResult === 'string') {
                signature = signResult;
            }

            if (!signature) {
                throw new Error('Failed to get transaction signature');
            }

            setTxSignature(signature);
            toast.success('Transaction sent successfully!');

            // verify transaction
            await verifyTransaction(signature);

        } catch (error) {
            console.error('Transaction failed:', error);
            toast.error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // verify transaction function
    const verifyTransaction = async (signature: string) => {
        try {
            const response = await fetch('/api/solana/verify-transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transaction_signature: signature,
                    from_pubkey: walletAddress,
                    to_pubkey: recipientAddress,
                    message: `Transfer from ${walletAddress} to ${recipientAddress}`
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to verify transaction');
            }

            const result = await response.json();

            if (result.success && result.data.verified) {
                toast.success('Transaction verified successfully!');
            } else {
                toast.warning('Transaction verification failed, please check transaction status');
            }

        } catch (error) {
            console.error('Failed to verify transaction:', error);
            toast.error(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Solana Transfer</h2>

            <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Sender Address:
                </label>
                <input
                    type="text"
                    value={walletAddress}
                    disabled
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Recipient Address:
                </label>
                <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Enter Solana recipient address"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Amount (SOL):
                </label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    min="0"
                    step="0.000000001"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <button
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                onClick={createTransaction}
                disabled={isLoading || !walletAddress}
            >
                {isLoading ? 'Processing...' : 'Send SOL'}
            </button>

            {txSignature && (
                <div className="mt-4 p-4 rounded-lg bg-secondary/50">
                    <h3 className="text-lg font-medium">Transaction Submitted</h3>
                    <p className="mt-2 mb-2">Transaction signature: <code className="p-1 bg-muted rounded text-xs break-all">{txSignature}</code></p>
                    <a
                        href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm font-medium"
                    >
                        View on Solana Explorer
                    </a>
                </div>
            )}
        </div>
    );
};

export default SolanaTransfer; 