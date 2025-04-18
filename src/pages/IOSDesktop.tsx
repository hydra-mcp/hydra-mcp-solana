import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IOSIcon } from '@/components/ios/IOSIcon';
import { IOSDock } from '@/components/ios/IOSDock';
import { IOSStatusBar } from '@/components/ios/IOSStatusBar';
import { cn } from '@/lib/utils';
import { useTheme, WALLPAPERS } from '@/hooks/use-theme';
import { AnimatePresence, motion } from 'framer-motion';
import { WindowManager } from '@/components/ios/WindowManager';
import { createAppWindow } from '@/components/ios/AppRegistry';
import { appRegistry } from '@/components/ios/appConfig';
import { useAppWindow } from '@/contexts/AppWindowContext';

// Context menu component
interface ContextMenuProps {
    appName: string;
    position: { x: number; y: number };
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
}

const ContextMenu = ({ appName, position, onClose, onRename, onDelete }: ContextMenuProps) => {
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
                {appName}
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
    appName: string;
    onClose: () => void;
    onConfirm: (newName: string) => void;
}

const RenameDialog = ({ appName, onClose, onConfirm }: RenameDialogProps) => {
    const [newName, setNewName] = useState(appName);
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

// iOS desktop page component
export function IOSDesktop() {
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedApp, setSelectedApp] = useState<string | null>(null);
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
            selectedApp={selectedApp}
            setSelectedApp={setSelectedApp}
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
    selectedApp,
    setSelectedApp,
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
    selectedApp: string | null;
    setSelectedApp: (app: string | null) => void;
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

    // Generate application list from appRegistry
    const [apps, setApps] = useState(() =>
        Object.values(appRegistry).map((app, index) => ({
            id: String(index + 1),
            name: app.title,
            icon: app.icon,
            path: app.path,
        }))
    );

    // Dock apps - using appRegistry application information
    const dockApps = [
        {
            name: appRegistry.walletFinder.title,
            icon: appRegistry.walletFinder.icon,
            path: appRegistry.walletFinder.path
        },
        {
            name: appRegistry.messages.title,
            icon: appRegistry.messages.icon,
            path: appRegistry.messages.path
        },
        {
            name: appRegistry.settings.title,
            icon: appRegistry.settings.icon,
            path: appRegistry.settings.path,
        }
    ];

    // Handle application click
    const handleAppClick = (id: string) => {
        if (isJiggling) {
            // Click on the application in the jiggling mode does not perform any operation
            return;
        }

        // Find app definition
        const iosApp = apps.find(app => app.id === id);
        if (!iosApp) return;

        // Find complete application configuration
        const appKey = Object.keys(appRegistry).find(
            key => appRegistry[key].title === iosApp.name
        );

        if (appKey && appRegistry[appKey].onIconClick) {
            // If the application defines a custom click processing function, execute it
            appRegistry[appKey].onIconClick();
        } else {
            // Otherwise, the default behavior is to open the application window
            // Determine appId from path (remove leading slash)
            const appId = iosApp.path.startsWith('/') ? iosApp.path.substring(1) : iosApp.path;
            // Create application window and open
            const appWindow = createAppWindow(appId);
            if (appWindow) {
                openApp(appWindow);
            } else {
                // If the corresponding application window definition is not found, fall back to traditional navigation
                navigate(iosApp.path);
            }
        }
    };

    // Handle right-click menu
    const handleContextMenu = (e: React.MouseEvent, appId: string) => {
        e.preventDefault();

        const app = apps.find(app => app.id === appId);
        if (!app) return;

        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setSelectedApp(app.name);
        setShowContextMenu(true);
    };

    // Handle long press to start jiggling
    const handleLongPress = () => {
        setIsJiggling(true);
    };

    // Handle renaming
    const handleRename = () => {
        setShowContextMenu(false);
        setShowRenameDialog(true);
    };

    // Confirm renaming
    const handleConfirmRename = (newName: string) => {
        if (selectedApp) {
            setApps(prev => prev.map(app =>
                app.name === selectedApp ? { ...app, name: newName } : app
            ));
            setSelectedApp(null);
            setShowRenameDialog(false);
        }
    };

    // Handle deleting applications
    const handleDelete = () => {
        if (selectedApp) {
            setApps(prev => prev.filter(app => app.name !== selectedApp));
            setShowContextMenu(false);
            setSelectedApp(null);
        }
    };

    // Click on the desktop area to stop jiggling
    const handleDesktopClick = () => {
        if (showContextMenu) {
            setShowContextMenu(false);
        }

        if (isJiggling) {
            setIsJiggling(false);
        }
    };

    // Dock label toggle handling
    const handleDockLabelToggle = () => {
        setShowDockLabels(!showDockLabels);
    };

    // Listen for Escape key to close dialogs
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showRenameDialog) {
                    setShowRenameDialog(false);
                } else if (showContextMenu) {
                    setShowContextMenu(false);
                } else if (isJiggling) {
                    setIsJiggling(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showRenameDialog, showContextMenu, isJiggling]);

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
                            name={app.name}
                            icon={app.icon}
                            onClick={() => handleAppClick(app.id)}
                            onContextMenu={(e) => handleContextMenu(e, app.id)}
                            isJiggling={isJiggling}
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
                {showContextMenu && selectedApp && (
                    <ContextMenu
                        appName={selectedApp}
                        position={contextMenuPosition}
                        onClose={() => setShowContextMenu(false)}
                        onRename={handleRename}
                        onDelete={handleDelete}
                    />
                )}
            </AnimatePresence>

            {/* Rename dialog */}
            <AnimatePresence>
                {showRenameDialog && selectedApp && (
                    <RenameDialog
                        appName={selectedApp}
                        onClose={() => setShowRenameDialog(false)}
                        onConfirm={handleConfirmRename}
                    />
                )}
            </AnimatePresence>

            {/* WindowManager for managing and displaying application popups */}
            <WindowManager />
        </div>
    );
}; 