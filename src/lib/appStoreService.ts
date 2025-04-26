import { apiRequest, ApiResponse } from "./api";

// App Store API functions
export interface AppCategory {
    id: string;
    name: string;
}

export interface AppItem {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string | null;
    rating: number | null;
    downloads: string | null;
    version?: string;
    publisher?: string;
    size?: string | null;
    releaseDate?: string | null;
    detailUrl?: string | null;
    installed: boolean;
    installDate?: string | null;
}

// Define the specific data structure returned by the install endpoint
interface InstallAppData {
    success: boolean;
    appId: string;
    message: string;
    installDate: string;
}

// Define the specific data structure returned by the uninstall endpoint
interface UninstallAppData {
    success: boolean;
    appId: string;
    message: string;
}

// Fetch available app categories
export async function fetchAppCategories(): Promise<AppCategory[]> {
    try {
        // Expect the response to be ApiResponse containing an array of AppCategory
        const result = await apiRequest<ApiResponse<AppCategory[]>>('/apps/categories');
        // Extract the array from the 'data' property
        if (result.status === 'success' && Array.isArray(result.data)) {
            return result.data;
        } else {
            console.error('API response error or unexpected format for categories:', result);
            throw new Error(result.error || 'Failed to fetch categories or unexpected format');
        }
    } catch (error) {
        console.error('Error fetching app categories:', error);
        // Return default categories if API fails
        return [
            { id: 'all', name: 'All' },
            { id: 'defi', name: 'DeFi' },
            { id: 'nft', name: 'NFT' },
            { id: 'wallet', name: 'Wallet' },
            { id: 'analytics', name: 'Analytics' },
            { id: 'trading', name: 'Trading' },
            { id: 'governance', name: 'Governance' }
        ];
    }
}

// Fetch apps with optional category filter
export async function fetchApps(category?: string): Promise<AppItem[]> {
    try {
        const endpoint = category && category !== 'all'
            ? `/apps?category=${encodeURIComponent(category)}`
            : '/apps';
        // Expect the response to be ApiResponse containing an array of AppItem
        const result = await apiRequest<ApiResponse<AppItem[]>>(endpoint);
        // Extract the array from the 'data' property
        if (result.status === 'success' && Array.isArray(result.data)) {
            return result.data;
        } else {
            console.error('API response error or unexpected format for apps:', result);
            throw new Error(result.error || 'Failed to fetch apps or unexpected format');
        }
    } catch (error) {
        console.error('Error fetching apps:', error);
        // Return empty array if API fails
        return [];
    }
}

// Install an app
export async function installApp(appId: string): Promise<InstallAppData> {
    try {
        // Expect the response to follow the ApiResponse structure with InstallAppData in 'data'
        const result = await apiRequest<ApiResponse<InstallAppData>>('/apps/install', {
            method: 'POST',
            body: JSON.stringify({ appId }),
        });

        if (result.status === 'success' && result.data) {
            // Return the entire data object { success, appId, message, installDate }
            return result.data;
        } else {
            console.error('API response error or unexpected format for install:', result);
            throw new Error(result.error || 'Install failed or unexpected format');
        }
    } catch (error) {
        console.error('Error installing app:', error);
        // Rethrow the error so the component can handle it (e.g., show an error message)
        throw error;
    }
}

// Uninstall an app
export async function uninstallApp(appId: string): Promise<UninstallAppData> {
    try {
        // Expect the response to follow the ApiResponse structure with UninstallAppData in 'data'
        // Assuming uninstall also returns a similar structure, adjust UninstallAppData if needed
        const result = await apiRequest<ApiResponse<UninstallAppData>>('/apps/uninstall', {
            method: 'POST',
            body: JSON.stringify({ appId }),
        });

        if (result.status === 'success' && result.data) {
            // Return the entire data object { success, appId, message }
            return result.data;
        } else {
            console.error('API response error or unexpected format for uninstall:', result);
            throw new Error(result.error || 'Uninstall failed or unexpected format');
        }
    } catch (error) {
        console.error('Error uninstalling app:', error);
        // Rethrow the error so the component can handle it (e.g., show an error message)
        throw error;
    }
}