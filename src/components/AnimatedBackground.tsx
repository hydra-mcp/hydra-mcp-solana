import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

interface AnimatedBackgroundProps {
    children: React.ReactNode;
    className?: string;
    particleCount?: number;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
    children,
    className = '',
    particleCount = 15
}) => {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(particleCount)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        initial={{
                            x: `${Math.random() * 100}%`,
                            y: '110%',
                            opacity: 0,
                            scale: 0.5 + Math.random() * 0.5,
                            rotate: Math.random() * 360
                        }}
                        animate={{
                            y: '-10%',
                            opacity: [0, Math.random() * 0.4, 0],
                            rotate: Math.random() * 360 + 360
                        }}
                        transition={{
                            duration: 15 + Math.random() * 15,
                            repeat: Infinity,
                            delay: i * 2,
                            ease: "linear"
                        }}
                    >
                        {i % 3 === 0 ? (
                            <div className="w-2 h-2 bg-[#F7931A]/20 rounded-full" />
                        ) : i % 3 === 1 ? (
                            <div className="w-3 h-3 bg-[#9945FF]/15 rounded-full" />
                        ) : (
                            <DollarSign className="w-4 h-4 text-[#F7931A]/15" />
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Gradient orbs */}
            <div className="fixed pointer-events-none">
                <motion.div
                    className="absolute -top-32 -left-32 w-64 h-64 bg-[#F7931A]/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, 30, 0],
                        y: [0, 20, 0]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />

                <motion.div
                    className="absolute top-1/2 -right-32 w-64 h-64 bg-[#9945FF]/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, -30, 0],
                        y: [0, -20, 0]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 1
                    }}
                />
            </div>

            {/* Main content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}; 