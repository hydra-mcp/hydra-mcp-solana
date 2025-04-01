import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IOSIconProps {
    name: string;
    icon: React.ReactNode;
    onClick: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    isJiggling?: boolean;
    className?: string;
}

export function IOSIcon({
    name,
    icon,
    onClick,
    onContextMenu,
    isJiggling = false,
    className
}: IOSIconProps) {
    const [isPressed, setIsPressed] = useState(false);
    const [isRightClicked, setIsRightClicked] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handlePress = (e: React.MouseEvent | React.TouchEvent) => {
        // If right-click, don't process press event
        if (e.type === 'mousedown' && (e as React.MouseEvent).button === 2) {
            return;
        }

        setIsPressed(true);

        // Add haptic feedback (if device supports it)
        if (navigator.vibrate) {
            navigator.vibrate(15);
        }
    };

    const handleRelease = (e: React.MouseEvent | React.TouchEvent) => {
        // If previously marked as right-clicked or in jiggling mode, don't execute click
        if (isRightClicked || isJiggling) {
            setIsRightClicked(false);
            setIsPressed(false);
            return;
        }

        // If mouse event and not left click, don't process
        if (e.type === 'mouseup' && (e as React.MouseEvent).button !== 0) {
            setIsPressed(false);
            return;
        }

        setIsPressed(false);
        onClick();
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Mark as right-clicked to prevent subsequent handleRelease from triggering click
        setIsRightClicked(true);
        setIsPressed(false);

        if (onContextMenu) {
            onContextMenu(e);
        }
    };

    // Handle mouse leave to reset states
    const handleMouseLeave = () => {
        if (isPressed) {
            setIsPressed(false);
        }
        setIsRightClicked(false);
        setIsHovered(false);
    };

    // Handle mouse enter
    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-24 h-32 cursor-pointer select-none",
                className
            )}
            onMouseDown={handlePress}
            onMouseUp={handleRelease}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            onTouchStart={handlePress}
            onTouchEnd={handleRelease}
            onContextMenu={handleContextMenu}
        >
            <motion.div
                className={cn(
                    "w-20 h-20 rounded-2xl shadow-md overflow-hidden flex items-center justify-center",
                    isPressed ? "shadow-sm" : "shadow-lg"
                )}
                animate={{
                    scale: isPressed ? 0.9 : isHovered ? 1.1 : 1,
                    y: isPressed ? 2 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15
                }}
                style={{
                    willChange: 'transform'
                }}
            >
                <motion.div
                    animate={{
                        rotate: isJiggling ? [-1, 1, -1] : 0
                    }}
                    transition={{
                        duration: 0.2,
                        repeat: isJiggling ? Infinity : 0,
                        repeatType: "mirror"
                    }}
                    className="w-full h-full flex items-center justify-center bg-gradient-to-br rounded-2xl"
                >
                    {icon}
                </motion.div>
            </motion.div>

            <motion.div
                className="mt-2 px-2 py-1 flex justify-center items-center w-full max-w-[90px]"
                animate={{
                    opacity: isPressed ? 0.7 : 1,
                    scale: isHovered ? 1.05 : 1.01
                }}
                transition={{
                    scale: { type: "spring", stiffness: 300, damping: 15 }
                }}
            >
                <span
                    className="text-xs font-medium text-white text-center truncate max-w-full"
                    style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.8)" }}
                >
                    {name}
                </span>
            </motion.div>

            {/* Delete button (shown in Jiggling mode) */}
            <AnimatePresence>
                {isJiggling && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md border border-red-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Add delete logic here
                        }}
                    >
                        <span className="text-white text-xs font-bold">×</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 