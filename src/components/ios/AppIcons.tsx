import { Wallet, MessageSquare, Settings, Image, Home, Search, Calendar, Mail } from 'lucide-react';
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
                    <Wallet className="w-7 h-7 text-white" />
                    <motion.div
                        className="text-[9px] text-white font-bold mt-0.5"
                        animate={{
                            y: [0, -1, 0, 1, 0],
                            opacity: [1, 0.9, 1, 0.9, 1]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "loop"
                        }}
                    >
                        AI
                    </motion.div>
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
            color="#8b5cf6"
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