import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { apiRequest } from '@/lib/api';
import { UserWalletInfo, BalanceResponse, RechargeHistory, RechargeOrder, ConsumptionHistory, ConsumptionRecord, ConsumptionType } from '@/types/wallet';
import { PhantomProvider, PhantomWindow } from '@/types/phantom';

// Connect wallet
export const connectWallet = async (): Promise<string | null> => {
    if (!(window as unknown as PhantomWindow).phantom?.solana) {
        throw new Error("Phantom wallet not detected, please install Phantom wallet extension");
    }

    try {
        // Try to connect wallet
        const provider = (window as unknown as PhantomWindow).phantom!.solana as PhantomProvider;
        const resp = await provider.connect();
        const publicKey = resp.publicKey.toString();

        // Store wallet address
        localStorage.setItem('wallet_address', publicKey);

        return publicKey;
    } catch (error) {
        console.error("Failed to connect wallet:", error);
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to connect wallet: ${message}`);
    }
};

// Disconnect wallet
export const disconnectWallet = async (): Promise<void> => {
    if (!(window as unknown as PhantomWindow).phantom?.solana) {
        return;
    }

    try {
        const provider = (window as unknown as PhantomWindow).phantom!.solana as PhantomProvider;
        await provider.disconnect();
        localStorage.removeItem('wallet_address');
    } catch (error) {
        console.error("Failed to disconnect wallet:", error);
        throw error;
    }
};

// Get current wallet address
export const getCurrentWalletAddress = (): string | null => {
    return localStorage.getItem('wallet_address');
};

// Check if wallet is connected
export const isWalletConnected = async (): Promise<boolean> => {
    if (!(window as unknown as PhantomWindow).phantom?.solana) {
        return false;
    }

    const walletAddress = getCurrentWalletAddress();
    return !!walletAddress;
};

// Get wallet balance
export const getWalletBalance = async (walletAddress: string): Promise<BalanceResponse> => {
    try {
        // Get balance information from API
        const response = await apiRequest<BalanceResponse>(`/web3/solana/balance?wallet_address=${walletAddress}`, {
            method: 'GET'
        });

        return response;
    } catch (error) {
        console.error("Failed to get wallet balance:", error);
        throw error;
    }
};

// Get wallet info (combine address and balance)
export const getWalletInfo = async (walletAddress?: string): Promise<UserWalletInfo | null> => {
    const address = walletAddress || getCurrentWalletAddress();

    if (!address) {
        return null;
    }

    try {
        const balanceData = await getWalletBalance(address);

        return {
            address,
            wallet_balance: balanceData.wallet_balance,
            user_sol_balance: balanceData.user_sol_balance,
            usdValue: balanceData.usdValue,
            lastUpdated: balanceData.lastUpdated
        };
    } catch (error) {
        console.error("Failed to get wallet info:", error);

        // Return information with address but no balance
        return {
            address,
            wallet_balance: 0,
            user_sol_balance: 0,
            lastUpdated: Date.now()
        };
    }
};

// Get recharge history
export const getRechargeHistory = async (limit: number = 10, offset: number = 0): Promise<RechargeHistory> => {
    const walletAddress = getCurrentWalletAddress();

    if (!walletAddress) {
        throw new Error("Wallet not connected");
    }

    try {
        const response = await apiRequest<{
            success: boolean,
            data: RechargeOrder[],
            message: string,
            meta: {
                offset: number,
                limit: number,
                total: number,
                has_more: boolean
            }
        }>(`/web3/solana/recharge-history?offset=${offset}&limit=${limit}`, {
            method: 'GET'
        });

        return {
            data: response.data,
            meta: response.meta
        };
    } catch (error) {
        console.error("Failed to get recharge history:", error);

        // If API is not available, return empty history
        return {
            data: [],
            meta: {
                offset,
                limit,
                total: 0,
                has_more: false
            }
        };
    }
};

// Get consumption history
export const getConsumptionHistory = async (
    limit: number = 10,
    offset: number = 0,
    consumptionType?: ConsumptionType
): Promise<ConsumptionHistory> => {
    const walletAddress = getCurrentWalletAddress();

    if (!walletAddress) {
        throw new Error("Wallet not connected");
    }

    try {
        let url = `/web3/solana/consumption-history?offset=${offset}&limit=${limit}`;
        if (consumptionType) {
            url += `&consumption_type=${consumptionType}`;
        }

        const response = await apiRequest<{
            success: boolean,
            data: ConsumptionRecord[],
            message: string,
            meta: {
                offset: number,
                limit: number,
                total: number,
                has_more: boolean
            }
        }>(url, {
            method: 'GET'
        });

        return {
            data: response.data,
            meta: response.meta
        };
    } catch (error) {
        console.error("Failed to get consumption history:", error);

        // If API is not available, return empty history
        return {
            data: [],
            meta: {
                offset,
                limit,
                total: 0,
                has_more: false
            }
        };
    }
};

// Format SOL amount display
export const formatSolAmount = (amount: number): string => {
    if (amount === undefined) return 'N/A';
    return amount.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
    });
};

// Format USD amount display
export const formatUsdAmount = (amount: number | undefined): string => {
    if (amount === undefined) return 'N/A';

    return amount.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Format shortened wallet address
export const formatShortAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}; 