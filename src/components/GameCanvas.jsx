import { useRef, useEffect } from "react";
import { rings as initialRings } from "../config/levels";
import { reflectVelocity } from "../engine/physics";
import { isInGap } from "../engine/collision";

export default function GameCanvas() {
    const canvasRef = useRef(null);

    const game = useRef({
        rings: initialRings.map(r => ({
            ...r,
            rotation: 0,
            hue: 240
        })),
        ball: {
            x: 200,
            y: 200,
            vx: 160, // px per second
            vy: 190, // px per second
            r: 8
        },
        gameOver: false,
        success: false
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // 🔥 DPI-AWARE CANVAS
        const dpr = window.devicePixelRatio || 1;
        const WIDTH = 400;
        const HEIGHT = 400;

        canvas.width = WIDTH * dpr;
        canvas.height = HEIGHT * dpr;
        canvas.style.width = WIDTH + "px";
        canvas.style.height = HEIGHT + "px";
        ctx.scale(dpr, dpr);

        const cx = WIDTH / 2;
        const cy = HEIGHT / 2;

        // ⏱ FIXED TIMESTEP
        const FIXED_DT = 1 / 60;
        let accumulator = 0;
        let lastTime = performance.now();

        function drawGameOver() {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 32px Arial";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", cx, cy - 10);

            ctx.font = "16px Arial";
            ctx.fillText("Ball too big to escape", cx, cy + 20);
        }

        function drawSuccess() {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            ctx.fillStyle = "#22c55e";
            ctx.font = "bold 32px Arial";
            ctx.textAlign = "center";
            ctx.fillText("YOU WIN 🎉", cx, cy - 10);

            ctx.fillStyle = "#fff";
            ctx.font = "16px Arial";
            ctx.fillText("All rings escaped", cx, cy + 20);
        }

        function updatePhysics(dt) {
            const { rings, ball } = game.current;
            if (rings.length === 0) return;

            // rotate rings
            rings.forEach(ring => {
                ring.rotation += ring.speed * dt; // rad/sec
            });

            // move ball
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;

            // collision with inner ring
            const ring = rings[0];
            const dx = ball.x - cx;
            const dy = ball.y - cy;
            const dist = Math.hypot(dx, dy);

            if (dist >= ring.radius - ball.r) {
                const angle =
                    (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
                const gapStart =
                    (ring.rotation + Math.PI * 2) % (Math.PI * 2);

                if (isInGap(angle, gapStart, ring.gapSize)) {
                    rings.shift();

                    if (rings.length === 0) {
                        game.current.success = true;
                        return;
                    }

                    ball.r += 3.5;
                    ball.vx *= 1.05;
                    ball.vy *= 1.05;
                } else {
                    ball.r += 0.05;
                    ring.hue = Math.max(0, ring.hue - 8);

                    const nx = dx / dist;
                    const ny = dy / dist;

                    const { vx, vy } = reflectVelocity(ball.vx, ball.vy, nx, ny);

                    // push inward
                    ball.x -= nx * 1.5;
                    ball.y -= ny * 1.5;

                    // angular deflection
                    const angleOffset = (Math.random() - 0.5) * 0.25;
                    const cos = Math.cos(angleOffset);
                    const sin = Math.sin(angleOffset);

                    ball.vx = vx * cos - vy * sin;
                    ball.vy = vx * sin + vy * cos;
                }
            }

            // GAME OVER CHECK
            const gapLength = ring.radius * ring.gapSize;
            if (ball.r * 2 > gapLength) {
                game.current.gameOver = true;
            }
        }

        function render() {
            ctx.clearRect(0, 0, WIDTH, HEIGHT);

            const { rings, ball, gameOver, success } = game.current;

            if (gameOver) {
                drawGameOver();
                return;
            }

            if (success) {
                drawSuccess();
                return;
            }

            // draw rings
            rings.forEach((ring, index) => {
                ctx.beginPath();
                ctx.arc(
                    cx,
                    cy,
                    ring.radius,
                    ring.rotation + ring.gapSize,
                    ring.rotation + Math.PI * 2
                );

                ctx.strokeStyle =
                    index === 0
                        ? `hsl(${ring.hue}, 80%, 55%)`
                        : `hsl(${ring.hue}, 30%, 35%)`;

                ctx.lineWidth = index === 0 ? 4 : 2;
                ctx.stroke();
            });

            // draw ball
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            ctx.fillStyle = "#3b82f6";
            ctx.fill();
        }

        function loop(now) {
            const deltaTime = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;
            accumulator += deltaTime;

            while (accumulator >= FIXED_DT) {
                updatePhysics(FIXED_DT);
                accumulator -= FIXED_DT;
            }

            render();
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }, []);

    return <canvas ref={canvasRef} />;
}
