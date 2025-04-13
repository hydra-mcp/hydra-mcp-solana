// User wallet type definition
export interface UserWalletInfo {
    address: string;                 // Wallet address
    wallet_balance: number;          // Wallet SOL balance
    recharged_sol_balance: number;   // Recharged account SOL balance
    usdValue?: number;               // USD value (optional)
    lastUpdated?: number;            // Last update timestamp
}

// Recharge order type definition
export interface RechargeOrder {
    order_id: string;                // Order ID
    order_number: string;            // Order number
    amount: number;                  // Recharge amount (SOL)
    status: OrderStatus;             // Order status
    created_at: string;              // Creation time (ISO format)
    payment_id: string | null;       // Payment ID
    transaction_signature: string | null; // Transaction signature
    completed_at: string | null;     // Completion time (ISO format)
}

// Order status enum
export enum OrderStatus {
    PENDING = "PENDING",      // Pending
    PAID = "PAID",            // Paid
    CANCELLED = "CANCELLED",  // Cancelled
    EXPIRED = "EXPIRED"       // Expired
}

// Recharge history
export interface RechargeHistory {
    data: RechargeOrder[];    // Order list
    meta: {
        offset: number;       // Current offset
        limit: number;        // Number of records per page
        total: number;        // Total number of records
        has_more: boolean;    // Whether there are more records
    };
}

// Get wallet balance response
export interface BalanceResponse {
    wallet_balance: number;          // Wallet SOL balance
    recharged_sol_balance: number;   // Recharged SOL balance
    usdValue?: number;               // USD value (optional)
    lastUpdated: number;             // Update timestamp
}

// Phantom wallet type
export interface PhantomWalletResponse {
    publicKey: { toString(): string };
}