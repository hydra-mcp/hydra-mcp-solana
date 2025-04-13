import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface AnimatedSolButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'default' | 'outline' | 'secondary';
    size?: 'default' | 'sm' | 'lg';
    loading?: boolean;
    className?: string;
}

export const AnimatedSolButton: React.FC<AnimatedSolButtonProps> = ({
    children,
    variant = 'default',
    size = 'default',
    loading = false,
    className = '',
    ...props
}) => {
    return (
        <div className="relative">
            {/* Pulsing background halo effect */}
            <motion.div
                className="absolute inset-0 rounded-md bg-gradient-to-r from-[#F7931A]/40 to-[#9945FF]/40 blur-md -z-10"
                animate={{
                    scale: [0.85, 1.05, 0.85],
                    opacity: [0.4, 0.6, 0.4]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Base button */}
            <Button
                variant={variant}
                size={size}
                disabled={loading || props.disabled}
                className={`relative overflow-hidden ${className} ${variant === 'default' ? 'bg-gradient-to-r from-[#F7931A] to-[#9945FF] hover:from-[#F7931A]/90 hover:to-[#9945FF]/90 border-0' : ''
                    }`}
                {...props}
            >
                {/* Lightning icon */}
                {!loading && (
                    <motion.div
                        className="mr-2"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut"
                        }}
                    >
                        <Zap className="w-4 h-4" />
                    </motion.div>
                )}

                {/* Loading animation */}
                {loading ? (
                    <div className="flex items-center">
                        <motion.div
                            className="w-4 h-4 border-2 border-t-transparent border-r-current border-b-current border-l-current rounded-full mr-2"
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                        Processing...
                    </div>
                ) : (
                    children
                )}

                {/* Particle effect */}
                {!loading && variant === 'default' && (
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 rounded-full bg-white"
                                initial={{
                                    x: `calc(${Math.random() * 100}% - 2px)`,
                                    y: '100%',
                                    opacity: 0
                                }}
                                animate={{
                                    y: '-100%',
                                    opacity: [0, 0.8, 0]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.8,
                                    repeatDelay: 2,
                                    ease: "easeOut"
                                }}
                            />
                        ))}
                    </div>
                )}
            </Button>
        </div>
    );
}; 