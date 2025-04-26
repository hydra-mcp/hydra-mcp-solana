import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { useAppWindow } from '@/contexts/AppWindowContext';
import { createAppWindow } from '@/components/ios/AppRegistry';

interface DockItemProps {
    icon: React.ReactNode;
    name: string;
    path: string;
    onClick?: () => void;
    showLabel?: boolean;
}

interface IOSDockProps {
    items: DockItemProps[];
    showLabels?: boolean;
}

// Single Dock icon
const DockIcon = ({ icon, name, path, onClick, showLabel = false }: DockItemProps) => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { openApp } = useAppWindow();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (path) {
            // If the path is an anchor, navigate directly
            if (path === "#") {
                return;
            }

            // Determine appId from path (remove leading slash)
            const appId = path.startsWith('/') ? path.substring(1) : path;
            // Create app window and open it
            const appWindow = createAppWindow(appId);
            if (appWindow) {
                openApp(appWindow);
            } else {
                // If the corresponding app window definition is not found, fall back to traditional navigation
                navigate(path);
            }
        }
    };

    // Prevent the icon itself from showing the right-click menu
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    return (
        <motion.div
            whileHover={{
                scale: 1.2,
                y: -5
            }}
            whileTap={{ scale: 0.92 }}
            className="flex flex-col items-center justify-center mx-2 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onContextMenu={handleContextMenu}
        >
            <motion.div
                className="w-[60px] h-[60px] flex items-center justify-center rounded-2xl shadow-md overflow-hidden cursor-pointer"
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                style={{
                    boxShadow: isDarkMode
                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)'
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
                }}
            >
                <div
                    className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl"
                    onContextMenu={handleContextMenu}
                >
                    {icon}
                </div>
            </motion.div>

            {showLabel && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 0.95, scale: 1 }}
                    whileHover={{ opacity: 1, scale: 1.05 }}
                    className="mt-2 px-2 py-1 flex justify-center items-center w-auto min-w-[28px] max-w-[100px]"
                    style={{ position: 'absolute', bottom: '-28px', textShadow: "0px 1px 2px rgba(0,0,0,0.8)" }}
                    onContextMenu={handleContextMenu}
                >
                    <span
                        className="text-xs text-white font-medium whitespace-nowrap truncate"
                    >
                        {name}
                    </span>
                </motion.div>
            )}
        </motion.div>
    );
};

// Dock frosted glass background effect
const DockGlassBackground = ({ isDarkMode }: { isDarkMode: boolean }) => {
    // Prevent the background from showing the right-click menu
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    return (
        <div
            className="absolute inset-0 rounded-3xl overflow-hidden"
            onContextMenu={handleContextMenu}
        >
            <div className={cn(
                "absolute inset-0",
                isDarkMode
                    ? "bg-gray-800/60 backdrop-blur-xl"
                    : "bg-white/30 backdrop-blur-xl"
            )} />

            {/* Top highlight effect */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-[1px]",
                isDarkMode ? "bg-white/10" : "bg-white/50"
            )} />

            {/* Bottom shadow effect */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 h-[1px]",
                isDarkMode ? "bg-black/30" : "bg-black/5"
            )} />
        </div>
    );
};

export function IOSDock({ items, showLabels = false }: IOSDockProps) {
    const { isDarkMode } = useTheme();

    // Prevent the right-click menu of the Dock area
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    return (
        <div
            className="fixed bottom-4 inset-x-0 flex justify-center items-center z-40"
            onContextMenu={handleContextMenu}
        >
            <motion.div
                className={cn(
                    "inline-block py-3 px-4 rounded-3xl border relative",
                    showLabels ? "pb-12" : "pb-3"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{
                    borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                    boxShadow: isDarkMode
                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
                        : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                }}
                onContextMenu={handleContextMenu}
            >
                {/* Frosted glass background */}
                <DockGlassBackground isDarkMode={isDarkMode} />

                {/* Dock icons */}
                <div
                    className="relative flex items-center justify-center z-10"
                    onContextMenu={handleContextMenu}
                >
                    {items.map((item, index) => (
                        <DockIcon
                            key={index}
                            icon={item.icon}
                            name={item.name}
                            path={item.path}
                            onClick={item.onClick}
                            showLabel={showLabels}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
} 