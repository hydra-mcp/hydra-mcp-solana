import React, { Suspense, ReactNode, createElement } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { appRegistry, AppType } from '@/components/ios/appConfig';
import { ChatComponent } from '@/components/ios/AppComponents';
import { AppItem } from '@/lib/appStoreService';

/**
 * Creates an app icon element based on the app data
 * 
 * @param app The app data
 * @returns ReactNode representing the app icon
 */
function createAppIcon(app: AppItem): ReactNode {
    if (app.icon) {
        // Create icon with image
        return createElement('div', {
            className: "w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center",
            children: [
                createElement('img', {
                    src: app.icon,
                    alt: app.name,
                    className: "w-full h-full object-cover rounded-xl",
                    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }
                }),
                createElement('div', {
                    className: cn("text-2xl text-white font-bold hidden"),
                    children: app.name.substring(0, 1)
                })
            ]
        });
    } else {
        // Create icon with letter
        return createElement('div', {
            className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl",
            children: createElement('span', {
                className: "text-white text-3xl font-bold",
                children: app.name.substring(0, 1)
            })
        });
    }
}

/**
 * Registers an app in the appRegistry if it's not already registered.
 * This utility function ensures consistent app registration across different components.
 * 
 * @param app The app data from the API
 * @returns The app ID that can be used with createAppWindow
 */
export function registerAppIfNeeded(app: AppItem): string {
    const appId = app.id;
    const appPath = `/app/${appId}`;

    // Only register if not already in the registry
    if (!appRegistry[appId]) {
        appRegistry[appId] = {
            id: appId,
            title: app.name,
            appType: AppType.MCP,
            path: appPath,
            icon: createAppIcon(app),
            component: createElement(
                Suspense,
                {
                    fallback: createElement('div', {
                        className: "flex items-center justify-center h-full",
                        children: createElement(Loader2, {
                            className: "w-8 h-8 text-blue-500 animate-spin"
                        })
                    })
                },
                React.createElement(ChatComponent({ appId, appType: AppType.MCP }))
            ),
            defaultSize: { width: '80%', height: '85%' },
            description: app.description,
            group: 'installed',
            isDisabled: app.is_disabled
        };
    }

    return appId;
}

/**
 * Gets an app icon component based on app data
 * 
 * @param app The app data to generate an icon for
 * @returns A React component representing the app icon
 */
export function getAppIcon(app: AppItem): ReactNode {
    return createAppIcon(app);
} 