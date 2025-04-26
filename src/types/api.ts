// API response basic interface
export interface ApiResponse {
    type?: string;
    content?: string;
    error?: {
        message: string;
        code?: string;
    };
}

// API error
export interface ApiError {
    message: string;
    code?: string;
    status?: number;
} 