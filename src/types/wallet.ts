// User wallet type definition
export interface UserWalletInfo {
    address: string;                 // Wallet address
    wallet_balance: number;          // Wallet SOL balance
    user_sol_balance: number;        // User SOL balance
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

// Consumption type enum
export enum ConsumptionType {
    CA_ANALYSIS = "CA_ANALYSIS", // CA analysis consumption
    WALLET_FINDER = "WALLET_FINDER",     // Wallet finder consumption
    PREMIUM_FEATURE = "PREMIUM_FEATURE" // Premium feature consumption
}

// Consumption status enum
export enum ConsumptionStatus {
    SUCCESS = "SUCCESS",      // Successful consumption
    FAILED = "FAILED",        // Failed consumption
    REFUNDED = "REFUNDED"     // Refunded consumption
}

// Consumption record
export interface ConsumptionRecord {
    id: string;               // Consumption record ID
    amount: number;           // Consumption amount (SOL)
    consumption_type: ConsumptionType; // Consumption type
    status: ConsumptionStatus; // Consumption status
    feature_id: string | null; // Feature/service ID
    description: string | null; // Consumption description
    quantity: number;         // Usage count/quantity
    created_at: string;       // Creation time (ISO format)
}

// Consumption history
export interface ConsumptionHistory {
    data: ConsumptionRecord[]; // Consumption record list
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
    user_sol_balance: number;        // User SOL balance
    usdValue?: number;               // USD value (optional)
    lastUpdated: number;             // Update timestamp
}

// Phantom wallet type
export interface PhantomWalletResponse {
    publicKey: { toString(): string };
}