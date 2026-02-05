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
            vx: 2.3,
            vy: 2.8,
            r: 8
        },
        gameOver: false,
        success: false
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = 400;
        canvas.height = 400;

        const cx = 200;
        const cy = 200;

        let lastTime = performance.now();

        function drawGameOver() {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 32px Arial";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);

            ctx.font = "16px Arial";
            ctx.fillText(
                "Ball too big to escape",
                canvas.width / 2,
                canvas.height / 2 + 20
            );
        }

        function drawSuccess() {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#22c55e";
            ctx.font = "bold 32px Arial";
            ctx.textAlign = "center";
            ctx.fillText("YOU WIN 🎉", canvas.width / 2, canvas.height / 2 - 10);

            ctx.fillStyle = "#fff";
            ctx.font = "16px Arial";
            ctx.fillText(
                "All rings escaped",
                canvas.width / 2,
                canvas.height / 2 + 20
            );
        }

        function loop(currentTime) {
            // ⏱ DELTA TIME (FPS-INDEPENDENT)
            const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05);
            lastTime = currentTime;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const { rings, ball, gameOver, success } = game.current;

            if (gameOver) {
                drawGameOver();
                return;
            }

            if (success) {
                drawSuccess();
                return;
            }

            if (rings.length === 0) return;

            // Draw & rotate all rings
            rings.forEach((ring, index) => {
                ring.rotation += ring.speed * deltaTime * 60;

                ctx.beginPath();
                ctx.arc(
                    cx,
                    cy,
                    ring.radius,
                    ring.rotation + ring.gapSize,
                    ring.rotation + Math.PI * 2
                );

                const ringColor =
                    index === 0
                        ? `hsl(${ring.hue}, 80%, 55%)`
                        : `hsl(${ring.hue}, 30%, 35%)`;

                ctx.strokeStyle = ringColor;
                ctx.lineWidth = index === 0 ? 4 : 2;
                ctx.stroke();
            });

            // Move ball (TIME-BASED)
            ball.x += ball.vx * deltaTime * 60;
            ball.y += ball.vy * deltaTime * 60;

            // Collision only with innermost ring
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
                    // ESCAPE
                    rings.shift();

                    if (rings.length === 0) {
                        game.current.success = true;
                        return;
                    }

                    ball.r += 3.5;
                    ball.vx *= 1.05;
                    ball.vy *= 1.05;
                } else {
                    // COLLISION
                    ball.r += 0.05;

                    ring.hue -= 10;
                    if (ring.hue < 0) ring.hue = 0;

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
            const ballDiameter = ball.r * 2;

            if (ballDiameter > gapLength) {
                game.current.gameOver = true;
            }

            // Draw ball
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            ctx.fillStyle = "#3b82f6";
            ctx.fill();

            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }, []);

    return <canvas ref={canvasRef} />;
}
