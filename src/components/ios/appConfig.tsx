import React, { ReactNode, lazy, Suspense, useState, useEffect } from 'react';
import { WalletFinderIcon, SettingsIcon, MessagesIcon, PhotosIcon, HomeIcon, SearchIcon, CalendarIcon, MailIcon, SmartWalletIcon, RechargeIcon, ThemeIcon, AppStoreIcon, AgentBuilderIcon, AiTradeIcon, HydraResearchIcon } from './AppIcons';
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
    Store,
    Clock,
    Bot,
    FileText,
    Bell,
    Eye
} from 'lucide-react';
import { useTheme, toggleThemeDirectly } from '@/hooks/use-theme';
import { CASignalIcon } from './AppIcons';
import AppStoreComponent from '@/components/AppStore/AppStoreComponent';
// Import ChatPageProps from ChatPage
import type { ChatPageProps } from '@/pages/ChatPage';
import { CaSignalComponent, SmartWalletComponent, HydraResearchComponent, SolRechargeComponent, SettingsApp, ThemeApp, PhotosApp, WalletFinderComponent, ChatComponent, AgentBuilderComponent, AiTradeComponent } from './AppComponents';

// Common loading placeholder component
export const LoadingPlaceholder = () => (
    <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
    </div>
);

export enum AppType {
    MCP = 'mcp',
    Agent = 'agent',
    System = 'system',
    Pro = "pro",
    Other = 'other'
}


// App definitions
export interface AppDefinition {
    id: string;
    path: string;
    title: string;
    icon: string | ReactNode;
    component: ReactNode;
    appType: AppType;
    defaultSize: {
        width: number | string;
        height: number | string;
    };
    defaultPosition?: { x: number; y: number };
    description?: string;
    category?: string;
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
    isHot?: boolean;
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
    agent: {
        id: 'agent',
        title: 'Agent',
        icon: <Puzzle className="w-4 h-4 text-white" />,
        color: 'bg-blue-600',
        secondaryColor: 'bg-blue-500',
        adaptiveWidth: true,
    },
    walletTools: {
        id: 'walletTools',
        title: 'HYDRAAI Analysis',
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
        appType: AppType.Pro,
        path: '/wallet-finder',
        title: 'CA Analysis',
        icon: <WalletFinderIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                <WalletFinderComponent />
            </Suspense>
        ),
        defaultSize,
        description: 'AI self-feedback learning method searches for the specified smart contract address.',
        status: 'online',
        group: 'walletTools',
        suggestedQuestions: {
            welcomeDescription: `Search for smart addresses under trending projects by simply sending the project's CA and wait for AI to provide the search results. Currently, only the SOLANA chain is supported, with future support for BSC/BASE/ETH and more. Each query consumes one POINT, priced at 0.01SOL per POINT, and rechargeable.`,
            modules: [
                {
                    title: 'Early Access Offer',
                    content: 'During the beta period, each query only costs 0.01 SOL. Recharge is supported, accepting both SOL and HDOS.',
                    icon: <DollarSign className="h-5 w-5" />
                },
                {
                    title: 'Smart Address Search',
                    content: 'Simply enter the project\'s CA and let HYDRAAI find its smart addresses.',
                    icon: <Search className="h-5 w-5" />
                },
                {
                    title: 'Insider Address Search',
                    content: 'Discover early insider addresses of a project for easier future transaction tracking.',
                    icon: <Wallet className="h-5 w-5" />
                },
                {
                    title: 'Address Ranking',
                    content: 'Categorize different smart addresses based on risk appetite, transaction frequency, and more.',
                    icon: <BarChart3 className="h-5 w-5" />
                }
            ]
        }
    },
    caSignal: {
        id: 'ca-signal',
        appType: AppType.Pro,

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
                {
                    title: 'Trading Trends',
                    content: 'Real-time monitoring of smart money trading trends, AI analysis of the best trading projects.',
                    icon: <Activity className="h-5 w-5" />
                },
                {
                    title: 'Signal Notifications',
                    content: 'Once AI detects high-quality trending projects, it will push the relevant project CA in real-time.',
                    icon: <SignalIcon className="h-5 w-5" />
                },
                {
                    title: 'Project Info',
                    content: 'Number of active smart addresses, average position size of smart addresses, and more.',
                    icon: <Info className="h-5 w-5" />
                },
                {
                    title: 'Trend Alerts',
                    content: 'Immediate notification of sudden changes in trending projects, capturing hot information in real-time.',
                    icon: <Zap className="h-5 w-5" />
                }
            ]
        }
    },
    smartWallet: {
        id: 'smart-wallet',
        appType: AppType.Pro,
        path: '/smart-wallet',
        title: 'Smart Address',
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
                {
                    title: 'Real-time Updates',
                    content: 'HYDRA will provide real-time updates on the most profitable smart addresses and analysis reports.',
                    icon: <Activity className="h-5 w-5" />
                },
                {
                    title: 'Pattern Analysis',
                    content: 'HYDRAAI performs 24-hour smart money transaction pattern analysis and learning.',
                    icon: <BarChart3 className="h-5 w-5" />
                },
                {
                    title: 'Transaction Alerts',
                    content: 'Real-time updates and notifications of on-chain transaction behaviors from smart addresses.',
                    icon: <Bell className="h-5 w-5" />
                },
                {
                    title: 'Insider Addresses',
                    content: 'Notification of relevant insider trading addresses for easy user tracking.',
                    icon: <Eye className="h-5 w-5" />
                }
            ]
        }
    },
    aiTrade: {
        id: 'ai-trade',
        appType: AppType.Pro,
        path: '/ai-trade',
        title: 'AI Trade',
        icon: <AiTradeIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                <AiTradeComponent />
            </Suspense>
        ),
        defaultSize,
        description: 'AI-powered trading assistant for complex task execution and self-improvement.',
        status: 'coming_soon',
        group: 'walletTools',
        suggestedQuestions: {
            welcomeDescription: "Through extensive preliminary training and learning, HYDRA AI has developed the capability to search for smart addresses across numerous on-chain projects. It simultaneously learns and establishes a neural network model for the transaction patterns of these smart addresses, attempting to autonomously execute trades. It continuously monitors and verifies transactions, capturing on-chain trading opportunities and executing buy-sell operations 24/7 based on users' risk preferences.",
            modules: [
                {
                    title: 'Cruise Mode',
                    content: '24-hour continuous search for on-chain opportunities, with record-keeping and pattern learning.',
                    icon: <Clock className="h-5 w-5" />
                },
                {
                    title: 'Trading Assistant',
                    content: 'Tell HYDRA AI what type of trading pattern to follow, whether early projects or trending projects.',
                    icon: <Bot className="h-5 w-5" />
                },
                {
                    title: 'Trading Reports',
                    content: 'Summary of trending projects within a specified recent timeframe, with immediate risk assessment for trading.',
                    icon: <FileText className="h-5 w-5" />
                },
                {
                    title: 'Trending Alerts',
                    content: 'Voice message alerts for sudden trending projects.',
                    icon: <Bell className="h-5 w-5" />
                }
            ]
        }
    },
    hydraResearch: {
        id: 'hydra-research',
        appType: AppType.System,
        path: '/hydra-research',
        title: 'Hydra Research',
        icon: <HydraResearchIcon />,
        component: (
            <Suspense fallback={<LoadingPlaceholder />}>
                <HydraResearchComponent />
            </Suspense>
        ),
        defaultSize,
        description: 'An information aggregation MCP intelligent AGENT in testing, continuously evolving and learning.',
        status: 'online',
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
        appType: AppType.System,

        path: '/app-store',
        title: 'MCP App Store',
        icon: <AppStoreIcon />,
        component: <AppStoreComponent />,
        defaultSize,
        description: 'Using HYDRAMCP allows you to experience all relevant MCP services on the market.',
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
        appType: AppType.System,
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
        group: 'agent',
        isHot: true,
        suggestedQuestions: {
            welcomeDescription: 'Build your own agent with the help of AI',
            modules: [
                { title: 'Agent Builder', content: 'Build your own agent with the help of AI', icon: <Code className="h-5 w-5" /> }
            ]
        }
    },
    solRecharge: {
        id: 'sol-recharge',
        appType: AppType.System,
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
        appType: AppType.System,
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
        appType: AppType.System,
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
    // messages: {
    //     id: 'messages',
    //     appType: AppType.System,
    //     path: '/chat',
    //     title: 'Messages',
    //     icon: <MessagesIcon />,
    //     component: (
    //         <Suspense fallback={<LoadingPlaceholder />}>
    //             {/* Pass proper ChatPageProps to ChatComponent */}
    //             {React.createElement(ChatComponent({ appId: 'message', appType: AppType.System }))}
    //         </Suspense>
    //     ),
    //     defaultSize,
    //     description: 'System message center, you can receive system messages here.',
    //     status: 'online',
    //     group: 'systemUtils',
    //     suggestedQuestions: {
    //         welcomeTitle: 'Welcome to Hydra OS',
    //         welcomeDescription: 'You can access all apps through the desktop or Dock bar.',
    //         modules: [
    //             { title: 'Ask a Question', content: 'Ask a question to get started', icon: <HelpCircle className="h-5 w-5" /> },
    //             { title: 'Get Information', content: 'Get information about blockchain projects', icon: <Info className="h-5 w-5" /> },
    //             { title: 'Solve Problems', content: 'Solve problems related to blockchain projects', icon: <Puzzle className="h-5 w-5" /> },
    //             { title: 'Get Recommendations', content: 'Get recommendations for blockchain projects', icon: <Lightbulb className="h-5 w-5" /> }
    //         ]
    //     }
    // },
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
        appType: AppType.System,
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
        appType: AppType.System,
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