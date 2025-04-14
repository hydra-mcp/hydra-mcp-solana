import { useEffect, useState, useRef, useCallback } from 'react';
import { createPhantom, Position } from "@phantom/wallet-sdk";
import { createSolanaClient, LAMPORTS_PER_SOL, address } from "gill";
import { PhantomProvider, PhantomWindow } from '@/types/phantom';

// Component properties interface
interface PhantomWalletProps {
    position?: Position;
    hideLauncherBeforeOnboarded?: boolean;
    namespace?: string;
    onInitialized?: (methods: PhantomWalletMethods) => void;
}

// Wallet methods interface
export interface PhantomWalletMethods {
    getSolBalance: (network?: 'mainnet' | 'devnet') => Promise<number>;
    isLoading: boolean;
    error: string | null;
}

// RPC endpoints configuration
const RPC_ENDPOINTS = {
    mainnet: "http://0.0.0.0:8000/api/auth/user/token",
    devnet: "https://api.devnet.solana.com"
};

export const PhantomWallet = ({
    position = Position.bottomRight,
    hideLauncherBeforeOnboarded = false,
    namespace = "my-app",
    onInitialized
}: PhantomWalletProps) => {
    const [phantom, setPhantom] = useState<any>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [useBrowserExtension, setUseBrowserExtension] = useState<boolean>(false);
    const [solBalance, setSolBalance] = useState<number | null>(null);

    // Use refs to track the latest state, avoid closure issues
    const errorRef = useRef<string | null>(null);
    const isLoadingRef = useRef<boolean>(false);

    // When the state changes, update refs
    useEffect(() => {
        errorRef.current = error;
    }, [error]);

    useEffect(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);

    // Query SOL balance
    const getSolBalance = useCallback(async (network: 'mainnet' | 'devnet' = 'mainnet'): Promise<number> => {
        if (!window.phantom?.solana) {
            setError("Phantom wallet not installed or unavailable");
            return 0;
        }

        if (!isConnected || !publicKey) {
            setError("Wallet not connected, please connect wallet first");
            return 0;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Use fetch directly to call the RPC interface, so as to specify a specific namespace
            const methodNamespace = network === 'mainnet' ? 'solana-mainnet' : 'solana';
            const endpoint = RPC_ENDPOINTS[network];

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    // jsonrpc: "2.0",
                    // id: "getbalance-" + Date.now(),
                    // method: `${methodNamespace}.getBalance`,
                    method: "getBalance",
                    params: [publicKey]
                })
            });

            // Parse the response
            const jsonResponse = await response.json();

            if (jsonResponse.error) {
                throw new Error(`RPC error: ${jsonResponse.error.message || JSON.stringify(jsonResponse.error)}`);
            }

            // Parse the returned balance result
            const balance = jsonResponse.result?.value || 0;
            const solAmount = Number(balance) / LAMPORTS_PER_SOL;

            console.log(`Balance: ${solAmount} SOL (using ${network} namespace)`);
            setSolBalance(solAmount);

            setIsLoading(false);
            return solAmount;
        } catch (error) {
            console.error("Failed to get SOL balance:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setError(`Failed to get SOL balance: ${errorMessage}`);
            setIsLoading(false);
            return 0;
        }
    }, [isConnected, publicKey]);

    // Connect wallet
    const connectWallet = useCallback(async () => {
        if (!window.phantom?.solana) {
            setError("Phantom wallet not installed or unavailable");
            return null;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Try to connect wallet
            const resp = await window.phantom.solana.connect();

            // Successfully connected, update status
            const publicKeyString = resp.publicKey.toString();
            setPublicKey(publicKeyString);
            console.log("Connected to wallet:", publicKeyString);
            setIsConnected(true);

            // Automatically query balance after successful connection
            getSolBalance();

            return publicKeyString;
        } catch (err) {
            console.error("Failed to connect wallet:", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Failed to connect wallet: ${errorMessage}`);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [getSolBalance]);

    // Check if the browser extension version of Phantom wallet is available
    const checkBrowserExtension = useCallback(() => {
        const provider = window.phantom?.solana as PhantomProvider | undefined;
        return !!(provider && provider.isPhantom);
    }, []);

    // Create a wallet method object, use getter to get the latest state
    const walletMethods = useRef<PhantomWalletMethods>({
        getSolBalance,
        get isLoading() { return isLoadingRef.current; },
        get error() { return errorRef.current; }
    });

    // When the method updates, update walletMethods
    useEffect(() => {
        walletMethods.current = {
            getSolBalance,
            get isLoading() { return isLoadingRef.current; },
            get error() { return errorRef.current; }
        };

        // If the onInitialized callback is provided, pass the latest method reference
        if (onInitialized) {
            onInitialized(walletMethods.current);
        }
    }, [getSolBalance, onInitialized]);

    // Initialize Phantom
    useEffect(() => {
        let isComponentMounted = true;

        const initializePhantom = async () => {
            try {
                // Check if the browser extension version of Phantom wallet is already installed
                const hasExtension = checkBrowserExtension();

                if (hasExtension) {
                    console.log("Detected Phantom browser extension, will use extension version");
                    if (isComponentMounted) setUseBrowserExtension(true);
                } else {
                    // Initialize Phantom embedded wallet
                    try {
                        const phantomInstance = await createPhantom({
                            position,
                            hideLauncherBeforeOnboarded,
                            namespace,
                        });

                        if (isComponentMounted) {
                            setPhantom(phantomInstance);
                            // Show wallet UI
                            phantomInstance.show();
                        }
                    } catch (initError) {
                        console.error("Failed to initialize embedded wallet, will try to use browser extension:", initError);
                        if (isComponentMounted) setUseBrowserExtension(true);
                    }
                }

                // Check if already connected
                if (window.phantom?.solana) {
                    try {
                        // Modify this part of the code to avoid using the non-existent isConnected method
                        // Use the getAccounts method directly to check if connected
                        try {
                            const provider = window.phantom.solana as PhantomProvider;
                            const accounts = await provider.request("connect", {});

                            // Check if accounts is an array and has elements
                            const accountsArray = Array.isArray(accounts) ? accounts :
                                (accounts && typeof accounts === 'object' && 'publicKey' in accounts) ? [accounts.publicKey.toString()] : [];

                            if (accountsArray.length > 0 && isComponentMounted) {
                                const publicKeyString = accountsArray[0].toString();
                                setPublicKey(publicKeyString);
                                setIsConnected(true);
                                console.log("Wallet connected:", publicKeyString);
                                // Automatically query SOL balance
                                getSolBalance();
                            } else if (isComponentMounted) {
                                // If no account is obtained, display the need to connect prompt
                                console.log("Wallet not connected, need to manually connect");
                                setIsConnected(false);
                                setPublicKey(null);
                            }
                        } catch (accountError) {
                            // It may be a permission error, need to authorize the user
                            console.log("Need to authorize to connect wallet");
                            if (isComponentMounted) {
                                await connectWallet();
                            }
                        }
                    } catch (connError) {
                        console.error("Failed to check wallet connection status:", connError);
                        if (isComponentMounted) {
                            // Change the error message to avoid displaying isConnected related errors
                            setError(`Failed to check wallet status, please refresh the page and try again`);
                        }
                    }
                } else if (isComponentMounted) {
                    setError("Phantom wallet not installed or unavailable, please install the Phantom wallet extension");
                }
            } catch (error) {
                console.error("Failed to initialize Phantom wallet:", error);
                if (isComponentMounted) {
                    setError(`Failed to initialize Phantom wallet: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        };

        initializePhantom();

        // Cleanup function
        return () => {
            isComponentMounted = false;
            if (phantom && !useBrowserExtension) {
                phantom.hide();
            }
        };
    }, [position, hideLauncherBeforeOnboarded, namespace, checkBrowserExtension, connectWallet, getSolBalance]);

    // Listen for wallet account changes
    useEffect(() => {
        // Function to handle account changes
        const handleAccountsChanged = (event: any) => {
            // Check if event contains accounts information
            const accounts = Array.isArray(event) ? event :
                (event && typeof event === 'object' && 'accounts' in event) ? event.accounts : [];

            if (accounts.length === 0) {
                // User disconnected
                setIsConnected(false);
                setPublicKey(null);
                setSolBalance(null);
            } else {
                // Account changed
                setPublicKey(accounts[0].toString());
                setIsConnected(true);
                // Automatically query balance after account change
                getSolBalance();
            }
        };

        if (window.phantom?.solana) {
            // Listen for account change events
            const provider = window.phantom.solana as PhantomProvider;
            // Use correct event type from PhantomEvent
            provider.on("connect", handleAccountsChanged);
        }

        return () => {
            if (window.phantom?.solana) {
                const provider = window.phantom.solana as PhantomProvider;
                provider.removeAllListeners();
            }
        };
    }, [getSolBalance]);

    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-3">Phantom wallet</h3>

            {error && (
                <div className="text-red-500 mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                    <p>
                        {error.includes('window.phantom.solana.isConnected')
                            ? 'Failed to check wallet status, but you can still try to connect wallet'
                            : error}
                    </p>
                </div>
            )}

            <div className="flex items-center mb-4">
                <span className="mr-2">Connection status:</span>
                {isConnected ? (
                    <span className="text-green-600 font-medium flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Connected
                    </span>
                ) : (
                    <span className="text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-gray-300 rounded-full mr-1"></span>
                        Disconnected
                    </span>
                )}
            </div>

            {publicKey && (
                <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">Current account:</div>
                    <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
                        {publicKey}
                    </div>
                </div>
            )}

            {solBalance !== null && (
                <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">SOL balance:</div>
                    <div className="bg-blue-50 p-2 rounded font-bold">
                        {solBalance.toFixed(6)} SOL
                    </div>
                </div>
            )}

            {isLoading ? (
                <button
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded w-full"
                    disabled
                >
                    Processing...
                </button>
            ) : !isConnected ? (
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full transition-colors"
                    onClick={connectWallet}
                >
                    Connect wallet
                </button>
            ) : (
                <button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded w-full transition-colors"
                    onClick={async () => {
                        try {
                            await window.phantom?.solana?.disconnect();
                            setIsConnected(false);
                            setPublicKey(null);
                            setSolBalance(null);
                        } catch (err) {
                            setError(`Failed to disconnect: ${err instanceof Error ? err.message : String(err)}`);
                        }
                    }}
                >
                    Disconnect
                </button>
            )}

            {useBrowserExtension && (
                <div className="mt-2 text-sm text-blue-600">
                    Use the browser extension version of Phantom wallet
                </div>
            )}
        </div>
    );
};