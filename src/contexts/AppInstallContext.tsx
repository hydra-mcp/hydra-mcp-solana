import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchApps, installApp, uninstallApp, AppItem } from '@/lib/appStoreService';

interface AppInstallContextType {
    installedApps: AppItem[];
    refreshInstalledApps: () => Promise<AppItem[]>;
    installAppAndRefresh: (appId: string) => Promise<boolean>;
    uninstallAppAndRefresh: (appId: string) => Promise<boolean>;
    isLoading: boolean;
}

const AppInstallContext = createContext<AppInstallContextType | null>(null);

export function AppInstallProvider({ children }: { children: ReactNode }) {
    const [installedApps, setInstalledApps] = useState<AppItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refreshInstalledApps = async (): Promise<AppItem[]> => {
        setIsLoading(true);
        try {
            const appsData = await fetchApps();
            const installed = appsData.filter(app => app.installed);
            setInstalledApps(installed);
            return installed;
        } catch (error) {
            console.error('Error fetching installed apps:', error);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    const installAppAndRefresh = async (appId: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const result = await installApp(appId);
            if (result.success) {
                await refreshInstalledApps();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error installing app:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const uninstallAppAndRefresh = async (appId: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const result = await uninstallApp(appId);
            if (result.success) {
                await refreshInstalledApps();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error uninstalling app:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch of installed apps
    useEffect(() => {
        refreshInstalledApps();
    }, []);

    return (
        <AppInstallContext.Provider value={{
            installedApps,
            refreshInstalledApps,
            installAppAndRefresh,
            uninstallAppAndRefresh,
            isLoading
        }}>
            {children}
        </AppInstallContext.Provider>
    );
}

export function useAppInstall() {
    const context = useContext(AppInstallContext);
    if (!context) {
        throw new Error('useAppInstall must be used within an AppInstallProvider');
    }
    return context;
} 