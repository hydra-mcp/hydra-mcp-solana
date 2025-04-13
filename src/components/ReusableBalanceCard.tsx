import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ReusableBalanceCardProps {
    icon: React.ReactElement;
    title: string;
    balance: number;
    currency?: string;
    description?: string;
    color: string;
    secondaryColor?: string;
    className?: string;
}

export const ReusableBalanceCard: React.FC<ReusableBalanceCardProps> = ({
    icon,
    title,
    balance,
    currency = "SOL",
    description,
    color,
    secondaryColor,
    className = ''
}) => {
    // Format balance to display nicely
    const formatBalance = (amount: number): string => {
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 6
        });
    };

    const gradientStyle = secondaryColor
        ? `from-${color}/5 to-${secondaryColor}/10`
        : `from-${color}/5 to-${color}/10`;

    return (
        <div className={`relative overflow-hidden rounded-lg border bg-gradient-to-r ${gradientStyle} p-4 ${className}`}>
            {/* Header with icon and title */}
            <div className="flex items-center mb-2">
                <motion.div
                    className="mr-2"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "easeInOut"
                    }}
                >
                    {React.cloneElement(icon, { className: `w-4 h-4 text-[${color}]` })}
                </motion.div>
                <span className="text-sm font-medium">{title}</span>
            </div>

            {/* Balance display */}
            <div className="flex items-center">
                <div className={`text-xl font-bold text-[${color}]`}>
                    {formatBalance(balance)} <span className="text-base">{currency}</span>
                </div>
            </div>

            {/* Description text */}
            {description && (
                <div className="mt-1 text-xs text-gray-500">
                    {description}
                </div>
            )}

            {/* Background decorative icon */}
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
                {React.cloneElement(icon, { className: `w-full h-full text-[${color}]` })}
            </div>

            {/* Animated particle effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className={`absolute w-1 h-1 rounded-full bg-[${color}]/20`}
                        initial={{
                            x: `${(i + 1) * 25}%`,
                            y: '100%',
                            opacity: 0
                        }}
                        animate={{
                            y: '-100%',
                            opacity: [0, 0.3, 0]
                        }}
                        transition={{
                            duration: 2 + i,
                            repeat: Infinity,
                            delay: i * 0.5,
                            repeatDelay: 1
                        }}
                    />
                ))}
            </div>
        </div>
    );
}; 