import React, { useState, useEffect } from 'react';
import {
    Download, Loader2, Check, Package, Trash2, Star, ExternalLink
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import {
    fetchAppCategories,
    fetchApps,
    installApp,
    uninstallApp,
    AppCategory,
    AppItem,
} from '@/lib/appStoreService';

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
                setApps(appsData);

                // Derive installed apps directly from the appsData response
                const initiallyInstalled = appsData
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
        setInstallingApps(prev => [...prev, appId]);

        try {
            const result = await installApp(appId);

            if (result.success) {
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
            const result = await uninstallApp(appId);

            if (result.success) {
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
                                            <div className="flex justify-end gap-2 mt-4">
                                                <button
                                                    className={cn(
                                                        "px-3 py-1 rounded-md text-sm",
                                                        isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowConfirmUninstall(null);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="px-3 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUninstall(app.id);
                                                    }}
                                                >
                                                    Uninstall
                                                </button>
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
                                    <div className={cn("text-2xl text-white font-bold", app.icon ? "hidden" : "")}>
                                        {app.name.substring(0, 1)}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-medium">{app.name}</h3>
                                        <div onClick={e => e.stopPropagation()}>
                                            {uninstallingApps.includes(app.id) ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                                            ) : installingApps.includes(app.id) ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                            ) : installedApps.includes(app.id) ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center justify-center">
                                                        <Check className="w-5 h-5 text-green-500" />
                                                    </div>
                                                    <button
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
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleInstall(app.id);
                                                    }}
                                                    className={cn(
                                                        "px-4 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
                                                        isDarkMode
                                                            ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                                                            : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                                                    )}
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Install
                                                </button>
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
                                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                                            {app.downloads} downloads
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
                                                    <span>Details</span>
                                                    <ExternalLink className="w-3 h-3" />
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