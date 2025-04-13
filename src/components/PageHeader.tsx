import React from 'react';
import { motion } from 'framer-motion';
import { Zap, DollarSign } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    className
}) => {
    return (
        <div className={`relative py-12 ${className}`}>
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F7931A]/10 to-[#9945FF]/10 rounded-lg -z-10" />

            {/* Content container */}
            <div className="container relative flex flex-col items-center text-center px-4 py-6">
                {/* Main title */}
                <motion.div
                    className="flex items-center space-x-3 mb-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Icon animation */}
                    <div className="relative h-12 w-12 flex items-center justify-center">
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
                            <div className="bg-gradient-to-r from-[#F7931A] to-[#9945FF] p-2 rounded-full">
                                <Zap className="w-7 h-7 text-white" />
                            </div>
                        </motion.div>

                        {/* Coin animation effect 2 */}
                        <motion.div
                            className="absolute -top-1 -left-1"
                            animate={{
                                y: [3, 6, 3],
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
                            <div className="w-4 h-4 bg-[#9945FF] rounded-full flex items-center justify-center text-white font-bold text-[8px]">
                                S
                            </div>
                        </motion.div>

                        {/* Halo effect */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.5, 0] }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "loop"
                            }}
                        >
                            <div className="w-14 h-14 rounded-full border-2 border-[#F7931A]/30 border-dashed" />
                        </motion.div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#F7931A] to-[#9945FF] bg-clip-text text-transparent">
                        {title}
                    </h1>
                </motion.div>

                {/* Subtitle */}
                {subtitle && (
                    <motion.p
                        className="text-lg text-gray-600 max-w-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {subtitle}
                    </motion.p>
                )}

                {/* Floating gold coin effect */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            initial={{
                                x: Math.random() * 100 - 50 + '%',
                                y: '100%',
                                opacity: 0,
                                scale: 0.5 + Math.random() * 0.5
                            }}
                            animate={{
                                y: '-100%',
                                opacity: [0, 0.7, 0],
                                rotate: Math.random() * 360
                            }}
                            transition={{
                                duration: 5 + Math.random() * 5,
                                repeat: Infinity,
                                delay: i * 2,
                                ease: "linear"
                            }}
                        >
                            <DollarSign className="w-4 h-4 text-[#F7931A]" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}; 