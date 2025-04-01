import { useState, useRef, useEffect } from 'react';
import { PhantomWallet } from './PhantomWallet';
import type { PhantomWalletMethods } from './PhantomWallet';
import { createSolanaClient, LAMPORTS_PER_SOL, address } from "gill";

// Network type
type NetworkType = 'mainnet' | 'devnet';

// Token information type
interface TokenData {
    mint: string;       // Token mint address
    symbol: string;     // Token symbol
    name: string;       // Token name
    balance: number;    // Token balance
    decimals: number;   // Token precision
    logoURI?: string;   // Token logo URL
}

// Token selection item type
interface TokenOption {
    mint: string;      // Token mint address
    symbol: string;    // Token symbol 
    name: string;      // Token name
    logoURI?: string;  // Token Logo URL
    decimals: number;  // Token precision
}

// Popular token list (Mainnet)
const POPULAR_TOKENS_MAINNET: TokenOption[] = [
    {
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        symbol: "USDC",
        name: "USD Coin",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
        decimals: 6
    },
    {
        mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        symbol: "USDT",
        name: "USDT",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
        decimals: 6
    },
    {
        mint: "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
        symbol: "BONK",
        name: "Bonk",
        logoURI: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
        decimals: 5
    },
    {
        mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
        symbol: "mSOL",
        name: "Marinade staked SOL",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png",
        decimals: 9
    },
    {
        mint: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
        symbol: "ETH",
        name: "Ethereum (Wormhole)",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png",
        decimals: 8
    },
    {
        mint: "So11111111111111111111111111111111111111112",
        symbol: "wSOL",
        name: "Wrapped SOL",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        decimals: 9
    },
    {
        mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        symbol: "BONK",
        name: "Bonk",
        logoURI: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
        decimals: 5
    },
    {
        mint: "DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ",
        symbol: "DUST",
        name: "DUST Protocol",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ/logo.jpg",
        decimals: 9
    },
    {
        mint: "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux",
        symbol: "HNT",
        name: "Helium Network Token",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux/logo.png",
        decimals: 8
    },
    {
        mint: "kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6",
        symbol: "KIN",
        name: "KIN",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6/logo.png",
        decimals: 5
    },
    {
        mint: "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm",
        symbol: "PYTH",
        name: "Pyth Network",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm/logo.png",
        decimals: 6
    },
    {
        mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
        symbol: "RAY",
        name: "Raydium",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
        decimals: 6
    }
];

// Popular token list (Devnet)
const POPULAR_TOKENS_DEVNET: TokenOption[] = [
    {
        mint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
        symbol: "USDC",
        name: "USD Coin (Devnet)",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
        decimals: 6
    },
    {
        mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
        symbol: "USDT",
        name: "USDT (Devnet)",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
        decimals: 6
    },
    {
        mint: "So11111111111111111111111111111111111111112",
        symbol: "wSOL",
        name: "Wrapped SOL (Devnet)",
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        decimals: 9
    }
];

// Get token list based on network
const getPopularTokens = (network: NetworkType): TokenOption[] => {
    return network === 'mainnet' ? POPULAR_TOKENS_MAINNET : POPULAR_TOKENS_DEVNET;
};

// Filter token list based on search keyword
const filterTokensBySearchTerm = (tokens: TokenOption[], searchTerm: string): TokenOption[] => {
    if (!searchTerm.trim()) {
        return tokens;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return tokens.filter(token =>
        token.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        token.symbol.toLowerCase().includes(lowerCaseSearchTerm) ||
        token.mint.toLowerCase().includes(lowerCaseSearchTerm)
    );
};

// Get token mint address from token symbol or name
const getMintAddressFromSymbolOrName = (tokens: TokenOption[], symbolOrName: string): string | null => {
    if (!symbolOrName.trim()) return null;

    const lowerCaseSearch = symbolOrName.toLowerCase();
    const token = tokens.find(t =>
        t.symbol.toLowerCase() === lowerCaseSearch ||
        t.name.toLowerCase() === lowerCaseSearch
    );

    return token ? token.mint : null;
};

// RPC endpoint configuration
const RPC_ENDPOINTS = {
    mainnet: "http://0.0.0.0:8000/api/auth/user/token",
    devnet: "https://api.devnet.solana.com"
};

// Check if the string is possibly a valid Solana address
const isSolanaAddress = (address: string): boolean => {
    // Solana addresses are usually base58 encoded, with lengths ranging from 32 to 44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

export const TokenBalanceExample = () => {
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [tokenBalance, setTokenBalance] = useState<TokenData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [apiState, setApiState] = useState<string>('Not initialized');
    const [customPublicKey, setCustomPublicKey] = useState<string>('');
    const [tokenMintAddress, setTokenMintAddress] = useState<string>('');
    const [customTokenMint, setCustomTokenMint] = useState<string>('');
    const [lastQueriedAddress, setLastQueriedAddress] = useState<string>('');
    const [queryMode, setQueryMode] = useState<'wallet' | 'custom' | 'token'>('wallet');
    const [network, setNetwork] = useState<NetworkType>('mainnet');
    const [showTokenOptions, setShowTokenOptions] = useState<boolean>(false);
    const [tokenSearchTerm, setTokenSearchTerm] = useState<string>('');
    const [filteredTokens, setFilteredTokens] = useState<TokenOption[]>([]);
    // Add: current active tab
    const [activeTab, setActiveTab] = useState<'sol' | 'token'>('sol');

    // Save the methods provided by the PhantomWallet component
    const walletMethodsRef = useRef<PhantomWalletMethods | null>(null);

    // Filter token list based on network and search keyword
    useEffect(() => {
        const allTokens = getPopularTokens(network);
        setFilteredTokens(filterTokensBySearchTerm(allTokens, tokenSearchTerm));
    }, [network, tokenSearchTerm]);

    // Call when the PhantomWallet component is initialized
    const handlePhantomInitialized = (methods: PhantomWalletMethods) => {
        walletMethodsRef.current = methods;
        setApiState('Initialized');

        // Clear any expired error information
        if (error && error.includes('isConnected')) {
            setError(null);
        }
    };

    // Listen for error status
    useEffect(() => {
        // Check the wallet methods for errors periodically
        const interval = setInterval(() => {
            if (walletMethodsRef.current?.error) {
                // Filter out errors related to isConnected
                const currentError = walletMethodsRef.current.error;
                if (currentError.includes('isConnected')) {
                    // This error does not affect actual use, can be ignored
                    return;
                }
                setError(walletMethodsRef.current.error);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Create SOL balance RPC request method
    const getRpcRequest = (walletAddress: string, networkType: NetworkType) => {
        // Create different namespace prefixes based on network type
        const methodNamespace = networkType === 'mainnet' ? 'solana-mainnet' : 'solana';

        // return {
        //     jsonrpc: "2.0",
        //     id: `getbalance-${Date.now()}`,
        //     method: `${methodNamespace}.getBalance`,
        //     params: [walletAddress]
        // };
        return {
            method: "getBalance",
            params: [walletAddress]
        }
    };

    // Create token balance RPC request method
    const getTokenAccountsRequest = (walletAddress: string, mintAddress: string, networkType: NetworkType) => {
        // Create different namespace prefixes based on network type
        const methodNamespace = networkType === 'mainnet' ? 'solana-mainnet' : 'solana';

        return {
            jsonrpc: "2.0",
            id: `gettokenaccounts-${Date.now()}`,
            method: `getTokenAccountsByOwner`,
            params: [
                walletAddress,
                {
                    mint: mintAddress
                },
                {
                    encoding: "jsonParsed"
                }
            ]
        };
    };

    // Query the SOL balance of the connected wallet
    const handleQueryWalletBalance = async () => {
        if (!walletMethodsRef.current) {
            setError("Wallet not initialized");
            return;
        }

        setIsLoading(true);
        setError(null);
        setQueryMode('wallet');
        // Clear token balance data
        setTokenBalance(null);

        try {
            setApiState('Querying...');

            // Pass the currently selected network parameter
            const balance = await walletMethodsRef.current.getSolBalance(network);
            setApiState('Query completed');

            setSolBalance(balance);
            setLastQueriedAddress(`Current connected wallet (${network})`);
        } catch (error) {
            let errorMessage = error instanceof Error ? error.message : String(error);

            // If it's an isConnected related error, provide a more friendly prompt
            if (errorMessage.includes('isConnected')) {
                errorMessage = "Wallet connection status check failed, please try refreshing the page";
            }

            setError(`Query failed: ${errorMessage}`);
            console.error('SOL balance query error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Query the SOL balance of a custom address
    const handleQueryCustomBalance = async () => {
        if (!customPublicKey.trim()) {
            setError("Please enter a valid wallet address");
            return;
        }

        setIsLoading(true);
        setError(null);
        setQueryMode('custom');
        // Clear token balance data
        setTokenBalance(null);

        try {
            setApiState('Querying...');

            try {
                const wallet = address(customPublicKey);

                // Use fetch directly to call the RPC interface, and call different namespaces based on the selected network
                const response = await fetch(RPC_ENDPOINTS[network], {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(getRpcRequest(wallet.toString(), network))
                });

                // Parse the response
                const jsonResponse = await response.json();

                if (jsonResponse.error) {
                    throw new Error(`RPC error: ${jsonResponse.error.message || JSON.stringify(jsonResponse.error)}`);
                }

                // Parse the returned balance result
                const balance = jsonResponse.result?.value || 0;
                const solAmount = Number(balance) / LAMPORTS_PER_SOL;

                console.log(`Custom address balance: ${solAmount} SOL (using ${network} namespace)`);
                setSolBalance(solAmount);
                setLastQueriedAddress(`${customPublicKey} (${network})`);
                setApiState('Query completed');
            } catch (addressError) {
                // More friendly address error prompt
                let errorMessage = addressError instanceof Error
                    ? addressError.message
                    : String(addressError);

                if (errorMessage.includes('Failed to find account')) {
                    errorMessage = `This address does not exist on ${network === 'mainnet' ? 'mainnet' : 'devnet'} or has a zero balance`;
                } else if (errorMessage.includes('invalid')) {
                    errorMessage = "Invalid Solana wallet address format";
                }

                setError(`Address error: ${errorMessage}`);
            }
        } catch (error) {
            let errorMessage = error instanceof Error ? error.message : String(error);

            // Network related error handling
            if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
                errorMessage = "Network connection error, please check your network connection and try again";
            } else if (errorMessage.includes('namespace')) {
                errorMessage = "RPC method namespace error, please check RPC configuration";
            }

            setError(`Query failed: ${errorMessage}`);
            console.error('SOL balance query error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Query token balance
    const handleQueryTokenBalance = async () => {
        // Use the selected token mint address or the custom input address
        const mintAddressToUse = tokenMintAddress || customTokenMint;

        if (!customPublicKey.trim()) {
            setError("Please enter a valid wallet address");
            return;
        }

        if (!mintAddressToUse.trim()) {
            setError("Please select a token or enter a valid token mint address");
            return;
        }

        setIsLoading(true);
        setError(null);
        setQueryMode('token');
        // Clear SOL balance data
        setSolBalance(null);

        try {
            setApiState('Querying token...');

            try {
                const wallet = address(customPublicKey);

                // Use fetch directly to call the RPC interface to query the token account
                const response = await fetch(RPC_ENDPOINTS[network], {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(getTokenAccountsRequest(wallet.toString(), mintAddressToUse, network))
                });

                // Parse the response
                const jsonResponse = await response.json();

                if (jsonResponse.error) {
                    throw new Error(`RPC error: ${jsonResponse.error.message || JSON.stringify(jsonResponse.error)}`);
                }

                // Parse the returned token account
                const tokenAccounts = jsonResponse.result?.value || [];

                // Find the selected token information
                const selectedToken = getPopularTokens(network).find(token => token.mint === mintAddressToUse);

                if (tokenAccounts.length === 0) {
                    // The user does not hold this token
                    setTokenBalance({
                        mint: mintAddressToUse,
                        symbol: selectedToken?.symbol || "Unknown token",
                        name: selectedToken?.name || "Unknown token",
                        balance: 0,
                        decimals: selectedToken?.decimals || 0,
                        logoURI: selectedToken?.logoURI
                    });

                    setLastQueriedAddress(`${customPublicKey} (${network})`);
                    setApiState('Query completed');
                    return;
                }

                // Parse token balance
                const tokenAccount = tokenAccounts[0];
                const tokenInfo = tokenAccount.account.data.parsed.info;
                const decimals = tokenInfo.tokenAmount.decimals;
                const balance = parseFloat(tokenInfo.tokenAmount.amount) / Math.pow(10, decimals);

                setTokenBalance({
                    mint: mintAddressToUse,
                    symbol: selectedToken?.symbol || "Unknown token",
                    name: selectedToken?.name || "Unknown token",
                    balance: balance,
                    decimals: decimals,
                    logoURI: selectedToken?.logoURI
                });

                setLastQueriedAddress(`${customPublicKey} (${network})`);
                setApiState('Query completed');

            } catch (addressError) {
                // More friendly address error prompt
                let errorMessage = addressError instanceof Error
                    ? addressError.message
                    : String(addressError);

                if (errorMessage.includes('Failed to find account')) {
                    errorMessage = `This address does not exist on ${network === 'mainnet' ? 'mainnet' : 'devnet'} or does not hold this token`;
                } else if (errorMessage.includes('invalid')) {
                    errorMessage = "Invalid address format";
                }

                setError(`Query error: ${errorMessage}`);
            }
        } catch (error) {
            let errorMessage = error instanceof Error ? error.message : String(error);

            setError(`Query token failed: ${errorMessage}`);
            console.error('Token balance query error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Clear the custom address input box
    const handleClearCustomInput = () => {
        setCustomPublicKey('');
        // Clear any existing error information
        if (error && error.includes('address error')) {
            setError(null);
        }
    };

    // Clear the custom token input box
    const handleClearTokenInput = () => {
        setCustomTokenMint('');
        // Clear the selected token
        setTokenMintAddress('');
        // Clear any existing error information
        if (error && error.includes('token')) {
            setError(null);
        }
    };

    // Clear error information
    const handleClearError = () => {
        setError(null);
    };

    // Switch network
    const handleNetworkChange = (newNetwork: NetworkType) => {
        setNetwork(newNetwork);
        // Clear previous results
        setSolBalance(null);
        setTokenBalance(null);
        // Reset token selection
        setTokenMintAddress('');
        // Clear any existing error information
        setError(null);
    };

    // Select token
    const handleSelectToken = (token: TokenOption) => {
        setTokenMintAddress(token.mint);
        setCustomTokenMint(''); // Clear custom input
        setShowTokenOptions(false); // Hide dropdown list
        setTokenSearchTerm(''); // Clear search term
    };

    // Handle quick search and try to automatically find tokens
    const handleQuickTokenSearch = () => {
        if (!customTokenMint) return;

        // Check if it is a complete mint address
        if (isSolanaAddress(customTokenMint)) {
            // It may be a complete mint address, keep it as is
            setError(`Mint address set: ${customTokenMint.slice(0, 6)}...${customTokenMint.slice(-4)}`);
            setTimeout(() => {
                if (error?.startsWith('Mint address set: ')) {
                    setError(null);
                }
            }, 3000);
            return;
        }

        // Try to get the mint address from the symbol or name
        const mint = getMintAddressFromSymbolOrName(getPopularTokens(network), customTokenMint);
        if (mint) {
            // Found a matching token, automatically set its mint address
            setTokenMintAddress(mint);
            setCustomTokenMint(''); // Clear custom input box

            // Find token details to display to the user
            const token = getPopularTokens(network).find(t => t.mint === mint);
            if (token) {
                // Display success prompt
                setError(`✅ Token automatically identified: ${token.name} (${token.symbol})`);
                setTimeout(() => {
                    if (error?.startsWith('✅ Token automatically identified: ')) {
                        setError(null);
                    }
                }, 3000);
            }
        } else {
            setError(`⚠️ Token "${customTokenMint}" not found, please try other names or directly enter the mint address`);
            setTimeout(() => {
                if (error?.startsWith(`⚠️ Token "${customTokenMint}" not found`)) {
                    setError(null);
                }
            }, 5000);
        }
    };

    return (
        <div className="flex flex-col p-4 gap-4 max-w-4xl mx-auto">
            {/* Initialize PhantomWallet component */}
            <PhantomWallet onInitialized={handlePhantomInitialized} />

            <h2 className="text-2xl font-bold mb-2">Solana balance query tool</h2>

            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm mb-4">
                <p>API status: <span className={apiState === 'Initialized' ? 'text-green-600 font-medium' : 'text-blue-600'}>{apiState}</span></p>
                <p>Current network: <span className="font-medium">{network === 'mainnet' ? 'Mainnet (Mainnet)' : 'Devnet (Devnet)'}</span></p>
            </div>

            {/* Network selection */}
            <div className="p-4 border rounded-lg bg-gray-50 mb-4">
                <h3 className="text-lg font-medium mb-3">Select network</h3>
                <div className="flex gap-3">
                    <button
                        className={`px-4 py-2 rounded-md ${network === 'mainnet'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        onClick={() => handleNetworkChange('mainnet')}
                    >
                        Mainnet (Mainnet)
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md ${network === 'devnet'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        onClick={() => handleNetworkChange('devnet')}
                    >
                        Devnet (Devnet)
                    </button>
                </div>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-gray-200 mb-4">
                <button
                    className={`py-3 px-6 font-medium text-sm rounded-t-lg ${activeTab === 'sol'
                        ? 'bg-white border-l border-t border-r border-gray-200 text-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                        }`}
                    onClick={() => setActiveTab('sol')}
                >
                    SOL balance query
                </button>
                <button
                    className={`py-3 px-6 font-medium text-sm rounded-t-lg ${activeTab === 'token'
                        ? 'bg-white border-l border-t border-r border-gray-200 text-purple-600'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                        }`}
                    onClick={() => setActiveTab('token')}
                >
                    Token balance query
                </button>
            </div>

            {/* Error/ */}
            {error && (
                <div className={`p-3 border rounded relative mb-4 ${error.startsWith('✅')
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : error.startsWith('⚠️')
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                        : 'bg-red-50 border-red-200 text-red-500'
                    }`}>
                    <button
                        onClick={handleClearError}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        title="Close message"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <p className={`font-medium ${error.startsWith('✅')
                        ? 'text-green-700'
                        : error.startsWith('⚠️')
                            ? 'text-yellow-700'
                            : 'text-red-600'
                        }`}>
                        {error.startsWith('✅')
                            ? 'Success'
                            : error.startsWith('⚠️')
                                ? 'Tip'
                                : 'Error'}:
                    </p>
                    <p className="whitespace-pre-wrap">{error}</p>
                    {error.includes('isConnected') && (
                        <p className="mt-2 text-sm text-blue-600">
                            ℹ️ Tip: This does not affect your use of the function, you can continue to operate normally
                        </p>
                    )}
                </div>
            )}

            {/* SOL balance query area */}
            {activeTab === 'sol' && (
                <div className="bg-white border rounded-lg shadow-sm">
                    <div className="border-b p-4">
                        <h3 className="text-lg font-semibold text-gray-800">SOL balance query</h3>
                        <p className="text-sm text-gray-600 mt-1">Query SOL native token balance</p>
                    </div>

                    <div className="p-5 flex flex-col gap-6">
                        {/* Connect wallet query */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h4 className="font-medium text-blue-800 mb-2">Use connected wallet</h4>
                            <p className="text-sm text-gray-600 mb-3">Query the balance of the currently connected Phantom wallet directly</p>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
                                onClick={handleQueryWalletBalance}
                                disabled={isLoading}
                            >
                                {isLoading && queryMode === 'wallet'
                                    ? <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Querying...
                                    </span>
                                    : "Query wallet balance"
                                }
                            </button>
                        </div>

                        {/* Custom address query */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <h4 className="font-medium text-green-800 mb-2">Query specified wallet address</h4>
                            <p className="text-sm text-gray-600 mb-3">Enter any Solana wallet address to query its SOL balance</p>

                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <input
                                        id="custom-address"
                                        type="text"
                                        className="flex-1 border border-gray-300 rounded p-2"
                                        value={customPublicKey}
                                        onChange={(e) => setCustomPublicKey(e.target.value)}
                                        placeholder="Enter Solana wallet address"
                                        disabled={isLoading}
                                    />
                                    <button
                                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                                        onClick={handleClearCustomInput}
                                        disabled={isLoading}
                                        title="Clear input"
                                    >
                                        Clear
                                    </button>
                                </div>

                                <button
                                    className="bg-green-600 text-white px-4 py-2 rounded-md disabled:bg-gray-300 hover:bg-green-700 transition-colors"
                                    onClick={handleQueryCustomBalance}
                                    disabled={isLoading || !customPublicKey.trim()}
                                >
                                    {isLoading && queryMode === 'custom'
                                        ? <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Querying...
                                        </span>
                                        : "Query SOL balance"
                                    }
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SOL balance result display */}
                    {solBalance !== null && (
                        <div className="border-t p-5">
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <h4 className="text-lg font-medium mb-2 text-gray-800">SOL balance query result</h4>
                                <p className="text-sm text-gray-600 mb-4">Address: {lastQueriedAddress}</p>

                                <div className="bg-white p-5 rounded-lg shadow-sm border flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-800">{solBalance.toFixed(6)}</div>
                                        <div className="text-purple-600 font-medium mt-1">SOL</div>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-gray-500 text-center">
                                    Network: {network === 'mainnet' ? 'Mainnet' : 'Devnet'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Token balance query area */}
            {activeTab === 'token' && (
                <div className="bg-white border rounded-lg shadow-sm">
                    <div className="border-b p-4">
                        <h3 className="text-lg font-semibold text-gray-800">Token balance query</h3>
                        <p className="text-sm text-gray-600 mt-1">Query the balance of a specific token for a specified wallet address</p>
                    </div>

                    <div className="p-5 flex flex-col gap-4">
                        {/* Wallet address input */}
                        <div>
                            <label htmlFor="token-wallet-address" className="block font-medium mb-2 text-gray-700">
                                Wallet address
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="token-wallet-address"
                                    type="text"
                                    className="flex-1 border border-gray-300 rounded p-2"
                                    value={customPublicKey}
                                    onChange={(e) => setCustomPublicKey(e.target.value)}
                                    placeholder="Enter the wallet address to query"
                                    disabled={isLoading}
                                />
                                <button
                                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                                    onClick={handleClearCustomInput}
                                    disabled={isLoading}
                                    title="Clear input"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <hr className="my-2" />

                        {/* Token selection */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                            <h4 className="font-medium text-purple-800 mb-3">Select the token to query</h4>

                            {/* Preset token selection */}
                            <div className="mb-4">
                                <label className="block font-medium mb-2 text-gray-700">
                                    Select popular tokens:
                                </label>
                                <div className="relative">
                                    <div
                                        className="w-full border border-gray-300 rounded p-2 bg-white flex justify-between items-center cursor-pointer"
                                        onClick={() => !isLoading && setShowTokenOptions(!showTokenOptions)}
                                    >
                                        {tokenMintAddress ? (
                                            <div className="flex items-center">
                                                {getPopularTokens(network).find(t => t.mint === tokenMintAddress)?.logoURI && (
                                                    <img
                                                        src={getPopularTokens(network).find(t => t.mint === tokenMintAddress)?.logoURI}
                                                        alt="Token Logo"
                                                        className="w-5 h-5 mr-2"
                                                    />
                                                )}
                                                <span>
                                                    {getPopularTokens(network).find(t => t.mint === tokenMintAddress)?.symbol} - {getPopularTokens(network).find(t => t.mint === tokenMintAddress)?.name}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">Select token...</span>
                                        )}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>

                                    {showTokenOptions && (
                                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-80 overflow-y-auto">
                                            {/* Search box */}
                                            <div className="sticky top-0 bg-white p-2 border-b">
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                                    placeholder="Search token name, symbol or address..."
                                                    value={tokenSearchTerm}
                                                    onChange={(e) => setTokenSearchTerm(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>

                                            {filteredTokens.length > 0 ? (
                                                filteredTokens.map((token) => (
                                                    <div
                                                        key={token.mint}
                                                        className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                                        onClick={() => handleSelectToken(token)}
                                                    >
                                                        {token.logoURI && (
                                                            <img src={token.logoURI} alt={token.symbol} className="w-5 h-5 mr-2" />
                                                        )}
                                                        <div>
                                                            <span className="font-medium">{token.symbol}</span>
                                                            <span className="text-sm text-gray-600 ml-2">{token.name}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-2 text-sm text-gray-500 text-center">
                                                    No matching tokens found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Manually enter token */}
                            <div className="mb-2">
                                <label htmlFor="custom-token" className="block font-medium mb-2 text-gray-700">
                                    Or enter token name/symbol/mint address:
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="custom-token"
                                        type="text"
                                        className="flex-1 border border-gray-300 rounded p-2"
                                        value={customTokenMint}
                                        onChange={(e) => {
                                            setCustomTokenMint(e.target.value);
                                            // If you enter a custom address, clear the selected preset token
                                            if (e.target.value) setTokenMintAddress('');
                                        }}
                                        placeholder="Enter token name, symbol or mint address"
                                        disabled={isLoading}
                                    />
                                    <button
                                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                                        onClick={handleClearTokenInput}
                                        disabled={isLoading}
                                        title="Clear input"
                                    >
                                        Clear
                                    </button>
                                </div>

                                <button
                                    className="mt-2 bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors text-sm"
                                    onClick={handleQuickTokenSearch}
                                    disabled={isLoading || !customTokenMint.trim()}
                                >
                                    Auto find token
                                </button>
                                <p className="text-xs text-gray-500 mt-1">
                                    Tip: You can directly enter the token symbol (e.g. USDC) or name for quick search
                                </p>
                            </div>
                        </div>

                        {/* Query button */}
                        <button
                            className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-md disabled:bg-gray-300 hover:bg-purple-700 transition-colors"
                            onClick={handleQueryTokenBalance}
                            disabled={isLoading || !customPublicKey.trim() || (!tokenMintAddress && !customTokenMint)}
                        >
                            {isLoading && queryMode === 'token'
                                ? <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Querying...
                                </span>
                                : "Query token balance"
                            }
                        </button>
                    </div>

                    {/* Token balance result display */}
                    {tokenBalance !== null && (
                        <div className="border-t p-5">
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <h4 className="text-lg font-medium mb-2 text-gray-800">Token balance query result</h4>
                                <p className="text-sm text-gray-600 mb-4">Address: {lastQueriedAddress}</p>

                                <div className="bg-white p-5 rounded-lg shadow-sm border">
                                    <div className="flex items-center gap-4">
                                        {tokenBalance.logoURI && (
                                            <div className="w-12 h-12 flex-shrink-0">
                                                <img src={tokenBalance.logoURI} alt={tokenBalance.symbol} className="w-full h-full object-contain" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600 mb-1">Token: {tokenBalance.name} ({tokenBalance.symbol})</p>
                                            <div className="text-2xl font-bold text-gray-800">
                                                {tokenBalance.balance.toFixed(tokenBalance.decimals)} {tokenBalance.symbol}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 bg-gray-100 p-3 rounded text-xs text-gray-600">
                                        <p>Mint Address:</p>
                                        <p className="font-mono break-all mt-1">{tokenBalance.mint}</p>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-gray-500 text-center">
                                    Network: {network === 'mainnet' ? 'Mainnet' : 'Devnet'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}; 