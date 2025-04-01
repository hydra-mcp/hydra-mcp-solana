import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LoginBackgroundCanvas } from '@/components/login/LoginBackgroundCanvas';
import { PasswordLoginForm } from '@/components/login/PasswordLoginForm';
import { PhantomLoginForm } from '@/components/login/PhantomLoginForm';
import { LoginTabs } from '@/components/login/LoginTabs';

export function Login() {
    // Default to wallet login
    const [activeTab, setActiveTab] = useState<'wallet' | 'password'>('wallet');

    const titleLetters = useMemo(() => {
        const title = "HYDRA-AI";
        return title.split('').map((letter, index) => ({
            letter,
            delay: index * 0.1,
            animationDelay: index * 0.15 + "s",
        }));
    }, []);

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-900 to-black">
            {/* Canvas for all background animations */}
            <LoginBackgroundCanvas />

            {/* Login form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative w-full max-w-md mx-4 z-10"
                style={{ willChange: 'transform, opacity' }}
            >
                <div className="absolute inset-0 bg-blue-400/10 rounded-2xl blur-xl -m-2"></div>

                <div className="bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 relative">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl">
                        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    </div>

                    {/* HYDRA-AI  */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="text-center mb-6 relative"
                    >
                        <div className="overflow-hidden mb-4">
                            <motion.div
                                initial={{ y: 60 }}
                                animate={{ y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                style={{ willChange: 'transform' }}
                            >
                                <div className="flex justify-center items-center mb-2">
                                    {titleLetters.map((item, index) => (
                                        <motion.span
                                            key={`letter-${index}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.5,
                                                delay: item.delay,
                                                ease: "easeOut"
                                            }}
                                            className="inline-block text-5xl font-bold"
                                            style={{
                                                color: index === 6 ? '#4BB4F8' : 'white',
                                                willChange: 'transform, opacity'
                                            }}
                                        >
                                            <span
                                                className={`animate-neon-pulse inline-block ${index === 6 ? "" : "text-shadow-white"}`}
                                                style={{ animationDelay: item.animationDelay }}
                                            >
                                                {item.letter}
                                            </span>
                                        </motion.span>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <motion.h1
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
                            className="text-3xl font-bold text-white mb-2"
                            style={{ willChange: 'transform, opacity' }}
                        >
                            User Login
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
                            className="text-gray-300"
                        >
                            Please sign in to continue
                        </motion.p>
                    </motion.div>

                    {/* Login tabs */}
                    <LoginTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />

                    {/* Conditional form rendering based on active tab */}
                    <PhantomLoginForm isActive={activeTab === 'wallet'} />
                    <PasswordLoginForm isActive={activeTab === 'password'} />
                </div>
            </motion.div>
        </div>
    );
}