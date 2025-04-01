import { useState, useEffect } from 'react';
import { Battery, Wifi, Signal, BatteryCharging, X } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface IOSStatusBarProps {
    transparent?: boolean;
}

// Battery API type definition
interface BatteryManager extends EventTarget {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

// Extend the Navigator interface
interface NavigatorWithBattery extends Navigator {
    getBattery(): Promise<BatteryManager>;
}

export function IOSStatusBar({ transparent = false }: IOSStatusBarProps) {
    const { isDarkMode } = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [batteryLevel, setBatteryLevel] = useState(85);
    const [isCharging, setIsCharging] = useState(false);
    const [batterySupported, setBatterySupported] = useState(true);
    const [chargingTime, setChargingTime] = useState<number | null>(null);
    const [dischargingTime, setDischargingTime] = useState<number | null>(null);
    const [showBatteryDetails, setShowBatteryDetails] = useState(false);

    // Prevent the right-click menu of the status bar
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    // Click the battery icon to show details
    const handleBatteryClick = () => {
        setShowBatteryDetails(prev => !prev);
    };

    // Close the battery details
    const closeBatteryDetails = () => {
        setShowBatteryDetails(false);
    };

    // Update time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    // Use Battery API to get battery status
    useEffect(() => {
        // Check if the browser supports the Battery API
        if ('getBattery' in navigator) {
            const nav = navigator as NavigatorWithBattery;

            const updateBatteryStatus = (battery: BatteryManager) => {
                // Update battery level
                setBatteryLevel(Math.round(battery.level * 100));
                // Update charging status
                setIsCharging(battery.charging);
                // Update charging/discharging time
                setChargingTime(battery.chargingTime);
                setDischargingTime(battery.dischargingTime);

                // Add battery event listener
                battery.addEventListener('levelchange', () => {
                    setBatteryLevel(Math.round(battery.level * 100));
                });

                battery.addEventListener('chargingchange', () => {
                    setIsCharging(battery.charging);
                });

                battery.addEventListener('chargingtimechange', () => {
                    setChargingTime(battery.chargingTime);
                });

                battery.addEventListener('dischargingtimechange', () => {
                    setDischargingTime(battery.dischargingTime);
                });
            };

            // Get initial battery status
            nav.getBattery().then(updateBatteryStatus).catch(error => {
                console.error("Battery API error:", error);
                setBatterySupported(false);
            });
        } else {
            // Browser does not support Battery API
            setBatterySupported(false);
            console.warn("Browser doesn't support Battery API");
        }
    }, []);

    // If the device does not support Battery API, use simulated data
    useEffect(() => {
        if (!batterySupported) {
            // Every 10 minutes, the battery decreases by 1%
            const batteryTimer = setInterval(() => {
                setBatteryLevel(prev => {
                    const newLevel = prev - 1;
                    return newLevel < 5 ? 85 : newLevel; // Reset when below 5%
                });
            }, 600000);

            return () => clearInterval(batteryTimer);
        }
    }, [batterySupported]);

    // Battery color based on battery level and charging status
    const getBatteryColor = () => {
        if (isCharging) return isDarkMode ? "text-green-500" : "text-green-700";
        if (batteryLevel <= 20) return "text-red-500";
        if (batteryLevel <= 50) return "text-yellow-500";
        return ""; // Default color
    };

    // Battery icon low battery variant animation
    const lowBatteryAnimation = batteryLevel <= 10 && !isCharging ? {
        opacity: [0.5, 1, 0.5],
        transition: {
            repeat: Infinity,
            duration: 2
        }
    } : {};

    // Charging animation variant
    const chargingAnimation = isCharging ? {
        scale: [1, 1.1, 1],
        transition: {
            repeat: Infinity,
            duration: 1.5
        }
    } : {};

    // Format time, convert seconds to hours and minutes
    const formatTime = (seconds: number): string => {
        if (seconds === Infinity || seconds <= 0) return "Unknown";

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}Hours${minutes > 0 ? ` ${minutes}Minutes` : ''}`;
        }
        return `${minutes}Minutes`;
    };

    return (
        <div
            className={cn(
                "fixed top-0 w-full flex items-center justify-between px-4 py-1 text-xs font-medium z-50 transition-colors duration-300",
                transparent
                    ? "bg-transparent"
                    : isDarkMode
                        ? "bg-black/80 backdrop-blur-md"
                        : "bg-white/80 backdrop-blur-md"
            )}
            onContextMenu={handleContextMenu}
        >
            {/* Left time */}
            <div className="font-semibold" onContextMenu={handleContextMenu}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Right status icons */}
            <div className="flex items-center gap-3" onContextMenu={handleContextMenu}>
                <Signal className="w-3.5 h-3.5" />
                <Wifi className="w-3.5 h-3.5" />
                <motion.div
                    className="flex items-center cursor-pointer"
                    animate={chargingAnimation}
                    onClick={handleBatteryClick}
                >
                    {isCharging ? (
                        <BatteryCharging className={cn("w-4 h-4", getBatteryColor())} />
                    ) : (
                        <motion.div animate={lowBatteryAnimation}>
                            <Battery className={cn("w-4 h-4", getBatteryColor())} />
                        </motion.div>
                    )}
                    <motion.span
                        className={cn("text-xs ml-0.5", getBatteryColor())}
                        animate={batteryLevel <= 10 && !isCharging ? lowBatteryAnimation : {}}
                    >
                        {batteryLevel}%
                    </motion.span>
                </motion.div>
            </div>

            {/* Battery details popup */}
            <AnimatePresence>
                {showBatteryDetails && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                            "absolute right-4 top-7 w-64 rounded-xl p-4 shadow-lg z-50",
                            isDarkMode
                                ? "bg-gray-800/90 backdrop-blur-lg border border-gray-700"
                                : "bg-white/90 backdrop-blur-lg border border-gray-200"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-medium">Battery Information</h3>
                            <button
                                onClick={closeBatteryDetails}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Battery</span>
                                <span className={getBatteryColor()}>{batteryLevel}%</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Status</span>
                                <span className={isCharging ? (isDarkMode ? "text-green-500" : "text-green-700") : ""}>
                                    {isCharging ? "Charging" : "Using Battery"}
                                </span>
                            </div>

                            {isCharging && chargingTime !== null && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Charging Complete</span>
                                    <span>{formatTime(chargingTime)}</span>
                                </div>
                            )}

                            {!isCharging && dischargingTime !== null && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Remaining Time</span>
                                    <span>{formatTime(dischargingTime)}</span>
                                </div>
                            )}

                            {/* Battery level graphic representation */}
                            <div className="mt-2 pt-1">
                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${batteryLevel}%` }}
                                        transition={{ duration: 1 }}
                                        className={cn(
                                            "h-full rounded-full",
                                            isCharging ? (isDarkMode ? "bg-green-500" : "bg-green-700") :
                                                batteryLevel <= 20 ? "bg-red-500" :
                                                    batteryLevel <= 50 ? "bg-yellow-500" :
                                                        "bg-blue-500"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 