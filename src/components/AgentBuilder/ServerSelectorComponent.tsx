import React, { useState, useEffect } from 'react';
import { Download, Loader2, Check, Package, Trash2, Star, ExternalLink, ServerIcon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { ServerItem, fetchServers } from '@/lib/appStoreService';
import { motion } from 'framer-motion';

interface ServerSelectorComponentProps {
    title?: string;
    className?: string;
    selectedServers: string[];
    onServerSelect: (selectedServers: string[]) => void;
    maxSelections?: number;
}

const ServerSelectorComponent: React.FC<ServerSelectorComponentProps> = ({
    title = "Select Servers",
    className,
    selectedServers,
    onServerSelect,
    maxSelections = 5
}) => {
    const { isDarkMode } = useTheme();
    const [servers, setServers] = useState<ServerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch servers on component mount
    useEffect(() => {
        const loadServers = async () => {
            setLoading(true);
            setError(null);

            try {
                const serversData = await fetchServers();
                setServers(serversData);
            } catch (err) {
                setError('Failed to load servers');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadServers();
    }, []);

    // Handle server selection
    const handleServerSelect = (serverId: string) => {
        if (selectedServers.includes(serverId)) {
            // Remove server if already selected
            onServerSelect(selectedServers.filter(id => id !== serverId));
        } else if (selectedServers.length < maxSelections) {
            // Add server if under the maximum limit
            onServerSelect([...selectedServers, serverId]);
        }
    };

    return (
        <div className={cn(
            "h-full flex flex-col",
            isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900",
            className
        )}>
            <div className="border-b px-4 py-3 flex items-center justify-between dark:border-gray-700">
                <h1 className="text-lg font-semibold">{title}</h1>
                <ServerIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>

            {/* Error Message */}
            {error && (
                <div className={cn(
                    "m-4 p-3 rounded-lg border text-center",
                    isDarkMode
                        ? "bg-red-900/20 border-red-800 text-red-200"
                        : "bg-red-50 border-red-200 text-red-600"
                )}>
                    {error}
                </div>
            )}

            {/* Selection limit warning */}
            {selectedServers.length >= maxSelections && (
                <div className={cn(
                    "m-4 p-3 rounded-lg border text-center",
                    isDarkMode
                        ? "bg-yellow-900/20 border-yellow-800 text-yellow-200"
                        : "bg-yellow-50 border-yellow-200 text-yellow-600"
                )}>
                    Maximum of {maxSelections} servers can be selected
                </div>
            )}

            {/* Server List */}
            <div className="flex-1 p-4 overflow-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading servers...</p>
                    </div>
                ) : servers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <ServerIcon className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No servers available</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {servers.map(server => (
                            <div
                                key={server.id}
                                onClick={() => handleServerSelect(server.id)}
                                className={cn(
                                    "rounded-lg p-4 border flex items-start cursor-pointer",
                                    isDarkMode
                                        ? selectedServers.includes(server.id)
                                            ? "border-blue-500 bg-blue-900/20"
                                            : "border-gray-700 bg-gray-800 hover:bg-gray-750"
                                        : selectedServers.includes(server.id)
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 bg-white hover:bg-gray-50"
                                )}
                            >
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 mr-4 flex items-center justify-center">
                                    {/* Server icon */}
                                    {server.icon ? (
                                        <img
                                            src={server.icon}
                                            alt={server.name}
                                            className="w-full h-full object-cover rounded-xl"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={cn("text-3xl text-white font-bold", server.icon ? "hidden" : "")}>
                                        {server.name.substring(0, 1)}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-medium">{server.name}</h3>
                                        {selectedServers.includes(server.id) && (
                                            <div className="flex items-center gap-2">
                                                <motion.div
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                    className="flex items-center justify-center h-7 px-2 rounded-md bg-green-100 dark:bg-green-900/30"
                                                >
                                                    <Check className="w-4 h-4 text-green-500 dark:text-green-400 mr-1" />
                                                    <span className="text-xs font-medium text-green-700 dark:text-green-400">Selected</span>
                                                </motion.div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-2">
                                        {server.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selection summary */}
            <div className="border-t px-4 py-3 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedServers.length} of {maxSelections} servers selected
                </p>
            </div>
        </div>
    );
};

export default ServerSelectorComponent; 