import React, { ReactNode, lazy, Suspense } from 'react';
import { WalletFinderIcon, SettingsIcon, MessagesIcon, PhotosIcon, HomeIcon, SearchIcon, CalendarIcon, MailIcon } from './AppIcons';
import { cn } from '@/lib/utils';
import { Calendar, Settings, Sliders, Image, Mail, Home, Search } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

// Common loading placeholder component
const LoadingPlaceholder = () => (
    <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
    </div>
);

// Lazy load WalletFinder component to improve performance
const WalletFinderComponent = lazy(() => import('@/pages/WalletFinder').then(module => ({
    default: () => {
        // This is to display in a modal popup rather than a page-level component
        const { WalletFinder } = module;
        return <WalletFinder isModal={true} />;
    }
})));

// Lazy load Chat component
const ChatComponent = lazy(() => import('@/pages/ChatPage').then(module => ({
    default: () => {
        // Load ChatPage component and set it to modal mode
        const { ChatPage } = module;
        return <ChatPage isModal={true} />;
    }
})));

// Settings app component
const SettingsApp = () => {
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
const PhotosApp = () => {
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

// App definitions
export interface AppDefinition {
    id: string;
    path: string;
    title: string;
    icon: ReactNode;
    component: ReactNode;
    defaultSize: {
        width: number | string;
        height: number | string;
    };
    defaultPosition?: { x: number; y: number };
    description?: string;
}

const defaultSize = { width: '80%', height: '80%' }

// Create a registry of all available apps
export const appRegistry: Record<string, AppDefinition> = {
    walletFinder: {
        id: 'wallet-finder',
        path: '/wallet-finder',
        title: 'Wallet Finder',
        icon: <WalletFinderIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                <WalletFinderComponent />
            </Suspense>
        ),
        defaultSize,
        description: 'Find the smart wallet of blockchain project.'
    },
    settings: {
        id: 'settings',
        path: '/settings',
        title: 'Settings',
        icon: <SettingsIcon />,
        component: <SettingsApp />,
        defaultSize,
        description: 'Change your settings'
    },
    messages: {
        id: 'messages',
        path: '/chat',
        title: 'Messages',
        icon: <MessagesIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                <ChatComponent />
            </Suspense>
        ),
        defaultSize,
        description: 'Chat with your friends'
    },
    photos: {
        id: 'photos',
        path: '/photos',
        title: 'Photos',
        icon: <PhotosIcon />,
        component: <PhotosApp />,
        defaultSize: { width: '75%', height: '65%' },
        description: 'View your photos'
    },
    home: {
        id: 'home',
        path: '/',
        title: 'Home',
        icon: <HomeIcon />,
        component: (
            <div className="p-4 h-full flex flex-col items-center justify-center">
                <Home className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Home App</h2>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    Welcome to Hydra OS, you can access all apps through the desktop or Dock bar.
                </p>
            </div>
        ),
        defaultSize: { width: '60%', height: '50%' },
        description: 'Home'
    },
    search: {
        id: 'search',
        path: '/search',
        title: 'Search',
        icon: <SearchIcon />,
        component: (
            <div className="p-4 h-full flex flex-col items-center justify-center">
                <Search className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Search App</h2>
                <div className="w-full max-w-md">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search files or apps..."
                            className="w-full px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </div>
        ),
        defaultSize: { width: '50%', height: '45%' },
        description: 'Search for files or apps'
    },
    calendar: {
        id: 'calendar',
        path: '/calendar',
        title: 'Calendar',
        icon: <CalendarIcon />,
        component: (
            <div className="h-full flex flex-col bg-white dark:bg-gray-900">
                <div className="border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                    <h1 className="text-lg font-semibold">Calendar</h1>
                    <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 p-4 flex flex-col items-center justify-center">
                    <Calendar className="w-16 h-16 text-blue-500 mb-4" />
                    <h2 className="text-xl font-bold">
                        {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {new Date().toLocaleDateString('zh-CN', { weekday: 'long' })}
                    </p>
                </div>
            </div>
        ),
        defaultSize: { width: '65%', height: '70%' },
        description: 'View your calendar'
    },
    mail: {
        id: 'mail',
        path: '/mail',
        title: 'Mail',
        icon: <MailIcon />,
        component: (
            <div className="h-full flex flex-col bg-white dark:bg-gray-900">
                <div className="border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                    <h1 className="text-lg font-semibold">Mail</h1>
                    <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 flex">
                    <div className="w-1/4 border-r dark:border-gray-700 p-2">
                        <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium mb-2">Inbox</div>
                        <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">Sent</div>
                        <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">Deleted</div>
                        <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">Drafts</div>
                    </div>
                    <div className="w-3/4 p-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        Select an email to view content
                    </div>
                </div>
            </div>
        ),
        defaultSize: { width: '70%', height: '75%' },
        description: 'Check your email'
    }
}; 