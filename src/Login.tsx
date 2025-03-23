import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StarProps {
    size: number;
    top: string;
    left: string;
    opacity: number;
    delay: number;
    duration: number;
    twinkleType: 'default' | 'random';
    color?: string;
    type?: 'normal' | 'bright' | 'flare';
}

interface MeteorProps {
    top: string;
    left: string;
    delay: number;
    duration: number;
    size: number;
    angle: number;
    color?: string;
}

interface GalaxyProps {
    width: string;
    height: string;
    top: string;
    left: string;
    rotation: number;
    opacity: number;
}

export function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { login } = useAuth();

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

    //  - useMemo
    const backgroundLayers = useMemo(() => {
        //  - ，
        const foregroundElements = Array.from({ length: 5 }).map((_, i) => ({
            id: `fg-${i}`,
            size: Math.random() * 180 + 120,
            initialPosition: {
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
            },
            duration: Math.random() * 25 + 45,
            delay: Math.random() * 5,
            opacity: 0.03 + Math.random() * 0.04,
            movement: {
                x: Math.random() * 35 - 17.5,
                y: Math.random() * 35 - 17.5,
            },
            blur: 1 + Math.random() * 3,
            layer: 'foreground',
        }));

        //  - ，
        const middlegroundElements = Array.from({ length: 5 }).map((_, i) => ({
            id: `mg-${i}`,
            size: Math.random() * 250 + 180,
            initialPosition: {
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
            },
            duration: Math.random() * 35 + 65,
            delay: Math.random() * 7,
            opacity: 0.02 + Math.random() * 0.03,
            movement: {
                x: Math.random() * 25 - 12.5,
                y: Math.random() * 25 - 12.5,
            },
            blur: 3 + Math.random() * 4,
            layer: 'middleground',
        }));

        //  - ，
        const backgroundElements = Array.from({ length: 3 }).map((_, i) => ({
            id: `bg-${i}`,
            size: Math.random() * 380 + 280,
            initialPosition: {
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
            },
            duration: Math.random() * 60 + 80,
            delay: Math.random() * 10,
            opacity: 0.01 + Math.random() * 0.02,
            movement: {
                x: Math.random() * 15 - 7.5,
                y: Math.random() * 15 - 7.5,
            },
            blur: 5 + Math.random() * 15,
            layer: 'background',
        }));

        return [...foregroundElements, ...middlegroundElements, ...backgroundElements];
    }, []);

    // 
    const starColors = useMemo(() => [
        'rgba(255, 255, 255, 0.9)', // 
        'rgba(220, 235, 255, 0.9)', // 
        'rgba(255, 230, 220, 0.9)', // 
        'rgba(255, 255, 220, 0.9)', // 
        'rgba(220, 255, 240, 0.9)', // 
    ], []);

    // 
    const stars = useMemo(() => {
        //  - 
        const mainStars = Array.from({ length: 120 }).map((_, i): StarProps => ({
            size: Math.random() * 2.5 + 0.8, // 0.8-3.3px 
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: 0.3 + Math.random() * 0.7, // 
            delay: Math.random() * 5, // 
            duration: 2 + Math.random() * 4, // 
            twinkleType: Math.random() > 0.7 ? 'random' : 'default', // 30%
            color: starColors[Math.floor(Math.random() * starColors.length)],
            type: 'normal'
        }));

        //  - ，
        const brightStars = Array.from({ length: 15 }).map((_, i): StarProps => ({
            size: Math.random() * 3 + 2.5, // 2.5-5.5px 
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: 0.7 + Math.random() * 0.3, // 
            delay: Math.random() * 3, // 
            duration: 3 + Math.random() * 5, // 
            twinkleType: 'random', // 
            color: starColors[Math.floor(Math.random() * starColors.length)],
            type: 'bright'
        }));

        //  - 
        const flareStars = Array.from({ length: 5 }).map((_, i): StarProps => ({
            size: Math.random() * 2 + 3, // 3-5px 
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: 0.8 + Math.random() * 0.2, // 
            delay: Math.random() * 4, // 
            duration: 6 + Math.random() * 4, // 
            twinkleType: 'random',
            color: i % 2 === 0 ? 'rgba(220, 235, 255, 0.95)' : 'rgba(255, 230, 220, 0.95)', // 
            type: 'flare'
        }));

        return [...mainStars, ...brightStars, ...flareStars];
    }, [starColors]);

    // 
    const meteorColors = useMemo(() => [
        'rgba(255, 255, 255, 0.9)', // 
        'rgba(200, 220, 255, 0.9)', // 
        'rgba(255, 220, 200, 0.9)', // 
    ], []);

    // 
    const Meteor = useCallback(({ top, left, delay, duration, size, angle, color = 'rgba(255, 255, 255, 0.9)' }: MeteorProps) => (
        <div
            className="absolute overflow-hidden"
            style={{
                top,
                left,
                transform: `rotate(${angle}deg)`,
                transformOrigin: 'left top',
                width: '150px',
                height: '2px',
                opacity: 0
            }}
        >
            <div
                className="absolute animate-meteor"
                style={{
                    height: `${size}px`,
                    background: `linear-gradient(90deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
                    borderRadius: '100px',
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                }}
            >
                {/*  */}
                <div
                    className="absolute h-full rounded-full animate-meteor-glow"
                    style={{
                        right: 0,
                        width: `${size * 2}px`,
                        background: color,
                        animationDelay: `${delay}s`,
                        animationDuration: `${duration * 0.5}s`
                    }}
                ></div>
            </div>
        </div>
    ), []);

    // 
    const meteors = useMemo(() => {
        return Array.from({ length: 10 }).map((_, i) => ({
            id: `meteor-${i}`,
            top: `${Math.random() * 40}%`, // 
            left: `${Math.random() * 100 - 20}%`, // 
            delay: Math.random() * 20 + i * 3, // ，
            duration: 3 + Math.random() * 4, // 
            size: 1 + Math.random() * 2, // 
            angle: -35 - Math.random() * 20, // ，
            color: meteorColors[Math.floor(Math.random() * meteorColors.length)],
        }));
    }, [meteorColors]);

    // 
    const galaxies = useMemo(() => {
        return [
            {
                width: '800px',
                height: '300px',
                top: '20%',
                left: '10%',
                rotation: 15,
                opacity: 0.08,
            },
            {
                width: '600px',
                height: '250px',
                top: '60%',
                left: '60%',
                rotation: -25,
                opacity: 0.06,
            }
        ];
    }, []);

    // 
    const titleLetters = useMemo(() => {
        const title = "HYDRA-AI";
        return title.split('').map((letter, index) => ({
            letter,
            delay: index * 0.1, // 
            animationDelay: index * 0.15 + "s",
        }));
    }, []);

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-900 to-black">
            {/*  */}
            <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[180px]"></div>

            {/*  */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-500/5 blur-[150px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-2/3 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }}></div>

            {/*  */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {galaxies.map((galaxy, i) => (
                    <div
                        key={`galaxy-${i}`}
                        className="absolute rounded-full bg-gradient-to-r from-transparent via-blue-300/5 to-transparent animate-galaxy-fade"
                        style={{
                            width: galaxy.width,
                            height: galaxy.height,
                            top: galaxy.top,
                            left: galaxy.left,
                            opacity: galaxy.opacity,
                            transform: `rotate(${galaxy.rotation}deg)`,
                            background: i % 2 === 0
                                ? 'linear-gradient(90deg, transparent, rgba(180, 210, 255, 0.1), transparent)'
                                : 'linear-gradient(90deg, transparent, rgba(220, 180, 255, 0.1), transparent)'
                        }}
                    >
                        <div className="absolute inset-0 animate-galaxy-rotate">
                            {/*  */}
                            {Array.from({ length: 30 }).map((_, j) => (
                                <div
                                    key={`galaxy-star-${i}-${j}`}
                                    className="absolute rounded-full bg-white"
                                    style={{
                                        width: `${1 + Math.random() * 2}px`,
                                        height: `${1 + Math.random() * 2}px`,
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`,
                                        opacity: 0.3 + Math.random() * 0.7,
                                        boxShadow: '0 0 2px 0 rgba(255, 255, 255, 0.5)'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/*  -  */}
            <div className="absolute inset-0 overflow-hidden">
                {stars.map((star, i) => (
                    <div
                        key={`star-${i}`}
                        className={`absolute rounded-full ${star.type === 'flare'
                            ? 'animate-flare'
                            : star.twinkleType === 'random'
                                ? 'animate-twinkle-random'
                                : 'animate-twinkle'
                            }`}
                        style={{
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            top: star.top,
                            left: star.left,
                            backgroundColor: star.color,
                            boxShadow: star.type === 'flare'
                                ? `0 0 ${star.size * 4}px ${star.size}px ${star.color?.replace(/[^,]+(?=\))/, '0.7')}`
                                : `0 0 ${star.size * 2}px 0 ${star.color?.replace(/[^,]+(?=\))/, '0.6')}`,
                            opacity: star.opacity,
                            animationDelay: `${star.delay}s`,
                            animationDuration: `${star.duration}s`,
                            zIndex: star.type === 'flare' ? 3 : 1
                        }}
                    />
                ))}
            </div>

            {/*  */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {meteors.map((meteor) => (
                    <Meteor
                        key={meteor.id}
                        top={meteor.top}
                        left={meteor.left}
                        delay={meteor.delay}
                        duration={meteor.duration}
                        size={meteor.size}
                        angle={meteor.angle}
                        color={meteor.color}
                    />
                ))}
            </div>

            {/*  */}
            <div className="absolute inset-0 overflow-hidden">
                {backgroundLayers.map((element) => (
                    <motion.div
                        key={element.id}
                        className={`absolute rounded-full bg-white/10 ${element.layer === 'foreground' ? 'z-[2]' :
                            element.layer === 'middleground' ? 'z-[1]' : 'z-[0]'
                            }`}
                        style={{
                            width: element.size,
                            height: element.size,
                            left: element.initialPosition.x,
                            top: element.initialPosition.y,
                            filter: `blur(${element.blur}px)`,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{
                            scale: [1, 1.02, 1],
                            opacity: [element.opacity, element.opacity * 1.2, element.opacity],
                            x: [0, element.movement.x, 0],
                            y: [0, element.movement.y, 0],
                        }}
                        transition={{
                            duration: element.duration,
                            delay: element.delay,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: [0.4, 0.0, 0.6, 1],
                        }}
                    />
                ))}
            </div>

            {/*  */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative w-full max-w-md mx-4 z-10"
            >
                {/*  */}
                <div className="absolute inset-0 bg-blue-400/10 rounded-2xl blur-xl -m-2"></div>

                <div className="bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 relative">
                    {/*  */}
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
                                                color: index === 6 ? '#4BB4F8' : 'white'
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