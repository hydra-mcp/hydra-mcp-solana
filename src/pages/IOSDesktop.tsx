import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { IOSIcon } from '@/components/ios/IOSIcon';
import { IOSDock } from '@/components/ios/IOSDock';
import { IOSStatusBar } from '@/components/ios/IOSStatusBar';
import { cn } from '@/lib/utils';
import { useTheme, WALLPAPERS } from '@/hooks/use-theme';
import { AnimatePresence, motion } from 'framer-motion';
import { WindowManager } from '@/components/ios/WindowManager';
import { createAppWindow, getDefaultAppPosition } from '@/components/ios/AppRegistry';
import { AppDefinition, appRegistry, defaultSize, LoadingPlaceholder, appGroups, AppType } from '@/components/ios/appConfig';
import { useAppWindow } from '@/contexts/AppWindowContext';
import { AppItem, uninstallApp, UserAgent, fetchUserAgents } from '@/lib/appStoreService';
import { useAppInstall } from '@/contexts/AppInstallContext';
import { v4 as uuidv4 } from 'uuid';
import { Wallet, Search, Settings, Store, Puzzle } from 'lucide-react';
import { ChatComponent } from '@/components/ios/AppComponents';
import { registerAppIfNeeded } from '@/lib/appRegistryUtils';

// Create a refresh context to handle agent refreshing
interface RefreshAgentContextType {
    refreshUserAgents: () => Promise<void>;
}

export const RefreshAgentContext = React.createContext<RefreshAgentContextType>({
    refreshUserAgents: async () => { }
});

export const useRefreshAgent = () => React.useContext(RefreshAgentContext);

// Context menu component
interface ContextMenuProps {
    appTitle: string;
    position: { x: number; y: number };
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
}

const ContextMenu = ({ appTitle, position, onClose, onRename, onDelete }: ContextMenuProps) => {
    const { isDarkMode } = useTheme();

    // Menu item animation variants
    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.2
            }
        }),
        exit: { opacity: 0, scale: 0.9 }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.2 }}
            className={cn(
                "fixed z-50 rounded-xl shadow-lg p-2 w-40",
                isDarkMode
                    ? "bg-gray-800/80 backdrop-blur-lg border border-gray-700/50"
                    : "bg-white/80 backdrop-blur-lg border border-gray-200/50"
            )}
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="text-sm font-medium pb-1 border-b border-gray-200 dark:border-gray-700 mb-1">
                {appTitle}
            </div>

            <div className="flex flex-col">
                <motion.button
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={0}
                    className="text-left py-1.5 px-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    onClick={onRename}
                >
                    Rename
                </motion.button>

                {/* <motion.button
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={1}
                    className="text-left py-1.5 px-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                    Move
                </motion.button> */}

                <motion.button
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={2}
                    className="text-left py-1.5 px-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    onClick={onDelete}
                >
                    Delete
                </motion.button>
            </div>
        </motion.div>
    );
};

// Rename dialog component
interface RenameDialogProps {
    appTitle: string;
    onClose: () => void;
    onConfirm: (newName: string) => void;
}

const RenameDialog = ({ appTitle, onClose, onConfirm }: RenameDialogProps) => {
    const [newName, setNewName] = useState(appTitle);
    const { isDarkMode } = useTheme();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus on input field
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            onConfirm(newName);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={cn(
                    "w-80 rounded-xl p-4 shadow-lg",
                    isDarkMode
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-3">Rename application</h3>

                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className={cn(
                            "w-full p-2 rounded-lg border mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none",
                            isDarkMode
                                ? "bg-gray-900 border-gray-700"
                                : "bg-white border-gray-300"
                        )}
                    />

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!newName.trim()}
                        >
                            Confirm
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Confirmation dialog component
interface ConfirmDialogProps {
    title: string;
    message: string;
    onClose: () => void;
    onConfirm: () => void;
}

const ConfirmDialog = ({ title, message, onClose, onConfirm }: ConfirmDialogProps) => {
    const { isDarkMode } = useTheme();

    return (
        <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={cn(
                    "w-80 rounded-xl p-4 shadow-lg",
                    isDarkMode
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                    >
                        Uninstall
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// iOS desktop page component
export function IOSDesktop() {
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [isJiggling, setIsJiggling] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showDockLabels, setShowDockLabels] = useState(false);
    const desktopRef = useRef<HTMLDivElement>(null);
    const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);

    // Add refreshUserAgents function
    const refreshUserAgents = async () => {
        setIsLoadingAgents(true);
        try {
            const agents = await fetchUserAgents();
            setUserAgents(agents);
        } catch (error) {
            console.error('Failed to refresh user agents:', error);
        } finally {
            setIsLoadingAgents(false);
        }
    };

    // Get the initializeApps function from the context
    const { initializeApps } = useAppInstall();

    // Initialize apps when the component mounts
    useEffect(() => {
        // Initialize installed apps when the desktop loads
        initializeApps();
    }, [initializeApps]);

    return (
        <RefreshAgentContext.Provider value={{ refreshUserAgents }}>
            <IOSDesktopContent
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                showContextMenu={showContextMenu}
                setShowContextMenu={setShowContextMenu}
                contextMenuPosition={contextMenuPosition}
                setContextMenuPosition={setContextMenuPosition}
                selectedAppId={selectedAppId}
                setSelectedAppId={setSelectedAppId}
                isJiggling={isJiggling}
                setIsJiggling={setIsJiggling}
                showRenameDialog={showRenameDialog}
                setShowRenameDialog={setShowRenameDialog}
                showDockLabels={showDockLabels}
                setShowDockLabels={setShowDockLabels}
                desktopRef={desktopRef}
                navigate={navigate}
                userAgents={userAgents}
                isLoadingAgents={isLoadingAgents}
                refreshUserAgents={refreshUserAgents}
            />
        </RefreshAgentContext.Provider>
    );
}

// Separated content component, can use AppWindowContext
const IOSDesktopContent = ({
    isDarkMode,
    toggleTheme,
    showContextMenu,
    setShowContextMenu,
    contextMenuPosition,
    setContextMenuPosition,
    selectedAppId,
    setSelectedAppId,
    isJiggling,
    setIsJiggling,
    showRenameDialog,
    setShowRenameDialog,
    showDockLabels,
    setShowDockLabels,
    desktopRef,
    navigate,
    userAgents,
    isLoadingAgents,
    refreshUserAgents
}: {
    isDarkMode: boolean;
    toggleTheme: () => void;
    showContextMenu: boolean;
    setShowContextMenu: (show: boolean) => void;
    contextMenuPosition: { x: number; y: number };
    setContextMenuPosition: (position: { x: number; y: number }) => void;
    selectedAppId: string | null;
    setSelectedAppId: (id: string | null) => void;
    isJiggling: boolean;
    setIsJiggling: (jiggling: boolean) => void;
    showRenameDialog: boolean;
    setShowRenameDialog: (show: boolean) => void;
    showDockLabels: boolean;
    setShowDockLabels: (show: boolean) => void;
    desktopRef: React.RefObject<HTMLDivElement>;
    navigate: (path: string) => void;
    userAgents: UserAgent[];
    isLoadingAgents: boolean;
    refreshUserAgents: () => Promise<void>;
}) => {
    const { openApp } = useAppWindow();
    const { installedApps: contextInstalledApps, uninstallAppAndRefresh, initialized, isLoading } = useAppInstall();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [appToUninstall, setAppToUninstall] = useState<AppDefinition | null>(null);

    // Combined state for all desktop apps (default + installed)
    // Initialized with default apps using registry key as ID
    const [apps, setApps] = useState<AppDefinition[]>(() =>
        Object.entries(appRegistry).map(([key, app]) => ({
            ...app,
            id: key // Use registry key as ID
        }))
    );

    // Fetch user agents
    useEffect(() => {
        refreshUserAgents();
    }, []);

    // Effect to update apps from user agents
    useEffect(() => {
        console.log("userAgents", userAgents);
        // Convert user agents to app definitions
        const agentAppDefinitions: AppDefinition[] = userAgents.map((agent): AppDefinition => ({
            id: `${agent.id}`, // Prefix with 'agent-' to avoid ID conflicts
            title: agent.name,
            appType: AppType.Agent,
            icon: agent.logo ? (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <img
                        src={agent.logo}
                        alt={agent.name}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <div className={cn("text-2xl text-white font-bold hidden")}>
                        {agent.name.substring(0, 1)}
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                    <Puzzle className="w-1/2 h-1/2 text-white" />
                </div>
            ),
            path: `/agent/${agent.id}`,
            component: (
                <Suspense fallback={<LoadingPlaceholder />}>
                    {React.createElement(ChatComponent({ appId: agent.id, appType: AppType.Agent }))}
                </Suspense>
            ),
            defaultSize,
            description: agent.description || `Custom agent: ${agent.name}`,
            group: 'userAgents',
            suggestedQuestions: {
                welcomeDescription: agent.description || `Custom agent: ${agent.name}`,
                modules: agent.suggested_questions?.map(question => ({
                    title: '',
                    content: question,
                }))
            }
        }));

        // Update apps state with user agent apps
        setApps(prevApps => {
            // First, remove all existing user agents
            const filteredApps = prevApps.filter(app => app.group !== 'userAgents');
            // Then add the current ones
            return [...filteredApps, ...agentAppDefinitions];
        });
    }, [userAgents]);

    // Effect to merge installed apps into the main 'apps' state
    useEffect(() => {
        // Only update apps if the context has been initialized
        if (!initialized && !isLoading) {
            return;
        }

        // Convert installed apps from API (AppItem) to AppDefinition format
        const installedAppDefinitions = contextInstalledApps.map((app): AppDefinition => ({
            id: app.id, // Use the ACTUAL App Store ID from API
            title: app.name,
            appType: AppType.MCP,
            icon: app.icon ?
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <img
                        src={app.icon}
                        alt={app.name}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <div className={cn("text-2xl text-white font-bold hidden")}>
                        {app.name.substring(0, 1)}
                    </div>
                </div> :
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <span className="text-white text-3xl font-bold">{app.name.substring(0, 1)}</span>
                </div>,
            path: `/app/${app.id}`,
            component: ( // Define component lazily or directly as needed
                <Suspense fallback={<LoadingPlaceholder />}>
                    {/* Ensure ChatComponent is correctly created or imported */}
                    {React.createElement(ChatComponent({ appId: app.id, appType: AppType.MCP }))}
                </Suspense>
            ),
            defaultSize,
            isDisabled: app.is_disabled,
            description: app.description,
            group: 'installed' // automatically assign installed group to installed apps
        }));

        // update installed apps
        setApps(prevApps => {
            const apps = [...prevApps];
            installedAppDefinitions.forEach(app => {
                const index = apps.findIndex(a => a.id === app.id);
                if (index === -1) {
                    apps.push(app);
                }
            });
            return apps;
        });

    }, [contextInstalledApps, initialized, isLoading]);

    // Dock apps - definition remains the same
    const dockApps = [
        { name: appRegistry.walletFinder.title, icon: appRegistry.walletFinder.icon, path: appRegistry.walletFinder.path },
        { name: appRegistry.messages.title, icon: appRegistry.messages.icon, path: appRegistry.messages.path },
        { name: appRegistry.settings.title, icon: appRegistry.settings.icon, path: appRegistry.settings.path, }
    ];

    // Handle application click (Uses stable ID: registry key or API ID)
    const handleAppClick = (id: string) => {
        if (isJiggling) {
            return;
        }

        const iosApp = apps.find(app => app.id === id);
        if (!iosApp) return;

        // Check if the app is disabled
        if (iosApp.isDisabled) {
            setAppToUninstall(iosApp); // Store the full definition for the dialog
            setShowConfirmDialog(true);
            return;
        }

        // Handle apps (path check is still valid)
        if (iosApp.path.startsWith('/app/') || iosApp.path.startsWith('/agent/')) {
            const appStoreAppId = iosApp.id; // The ID is the App Store ID

            // Convert AppDefinition to AppItem format if needed for registerAppIfNeeded
            // This is necessary because our utility expects AppItem format
            if (!appRegistry[appStoreAppId]) {
                const appItem: AppItem = {
                    id: iosApp.id,
                    name: iosApp.title,
                    description: iosApp.description || '',
                    category: iosApp.category || '',
                    icon: iosApp.icon,
                    rating: null,
                    downloads: null,
                    installed: true,
                    is_disabled: iosApp.isDisabled,
                    appType: iosApp.appType,
                    suggested_questions: iosApp.suggestedQuestions
                };

                // Register app using our shared utility
                registerAppIfNeeded(appItem);
            }

            const appWindow = createAppWindow(appStoreAppId);
            if (appWindow) {
                openApp(appWindow);
            } else {
                console.error(`Could not create window for installed app: ${appStoreAppId}`);
                // Optionally navigate or show error
            }
            return; // Stop processing here for installed apps
        }

        // Handle default apps (ID is the registry key)
        const appKey = id;
        if (appRegistry[appKey]?.onIconClick) {
            appRegistry[appKey].onIconClick!();
        } else if (appRegistry[appKey]) { // Check if it's a standard app to open
            const appWindow = createAppWindow(appKey);
            if (appWindow) {
                openApp(appWindow);
            } else {
                // Fallback navigation if window creation fails but app exists
                navigate(appRegistry[appKey].path);
            }
        } else {
            console.error(`App definition not found for key/ID: ${id}`);
        }
    };

    // Handle right-click menu (Uses stable ID)
    const handleContextMenu = (e: React.MouseEvent, appId: string) => {
        e.preventDefault();
        const app = apps.find(a => a.id === appId);
        if (!app) return;

        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setSelectedAppId(appId); // Store the unique ID
        setShowContextMenu(true);
    };

    // Handle long press to start jiggling
    const handleLongPress = () => {
        setIsJiggling(true);
    };

    // Handle renaming
    const handleRename = () => {
        setShowContextMenu(false);
        setShowRenameDialog(true); // RenameDialog will get app details via selectedAppId
    };

    // Confirm renaming
    const handleConfirmRename = (newName: string) => {
        if (selectedAppId) {
            setApps(prev => prev.map(app =>
                app.id === selectedAppId ? { ...app, title: newName } : app
            ));
            setSelectedAppId(null); // Clear selection
            setShowRenameDialog(false);
        }
    };

    // Handle deleting applications
    const handleDelete = () => {
        if (selectedAppId) {
            const appToDelete = apps.find(a => a.id === selectedAppId);

            if (!appToDelete) {
                setShowContextMenu(false);
                setSelectedAppId(null);
                return;
            }

            // For regular non-installed apps, just remove from UI state
            if (!appToDelete.path.startsWith('/app/')) {
                setApps(prev => prev.filter(app => app.id !== selectedAppId));
                setShowContextMenu(false);
                setSelectedAppId(null);
                return;
            }

            // For all installed apps, show the confirmation dialog
            // This matches the behavior in AppStoreComponent.tsx
            if (appToDelete.path.startsWith('/app/')) {
                setAppToUninstall(appToDelete);
                setShowConfirmDialog(true);
                setShowContextMenu(false);
                setSelectedAppId(null);
                return;
            }

            // Default fallback - just close the context menu
            setShowContextMenu(false);
            setSelectedAppId(null);
        }
    };

    // Click on the desktop area to stop jiggling
    const handleDesktopClick = () => {
        if (showContextMenu) {
            setShowContextMenu(false);
            setSelectedAppId(null); // Clear selection
        }
        if (isJiggling) {
            setIsJiggling(false);
        }
    };

    // Dock label toggle handling
    const handleDockLabelToggle = () => {
        setShowDockLabels(!showDockLabels);
    };

    // Listen for Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showConfirmDialog) { // Close confirm dialog first
                    setShowConfirmDialog(false);
                    setAppToUninstall(null);
                } else if (showRenameDialog) {
                    setShowRenameDialog(false);
                    setSelectedAppId(null); // Clear selection
                } else if (showContextMenu) {
                    setShowContextMenu(false);
                    setSelectedAppId(null); // Clear selection
                } else if (isJiggling) {
                    setIsJiggling(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showRenameDialog, showContextMenu, isJiggling, showConfirmDialog]);

    // Double-click handling
    // useEffect(() => {
    //     const handleDoubleClick = () => {
    //         handleDockLabelToggle();
    //     };

    //     desktopRef.current?.addEventListener('dblclick', handleDoubleClick);
    //     return () => desktopRef.current?.removeEventListener('dblclick', handleDoubleClick);
    // }, [showDockLabels]);

    // Wallpaper URL
    const wallpaperUrl = isDarkMode
        ? WALLPAPERS.DARK
        : WALLPAPERS.LIGHT;

    // Handle right-click on the desktop area
    const handleDesktopContextMenu = (e: React.MouseEvent) => {
        // Prevent default right-click menu
        e.preventDefault();

        // Do not display custom menu here, just prevent default menu
        return false;
    };

    // Handle confirming uninstall
    const handleConfirmUninstall = async () => {
        if (!appToUninstall) return;

        const appStoreAppId = appToUninstall.id; // ID is the App Store ID

        // Close confirmation dialog immediately
        setShowConfirmDialog(false);

        // Track uninstalling state (could be displayed with a loading indicator if desired)
        // This matches behavior in AppStoreComponent.tsx
        const uninstallingAppTitle = appToUninstall.title;

        try {
            // Use the context function instead of direct API call
            const success = await uninstallAppAndRefresh(appStoreAppId);

            if (!success) {
                throw new Error(`Failed to uninstall app ${uninstallingAppTitle}`);
            }

            console.log(`App ${uninstallingAppTitle} uninstalled successfully.`);

            // Update local apps state to reflect the uninstall
            // This ensures UI is consistent
            setApps(prevApps => prevApps.filter(app => app.id !== appStoreAppId));
        } catch (error) {
            console.error(`Failed to uninstall app ${uninstallingAppTitle}:`, error);
            // TODO: Show user-facing error message
        } finally {
            setAppToUninstall(null);
            setSelectedAppId(null); // Also clear selection if uninstall was triggered from context menu
        }
    };

    // Find app details for dialogs based on selectedAppId
    const appForContextMenu = selectedAppId ? apps.find(a => a.id === selectedAppId) : null;
    const appForRenameDialog = selectedAppId ? apps.find(a => a.id === selectedAppId) : null;

    return (
        <div
            ref={desktopRef}
            className="min-h-screen w-full relative overflow-hidden select-none"
            onClick={handleDesktopClick}
            onContextMenu={handleDesktopContextMenu}
        >
            {/* Wallpaper */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{ backgroundImage: `url(${wallpaperUrl})` }}
                onContextMenu={handleDesktopContextMenu}
            >
                {/* Dark overlay on wallpaper */}
                <div
                    className={cn(
                        "absolute inset-0 transition-opacity duration-1000",
                        isDarkMode ? "bg-black/40" : "bg-black/5"
                    )}
                    onContextMenu={handleDesktopContextMenu}
                />
            </div>

            {/* Status bar */}
            <div onContextMenu={handleDesktopContextMenu}>
                <IOSStatusBar transparent />
            </div>

            {/* Application icon grid */}
            <div
                className="pt-14 mx-auto"
                onContextMenu={handleDesktopContextMenu}
            >
                <div className="px-4 sm:px-8 md:px-20 lg:px-24 max-w-[1600px] mx-auto space-y-10">
                    {/* adaptive width group layout */}
                    <div className="flex flex-wrap gap-6">
                        {Object.values(appGroups).map((group) => {
                            // filter apps belong to current group
                            const groupApps = apps.filter(app => app.group === group.id);

                            // only show groups with apps
                            if (groupApps.length === 0) return null;

                            // calculate columns of apps per row
                            const calculateColumns = (breakpoint: string) => {
                                if (!group.adaptiveWidth) {
                                    // non-adaptive width group use standard columns
                                    return {
                                        xs: 3,  // mobile device display 3 columns
                                        sm: 4,  // small screen display 4 columns
                                        md: 6,  // medium screen display 6 columns
                                        lg: 8   // large screen display 8 columns
                                    }[breakpoint] || 3;
                                } else {
                                    // adaptive width group adjust columns based on container width and app count
                                    // width ratio is the same as standard, keep layout consistent
                                    return {
                                        xs: 3,
                                        sm: 4,
                                        md: 5,
                                        lg: 6
                                    }[breakpoint] || 3;
                                }
                            };

                            // set group container style
                            const groupContainerStyle: React.CSSProperties = {
                                flex: group.adaptiveWidth ? '1 1 auto' : '0 0 100%',
                                minWidth: group.adaptiveWidth ? group.minWidth : '100%',
                                maxWidth: group.adaptiveWidth ? group.maxWidth : '100%',
                            };

                            return (
                                <div
                                    key={group.id}
                                    className={cn(
                                        "rounded-xl p-5 backdrop-blur-sm shadow-sm group",
                                        isDarkMode
                                            ? "bg-gray-800/40 border border-gray-700/50"
                                            : "bg-white/30 border border-gray-200/50",
                                        !group.adaptiveWidth && "w-full",
                                        "transition-all duration-300 ease-in-out hover:shadow-md",
                                        isDarkMode
                                            ? "hover:bg-gray-800/60 hover:border-gray-600/60"
                                            : "hover:bg-white/50 hover:border-gray-300/70"
                                    )}
                                    style={groupContainerStyle}
                                >
                                    <div className="flex items-center mb-4">
                                        <div className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center mr-2.5",
                                            isDarkMode ? group.color : group.secondaryColor || group.color,
                                            "transition-transform duration-300 group-hover:scale-110"
                                        )}>
                                            {group.icon}
                                        </div>
                                        <h3 className={cn(
                                            "text-sm font-semibold",
                                            isDarkMode ? "text-gray-200" : "text-gray-800",
                                            "transition-colors duration-300",
                                            isDarkMode ? "group-hover:text-white" : "group-hover:text-gray-900"
                                        )}>
                                            {group.title}
                                        </h3>
                                    </div>
                                    <div className={cn(
                                        "grid gap-x-4 gap-y-10 justify-items-center",
                                        "group-hover:scale-[1.01] transition-transform duration-500"
                                    )}
                                        style={{
                                            // force using the same app spacing, ensure the spacing is consistent in all groups
                                            gridTemplateColumns: group.adaptiveWidth
                                                ? "repeat(auto-fill, minmax(80px, 1fr))"
                                                : "repeat(8, minmax(0, 1fr))",
                                            columnGap: "2rem",
                                            rowGap: "0.2rem"
                                        }}
                                    >
                                        {groupApps.map((app) => (
                                            <IOSIcon
                                                key={app.id}
                                                name={app.title}
                                                icon={app.icon}
                                                onClick={() => handleAppClick(app.id)}
                                                onContextMenu={(e) => handleContextMenu(e, app.id)}
                                                isJiggling={isJiggling}
                                                isDisabled={app.isDisabled}
                                                className="transition-all duration-300 group-hover:translate-y-[-2px]"
                                                isHot={app.isHot}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* show apps without group (if any) */}
                    {apps.filter(app => !app.group && app.id !== 'home').length > 0 && (
                        <div className={cn(
                            "rounded-xl p-5 backdrop-blur-sm shadow-sm w-full group",
                            isDarkMode
                                ? "bg-gray-800/40 border border-gray-700/50"
                                : "bg-white/30 border border-gray-200/50",
                            "transition-all duration-300 ease-in-out hover:shadow-md",
                            isDarkMode
                                ? "hover:bg-gray-800/60 hover:border-gray-600/60"
                                : "hover:bg-white/50 hover:border-gray-300/70"
                        )}>
                            <div className="flex items-center mb-4">
                                <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center mr-2.5",
                                    isDarkMode ? "bg-amber-600" : "bg-amber-500",
                                    "transition-transform duration-300 group-hover:scale-110"
                                )}>
                                    <Store className="w-4 h-4 text-white" />
                                </div>
                                <h3 className={cn(
                                    "text-sm font-semibold",
                                    isDarkMode ? "text-gray-200" : "text-gray-800",
                                    "transition-colors duration-300",
                                    isDarkMode ? "group-hover:text-white" : "group-hover:text-gray-900"
                                )}>
                                    Other Applications
                                </h3>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-10 justify-items-center group-hover:scale-[1.01] transition-transform duration-500"
                                style={{
                                    // ensure "other applications" group uses the same spacing as previous groups
                                    gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
                                    columnGap: "2rem",
                                    rowGap: "0.2rem"
                                }}
                            >
                                {apps
                                    .filter(app => !app.group && app.id !== 'home')
                                    .map((app) => (
                                        <IOSIcon
                                            key={app.id}
                                            name={app.title}
                                            icon={app.icon}
                                            onClick={() => handleAppClick(app.id)}
                                            onContextMenu={(e) => handleContextMenu(e, app.id)}
                                            isJiggling={isJiggling}
                                            isDisabled={app.isDisabled}
                                            className="transition-all duration-300 group-hover:translate-y-[-2px]"
                                            isHot={app.isHot}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dock */}
            <div onContextMenu={handleDesktopContextMenu}>
                <IOSDock
                    items={dockApps}
                    showLabels={showDockLabels}
                />
            </div>

            {/* Prompt information */}
            {/* <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="fixed bottom-40 inset-x-0 mx-auto w-full max-w-md px-4 text-white/70 text-xs text-center"
                onContextMenu={handleDesktopContextMenu}
            >
                <div className="bg-black/20 backdrop-blur-sm py-1.5 px-4 rounded-full inline-block">
                    Double-click desktop to hide/show Dock labels | Right-click application icon to view more options
                </div>
            </motion.div> */}

            {/* Context menu */}
            <AnimatePresence>
                {showContextMenu && appForContextMenu && (
                    <ContextMenu
                        appTitle={appForContextMenu.title}
                        position={contextMenuPosition}
                        onClose={() => { setShowContextMenu(false); setSelectedAppId(null); }}
                        onRename={handleRename}
                        onDelete={handleDelete}
                    />
                )}
            </AnimatePresence>

            {/* Rename dialog */}
            <AnimatePresence>
                {showRenameDialog && appForRenameDialog && (
                    <RenameDialog
                        appTitle={appForRenameDialog.title}
                        onClose={() => { setShowRenameDialog(false); setSelectedAppId(null); }}
                        onConfirm={handleConfirmRename}
                    />
                )}
            </AnimatePresence>

            {/* Uninstall Confirmation Dialog */}
            <AnimatePresence>
                {showConfirmDialog && appToUninstall && (
                    <ConfirmDialog
                        title="Uninstall App?"
                        message={`Do you want to uninstall the app "${appToUninstall.title}"?`}
                        onClose={() => { setShowConfirmDialog(false); setAppToUninstall(null); }}
                        onConfirm={handleConfirmUninstall}
                    />
                )}
            </AnimatePresence>

            {/* WindowManager for managing and displaying application popups */}
            <WindowManager />
        </div>
    );
}; 