// Phantom wallet method interface
export interface PhantomWalletMethods {
    getSolBalance: () => Promise<number>;
    isLoading: boolean;
    error: string | null;
} 