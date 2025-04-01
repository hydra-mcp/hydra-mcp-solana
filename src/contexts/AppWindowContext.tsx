import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Define the app window type
export interface AppWindow {
    id: string;
    title: string;
    content: ReactNode;
    isMinimized: boolean;
    zIndex: number;
    position: { x: number; y: number };
    size: { width: number; height: number };
    path: string;
}

interface AppWindowContextType {
    openWindows: AppWindow[];
    activeWindowId: string | null;
    openApp: (app: Omit<AppWindow, 'isMinimized' | 'zIndex'>) => void;
    closeApp: (id: string) => void;
    focusApp: (id: string) => void;
    moveApp: (id: string, position: { x: number; y: number }) => void;
    resizeApp: (id: string, size: { width: number; height: number }) => void;
    minimizeApp: (id: string) => void;
    restoreApp: (id: string) => void;
    closeAllApps: () => void;
    arrangeWindows: () => void;
    arrangeWindowsGoldenRatio: () => void;
    getAppByPath: (path: string) => AppWindow | undefined;
    isAppOpen: (path: string) => boolean;
}

const AppWindowContext = createContext<AppWindowContextType | undefined>(undefined);

// Create a custom hook to use the context
export const useAppWindow = () => {
    const context = useContext(AppWindowContext);
    if (!context) {
        throw new Error('useAppWindow must be used within an AppWindowProvider');
    }
    return context;
};

// Create a new window application
export const createAppWindow = (
    id: string,
    title: string,
    content: ReactNode,
    path: string,
    position?: { x: number; y: number },
    size?: { width: number; height: number }
): Omit<AppWindow, 'isMinimized' | 'zIndex'> => {
    // Default window size
    const defaultSize = { width: 800, height: 600 };
    // Calculate center position (if no position is provided)
    const viewportWidth = globalThis.window?.innerWidth || 1200;
    const viewportHeight = globalThis.window?.innerHeight || 800;
    const defaultPosition = {
        x: (viewportWidth - (size?.width || defaultSize.width)) / 2,
        y: Math.max(20, (viewportHeight - (size?.height || defaultSize.height)) / 3)
    };

    return {
        id,
        title,
        content,
        path,
        position: position || defaultPosition,
        size: size || defaultSize
    };
};

interface AppWindowProviderProps {
    children: ReactNode;
}

// Base z-index for windows
const BASE_Z_INDEX = 1000;

export const AppWindowProvider: React.FC<AppWindowProviderProps> = ({ children }) => {
    const [openWindows, setOpenWindows] = useState<AppWindow[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const [highestZIndex, setHighestZIndex] = useState<number>(BASE_Z_INDEX);

    // Open a new app window
    const openApp = useCallback((appInfo: Omit<AppWindow, 'isMinimized' | 'zIndex'>) => {
        // Check if app with the same path is already open
        const existingAppIndex = openWindows.findIndex(app => app.path === appInfo.path);

        if (existingAppIndex !== -1) {
            // If app is already open, focus it
            const newHighestZ = highestZIndex + 1;
            setHighestZIndex(newHighestZ);

            setOpenWindows(prev => prev.map((window, index) =>
                index === existingAppIndex
                    ? { ...window, isMinimized: false, zIndex: newHighestZ }
                    : window
            ));

            setActiveWindowId(openWindows[existingAppIndex].id);
            return;
        }

        // Create new app window with the next z-index
        const newZ = highestZIndex + 1;
        setHighestZIndex(newZ);

        const newWindow: AppWindow = {
            ...appInfo,
            isMinimized: false,
            zIndex: newZ
        };

        setOpenWindows(prev => [...prev, newWindow]);
        setActiveWindowId(newWindow.id);
    }, [openWindows, highestZIndex]);

    // Close an app window
    const closeApp = useCallback((id: string) => {
        // Ensure the window is closed before getting window information (can be used for subsequent processing, such as saving state, etc.)
        const windowToClose = openWindows.find(window => window.id === id);
        if (!windowToClose) {
            console.warn(`Attempting to close a non-existent window ID: ${id}`);
            return;
        }

        // Remove window
        setOpenWindows(prev => prev.filter(window => window.id !== id));

        // If the closed window was active, set the next highest z-index window as active
        if (activeWindowId === id) {
            const remainingWindows = openWindows.filter(window => window.id !== id);
            if (remainingWindows.length > 0) {
                // Find the window with the highest Z-index and activate it
                const highestWindow = remainingWindows.reduce((highest, current) =>
                    current.zIndex > highest.zIndex ? current : highest
                );
                setActiveWindowId(highestWindow.id);
            } else {
                // If there are no remaining windows, clear activeWindowId
                setActiveWindowId(null);
            }
        }

        // Window closed
    }, [openWindows, activeWindowId]);

    // Focus an app (bring to front)
    const focusApp = useCallback((id: string) => {
        const windowToFocus = openWindows.find(window => window.id === id);
        if (!windowToFocus) return;

        // If the window is minimized, restore it first
        if (windowToFocus.isMinimized) {
            setOpenWindows(prev => prev.map(window =>
                window.id === id ? { ...window, isMinimized: false } : window
            ));
        }

        const newZ = highestZIndex + 1;
        setHighestZIndex(newZ);

        setOpenWindows(prev => prev.map(window =>
            window.id === id ? { ...window, zIndex: newZ } : window
        ));

        setActiveWindowId(id);
    }, [openWindows, highestZIndex]);

    // Move an app window
    const moveApp = useCallback((id: string, position: { x: number; y: number }) => {
        setOpenWindows(prev => prev.map(window =>
            window.id === id ? { ...window, position } : window
        ));
    }, []);

    // Resize an app window
    const resizeApp = useCallback((id: string, size: { width: number; height: number }) => {
        setOpenWindows(prev => prev.map(window =>
            window.id === id ? { ...window, size } : window
        ));
    }, []);

    // Minimize window
    const minimizeApp = useCallback((id: string) => {
        const windowToMinimize = openWindows.find(window => window.id === id);
        if (!windowToMinimize || windowToMinimize.isMinimized) return;

        setOpenWindows(prev => prev.map(window =>
            window.id === id ? { ...window, isMinimized: true } : window
        ));

        // If the currently active window is minimized, find the next highest z-index window to activate
        if (activeWindowId === id) {
            const visibleWindows = openWindows.filter(
                window => window.id !== id && !window.isMinimized
            );

            if (visibleWindows.length > 0) {
                const highestWindow = visibleWindows.reduce(
                    (highest, current) => current.zIndex > highest.zIndex ? current : highest
                );
                setActiveWindowId(highestWindow.id);
            } else {
                setActiveWindowId(null);
            }
        }
    }, [openWindows, activeWindowId]);

    // Restore window
    const restoreApp = useCallback((id: string) => {
        const windowToRestore = openWindows.find(window => window.id === id);
        if (!windowToRestore || !windowToRestore.isMinimized) return;

        setOpenWindows(prev => prev.map(window =>
            window.id === id ? { ...window, isMinimized: false } : window
        ));

        // Focus the window
        focusApp(id);
    }, [openWindows, focusApp]);

    // Close all windows
    const closeAllApps = useCallback(() => {
        setOpenWindows([]);
        setActiveWindowId(null);
    }, []);

    // Auto arrange windows
    const arrangeWindows = useCallback(() => {
        const visibleWindows = openWindows.filter(window => !window.isMinimized);
        if (visibleWindows.length === 0) return;

        const viewportWidth = globalThis.window?.innerWidth || 1200;
        const viewportHeight = globalThis.window?.innerHeight || 800;

        // Determine arrangement based on number of windows
        if (visibleWindows.length === 1) {
            // Single window centered
            const window = visibleWindows[0];
            moveApp(window.id, {
                x: (viewportWidth - window.size.width) / 2,
                y: (viewportHeight - window.size.height) / 2
            });
        } else if (visibleWindows.length === 2) {
            // Two windows left and right
            const leftWindow = visibleWindows[0];
            const rightWindow = visibleWindows[1];

            // Adjust window size to half screen width
            const newWidth = Math.floor(viewportWidth / 2) - 20;
            const newHeight = Math.floor(viewportHeight * 0.8);

            resizeApp(leftWindow.id, { width: newWidth, height: newHeight });
            resizeApp(rightWindow.id, { width: newWidth, height: newHeight });

            // Position windows
            moveApp(leftWindow.id, { x: 10, y: Math.floor(viewportHeight * 0.1) });
            moveApp(rightWindow.id, { x: Math.floor(viewportWidth / 2) + 10, y: Math.floor(viewportHeight * 0.1) });
        } else {
            // Multiple windows grid arrangement
            const cols = Math.ceil(Math.sqrt(visibleWindows.length));
            const rows = Math.ceil(visibleWindows.length / cols);

            const cellWidth = Math.floor(viewportWidth / cols);
            const cellHeight = Math.floor(viewportHeight / rows);

            visibleWindows.forEach((window, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);

                // Adjust window size
                const newWidth = cellWidth - 20;
                const newHeight = cellHeight - 20;

                resizeApp(window.id, { width: newWidth, height: newHeight });

                // Position windows
                moveApp(window.id, {
                    x: col * cellWidth + 10,
                    y: row * cellHeight + 10
                });
            });
        }
    }, [openWindows, moveApp, resizeApp]);

    // Arrange windows by golden ratio
    const arrangeWindowsGoldenRatio = useCallback(() => {
        const visibleWindows = openWindows.filter(window => !window.isMinimized);
        if (visibleWindows.length === 0) return;

        const viewportWidth = globalThis.window?.innerWidth || 1200;
        const viewportHeight = globalThis.window?.innerHeight || 800;

        // Golden ratio is 1.618
        const goldenRatio = 1.618;

        if (visibleWindows.length === 1) {
            // Single window apply golden ratio
            const window = visibleWindows[0];
            const newWidth = Math.min(viewportWidth * 0.8, 1200); // Maximum limit width
            const newHeight = newWidth / goldenRatio;

            resizeApp(window.id, { width: newWidth, height: newHeight });
            moveApp(window.id, {
                x: (viewportWidth - newWidth) / 2,
                y: (viewportHeight - newHeight) / 2
            });
        } else if (visibleWindows.length === 2) {
            // Two windows, one main, one secondary
            const mainWindow = visibleWindows[0];
            const secondaryWindow = visibleWindows[1];

            // Main window occupies the area of golden ratio
            const totalWidth = viewportWidth * 0.9;
            const mainWidth = totalWidth / goldenRatio * (goldenRatio - 1);
            const secondaryWidth = totalWidth - mainWidth;

            const mainHeight = viewportHeight * 0.8;
            const secondaryHeight = mainHeight;

            // Adjust window size
            resizeApp(mainWindow.id, { width: mainWidth, height: mainHeight });
            resizeApp(secondaryWindow.id, { width: secondaryWidth, height: secondaryHeight });

            // Position windows
            const xOffset = (viewportWidth - totalWidth) / 2;
            moveApp(mainWindow.id, {
                x: xOffset,
                y: (viewportHeight - mainHeight) / 2
            });
            moveApp(secondaryWindow.id, {
                x: xOffset + mainWidth,
                y: (viewportHeight - secondaryHeight) / 2
            });
        } else {
            // For more windows, use Fibonacci spiral layout
            const centerX = viewportWidth / 2;
            const centerY = viewportHeight / 2;

            visibleWindows.forEach((window, index) => {
                // Determine window size based on Fibonacci sequence
                const size = 300 / Math.sqrt(index + 1);
                const angle = index * (360 / goldenRatio) * (Math.PI / 180);
                const distance = 30 * Math.sqrt(index);

                const posX = centerX + Math.cos(angle) * distance - size / 2;
                const posY = centerY + Math.sin(angle) * distance - size / 2;

                // Limit within viewport
                const boundedX = Math.max(0, Math.min(viewportWidth - size, posX));
                const boundedY = Math.max(0, Math.min(viewportHeight - size, posY));

                resizeApp(window.id, { width: size * 2, height: size * 1.5 });
                moveApp(window.id, { x: boundedX, y: boundedY });

                // Slightly delay focusing to create a cascading effect
                setTimeout(() => {
                    focusApp(window.id);
                }, index * 100);
            });
        }
    }, [openWindows, moveApp, resizeApp, focusApp]);

    // Get app by path
    const getAppByPath = useCallback((path: string) => {
        return openWindows.find(window => window.path === path);
    }, [openWindows]);

    // Check if app is open
    const isAppOpen = useCallback((path: string) => {
        return openWindows.some(window => window.path === path);
    }, [openWindows]);

    const value = {
        openWindows,
        activeWindowId,
        openApp,
        closeApp,
        focusApp,
        moveApp,
        resizeApp,
        minimizeApp,
        restoreApp,
        closeAllApps,
        arrangeWindows,
        arrangeWindowsGoldenRatio,
        getAppByPath,
        isAppOpen
    };

    return (
        <AppWindowContext.Provider value={value}>
            {children}
        </AppWindowContext.Provider>
    );
};