import { motion } from 'framer-motion';
import { WalletIcon, UserIcon } from 'lucide-react';

interface LoginTabsProps {
    activeTab: 'wallet' | 'password';
    onTabChange: (tab: 'wallet' | 'password') => void;
}

export function LoginTabs({ activeTab, onTabChange }: LoginTabsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center bg-white/5 backdrop-blur-sm rounded-lg p-1 mb-6"
        >
            <button
                onClick={() => onTabChange('wallet')}
                className={`flex items-center justify-center w-1/2 py-2 rounded ${activeTab === 'wallet'
                        ? 'bg-purple-600 text-white'
                        : 'bg-transparent text-gray-300 hover:text-white hover:bg-white/5'
                    } transition-colors relative`}
            >
                <WalletIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Wallet</span>

                {/* Active indicator dot */}
                {activeTab === 'wallet' && (
                    <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                )}
            </button>

            <button
                onClick={() => onTabChange('password')}
                className={`flex items-center justify-center w-1/2 py-2 rounded ${activeTab === 'password'
                        ? 'bg-blue-600 text-white'
                        : 'bg-transparent text-gray-300 hover:text-white hover:bg-white/5'
                    } transition-colors relative`}
            >
                <UserIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Password</span>

                {/* Active indicator dot */}
                {activeTab === 'password' && (
                    <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                )}
            </button>
        </motion.div>
    );
} 