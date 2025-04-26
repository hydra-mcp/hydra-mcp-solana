import { useEffect, useRef } from 'react';

export function LoginBackgroundCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>();

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

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 0 }}
        />
    );
} 