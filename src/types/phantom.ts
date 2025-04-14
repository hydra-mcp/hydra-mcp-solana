import { PublicKey, Transaction, VersionedTransaction, SendOptions } from '@solana/web3.js';

type DisplayEncoding = 'utf8' | 'hex';

type PhantomEvent = 'connect' | 'disconnect' | 'accountChanged';

type PhantomRequestMethod =
    | 'connect'
    | 'disconnect'
    | 'signAndSendTransaction'
    | 'signAndSendTransactionV0'
    | 'signAndSendTransactionV0WithLookupTable'
    | 'signTransaction'
    | 'signAllTransactions'
    | 'signMessage';

interface ConnectOpts {
    onlyIfTrusted: boolean;
}

// Add Phantom wallet type declaration
export interface PhantomProvider {
    isPhantom?: boolean;
    removeAllListeners: () => void;
    publicKey: PublicKey | null;
    isConnected: boolean | null;
    signAndSendTransaction: (
        transaction: Transaction | VersionedTransaction,
        opts?: SendOptions
    ) => Promise<{ signature: string; publicKey: PublicKey }>;
    signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
    signAllTransactions: (
        transactions: (Transaction | VersionedTransaction)[]
    ) => Promise<(Transaction | VersionedTransaction)[]>;
    signMessage: (message: Uint8Array | string, display?: DisplayEncoding) => Promise<any>;
    connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
    disconnect: () => Promise<void>;
    on: (event: PhantomEvent, handler: (args: any) => void) => void;
    request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

// Export the Phantom type for window object
export interface PhantomWindow {
    phantom?: {
        solana?: PhantomProvider;
    };
}

// Type guard to check if window has phantom
export function hasPhantomWallet(window: any): window is Window & PhantomWindow {
    return window.phantom && window.phantom.solana;
}

// Extend the global Window interface to include phantom
declare global {
    interface Window {
        phantom?: {
            solana?: PhantomProvider;
        };
    }
}