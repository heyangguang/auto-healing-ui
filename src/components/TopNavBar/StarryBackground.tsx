import React, { memo, useEffect, useRef } from 'react';

const StarryBackground: React.FC = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.parentElement?.clientWidth || window.innerWidth;
        let height = 58;
        canvas.width = width;
        canvas.height = height;

        const onResize = () => {
            width = canvas.parentElement?.clientWidth || window.innerWidth;
            height = 58;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', onResize);

        // Stars
        const numStars = Math.floor(width / 15); // Not too dense
        const stars: { x: number; y: number; r: number; alpha: number; delta: number }[] = [];

        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 1.5,
                alpha: Math.random(),
                delta: (Math.random() * 0.02) - 0.01,
            });
        }

        // Meteors
        const meteors: {
            x: number; y: number; length: number; speed: number;
            alpha: number; active: boolean; dx: number; dy: number;
        }[] = [];
        const maxMeteors = 6; // More meteors for the wide nav bar
        for (let i = 0; i < maxMeteors; i++) {
            meteors.push({ x: 0, y: 0, length: 0, speed: 0, alpha: 0, active: false, dx: 0, dy: 0 });
        }

        let animationFrameId: number;

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw and update stars
            for (const star of stars) {
                star.alpha += star.delta;
                if (star.alpha <= 0.1 || star.alpha >= 1) {
                    star.delta = -star.delta;
                }
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.fill();

                // Slight drift to the left
                star.x -= 0.1;
                if (star.x < 0) {
                    star.x = width;
                    star.y = Math.random() * height;
                }
            }

            // Draw and update meteors
            for (const meteor of meteors) {
                if (meteor.active) {
                    meteor.x += meteor.dx * meteor.speed;
                    meteor.y += meteor.dy * meteor.speed;
                    meteor.alpha -= 0.015;

                    if (meteor.alpha <= 0 || meteor.x < 0 || meteor.y > height) {
                        meteor.active = false;
                    } else {
                        const grad = ctx.createLinearGradient(
                            meteor.x, meteor.y,
                            meteor.x - meteor.dx * meteor.length, meteor.y - meteor.dy * meteor.length
                        );
                        grad.addColorStop(0, `rgba(255, 255, 255, ${meteor.alpha})`);
                        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

                        ctx.beginPath();
                        ctx.moveTo(meteor.x, meteor.y);
                        ctx.lineTo(meteor.x - meteor.dx * meteor.length, meteor.y - meteor.dy * meteor.length);
                        ctx.strokeStyle = grad;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                } else {
                    // Randomly spawn a meteor
                    if (Math.random() < 0.012) {
                        meteor.active = true;
                        meteor.x = Math.random() * width; // Spawn across full width
                        meteor.y = -10; // Start slightly above the header
                        meteor.length = Math.random() * 40 + 40;
                        meteor.speed = Math.random() * 2 + 4; // Fast movement
                        meteor.alpha = 1;
                        meteor.dx = -1; // Moving left
                        meteor.dy = Math.random() * 0.3 + 0.1; // Slightly downward
                    }
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    );
});

export default StarryBackground;
