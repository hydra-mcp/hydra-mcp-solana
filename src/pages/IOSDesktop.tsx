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
import { AppDefinition, appRegistry, ChatComponent, defaultSize, LoadingPlaceholder } from '@/components/ios/appConfig';
import { useAppWindow } from '@/contexts/AppWindowContext';
import { fetchApps, AppItem, uninstallApp } from '@/lib/appStoreService';
import { v4 as uuidv4 } from 'uuid';

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

                <motion.button
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={1}
                    className="text-left py-1.5 px-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                    Move
                </motion.button>

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
    const [showDockLabels, setShowDockLabels] = useState(true);
    const desktopRef = useRef<HTMLDivElement>(null);

    return (
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
        />
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
    navigate
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
}) => {
    const { openApp } = useAppWindow();
    const [installedApps, setInstalledApps] = useState<AppItem[]>([]);
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

    // Fetch installed apps from the API on mount
    useEffect(() => {
        const fetchInstalledApps = async () => {
            try {
                const appsData = await fetchApps();
                const installed = appsData.filter(app => app.installed);
                setInstalledApps(installed); // Update raw installed apps list
            } catch (error) {
                console.error('Error fetching installed apps:', error);
            }
        };
        fetchInstalledApps();
    }, []);

    // Effect to merge installed apps into the main 'apps' state
    useEffect(() => {
        // Convert installed apps from API (AppItem) to AppDefinition format
        const installedAppDefinitions = installedApps.map((app): AppDefinition => ({
            id: app.id, // Use the ACTUAL App Store ID from API
            title: app.name,
            icon: app.icon ?
                <img src={app.icon} alt={app.name} className="w-full h-full object-cover" /> : // Added object-cover
                <div className="w-full h-full flex items-center justify-center bg-blue-500 rounded-xl">
                    <span className="text-white text-4xl font-bold">{app.name.charAt(0)}</span>
                </div>,
            path: `/app/${app.id}`,
            component: ( // Define component lazily or directly as needed
                <Suspense fallback={<LoadingPlaceholder />}>
                    {/* Ensure ChatComponent is correctly created or imported */}
                    {React.createElement(ChatComponent({ appId: app.id }))}
                </Suspense>
            ),
            defaultSize,
            isDisabled: app.is_disabled,
            description: app.description
        }));

        // Get default apps from registry using registry key as ID
        const defaultAppsFromRegistry = Object.entries(appRegistry).map(([key, app]) => ({
            ...app,
            id: key
        }));

        // Combine default apps and installed apps using a Map to handle potential overrides and ensure uniqueness by ID
        const combinedAppsMap = new Map<string, AppDefinition>();

        // Add default apps first
        defaultAppsFromRegistry.forEach(app => combinedAppsMap.set(app.id, app));

        // Add/update with installed apps (using their API ID as the key)
        installedAppDefinitions.forEach(app => combinedAppsMap.set(app.id, app));

        // Update the state with the unique, combined list from the map values
        setApps(Array.from(combinedAppsMap.values()));

    }, [installedApps]); // Re-run whenever the raw installedApps list changes

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

        // Handle installed apps (path check is still valid)
        if (iosApp.path.startsWith('/app/')) {
            const appStoreAppId = iosApp.id; // The ID is the App Store ID

            // Ensure the app definition is temporarily in appRegistry if needed by createAppWindow
            // (Assuming createAppWindow might look up by ID in appRegistry)
            if (!appRegistry[appStoreAppId]) {
                appRegistry[appStoreAppId] = { ...iosApp }; // Add definition
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
            // Only allow deleting non-installed apps this way
            if (appToDelete && !appToDelete.path.startsWith('/app/')) {
                setApps(prev => prev.filter(app => app.id !== selectedAppId));
            } else if (appToDelete && appToDelete.isDisabled) {
                // If it's a disabled installed app, trigger the uninstall dialog
                setAppToUninstall(appToDelete);
                setShowConfirmDialog(true);
            }
            setShowContextMenu(false);
            setSelectedAppId(null); // Clear selection
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
    useEffect(() => {
        const handleDoubleClick = () => {
            handleDockLabelToggle();
        };

        desktopRef.current?.addEventListener('dblclick', handleDoubleClick);
        return () => desktopRef.current?.removeEventListener('dblclick', handleDoubleClick);
    }, [showDockLabels]);

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

        try {
            await uninstallApp(appStoreAppId);
            // Update the raw installedApps list; the useEffect will update the main 'apps' state
            setInstalledApps(prev => prev.filter(app => app.id !== appStoreAppId));
            console.log(`App ${appToUninstall.title} uninstalled successfully.`);
        } catch (error) {
            console.error(`Failed to uninstall app ${appToUninstall.title}:`, error);
            // TODO: Show user-facing error message
        } finally {
            setShowConfirmDialog(false);
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
                className="pt-14 mx-auto container"
                onContextMenu={handleDesktopContextMenu}
            >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-4 gap-y-12 sm:gap-x-6 md:gap-x-8 justify-items-center px-4 sm:px-8 md:px-12 lg:px-16 max-w-[1600px] mx-auto">
                    {apps.map((app) => (
                        <IOSIcon
                            key={app.id}
                            name={app.title}
                            icon={app.icon}
                            onClick={() => handleAppClick(app.id)}
                            onContextMenu={(e) => handleContextMenu(e, app.id)}
                            isJiggling={isJiggling}
                            isDisabled={app.isDisabled}
                        />
                    ))}
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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="fixed bottom-40 inset-x-0 mx-auto w-full max-w-md px-4 text-white/70 text-xs text-center"
                onContextMenu={handleDesktopContextMenu}
            >
                <div className="bg-black/20 backdrop-blur-sm py-1.5 px-4 rounded-full inline-block">
                    Double-click desktop to hide/show Dock labels | Right-click application icon to view more options
                </div>
            </motion.div>

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
                        message={`"${appToUninstall.title}" has been disabled by the administrator. Do you want to uninstall it?`}
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