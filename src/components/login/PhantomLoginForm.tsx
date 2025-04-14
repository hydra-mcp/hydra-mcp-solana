import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, WalletIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import phamtomLogo from './phamtom.svg';
import { VersionedTransaction } from '@solana/web3.js';
import { PhantomProvider, PhantomWindow } from '@/types/phantom';

interface PhantomLoginFormProps {
    isActive: boolean;
}

// Nonce response interface
interface NonceResponse {
    success: boolean;
    nonce: string;
    expires_in: number;
}

export function PhantomLoginForm({ isActive }: PhantomLoginFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [hasPhantomWallet, setHasPhantomWallet] = useState(false);
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [connectionStep, setConnectionStep] = useState<'initial' | 'connecting' | 'signing' | 'verifying'>('initial');

    const navigate = useNavigate();
    const { toast } = useToast();
    const { loginWithWallet } = useAuth();

    // Check if Phantom wallet is installed
    const checkForPhantomWallet = useCallback(() => {
        if ((window as unknown as PhantomWindow).phantom?.solana) {
            setHasPhantomWallet(true);
            setError(null);
        } else {
            setHasPhantomWallet(false);
            setError('Phantom wallet extension not detected');
        }
    }, []);

    // Get nonce from server
    const getNonce = async (walletAddress: string): Promise<string> => {
        try {
            const response = await apiRequest<NonceResponse>(`/auth/nonce?wallet_address=${walletAddress}`, {
                method: 'GET'
            });

            if (!response.success || !response.nonce) {
                throw new Error('Invalid nonce response from server');
            }

            return response.nonce;
        } catch (error) {
            console.error('Error getting nonce:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to get authentication challenge: ${errorMessage}`);
        }
    };

    // Sign message with Phantom wallet
    const signMessage = async (message: string): Promise<string> => {
        if (!window.phantom?.solana) {
            throw new Error('Phantom wallet not available');
        }

        try {
            // Convert message to UTF-8 encoded byte array
            const encodedMessage = new TextEncoder().encode(message);

            // Add type assertion
            const provider = window.phantom.solana as PhantomProvider;

            // Request user to sign the message
            const signedMessage = await provider.signMessage(encodedMessage, "utf8");

            // Return the Base64 encoded signature
            return signedMessage.signature;
        } catch (error) {
            console.error('Error signing message:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Signing failed: ${errorMessage}`);
        }
    };

    // Connect to Phantom wallet
    const connectWallet = async () => {
        setIsLoading(true);
        setError(null);
        setConnectionStep('connecting');

        try {
            if (!window.phantom?.solana) {
                setError('Phantom wallet not installed or unavailable');
                return;
            }

            const provider = window.phantom.solana as PhantomProvider;

            // Step 1: Connect wallet and get public key
            const resp = await provider.connect();
            const walletPublicKey = resp.publicKey.toString();
            setPublicKey(walletPublicKey);

            setConnectionStep('signing');

            // Step 2: Get nonce from server
            const nonce = await getNonce(walletPublicKey);

            // Show toast for user to sign message
            // toast({
            //     title: 'Signature required',
            //     description: 'Please sign the message in your wallet to authenticate',
            //     duration: 5000,
            // });

            // Step 3: Sign the nonce with wallet
            const signature = await signMessage(nonce);

            setConnectionStep('verifying');

            // Step 4: Verify signature and login
            // Process signature and convert to Base64
            let base64Signature = '';

            // Since the format of the signature returned by Phantom wallet may be uncertain
            // We need to handle various possible types safely
            try {
                // If the signature is already a Base64 string
                if (typeof signature === 'string') {
                    base64Signature = signature;
                } else {
                    // Convert signature to Base64 format
                    // In TypeScript, we need to use array expansion syntax to handle binary data
                    const arrayData = Array.from(new Uint8Array(signature as any));
                    base64Signature = btoa(String.fromCharCode(...arrayData));
                }
            } catch (error) {
                console.error("Error converting signature to Base64:", error);
                throw new Error("Failed to process signature");
            }

            // Login with wallet and signature
            await loginWithWallet(walletPublicKey, base64Signature, nonce);

            toast({
                title: 'Login successful',
                description: 'Connected with Phantom wallet',
                duration: 2000,
            });

            navigate('/');
        } catch (err) {
            console.error("Wallet login failed:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);

            // Handle user cancellation specially
            if (errorMessage.includes('User rejected') || errorMessage.includes('cancelled')) {
                setError('You cancelled the wallet connection request');
                toast({
                    title: 'Connection cancelled',
                    description: 'You cancelled the wallet connection',
                    duration: 3000,
                });
            } else {
                setError(`Wallet login failed: ${errorMessage}`);
                toast({
                    title: 'Wallet login failed',
                    description: errorMessage,
                    duration: 3000,
                });
            }

            // Reset connection step
            setConnectionStep('initial');
        } finally {
            setIsLoading(false);
        }
    };

    // Check for wallet on component mount
    useEffect(() => {
        if (isActive) {
            checkForPhantomWallet();
        }
    }, [isActive, checkForPhantomWallet]);

    if (!isActive) return null;

    return (
        <motion.div
            className="relative space-y-6 p-6 bg-gradient-to-b from-purple-900/20 to-purple-900/10 backdrop-blur-sm rounded-xl border border-purple-500/20 shadow-xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Background animation effect */}
            <motion.div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.3, duration: 0.8 }}
            >
                <motion.div
                    className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        x: [0, -20, 0],
                        y: [0, 20, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />
                <motion.div
                    className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                        x: [0, 30, 0],
                        y: [0, -10, 0],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />
            </motion.div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 bg-red-500/20 border border-red-500/30 rounded-md text-red-200 text-sm z-10 relative"
                >
                    {error}
                    {!hasPhantomWallet && (
                        <div className="mt-2">
                            <a
                                href="https://phantom.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-300 hover:text-blue-200 underline"
                            >
                                Install Phantom Wallet →
                            </a>
                        </div>
                    )}
                </motion.div>
            )}

            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                style={{ willChange: 'transform, opacity' }}
                className="flex justify-center mb-2 z-10 relative"
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                        boxShadow: ["0px 0px 0px rgba(171, 159, 242, 0.3)", "0px 0px 20px rgba(171, 159, 242, 0.6)", "0px 0px 0px rgba(171, 159, 242, 0.3)"]
                    }}
                    transition={{
                        boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }
                    }}
                    className="w-24 h-24 flex items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 cursor-pointer"
                    onClick={!isLoading ? connectWallet : undefined}
                >
                    <motion.img
                        src={phamtomLogo}
                        alt="Phantom Wallet"
                        className="w-14 h-14"
                        animate={{ rotate: [0, 5, 0, -5, 0] }}
                        style={{
                            scale: 2
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </motion.div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-center text-gray-300 text-sm mb-4"
            >
                Connect with your Phantom wallet to sign in securely without a password
            </motion.p>

            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                style={{ willChange: 'transform, opacity' }}
            >
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Button
                        type="button"
                        onClick={connectWallet}
                        className={`w-full relative overflow-hidden ${isLoading
                            ? 'bg-purple-700 hover:bg-purple-800'
                            : 'bg-purple-600 hover:bg-purple-700'} text-white`}
                        disabled={isLoading || !hasPhantomWallet}
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-400/30 to-purple-500/0"
                            animate={{
                                x: ['-100%', '200%']
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatDelay: 0.5
                            }}
                            style={{
                                display: isLoading ? 'none' : 'block'
                            }}
                        />
                        {isLoading ? (
                            <motion.div
                                className="flex items-center justify-center"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <motion.span
                                    key={connectionStep}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {connectionStep === 'connecting' && 'Connecting...'}
                                    {connectionStep === 'signing' && 'Please sign message...'}
                                    {connectionStep === 'verifying' && 'Verifying signature...'}
                                </motion.span>
                            </motion.div>
                        ) : (
                            <motion.div
                                className="flex items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <WalletIcon className="h-5 w-5 mr-2" />
                                Connect Wallet
                            </motion.div>
                        )}
                    </Button>
                </motion.div>
            </motion.div>

            {publicKey && (
                <motion.div
                    initial={{ opacity: 0, y: 20, height: 0 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        height: 'auto',
                        transition: {
                            height: { duration: 0.3 }
                        }
                    }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="mt-4 overflow-hidden"
                >
                    <motion.div
                        className="p-4 bg-gradient-to-r from-green-500/10 via-green-500/20 to-green-500/10 border border-green-500/30 rounded-md shadow-lg"
                        animate={{
                            boxShadow: ["0px 0px 0px rgba(74, 222, 128, 0)", "0px 0px 15px rgba(74, 222, 128, 0.2)", "0px 0px 0px rgba(74, 222, 128, 0)"]
                        }}
                        transition={{
                            boxShadow: {
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "reverse"
                            }
                        }}
                    >
                        <div className="flex items-center mb-2">
                            <motion.div
                                className="w-3 h-3 rounded-full bg-green-500 mr-2"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <p className="text-green-200 text-sm font-medium">Wallet Connected</p>
                        </div>
                        <motion.div
                            className="px-3 py-2 bg-black/30 rounded-md font-mono text-xs text-white/70 overflow-hidden relative"
                            whileHover={{ scale: 1.01 }}
                        >
                            <div className="truncate">
                                {publicKey}
                            </div>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                            />
                        </motion.div>
                        <motion.div
                            className="text-xs text-green-200/60 mt-2 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <motion.span
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                Redirecting to dashboard...
                            </motion.span>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
} 