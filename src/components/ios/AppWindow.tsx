import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useAppWindow, AppWindow as AppWindowType } from '@/contexts/AppWindowContext';

interface AppWindowProps {
    window: AppWindowType;
}

export const AppWindow: React.FC<AppWindowProps> = ({ window }) => {
    const { focusApp, closeApp, moveApp, resizeApp, activeWindowId } = useAppWindow();
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [prevSize, setPrevSize] = useState(window.size);
    const [prevPosition, setPrevPosition] = useState(window.position);

    const windowRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const resizeStartRef = useRef({ width: 0, height: 0, x: 0, y: 0 });

    // Handle click to focus
    const handleWindowClick = () => {
        focusApp(window.id);
    };

    // When the close button is hovered
    const [isCloseHovered, setIsCloseHovered] = useState(false);
    const [isMaximizeHovered, setIsMaximizeHovered] = useState(false);

    // Handle close button
    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        try {
            // Close the window directly, without using animation (ensure the close logic is executed)
            closeApp(window.id);
        } catch (error) {
            console.error('Error closing window:', error);
        }
    };

    // Handle fullscreen toggle
    const handleFullscreenToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        try {
            if (isFullscreen) {
                // Restore to the previous size and position
                moveApp(window.id, prevPosition);
                resizeApp(window.id, prevSize);
            } else {
                // Save the current size and position
                setPrevSize(window.size);
                setPrevPosition(window.position);

                // Set to maximized (use 95% of viewport size, with some margin)
                const viewportWidth = globalThis.window.innerWidth * 0.95;
                const viewportHeight = globalThis.window.innerHeight * 0.95;
                moveApp(window.id, {
                    x: (globalThis.window.innerWidth - viewportWidth) / 2,
                    y: (globalThis.window.innerHeight - viewportHeight) / 2
                });
                resizeApp(window.id, { width: viewportWidth, height: viewportHeight });
            }

            // Toggle fullscreen state
            setIsFullscreen(!isFullscreen);
        } catch (error) {
            console.error('Error toggling fullscreen state:', error);
        }
    };

    // Handle window drag start
    const handleDragStart = (e: React.MouseEvent) => {
        // If it's the control button area, do not handle the drag
        const target = e.target as HTMLElement;

        // Find the nearest parent element with the window-controls class
        const isControlElement = target.closest('.window-controls') !== null;

        // If it's the control button area, do not trigger the drag
        if (isControlElement) {
            return;
        }

        // Fullscreen mode does not allow dragging
        if (isFullscreen) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        // Immediately update the window style to enhance the drag effect response
        setIsDragging(true);

        // Record the drag start position
        dragStartRef.current = {
            x: e.clientX - window.position.x,
            y: e.clientY - window.position.y
        };

        // Trigger focus - performance optimization: only call focusApp when the window is not the current active window
        if (activeWindowId !== window.id) {
            focusApp(window.id);
        }
    };

    // Add touch support for the title bar
    const handleTouchStart = (e: React.TouchEvent) => {
        // If it's the control button area, do not handle the drag
        const target = e.target as HTMLElement;

        // Find the nearest parent element with the window-controls class
        const isControlElement = target.closest('.window-controls') !== null;

        // If it's the control button area, do not trigger the drag
        if (isControlElement) {
            return;
        }

        // Fullscreen mode does not allow dragging
        if (isFullscreen) return;

        // Get the first touch point
        if (e.touches.length === 1) {
            const touch = e.touches[0];

            e.preventDefault();
            e.stopPropagation();

            // Immediately update the window style to enhance the drag effect response
            setIsDragging(true);

            // Record the drag start position
            dragStartRef.current = {
                x: touch.clientX - window.position.x,
                y: touch.clientY - window.position.y
            };

            // Trigger focus - performance optimization: only call focusApp when the window is not the current active window
            if (activeWindowId !== window.id) {
                focusApp(window.id);
            }
        }
    };

    // Handle resize start
    const handleResizeStart = (e: React.MouseEvent) => {
        if (isFullscreen) return; // Fullscreen mode does not allow resizing

        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStartRef.current = {
            width: Number(window.size.width),
            height: Number(window.size.height),
            x: e.clientX,
            y: e.clientY
        };

        // Trigger focus
        focusApp(window.id);
    };

    // Touch resize start
    const handleResizeTouchStart = (e: React.TouchEvent) => {
        if (isFullscreen) return; // Fullscreen mode does not allow resizing

        if (e.touches.length === 1) {
            const touch = e.touches[0];

            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
            resizeStartRef.current = {
                width: Number(window.size.width),
                height: Number(window.size.height),
                x: touch.clientX,
                y: touch.clientY
            };

            // Trigger focus
            focusApp(window.id);
        }
    };

    // Resize visual indicator
    const [showResizeIndicator, setShowResizeIndicator] = useState(false);

    // Show resize indicator
    const handleResizeHandleMouseEnter = () => {
        setShowResizeIndicator(true);
    };

    // Hide resize indicator
    const handleResizeHandleMouseLeave = () => {
        if (!isResizing) {
            setShowResizeIndicator(false);
        }
    };

    // Hide resize indicator when resizing ends
    useEffect(() => {
        if (!isResizing) {
            setShowResizeIndicator(false);
        }
    }, [isResizing]);

    // Set up global mouse move and up handlers for dragging and resizing
    useEffect(() => {
        let animationFrameId: number | null = null;
        let lastPositionX = window.position.x;
        let lastPositionY = window.position.y;
        let lastWidth = Number(window.size.width);
        let lastHeight = Number(window.size.height);
        let lastMoveTime = 0;

        // Use requestAnimationFrame to optimize drag performance
        const updateWindowPosition = (x: number, y: number) => {
            if (Math.abs(x - lastPositionX) < 0.5 && Math.abs(y - lastPositionY) < 0.5) {
                return; // If the change is too small, ignore it
            }

            lastPositionX = x;
            lastPositionY = y;
            moveApp(window.id, { x, y });
        };

        const updateWindowSize = (width: number, height: number) => {
            if (Math.abs(width - Number(lastWidth)) < 0.5 && Math.abs(height - Number(lastHeight)) < 0.5) {
                return; // If the change is too small, ignore it
            }

            lastWidth = width;
            lastHeight = height;
            resizeApp(window.id, { width, height });
        };

        // Handle mouse move events
        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            // Frame rate control - update every 16.6ms (approximately 60fps)
            if (now - lastMoveTime < 16) return;
            lastMoveTime = now;

            if (isDragging) {
                const newX = e.clientX - dragStartRef.current.x;
                const newY = e.clientY - dragStartRef.current.y;

                // Get viewport width and height
                const viewportWidth = globalThis.window.innerWidth;
                const viewportHeight = globalThis.window.innerHeight;

                // Calculate window boundaries
                const minX = -Number(window.size.width) / 2;
                const maxX = viewportWidth - Number(window.size.width) / 2;
                const minY = 0;
                const maxY = viewportHeight - 40;

                // Apply boundary limits
                const boundedX = Math.max(minX, Math.min(maxX, newX));
                const boundedY = Math.max(minY, Math.min(maxY, newY));

                // Remove elastic effect, use exact position to get a more accurate drag experience

                // Use requestAnimationFrame to update the DOM
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }

                animationFrameId = requestAnimationFrame(() => {
                    updateWindowPosition(boundedX, boundedY);
                    animationFrameId = null;
                });
            }

            if (isResizing) {
                const deltaX = e.clientX - resizeStartRef.current.x;
                const deltaY = e.clientY - resizeStartRef.current.y;

                // Get viewport width and height
                const viewportWidth = globalThis.window.innerWidth;
                const viewportHeight = globalThis.window.innerHeight;

                // Calculate new width and height, considering viewport boundaries
                const newWidth = Math.min(
                    viewportWidth - window.position.x + 100,
                    Math.max(300, resizeStartRef.current.width + deltaX)
                );

                const newHeight = Math.min(
                    viewportHeight - window.position.y + 100,
                    Math.max(200, resizeStartRef.current.height + deltaY)
                );

                // Use requestAnimationFrame to update the DOM
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }

                animationFrameId = requestAnimationFrame(() => {
                    updateWindowSize(newWidth, newHeight);
                    animationFrameId = null;
                });
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                // If the window position exceeds a reasonable range after dragging, adjust it to a reasonable position
                const viewportWidth = globalThis.window.innerWidth;
                const viewportHeight = globalThis.window.innerHeight;

                // Ensure the title bar is always visible
                if (window.position.y < 0) {
                    moveApp(window.id, { ...window.position, y: 0 });
                } else if (window.position.y > viewportHeight - 40) {
                    moveApp(window.id, { ...window.position, y: viewportHeight - 40 });
                }

                // Ensure the window does not completely disappear outside the viewport
                if (window.position.x > viewportWidth - 40) {
                    moveApp(window.id, { ...window.position, x: viewportWidth - 40 });
                } else if (window.position.x < -Number(window.size.width) + 40) {
                    moveApp(window.id, { ...window.position, x: -Number(window.size.width) + 40 });
                }
            }

            // Cancel all ongoing animation frames
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            setIsDragging(false);
            setIsResizing(false);
        };

        // Add touch event support
        const handleTouchMove = (e: TouchEvent) => {
            const now = Date.now();
            // Frame rate control
            if (now - lastMoveTime < 16) return;
            lastMoveTime = now;

            if (isDragging && e.touches.length === 1) {
                const touch = e.touches[0];
                const newX = touch.clientX - dragStartRef.current.x;
                const newY = touch.clientY - dragStartRef.current.y;

                // Get viewport width and height
                const viewportWidth = globalThis.window.innerWidth;
                const viewportHeight = globalThis.window.innerHeight;

                // Calculate window boundaries
                const minX = -Number(window.size.width) / 2;
                const maxX = viewportWidth - Number(window.size.width) / 2;
                const minY = 0;
                const maxY = viewportHeight - 40;

                // Apply boundary limits
                const boundedX = Math.max(minX, Math.min(maxX, newX));
                const boundedY = Math.max(minY, Math.min(maxY, newY));

                // Use requestAnimationFrame to update the DOM
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }

                animationFrameId = requestAnimationFrame(() => {
                    updateWindowPosition(boundedX, boundedY);
                    animationFrameId = null;
                });

                // Prevent page scrolling
                e.preventDefault();
            }

            if (isResizing && e.touches.length === 1) {
                const touch = e.touches[0];
                const deltaX = touch.clientX - resizeStartRef.current.x;
                const deltaY = touch.clientY - resizeStartRef.current.y;

                const newWidth = Math.max(300, resizeStartRef.current.width + deltaX);
                const newHeight = Math.max(200, resizeStartRef.current.height + deltaY);

                // Use requestAnimationFrame to update the DOM
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }

                animationFrameId = requestAnimationFrame(() => {
                    updateWindowSize(newWidth, newHeight);
                    animationFrameId = null;
                });

                // Prevent page scrolling
                e.preventDefault();
            }
        };

        const handleTouchEnd = () => {
            // Cancel all ongoing animation frames
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove, { passive: true });
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
            document.addEventListener('touchcancel', handleTouchEnd);

            // Add cursor style to body
            if (isDragging) {
                document.body.style.cursor = 'move';
            } else if (isResizing) {
                document.body.style.cursor = 'nwse-resize';
            }
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);

            // Restore default cursor
            document.body.style.cursor = '';
        };
    }, [isDragging, isResizing, window.id, moveApp, resizeApp, isFullscreen, window.position, window.size]);

    // Double-click the title bar to maximize/restore the window
    const handleHeaderDoubleClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('window-header')) {
            handleFullscreenToggle(e);
        }
    };

    return (
        <motion.div
            ref={windowRef}
            className={cn(
                "absolute rounded-xl overflow-hidden shadow-2xl backdrop-blur-md border",
                "bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700",
                isFullscreen && "transition-all duration-300",
                isDragging && "shadow-xl transform-gpu will-change-transform"
            )}
            style={{
                left: window.position.x,
                top: window.position.y,
                width: window.size.width,
                height: window.size.height,
                zIndex: window.zIndex,
                transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
                transform: 'translate3d(0,0,0)', // Force hardware acceleration
            }}
            onClick={handleWindowClick}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: 1,
                rotate: 0, // Remove tilt effect
            }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
        >
            {/* Window header with title and controls */}
            <div
                className={cn(
                    "window-header h-9 flex items-center relative px-3 cursor-move",
                    "bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
                    "z-50 absolute top-0 left-0 right-0",
                    isDragging && "bg-gray-200/90 dark:bg-gray-800/90"
                )}
                onMouseDown={handleDragStart}
                onTouchStart={handleTouchStart}
                onDoubleClick={handleHeaderDoubleClick}
            >
                {/* Control button container */}
                <div
                    className="window-controls flex space-x-2 absolute left-3 top-1/2 transform -translate-y-1/2 z-50"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <div
                        className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center",
                            "bg-red-500 hover:bg-red-600 transition-colors duration-150 cursor-pointer"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleClose(e);
                        }}
                        title="Close"
                        onMouseEnter={() => setIsCloseHovered(true)}
                        onMouseLeave={() => setIsCloseHovered(false)}
                    >
                        {(isCloseHovered || window.id === activeWindowId) && (
                            <X className="w-2.5 h-2.5 text-red-800" />
                        )}
                    </div>

                    {/* Maximize/restore button */}
                    <div
                        className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center",
                            "bg-green-500 hover:bg-green-600 transition-colors duration-150 cursor-pointer"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleFullscreenToggle(e);
                        }}
                        title={isFullscreen ? "Restore" : "Maximize"}
                        onMouseEnter={() => setIsMaximizeHovered(true)}
                        onMouseLeave={() => setIsMaximizeHovered(false)}
                    >
                        {(isMaximizeHovered || window.id === activeWindowId) && (
                            isFullscreen ? (
                                <Minimize2 className="w-2.5 h-2.5 text-green-800" />
                            ) : (
                                <Maximize2 className="w-2.5 h-2.5 text-green-800" />
                            )
                        )}
                    </div>
                </div>

                {/* Title */}
                <div className="window-header-title w-full text-center cursor-move">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {window.title}
                    </span>
                </div>
            </div>

            {/* Window content */}
            <div
                className={cn(
                    "absolute inset-0 pt-9 overflow-auto z-20",
                    isDragging && "pointer-events-none", // When dragging, disable interaction with the content area to avoid accidental clicks
                    isResizing && "pointer-events-none" // Also disable interaction with the content area when resizing
                )}
                onClick={(e) => e.stopPropagation()} // When clicking on the content area, prevent the entire window from being clicked
            >
                {window.content}
            </div>

            {/* Resize handle - Hide the resize handle when fullscreen */}
            {!isFullscreen && (
                <div
                    className={cn(
                        "absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize",
                        (showResizeIndicator || isResizing) && "bg-gray-200/50 dark:bg-gray-700/50 rounded-tl-md"
                    )}
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeTouchStart}
                    onMouseEnter={handleResizeHandleMouseEnter}
                    onMouseLeave={handleResizeHandleMouseLeave}
                >
                    <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        className={cn(
                            "absolute bottom-1 right-1 fill-current",
                            isResizing ? "text-primary" : "text-gray-400",
                            "transition-colors duration-200"
                        )}
                    >
                        <rect x="0" y="8" width="2" height="2" />
                        <rect x="4" y="8" width="2" height="2" />
                        <rect x="8" y="8" width="2" height="2" />
                        <rect x="4" y="4" width="2" height="2" />
                        <rect x="8" y="4" width="2" height="2" />
                        <rect x="8" y="0" width="2" height="2" />
                    </svg>
                </div>
            )}

            {/* Resize indicator - Display when resizing */}
            {isResizing && (
                <div className="absolute inset-0 pointer-events-none border-2 border-primary/30 rounded-xl z-50"></div>
            )}
        </motion.div>
    );
}; 