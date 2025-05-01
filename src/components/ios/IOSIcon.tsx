import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Ban, Flame } from 'lucide-react';

interface IOSIconProps {
    name: string;
    icon: React.ReactNode;
    onClick: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    isJiggling?: boolean;
    isDisabled?: boolean;
    isHot?: boolean;
    className?: string;
}

export function IOSIcon({
    name,
    icon,
    onClick,
    onContextMenu,
    isJiggling = false,
    isDisabled,
    isHot = false,
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
                className,
                isJiggling ? 'animate-jiggle' : ''
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
                    "relative w-20 h-20 rounded-2xl shadow-md flex items-center justify-center",
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
                    className="w-full h-full flex items-center justify-center bg-gradient-to-br rounded-2xl overflow-hidden"
                >
                    {icon}
                    {isDisabled && (
                        <>
                            <div className="absolute inset-0 bg-black/30 rounded-2xl"></div>
                            <div className="absolute top-1 right-1 bg-gray-600/80 backdrop-blur-sm rounded-full p-0.5">
                                <Ban className="w-4 h-4 text-white/90" />
                            </div>
                        </>
                    )}
                </motion.div>

                {/* Hot indicator */}
                {isHot && (
                    <AnimatePresence>
                        <motion.div
                            className="absolute -top-3 -left-3 z-20"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: [0.95, 1.05, 0.95],
                                opacity: 1,
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                                scale: {
                                    repeat: Infinity,
                                    duration: 1.5
                                },
                                rotate: {
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "easeInOut"
                                }
                            }}
                        >
                            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-full p-1.5 shadow-lg border border-orange-300">
                                <Flame className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </motion.div>

            <motion.div
                className="mt-2 px-2 py-1 flex justify-center items-center w-full"
                animate={{
                    opacity: isPressed ? 0.7 : 1,
                    scale: isHovered ? 1.05 : 1.01
                }}
                transition={{
                    scale: { type: "spring", stiffness: 300, damping: 15 }
                }}
            >
                <span
                    className={cn(
                        "text-xs font-medium text-white text-center overflow-visible whitespace-nowrap",
                        isHot && "text-orange-300 font-semibold"
                    )}
                    style={{
                        textShadow: isHot
                            ? "0px 1px 1px rgba(255,100,0,0.6), 0px 1px 3px rgba(0,0,0,0.9)"
                            : "0px 1px 2px rgba(0,0,0,0.8)",
                        transform: "scale(var(--scale, 1))",
                        transformOrigin: "center",
                        wordBreak: "keep-all",
                        display: "inline-block",
                        width: "auto",
                        maxWidth: "none"
                    }}
                >
                    {name}
                    {isHot && (
                        <motion.span
                            className="ml-1 text-yellow-300"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{
                                duration: 1.3,
                                repeat: Infinity
                            }}
                        >
                            🔥
                        </motion.span>
                    )}
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