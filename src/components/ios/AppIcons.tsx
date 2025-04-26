import { Wallet, MessageSquare, Settings, Image, Home, Search, Calendar, Mail, BarChart, DollarSign, CreditCard, Zap, SunMoon, Grid, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Icon base component
interface AppIconBaseProps {
    color: string;
    secondaryColor?: string;
    icon: React.ReactNode;
    className?: string;
}

export const AppIconBase = ({ color, secondaryColor, icon, className }: AppIconBaseProps) => {
    return (
        <div
            className={cn(
                "w-full h-full flex items-center justify-center rounded-2xl overflow-hidden",
                className
            )}
            style={{
                background: secondaryColor
                    ? `linear-gradient(135deg, ${color}, ${secondaryColor})`
                    : color
            }}
        >
            <div className="flex items-center justify-center">
                {icon}
            </div>
        </div>
    );
};

// WalletFinder icon
export const WalletFinderIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#2563eb"
            secondaryColor="#3b82f6"
            className={className}
            icon={
                <div className="flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ scale: 1 }}
                        animate={{
                            scale: [1, 1.05, 1],
                            y: [0, -1, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut"
                        }}
                    >
                        <Wallet className="w-7 h-7 text-white" />
                    </motion.div>
                    <div className="relative">
                        <motion.div
                            className="text-[9px] text-white font-bold mt-0.5"
                            animate={{
                                opacity: [1, 0.8, 1]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatType: "loop"
                            }}
                        >
                            AI
                        </motion.div>
                        <motion.div
                            className="absolute -right-3 -top-1"
                            animate={{
                                opacity: [0, 0.7, 0],
                                x: [0, 5, 10],
                                y: [-2, -5, -8]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "easeOut"
                            }}
                        >
                            <div className="w-1 h-1 bg-white rounded-full" />
                        </motion.div>
                        <motion.div
                            className="absolute -left-3 -top-1"
                            animate={{
                                opacity: [0, 0.7, 0],
                                x: [0, -5, -10],
                                y: [-2, -5, -8]
                            }}
                            transition={{
                                duration: 2,
                                delay: 0.5,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "easeOut"
                            }}
                        >
                            <div className="w-1 h-1 bg-white rounded-full" />
                        </motion.div>
                    </div>
                </div>
            }
        />
    );
};

// Settings icon
export const SettingsIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#64748b"
            secondaryColor="#475569"
            className={className}
            icon={
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    <Settings className="w-9 h-9 text-white" />
                </motion.div>
            }
        />
    );
};

// theme icon
export const ThemeIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#8b5cf6"
            secondaryColor="#a78bfa"
            className={className}
            icon={
                <div className="relative">
                    <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 180 }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                        }}
                    >
                        <div className="flex items-center justify-center">
                            <motion.div
                                className="absolute w-9 h-9 rounded-full"
                                initial={{ background: "linear-gradient(to right, #fbbf24, #f59e0b)" }}
                                animate={{ background: "linear-gradient(to right, #3b82f6, #2563eb)" }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    ease: "easeInOut"
                                }}
                                style={{ opacity: 0.3 }}
                            />
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.8, 1, 0.8]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <SunMoon className="w-9 h-9 text-white" />
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Floating stars/particles */}
                    <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full"
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0.8, 1.2, 0.8],
                            y: [-2, -4, -2]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute bottom-0 -left-1 w-1.5 h-1.5 bg-blue-300 rounded-full"
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0.8, 1.2, 0.8],
                            x: [-1, -3, -1]
                        }}
                        transition={{
                            duration: 2.5,
                            delay: 0.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            }
        />
    );
};

// Messages icon
export const MessagesIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#16a34a"
            secondaryColor="#22c55e"
            className={className}
            icon={
                <div className="relative">
                    <MessageSquare className="w-9 h-9 text-white" />
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">3</span>
                    </div>
                </div>
            }
        />
    );
};

// Photos icon
export const PhotosIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#f97316"
            secondaryColor="#fb923c"
            className={className}
            icon={
                <div className="flex items-center justify-center">
                    <div className="absolute transform rotate-12">
                        <Image className="w-7 h-7 text-white/80" />
                    </div>
                    <Image className="w-8 h-8 text-white" />
                </div>
            }
        />
    );
};

// Home icon
export const HomeIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#8df4f2"
            secondaryColor="#a78bfa"
            className={className}
            icon={
                <Home className="w-9 h-9 text-white" />
            }
        />
    );
};

// Search icon
export const SearchIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#ec4899"
            secondaryColor="#f472b6"
            className={className}
            icon={
                <Search className="w-9 h-9 text-white" />
            }
        />
    );
};

// Calendar icon
export const CalendarIcon = ({ className, day }: { className?: string, day?: number }) => {
    const today = day || new Date().getDate();

    return (
        <AppIconBase
            color="#ffffff"
            className={className}
            icon={
                <div className="flex flex-col items-center w-full">
                    <div className="text-xs font-medium text-red-500 -mb-1">
                        {new Date().toLocaleString('default', { weekday: 'short' })}
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {today}
                    </div>
                </div>
            }
        />
    );
};

// Mail icon
export const MailIcon = ({ className, count = 9 }: { className?: string, count?: number }) => {
    return (
        <AppIconBase
            color="#3b82f6"
            className={className}
            icon={
                <div className="relative">
                    <Mail className="w-9 h-9 text-white" />
                    {count > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-red-500 flex items-center justify-center px-1">
                            <span className="text-[10px] font-bold text-white">{count > 99 ? "99+" : count}</span>
                        </div>
                    )}
                </div>
            }
        />
    );
};

// CA Signal icon
export const CASignalIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#4f46e5"
            secondaryColor="#6366f1"
            className={className}
            icon={
                <motion.div
                    className="relative"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                >
                    <div className="flex flex-col items-center justify-center">
                        <div className="flex h-6 items-end space-x-1">
                            <div className="w-1 h-1 bg-white rounded-sm"></div>
                            <div className="w-1 h-2 bg-white rounded-sm"></div>
                            <div className="w-1 h-3 bg-white rounded-sm"></div>
                            <div className="w-1 h-4 bg-white rounded-sm"></div>
                        </div>
                    </div>
                </motion.div>
            }
        />
    );
};

export const SmartWalletIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#10b981"
            secondaryColor="#34d399"
            className={className}
            icon={
                <div className="relative">
                    <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: [-2, 2, -2] }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Wallet className="w-9 h-9 text-white" />
                    </motion.div>

                    {/* money animation effect */}
                    <motion.div
                        className="absolute top-1 right-1"
                        initial={{ opacity: 0, scale: 0.5, x: -5, y: 10 }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.5],
                            x: [-5, 5, 15],
                            y: [10, 0, -10]
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            repeatDelay: 1
                        }}
                    >
                        <div className="w-2 h-2 bg-yellow-300 rounded-full shadow-glow-sm" />
                    </motion.div>

                    {/* smart connection line effect */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.7, 0] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 1
                        }}
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-white/30 border-dashed" />
                    </motion.div>

                    {/* smart wallet identifier */}
                    {/* <motion.div
                        className="absolute -bottom-1 -right-1 bg-white/20 backdrop-blur-sm px-1 rounded text-[8px] font-bold text-white"
                        animate={{
                            opacity: [0.7, 1, 0.7],
                            scale: [0.95, 1, 0.95]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        smart
                    </motion.div> */}
                </div>
            }
        />
    );
};

export const DeepSearchIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#5ed7ea"
            secondaryColor="#60a5fa"
            className={className}
            icon={
                <motion.div
                    className="relative"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                >
                    <Search className="w-9 h-9 text-white" />
                    <motion.div
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center"
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    >
                        <motion.div
                            className="w-2 h-2 bg-blue-500 rounded-full"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.7, 1, 0.7]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.div>
                </motion.div>
            }
        />
    );
};

export const RechargeIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#F7931A"  // Bitcoin orange color
            secondaryColor="#9945FF"  // Solana purple color
            className={className}
            icon={
                <div className="relative">
                    {/* Main Icon */}
                    <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut"
                        }}
                    >
                        <Zap className="w-9 h-9 text-white" />
                    </motion.div>

                    {/* Floating Solana */}
                    <motion.div
                        className="absolute -top-1 -left-2"
                        animate={{
                            y: [-5, -10, -5],
                            x: [0, -3, 0]
                        }}
                        transition={{
                            duration: 3,
                            delay: 0.5,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut"
                        }}
                    >
                        <div className="w-5 h-5 bg-[#9945FF] rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                            S
                        </div>
                    </motion.div>

                    {/* Recharge Effect Circle */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.7, 0] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "loop"
                        }}
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-white/40 border-dashed" />
                    </motion.div>

                    {/* Incoming Coin Animation */}
                    <motion.div
                        className="absolute inset-x-0 bottom-0 flex justify-center"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{
                            y: [20, 0, 0],
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.8]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 1
                        }}
                    >
                        <DollarSign className="w-4 h-4 text-white/80" />
                    </motion.div>
                </div>
            }
        />
    );
};

export const AppStoreIcon = ({ className }: { className?: string }) => {
    return (
        <AppIconBase
            color="#0ea5e9"
            secondaryColor="#38bdf8"
            className={className}
            icon={
                <div className="relative">
                    {/* Main Icon */}
                    <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut"
                        }}
                    >
                        <Store className="w-9 h-9 text-white" />
                    </motion.div>

                    {/* New Badge */}
                    <motion.div
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                        initial={{ scale: 0.8 }}
                        animate={{
                            scale: [0.8, 1, 0.8],
                            rotate: [0, 5, 0, -5, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <span className="text-[8px] font-bold text-white">new</span>
                    </motion.div>
                </div>
            }
        />
    );
};

