import React, { useState, useEffect, Suspense } from 'react';
import {
    Download, Loader2, Check, Package, Trash2, Star, ExternalLink,
    AlertCircle, Clock, Shield, MessageSquare
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import {
    fetchAppCategories,
    fetchApps,
    AppCategory,
    AppItem,
} from '@/lib/appStoreService';
import { useAppInstall } from '@/contexts/AppInstallContext';
import { useAppWindow } from '@/contexts/AppWindowContext';
import { createAppWindow } from '@/components/ios/AppRegistry';
import { AppType } from '@/components/ios/appConfig';
import { registerAppIfNeeded } from '@/lib/appRegistryUtils';
import { motion } from 'framer-motion';

interface AppStoreComponentProps {
    title?: string;
    className?: string;
    onAppClick?: (app: AppItem) => void;
}

const AppStoreComponent: React.FC<AppStoreComponentProps> = ({
    title = "MCP App Store",
    className,
    onAppClick
}) => {
    const { isDarkMode } = useTheme();
    const {
        installedApps: contextInstalledApps,
        installAppAndRefresh,
        uninstallAppAndRefresh,
        isLoading: contextLoading
    } = useAppInstall();
    const { openApp, closeApp, activeWindowId } = useAppWindow();
    const [apps, setApps] = useState<AppItem[]>([]);
    const [categories, setCategories] = useState<AppCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [installingApps, setInstallingApps] = useState<string[]>([]);
    const [uninstallingApps, setUninstallingApps] = useState<string[]>([]);
    const [installedApps, setInstalledApps] = useState<string[]>([]);
    const [showConfirmUninstall, setShowConfirmUninstall] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch categories on component mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const categoriesData = await fetchAppCategories();
                setCategories(categoriesData);
            } catch (err) {
                setError('Failed to load categories');
                console.error(err);
            }
        };

        loadCategories();
    }, []);

    // Fetch apps and derive installed status from the response
    useEffect(() => {
        const loadAppsData = async () => {
            setLoading(true);
            setError(null);
            setApps([]); // Clear previous apps while loading new category
            setInstalledApps([]); // Clear installed state

            try {
                // Load apps based on selected category
                const appsData = await fetchApps(selectedCategory);
                setApps(appsData.app_list);

                // Derive installed apps directly from the appsData response
                const initiallyInstalled = appsData.app_list
                    .filter(app => app.installed)
                    .map(app => app.id);
                setInstalledApps(initiallyInstalled);

            } catch (err) {
                setError('Failed to load apps data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadAppsData();
    }, [selectedCategory]);

    // Handle app installation
    const handleInstall = async (appId: string) => {
        // Find the app to check its audit status
        const appToInstall = apps.find(app => app.id === appId);

        // Prevent installation if app is not approved
        if (appToInstall?.audit_status && appToInstall.audit_status !== 'approved') {
            setError(`This app cannot be installed because it is ${appToInstall.audit_status === 'pending' ? 'pending approval' : 'rejected'}.`);
            return;
        }

        setInstallingApps(prev => [...prev, appId]);

        try {
            const success = await installAppAndRefresh(appId);

            if (success) {
                // Update local state
                setInstalledApps(prev => [...prev, appId]);
                setApps(prevApps => prevApps.map(app =>
                    app.id === appId ? { ...app, installed: true } : app
                ));
            } else {
                throw new Error('Installation failed');
            }
        } catch (err) {
            console.error('Error installing app:', err);
            setError('Failed to install app. Please try again.');
        } finally {
            setInstallingApps(prev => prev.filter(id => id !== appId));
        }
    };

    // Handle app uninstallation
    const handleUninstall = async (appId: string) => {
        setShowConfirmUninstall(null);
        setUninstallingApps(prev => [...prev, appId]);

        try {
            const success = await uninstallAppAndRefresh(appId);

            if (success) {
                // Update local state
                setInstalledApps(prev => prev.filter(id => id !== appId));
                setApps(prevApps => prevApps.map(app =>
                    app.id === appId ? { ...app, installed: false, installDate: null } : app
                ));
            } else {
                throw new Error('Uninstallation failed');
            }
        } catch (err) {
            console.error('Error uninstalling app:', err);
            setError('Failed to uninstall app. Please try again.');
        } finally {
            setUninstallingApps(prev => prev.filter(id => id !== appId));
        }
    };

    // Open chat window with app
    const handleOpenAppChat = (e: React.MouseEvent, appId: string) => {
        e.stopPropagation();

        // Find the app from our list of apps
        const app = apps.find(app => app.id === appId);
        if (!app) return;

        // Register the app in appRegistry if needed
        registerAppIfNeeded(app);

        // Create app window and open it
        const appWindow = createAppWindow(appId);
        if (appWindow) {
            openApp(appWindow);

            // Close the current App Store window if it's active
            if (activeWindowId) {
                closeApp(activeWindowId);
            }
        } else {
            console.error(`Could not create window for app: ${appId}`);
        }
    };

    return (
        <div className={cn(
            "h-full flex flex-col",
            isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900",
            className
        )}>
            <div className="border-b px-4 py-3 flex items-center justify-between dark:border-gray-700">
                <h1 className="text-lg font-semibold">{title}</h1>
                <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>

            {/* Categories */}
            <div className="px-4 py-3 border-b dark:border-gray-700">
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap",
                                selectedCategory === category.id
                                    ? isDarkMode
                                        ? "bg-blue-600 text-white"
                                        : "bg-blue-500 text-white"
                                    : isDarkMode
                                        ? "bg-gray-800 text-gray-300"
                                        : "bg-gray-200 text-gray-700"
                            )}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className={cn(
                    "m-4 p-3 rounded-lg border text-center",
                    isDarkMode
                        ? "bg-red-900/20 border-red-800 text-red-200"
                        : "bg-red-50 border-red-200 text-red-600"
                )}>
                    {error}
                </div>
            )}

            {/* App List */}
            <div className="flex-1 p-4 overflow-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading apps...</p>
                    </div>
                ) : apps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Package className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No apps found in this category</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {apps.map(app => (
                            <div
                                key={app.id}
                                onClick={() => onAppClick && onAppClick(app)}
                                className={cn(
                                    "rounded-lg p-4 border flex items-start relative",
                                    onAppClick && "cursor-pointer",
                                    isDarkMode ? "border-gray-700 bg-gray-800 hover:bg-gray-750" : "border-gray-200 bg-white hover:bg-gray-50"
                                )}
                            >
                                {/* Uninstall confirmation dialog */}
                                {showConfirmUninstall === app.id && (
                                    <div className={cn(
                                        "absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10 rounded-lg",
                                        isDarkMode ? "bg-gray-900/80" : "bg-gray-100/80"
                                    )}>
                                        <div
                                            className={cn(
                                                "p-4 rounded-lg shadow-lg w-5/6 border",
                                                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                                            )}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <h4 className="font-medium mb-3">Uninstall {app.name}?</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                This will remove the app from your device.
                                            </p>
                                            <div className="flex justify-end gap-2 mt-4">
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full text-sm font-medium",
                                                        isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowConfirmUninstall(null);
                                                    }}
                                                >
                                                    Cancel
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    className="px-3 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium shadow-sm hover:shadow-md"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUninstall(app.id);
                                                    }}
                                                >
                                                    Uninstall
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 mr-4 flex items-center justify-center">
                                    {/* App icon */}
                                    {app.icon ? (
                                        <img
                                            src={app.icon}
                                            alt={app.name}
                                            className="w-full h-full object-cover rounded-xl"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={cn("text-3xl text-white font-bold", app.icon ? "hidden" : "")}>
                                        {app.name.substring(0, 1)}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center">
                                            <h3 className="font-medium">{app.name}</h3>
                                            {app.audit_status && app.audit_status !== 'approved' && (
                                                <div className={cn(
                                                    "ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                                    app.audit_status === 'pending'
                                                        ? isDarkMode ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800/30" : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                                        : isDarkMode ? "bg-red-900/30 text-red-400 border border-red-800/30" : "bg-red-100 text-red-800 border border-red-200"
                                                )}>
                                                    {app.audit_status === 'pending' ? (
                                                        <>
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            Pending
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Rejected
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            {app.audit_status === 'approved' && (
                                                <div className={cn(
                                                    "ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                                    isDarkMode ? "bg-green-900/30 text-green-400 border border-green-800/30" : "bg-green-100 text-green-800 border border-green-200"
                                                )}>
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Approved
                                                </div>
                                            )}
                                        </div>
                                        <div onClick={e => e.stopPropagation()}>
                                            {uninstallingApps.includes(app.id) ? (
                                                <div className="flex items-center gap-1">
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="relative w-10 h-10"
                                                    >
                                                        <svg className="w-10 h-10" viewBox="0 0 36 36">
                                                            <circle
                                                                cx="18"
                                                                cy="18"
                                                                r="16"
                                                                fill="none"
                                                                className={cn(
                                                                    "stroke-current stroke-[2.5]",
                                                                    isDarkMode ? "text-gray-700" : "text-gray-200"
                                                                )}
                                                            />
                                                            <motion.circle
                                                                cx="18"
                                                                cy="18"
                                                                r="16"
                                                                fill="none"
                                                                className="stroke-red-500 stroke-[2.5]"
                                                                strokeLinecap="round"
                                                                strokeDasharray="100"
                                                                initial={{ strokeDashoffset: 100 }}
                                                                animate={{ strokeDashoffset: 0 }}
                                                                transition={{
                                                                    duration: 1.5,
                                                                    ease: "easeInOut",
                                                                    repeat: Infinity,
                                                                }}
                                                                style={{
                                                                    transformOrigin: 'center',
                                                                    transform: 'rotate(-90deg)'
                                                                }}
                                                            />
                                                        </svg>
                                                        <motion.div
                                                            className="absolute inset-0 flex items-center justify-center"
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <div className={cn(
                                                                "w-6 h-6 flex items-center justify-center rounded-full",
                                                                isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"
                                                            )}>
                                                                <span className="text-xs">...</span>
                                                            </div>
                                                        </motion.div>
                                                    </motion.div>
                                                </div>
                                            ) : installingApps.includes(app.id) ? (
                                                <div className="flex items-center gap-1">
                                                    <div className="relative w-10 h-10">
                                                        <svg className="w-10 h-10" viewBox="0 0 36 36">
                                                            <circle
                                                                cx="18"
                                                                cy="18"
                                                                r="16"
                                                                fill="none"
                                                                className={cn(
                                                                    "stroke-current stroke-[2.5]",
                                                                    isDarkMode ? "text-gray-700" : "text-gray-200"
                                                                )}
                                                            />
                                                            <motion.circle
                                                                cx="18"
                                                                cy="18"
                                                                r="16"
                                                                fill="none"
                                                                className="stroke-blue-500 stroke-[2.5]"
                                                                strokeLinecap="round"
                                                                strokeDasharray="100"
                                                                initial={{ strokeDashoffset: 100 }}
                                                                animate={{ strokeDashoffset: 0 }}
                                                                transition={{
                                                                    duration: 1.5,
                                                                    ease: "easeInOut",
                                                                    repeat: Infinity,
                                                                }}
                                                                style={{
                                                                    transformOrigin: 'center',
                                                                    transform: 'rotate(-90deg)'
                                                                }}
                                                            />
                                                        </svg>
                                                        <motion.div
                                                            className="absolute inset-0 flex items-center justify-center"
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <div className={cn(
                                                                "w-6 h-6 flex items-center justify-center rounded-full",
                                                                isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"
                                                            )}>
                                                                <span className="text-xs">...</span>
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                </div>
                                            ) : installedApps.includes(app.id) ? (
                                                <div className="flex items-center gap-2">
                                                    <motion.div
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                        className="flex items-center"
                                                    >
                                                        <button
                                                            className={cn(
                                                                "px-4 py-1.5 rounded-full text-sm font-medium",
                                                                isDarkMode
                                                                    ? "bg-gray-700 text-gray-300"
                                                                    : "bg-gray-200 text-gray-700"
                                                            )}
                                                            disabled
                                                        >
                                                            Installed
                                                        </button>
                                                    </motion.div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowConfirmUninstall(app.id);
                                                        }}
                                                        className={cn(
                                                            "p-1.5 rounded-full transition-colors flex items-center justify-center",
                                                            isDarkMode
                                                                ? "hover:bg-gray-700 text-gray-400 hover:text-red-400"
                                                                : "hover:bg-gray-200 text-gray-500 hover:text-red-500"
                                                        )}
                                                        title="Uninstall"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={(e) => handleOpenAppChat(e, app.id)}
                                                        className={cn(
                                                            "p-1.5 rounded-full transition-colors flex items-center justify-center",
                                                            isDarkMode
                                                                ? "hover:bg-blue-700 text-blue-400 hover:text-blue-300"
                                                                : "hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                                                        )}
                                                        title="Open Chat"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                            ) : (
                                                // Replace disabled button with status display for non-approved apps
                                                app.audit_status && app.audit_status !== 'approved' ? (
                                                    <div className={cn(
                                                        "px-4 py-1.5 text-sm rounded-full font-medium flex items-center justify-center gap-2",
                                                        app.audit_status === 'pending'
                                                            ? isDarkMode
                                                                ? "bg-yellow-900/30 text-yellow-400"
                                                                : "bg-yellow-100 text-yellow-800"
                                                            : isDarkMode
                                                                ? "bg-red-900/30 text-red-400"
                                                                : "bg-red-100 text-red-800"
                                                    )}>
                                                        {app.audit_status === 'pending' ? (
                                                            <>
                                                                <Clock className="w-4 h-4" />
                                                                Pending Review
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertCircle className="w-4 h-4" />
                                                                Rejected
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Install button for approved apps
                                                    <motion.button
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleInstall(app.id);
                                                        }}
                                                        className={cn(
                                                            "px-4 py-1.5 text-sm rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm",
                                                            isDarkMode
                                                                ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
                                                                : "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md"
                                                        )}
                                                    >
                                                        <span>Get</span>
                                                    </motion.button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-2">
                                        {app.description}
                                    </p>
                                    <div className="flex items-center text-sm">
                                        <div className="flex items-center mr-3">
                                            <Star className="w-3.5 h-3.5 text-yellow-400 mr-1" />
                                            <span className="text-gray-600 dark:text-gray-300">{app.rating}</span>
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400 text-xs flex items-center">
                                            <Download className="w-3.5 h-3.5 mr-1" />
                                            {app.downloads}
                                        </div>
                                        {app.detailUrl && (
                                            <div className="ml-auto" onClick={e => e.stopPropagation()}>
                                                <a
                                                    href={app.detailUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={cn(
                                                        "flex items-center text-xs gap-1 px-2 py-1 rounded-md transition-colors",
                                                        isDarkMode
                                                            ? "text-blue-400 hover:bg-gray-700"
                                                            : "text-blue-600 hover:bg-gray-100"
                                                    )}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppStoreComponent; 