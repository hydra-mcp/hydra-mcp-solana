import React, { ReactNode, lazy, Suspense, useState, useEffect } from 'react';
import { WalletFinderIcon, SettingsIcon, MessagesIcon, PhotosIcon, HomeIcon, SearchIcon, CalendarIcon, MailIcon, SmartWalletIcon, DeepSearchIcon, RechargeIcon, ThemeIcon, AppStoreIcon, AgentBuilderIcon } from './AppIcons';
import { cn } from '@/lib/utils';
import {
    Calendar, Settings, Sliders, Image, Mail, Home, Search, SignalIcon,
    HelpCircle, Info, Puzzle, Lightbulb, BarChart3, Users, DollarSign, CreditCard, Activity,
    Code,
    Bug,
    BookOpen,
    Zap,
    Wallet,
    Shield,
    Download,
    Loader2,
    Star,
    Check,
    Package,
    Trash2,
    X,
    Store
} from 'lucide-react';
import { useTheme, toggleThemeDirectly } from '@/hooks/use-theme';
import { CASignalIcon } from './AppIcons';
import AppStoreComponent from '@/components/AppStore/AppStoreComponent';
// Import ChatPageProps from ChatPage
import type { ChatPageProps } from '@/pages/ChatPage';
import { CaSignalComponent, SmartWalletComponent, DeepSearchComponent, SolRechargeComponent, SettingsApp, ThemeApp, PhotosApp, WalletFinderComponent, ChatComponent, AgentBuilderComponent } from './AppComponents';

// Common loading placeholder component
export const LoadingPlaceholder = () => (
    <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
    </div>
);


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
    status?: 'online' | 'coming_soon';
    onIconClick?: () => void;
    suggestedQuestions?: {
        welcomeTitle?: string;
        welcomeDescription?: string;
        modules?: Array<{
            title: string;
            content: string;
            icon?: ReactNode;
        }>;
    };
    isDisabled?: boolean;
    group?: string;
}

export const defaultSize = { width: '80%', height: '85%' }

// define app group information
export interface AppGroup {
    id: string;
    title: string;
    icon: ReactNode;
    color: string;
    secondaryColor?: string;
    adaptiveWidth?: boolean; // whether to support adaptive width
    minWidth?: string; // minimum width
    maxWidth?: string; // maximum width
}

// app group configuration
export const appGroups: Record<string, AppGroup> = {
    walletTools: {
        id: 'walletTools',
        title: 'Wallet Analysis Tools',
        icon: <Wallet className="w-4 h-4 text-white" />,
        color: 'bg-blue-600',
        secondaryColor: 'bg-blue-500',
        adaptiveWidth: true,
        minWidth: '50%',
        maxWidth: '60%'
    },
    searchApps: {
        id: 'searchApps',
        title: 'Search & Applications',
        icon: <Search className="w-4 h-4 text-white" />,
        color: 'bg-purple-600',
        secondaryColor: 'bg-purple-500',
        adaptiveWidth: true,
        minWidth: '30%',
        maxWidth: '40%'
    },
    systemUtils: {
        id: 'systemUtils',
        title: 'System & Utilities',
        icon: <Settings className="w-4 h-4 text-white" />,
        color: 'bg-green-600',
        secondaryColor: 'bg-green-500',
        adaptiveWidth: true
    },
    installed: {
        id: 'installed',
        title: 'Installed Applications',
        icon: <Store className="w-4 h-4 text-white" />,
        color: 'bg-amber-600',
        secondaryColor: 'bg-amber-500',
        adaptiveWidth: true,
        minWidth: '60%',
        maxWidth: '100%'
    },
    userAgents: {
        id: 'userAgents',
        title: 'My Created Agents',
        icon: <Puzzle className="w-4 h-4 text-white" />,
        color: 'bg-indigo-600',
        secondaryColor: 'bg-indigo-500',
        adaptiveWidth: true,
        minWidth: '50%',
        maxWidth: '100%'
    }
}

// Create a registry of all available apps
export const appRegistry: Record<string, AppDefinition> = {
    walletFinder: {
        id: 'wallet-finder',
        path: '/wallet-finder',
        title: 'CA Analysis',
        icon: <WalletFinderIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                <WalletFinderComponent />
            </Suspense>
        ),
        defaultSize,
        description: 'Find the smart wallet of blockchain project.',
        status: 'online',
        group: 'walletTools'
    },
    caSignal: {
        id: 'ca-signal',
        path: '/ca-signal',
        title: 'CA Signal',
        icon: <CASignalIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                <CaSignalComponent />
            </Suspense>
        ),
        defaultSize,
        description: 'Based on the trading behavior of smart addresses on the chain, we will push project-related information.',
        status: 'coming_soon',
        group: 'walletTools',
        suggestedQuestions: {
            welcomeDescription: 'We will push the CA of relevant qualified projects in real time. Based on the trading behavior of smart addresses on the chain, we will push project-related information, such as: project CA, the number of smart addresses that have purchased the project, the average purchase amount of smart funds, market capitalization, number of holders, and other data, for users to reference whether to follow up and buy.',
            modules: [
                { title: 'Project CA', content: 'The CA of the project', icon: <CreditCard className="h-5 w-5" /> },
                { title: 'Number of Smart Addresses', content: 'The number of smart addresses that have purchased the project', icon: <Users className="h-5 w-5" /> },
                { title: 'Market Capitalization', content: 'The market capitalization of the project', icon: <BarChart3 className="h-5 w-5" /> },
                { title: 'Number of Holders', content: 'The number of holders of the project', icon: <Activity className="h-5 w-5" /> }
            ]
        }
    },
    smartWallet: {
        id: 'smart-wallet',
        path: '/smart-wallet',
        title: 'Smart Wallet',
        icon: <SmartWalletIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                <SmartWalletComponent />
            </Suspense>
        ),
        defaultSize,
        description: 'We will promptly push some smart addresses discovered on the chain to users, making it convenient for them to add these smart addresses to their monitoring system for future trading reference.',
        status: 'coming_soon',
        group: 'walletTools',
        suggestedQuestions: {
            welcomeDescription: 'We will promptly push some smart addresses discovered on the chain to users, making it convenient for them to add these smart addresses to their monitoring system for future trading reference.',
            modules: [
                { title: 'Smart Address', content: 'The smart address discovered on chain', icon: <CreditCard className="h-5 w-5" /> },
                { title: 'Transaction History', content: 'Recent transaction records of the smart address', icon: <Activity className="h-5 w-5" /> },
                { title: 'Portfolio Analysis', content: 'Current portfolio composition and performance', icon: <BarChart3 className="h-5 w-5" /> },
                { title: 'Trading Strategy', content: 'Trading patterns and strategies analysis', icon: <Lightbulb className="h-5 w-5" /> }
            ]
        }
    },
    deepSearch: {
        id: 'deep-search',
        path: '/deep-search',
        title: 'Deep Search',
        icon: <DeepSearchIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                <DeepSearchComponent />
            </Suspense>
        ),
        defaultSize,
        description: 'Advanced AI-powered code analysis and debugging tool for complex task execution and self-improvement.',
        status: 'coming_soon',
        group: 'searchApps',
        suggestedQuestions: {
            welcomeDescription: 'Our latest CODEACT feature testing window collects the HYDRA-CodeAct dataset for instruction tuning. The trained HYDRA-CodeAct can perform complex tasks and self-debug and improve.',
            modules: [
                { title: 'Code Analysis', content: 'Deep analysis of code structure and patterns', icon: <Code className="h-5 w-5" /> },
                { title: 'Debugging Assistant', content: 'AI-powered debugging and error resolution', icon: <Bug className="h-5 w-5" /> },
                { title: 'Performance Optimization', content: 'Code optimization and performance improvement suggestions', icon: <Zap className="h-5 w-5" /> },
                { title: 'Learning Assistant', content: 'Interactive learning and improvement guidance', icon: <BookOpen className="h-5 w-5" /> }
            ]
        }
    },
    appStore: {
        id: 'app-store',
        path: '/app-store',
        title: 'MCP App Store',
        icon: <AppStoreIcon />,
        component: <AppStoreComponent />,
        defaultSize,
        description: 'Explore and install the latest applications and tools for Hydra OS',
        status: 'online',
        group: 'searchApps',
        suggestedQuestions: {
            welcomeDescription: 'Welcome to the MCP App Store, where you can browse, download, and install the latest blockchain applications and tools.',
            modules: [
                { title: 'Application Classification', content: 'Browse applications by function category', icon: <Puzzle className="h-5 w-5" /> },
                { title: 'Top Recommendations', content: 'View the top applications loved by users', icon: <Star className="h-5 w-5" /> },
                { title: 'New Releases', content: 'Explore the latest released applications', icon: <Zap className="h-5 w-5" /> },
                { title: 'Application Management', content: 'Manage installed applications and updates', icon: <Settings className="h-5 w-5" /> }
            ]
        }
    },
    agentBuilder: {
        id: 'agent-builder',
        path: '/agent-builder',
        title: 'Agent Builder',
        icon: <AgentBuilderIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                <AgentBuilderComponent />
            </Suspense>
        ),
        defaultSize,
        description: 'Build your own agent with the help of AI',
        status: 'online',
        group: 'searchApps',
        suggestedQuestions: {
            welcomeDescription: 'Build your own agent with the help of AI',
            modules: [
                { title: 'Agent Builder', content: 'Build your own agent with the help of AI', icon: <Code className="h-5 w-5" /> }
            ]
        }
    },
    solRecharge: {
        id: 'sol-recharge',
        path: '/sol-recharge',
        title: 'Recharge',
        icon: <RechargeIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                <SolRechargeComponent />
            </Suspense>
        ),
        defaultSize,
        description: 'Convenient SOL token recharge service with real-time transaction monitoring and secure wallet integration.',
        status: 'online',
        group: 'systemUtils',
        suggestedQuestions: {
            welcomeDescription: 'Welcome to SOL Recharge service. We provide secure and efficient SOL token recharge with real-time transaction monitoring.',
            modules: [
                { title: 'Wallet Integration', content: 'Secure connection with Phantom wallet for seamless transactions', icon: <Wallet className="h-5 w-5" /> },
                { title: 'Transaction History', content: 'View and track all your SOL recharge transactions', icon: <Activity className="h-5 w-5" /> },
                { title: 'Balance Management', content: 'Monitor your SOL balance and transaction limits', icon: <BarChart3 className="h-5 w-5" /> },
                { title: 'Security Features', content: 'Advanced security measures for safe transactions', icon: <Shield className="h-5 w-5" /> }
            ]
        }
    },
    settings: {
        id: 'settings',
        path: '/settings',
        title: 'Settings',
        icon: <SettingsIcon />,
        component: <SettingsApp />,
        defaultSize,
        description: 'Change your settings',
        status: 'online',
        group: 'systemUtils'
    },
    theme: {
        id: 'theme',
        path: '/theme',
        title: 'Theme',
        icon: <ThemeIcon />,
        component: <ThemeApp />,
        defaultSize,
        description: 'Change your theme',
        status: 'online',
        onIconClick: toggleThemeDirectly,
        group: 'systemUtils'
    },
    messages: {
        id: 'messages',
        path: '/chat',
        title: 'Messages',
        icon: <MessagesIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                {/* Pass proper ChatPageProps to ChatComponent */}
                {React.createElement(ChatComponent({ appId: '' }))}
            </Suspense>
        ),
        defaultSize,
        description: 'Chat with Hydra AI',
        status: 'online',
        group: 'systemUtils',
        suggestedQuestions: {
            welcomeTitle: 'Welcome to Hydra OS',
            welcomeDescription: 'You can access all apps through the desktop or Dock bar.',
            modules: [
                { title: 'Ask a Question', content: 'Ask a question to get started', icon: <HelpCircle className="h-5 w-5" /> },
                { title: 'Get Information', content: 'Get information about blockchain projects', icon: <Info className="h-5 w-5" /> },
                { title: 'Solve Problems', content: 'Solve problems related to blockchain projects', icon: <Puzzle className="h-5 w-5" /> },
                { title: 'Get Recommendations', content: 'Get recommendations for blockchain projects', icon: <Lightbulb className="h-5 w-5" /> }
            ]
        }
    },
    // photos: {
    //     id: 'photos',
    //     path: '/photos',
    //     title: 'Photos',
    //     icon: <PhotosIcon />,
    //     component: <PhotosApp />,
    //     defaultSize: { width: '75%', height: '65%' },
    //     description: 'View your photos'
    // },
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
        description: 'Home',
        status: 'online'
    },
    // search: {
    //     id: 'search',
    //     path: '/search',
    //     title: 'Search',
    //     icon: <SearchIcon />,
    //     component: (
    //         <div className="p-4 h-full flex flex-col items-center justify-center">
    //             <Search className="w-16 h-16 text-blue-500 mb-4" />
    //             <h2 className="text-xl font-bold mb-2">Search App</h2>
    //             <div className="w-full max-w-md">
    //                 <div className="relative">
    //                     <input
    //                         type="text"
    //                         placeholder="Search files or apps..."
    //                         className="w-full px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
    //                     />
    //                     <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
    //                 </div>
    //             </div>
    //         </div>
    //     ),
    //     defaultSize: { width: '50%', height: '45%' },
    //     description: 'Search for files or apps'
    // },
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
        description: 'View your calendar',
        status: 'online',
        group: 'systemUtils'
    },
    // mail: {
    //     id: 'mail',
    //     path: '/mail',
    //     title: 'Mail',
    //     icon: <MailIcon />,
    //     component: (
    //         <div className="h-full flex flex-col bg-white dark:bg-gray-900">
    //             <div className="border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
    //                 <h1 className="text-lg font-semibold">Mail</h1>
    //                 <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
    //             </div>
    //             <div className="flex-1 flex">
    //                 <div className="w-1/4 border-r dark:border-gray-700 p-2">
    //                     <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium mb-2">Inbox</div>
    //                     <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">Sent</div>
    //                     <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">Deleted</div>
    //                     <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">Drafts</div>
    //                 </div>
    //                 <div className="w-3/4 p-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
    //                     Select an email to view content
    //                 </div>
    //             </div>
    //         </div>
    //     ),
    //     defaultSize: { width: '70%', height: '75%' },
    //     description: 'Check your email'
    // }


}; 