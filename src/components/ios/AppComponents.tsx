import React, { ReactNode, lazy, Suspense, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    Calendar, Settings, Sliders, Image, Mail, Home, Search, SignalIcon,
} from 'lucide-react';

import { useTheme, toggleThemeDirectly } from '@/hooks/use-theme';
import { CASignalIcon } from './AppIcons';
import AppStoreComponent from '@/components/AppStore/AppStoreComponent';
// Import ChatPageProps from ChatPage
import type { ChatPageProps } from '@/pages/ChatPage';


// Lazy load WalletFinder component to improve performance
export const WalletFinderComponent = lazy(() => import('@/pages/WalletFinder').then(module => ({
    default: () => {
        // This is to display in a modal popup rather than a page-level component
        const { WalletFinder } = module;
        return <WalletFinder isModal={true} />;
    }
})));

// Lazy load Chat component
export const ChatComponent = (props: ChatPageProps) => lazy(() => import('@/pages/ChatPage').then(module => ({
    default: () => {
        // Load ChatPage component and set it to modal mode
        const { ChatPage } = module;
        return <ChatPage {...props} />;
    }
})));

// Lazy load CaSignal component
export const CaSignalComponent = lazy(() => import('@/pages/CaSignal').then(module => ({
    default: () => {
        // Load CaSignal component and set it to modal mode
        const { CaSignal } = module;
        return <CaSignal />;
    }
})));

// Lazy load SmartWallet component
export const SmartWalletComponent = lazy(() => import('@/pages/SmartWallet').then(module => ({
    default: () => {
        // Load SmartWallet component and set it to modal mode
        const { SmartWallet } = module;
        return <SmartWallet />;
    }
})));

// Lazy load AiTrade component
export const AiTradeComponent = lazy(() => import('@/pages/AiTrade').then(module => ({
    default: () => {
        // Load AiTrade component and set it to modal mode
        const { AiTrade } = module;
        return <AiTrade />;
    }
})));

export const HydraResearchComponent = lazy(() => import('@/pages/HydraResearch').then(module => ({
    default: () => {
        // Load HydraResearch component and set it to modal mode
        const { HydraResearch } = module;
        return <HydraResearch />;
    }
})));

export const SolRechargeComponent = lazy(() => import('@/pages/SolanaPaymentPage').then(module => ({
    default: () => {
        // Load SolanaPaymentPage component and set it to modal mode
        const { SolanaPaymentPage } = module;
        return <SolanaPaymentPage />;
    }
})));

export const AgentBuilderComponent = lazy(() => import('@/pages/AgentBuilder').then(module => ({
    default: () => {
        // Load AgentBuilder component and set it to modal mode
        const { AgentBuilder } = module;
        return <AgentBuilder />;
    }
})));

// Settings app component
export const SettingsApp = () => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <div className={cn(
            "h-full flex flex-col",
            isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        )}>
            <div className="border-b px-4 py-3 flex items-center justify-between dark:border-gray-700">
                <h1 className="text-lg font-semibold">Settings</h1>
                <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 p-4 overflow-auto">
                <div className={cn(
                    "rounded-lg mb-4 overflow-hidden border",
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                )}>
                    <div className={cn(
                        "p-4 flex items-center justify-between cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-800/50",
                        isDarkMode ? "bg-gray-800" : "bg-white"
                    )}>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                                <Sliders className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-medium">Appearance</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Choose light or dark theme</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-sm",
                                isDarkMode
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-gray-200 text-gray-700"
                            )}
                        >
                            {isDarkMode ? "Dark" : "Light"}
                        </button>
                    </div>
                </div>

                {/* Other settings items placeholder */}
                <div
                    className={cn(
                        "rounded-lg mb-4 p-4 border",
                        isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                    )}
                >
                    <div className="flex items-center">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                            "bg-blue-500"
                        )}>
                            <div className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium">Setting CA Analysis option</h3>
                            <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
                        </div>
                    </div>
                </div>
                <div
                    className={cn(
                        "rounded-lg mb-4 p-4 border",
                        isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                    )}
                >
                    <div className="flex items-center">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                            "bg-green-500"
                        )}>
                            <div className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium">Setting CA Signal option</h3>
                            <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
                        </div>
                    </div>
                </div>
                <div
                    className={cn(
                        "rounded-lg mb-4 p-4 border",
                        isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                    )}
                >
                    <div className="flex items-center">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                            "bg-amber-500"
                        )}>
                            <div className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium">Setting CA Signal option</h3>
                            <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Theme app component
export const ThemeApp = () => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <div className={cn(
            "h-full flex flex-col",
            isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        )}>
            <div className="border-b px-4 py-3 flex items-center justify-between dark:border-gray-700">
                <h1 className="text-lg font-semibold">Theme</h1>
                <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 p-4 overflow-auto">
                <div className={cn(
                    "rounded-lg mb-4 overflow-hidden border",
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                )}>
                    <div className={cn(
                        "p-4 flex items-center justify-between cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-800/50",
                        isDarkMode ? "bg-gray-800" : "bg-white"
                    )}>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                                <Sliders className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-medium">Appearance</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Choose light or dark theme</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-sm",
                                isDarkMode
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-gray-200 text-gray-700"
                            )}
                        >
                            {isDarkMode ? "Dark" : "Light"}
                        </button>
                    </div>
                </div>

                {/* Other settings items placeholder */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "rounded-lg mb-4 p-4 border",
                            isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                        )}
                    >
                        <div className="flex items-center">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                                ["bg-blue-500", "bg-green-500", "bg-amber-500"][i]
                            )}>
                                <div className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium">Setting option {i + 1}</h3>
                                <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Photos app component
export const PhotosApp = () => {
    const { isDarkMode } = useTheme();

    // Simulate photo data
    const photoItems = Array.from({ length: 12 }).map((_, i) => ({
        id: i.toString(),
        url: `https://source.unsplash.com/random/400x400?sig=${i}`,
        title: `Photo ${i + 1}`
    }));

    return (
        <div className={cn(
            "h-full flex flex-col",
            isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        )}>
            <div className="border-b px-4 py-3 flex items-center justify-between dark:border-gray-700">
                <h1 className="text-lg font-semibold">Photos</h1>
                <Image className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 p-4 overflow-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {photoItems.map((photo) => (
                        <div
                            key={photo.id}
                            className={cn(
                                "aspect-square rounded-lg overflow-hidden border",
                                isDarkMode ? "border-gray-700" : "border-gray-200"
                            )}
                        >
                            <img
                                src={photo.url}
                                alt={photo.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};