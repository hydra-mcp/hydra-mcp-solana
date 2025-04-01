import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { login } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim() === '' || password.trim() === '') {
            toast({
                title: 'Login failed',
                description: 'Username and password cannot be empty',
                duration: 3000,
            });
            return;
        }

        setIsLoading(true);

        try {
            await login(username, password);
            toast({
                title: 'Login successful',
                description: 'Welcome back!',
                duration: 2000,
            });
            navigate('/');
        } catch (error) {
            let errorMessage = 'Login failed';

            if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast({
                title: 'Login failed',
                description: errorMessage,
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Canvas animation - draws and animates all background effects
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas to full screen size with device pixel ratio for sharpness
        const updateCanvasSize = () => {
            const dpr = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            const height = window.innerHeight;

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            ctx.scale(dpr, dpr);
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        // Star properties
        const stars = Array.from({ length: 100 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 2 + 0.5,
            opacity: 0.3 + Math.random() * 0.7,
            twinkleSpeed: 1 + Math.random() * 3,
            twinklePhase: Math.random() * Math.PI * 2
        }));

        // Nebula/background glow properties
        const nebulas = Array.from({ length: 5 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 300 + 200,
            opacity: 0.03 + Math.random() * 0.04,
            color: Math.random() > 0.5 ? '#4169e1' : '#5e35b1'
        }));

        // Meteor properties
        const meteors: {
            x: number;
            y: number;
            length: number;
            speed: number;
            opacity: number;
            active: boolean;
            timeToLaunch: number;
        }[] = [];

        // Animation loop
        let lastMeteorTime = 0;
        const animate = (timestamp: number) => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

            // Draw nebulas (large blurred background elements)
            nebulas.forEach(nebula => {
                const gradient = ctx.createRadialGradient(
                    nebula.x, nebula.y, 0,
                    nebula.x, nebula.y, nebula.size
                );

                gradient.addColorStop(0, `${nebula.color}${Math.floor(nebula.opacity * 100).toString(16).padStart(2, '0')}`);
                gradient.addColorStop(1, 'transparent');

                ctx.beginPath();
                ctx.fillStyle = gradient;
                ctx.arc(nebula.x, nebula.y, nebula.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw stars with twinkling effect
            stars.forEach(star => {
                const twinkle = Math.sin(timestamp / 1000 * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
                const currentOpacity = star.opacity * (0.5 + twinkle * 0.5);

                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                // Add glow effect to larger stars
                if (star.size > 1.2) {
                    ctx.beginPath();
                    const glow = ctx.createRadialGradient(
                        star.x, star.y, 0,
                        star.x, star.y, star.size * 4
                    );
                    glow.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity * 0.4})`);
                    glow.addColorStop(1, 'transparent');

                    ctx.fillStyle = glow;
                    ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Create new meteors periodically
            if (timestamp - lastMeteorTime > 2000 && meteors.length < 3) {
                lastMeteorTime = timestamp;

                if (Math.random() < 0.3) { // 30% chance to create meteor
                    meteors.push({
                        x: Math.random() * window.innerWidth,
                        y: 0,
                        length: Math.random() * 100 + 50,
                        speed: Math.random() * 300 + 200,
                        opacity: 0.7 + Math.random() * 0.3,
                        active: true,
                        timeToLaunch: Math.random() * 1000
                    });
                }
            }

            // Draw and update meteors
            meteors.forEach((meteor, index) => {
                if (meteor.timeToLaunch > 0) {
                    meteor.timeToLaunch -= timestamp / 60;
                    return;
                }

                ctx.save();

                // Create meteor gradient
                const gradient = ctx.createLinearGradient(
                    meteor.x, meteor.y,
                    meteor.x + meteor.length, meteor.y + meteor.length
                );

                gradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.opacity})`);
                gradient.addColorStop(0.3, `rgba(200, 220, 255, ${meteor.opacity * 0.8})`);
                gradient.addColorStop(1, 'transparent');

                ctx.beginPath();
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.moveTo(meteor.x, meteor.y);
                ctx.lineTo(meteor.x + meteor.length, meteor.y + meteor.length);
                ctx.stroke();

                // Draw glow at meteor head
                const glowGradient = ctx.createRadialGradient(
                    meteor.x, meteor.y, 0,
                    meteor.x, meteor.y, 10
                );

                glowGradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.opacity})`);
                glowGradient.addColorStop(1, 'transparent');

                ctx.fillStyle = glowGradient;
                ctx.arc(meteor.x, meteor.y, 10, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                // Update meteor position
                const delta = timestamp / 1000 * meteor.speed / 60;
                meteor.x += delta;
                meteor.y += delta;

                // Remove meteors that go off screen
                if (meteor.x > window.innerWidth || meteor.y > window.innerHeight) {
                    meteors[index].active = false;
                }
            });

            // Clean up inactive meteors
            for (let i = meteors.length - 1; i >= 0; i--) {
                if (!meteors[i].active) {
                    meteors.splice(i, 1);
                }
            }

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        // Cleanup
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, []);

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
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ zIndex: 0 }}
            />

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
                        className="text-center mb-8 relative"
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

                    <form onSubmit={handleLogin} className="space-y-6 relative">
                        <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                            style={{ willChange: 'transform, opacity' }}
                        >
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                            style={{ willChange: 'transform, opacity' }}
                        >
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300 focus:outline-none password-toggle-btn"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.div
                                            key={showPassword ? "hide" : "show"}
                                            initial={{ opacity: 0, rotateY: 90 }}
                                            animate={{ opacity: 1, rotateY: 0 }}
                                            exit={{ opacity: 0, rotateY: 90 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" aria-hidden="true" />
                                            ) : (
                                                <Eye className="h-5 w-5" aria-hidden="true" />
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                            style={{ willChange: 'transform, opacity' }}
                        >
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </motion.div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}