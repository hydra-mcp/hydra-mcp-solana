import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

interface IOSNavBarProps {
    title: string;
    onBack?: () => void;
    rightElement?: React.ReactNode;
    transparent?: boolean;
    largeTitleMode?: boolean;
}

export function IOSNavBar({
    title,
    onBack,
    rightElement,
    transparent = false,
    largeTitleMode = false
}: IOSNavBarProps) {
    const { isDarkMode } = useTheme();

    return (
        <>
            {/* Standard navigation bar */}
            <div
                className={cn(
                    "fixed top-0 w-full z-40 px-4 flex items-center justify-between border-b transition-colors duration-300",
                    largeTitleMode ? "h-12" : "h-14",
                    transparent
                        ? "bg-transparent border-transparent"
                        : isDarkMode
                            ? "bg-black/80 backdrop-blur-xl border-gray-800/80"
                            : "bg-white/80 backdrop-blur-xl border-gray-200/80"
                )}
            >
                {/* Left button area */}
                <div className="w-24 flex items-center justify-start">
                    {onBack && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onBack}
                            className="flex items-center text-blue-500 py-2"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm">Back</span>
                        </motion.button>
                    )}
                </div>

                {/* Middle title area - Display when not in large title mode */}
                {!largeTitleMode && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 text-base font-semibold truncate max-w-[50%]">
                        {title}
                    </div>
                )}

                {/* Right button area */}
                <div className="w-24 flex items-center justify-end">
                    {rightElement}
                </div>
            </div>

            {/* Title area displayed in large title mode */}
            {largeTitleMode && (
                <div
                    className={cn(
                        "fixed top-12 w-full z-30 px-4 pb-2 pt-3 transition-colors duration-300",
                        transparent
                            ? "bg-transparent"
                            : isDarkMode
                                ? "bg-black/80 backdrop-blur-xl"
                                : "bg-white/80 backdrop-blur-xl"
                    )}
                >
                    <h1 className="text-3xl font-bold">{title}</h1>
                </div>
            )}
        </>
    );
} 