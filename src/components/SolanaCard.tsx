import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SolanaCardProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
}

export const SolanaCard: React.FC<SolanaCardProps> = ({
    title,
    icon,
    children,
    footer,
    className = '',
    variant = 'default'
}) => {
    // Set different colors based on different variants
    const getColors = () => {
        switch (variant) {
            case 'success':
                return {
                    bg: 'from-green-500/10 to-[#9945FF]/10',
                    border: 'border-green-500/20',
                    title: 'text-green-600',
                    glow: 'from-green-500/20 to-[#9945FF]/20'
                };
            case 'error':
                return {
                    bg: 'from-red-500/10 to-[#9945FF]/10',
                    border: 'border-red-500/20',
                    title: 'text-red-600',
                    glow: 'from-red-500/20 to-[#9945FF]/20'
                };
            case 'warning':
                return {
                    bg: 'from-yellow-500/10 to-[#9945FF]/10',
                    border: 'border-yellow-500/20',
                    title: 'text-yellow-600',
                    glow: 'from-yellow-500/20 to-[#9945FF]/20'
                };
            default:
                return {
                    bg: 'from-[#F7931A]/10 to-[#9945FF]/10',
                    border: 'border-[#F7931A]/20',
                    title: 'text-[#F7931A]',
                    glow: 'from-[#F7931A]/20 to-[#9945FF]/20'
                };
        }
    };

    const colors = getColors();

    return (
        <div className="relative">
            {/* Animation glow effect */}
            <motion.div
                className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${colors.glow} blur-md opacity-30 -z-10`}
                animate={{
                    scale: [0.98, 1.01, 0.98],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <Card className={`border ${colors.border} bg-gradient-to-r ${colors.bg} ${className}`}>
                <CardHeader className="pb-2">
                    <div className="flex items-center">
                        {icon && (
                            <motion.div
                                className="mr-3"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatType: "loop",
                                    ease: "easeInOut"
                                }}
                            >
                                {icon}
                            </motion.div>
                        )}
                        <CardTitle className={`text-lg ${colors.title}`}>{title}</CardTitle>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Card content */}
                    <div className="relative">
                        {/* Add floating particle effect */}
                        {variant === 'default' && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-1.5 h-1.5 rounded-full bg-[#F7931A]/30"
                                        initial={{
                                            x: `${Math.random() * 100}%`,
                                            y: `${Math.random() * 100}%`,
                                            opacity: 0
                                        }}
                                        animate={{
                                            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                                            x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                                            opacity: [0, 0.8, 0]
                                        }}
                                        transition={{
                                            duration: 4 + Math.random() * 3,
                                            repeat: Infinity,
                                            delay: i * 1.5,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {children}
                    </div>
                </CardContent>

                {footer && (
                    <CardFooter>
                        {footer}
                    </CardFooter>
                )}
            </Card>

            {/* Decorative badge - only shown for default variant */}
            {variant === 'default' && (
                <div className="absolute -top-1 -right-1">
                    <motion.div
                        className="w-3 h-3 bg-gradient-to-r from-[#F7931A] to-[#9945FF] rounded-full"
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
                </div>
            )}
        </div>
    );
}; 