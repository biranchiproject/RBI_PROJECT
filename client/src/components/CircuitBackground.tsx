import { useEffect, useRef } from "react";

const CircuitBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let lines: CircuitLine[] = [];
        let animationFrameId: number;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        window.addEventListener("resize", resizeCanvas);

        class CircuitLine {
            x: number;
            y: number;
            length: number;
            speed: number;
            direction: "left" | "right";
            color: string;
            width: number;

            constructor(side: "left" | "right") {
                this.direction = side;
                // Start from edges
                this.x = side === "left" ? 0 : canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.length = Math.random() * (canvas!.width * 0.3) + 50; // Max 30% width to keep center clear
                this.speed = Math.random() * 2 + 0.5;
                this.color = Math.random() > 0.5 ? "rgba(0, 245, 160," : "rgba(0, 207, 255,"; // Neon Green/Cyan
                this.width = Math.random() * 2 + 1;
            }

            update() {
                if (this.direction === "left") {
                    this.x += this.speed;
                    if (this.x > this.length) {
                        // Reset to start
                        this.x = 0;
                        this.y = Math.random() * canvas!.height;
                    }
                } else {
                    this.x -= this.speed;
                    if (this.x < canvas!.width - this.length) {
                        // Reset to start
                        this.x = canvas!.width;
                        this.y = Math.random() * canvas!.height;
                    }
                }
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.strokeStyle = this.color + " 0.4)"; // Base opacity
                ctx.lineWidth = this.width;

                // Draw main line
                if (this.direction === "left") {
                    ctx.moveTo(0, this.y);
                    ctx.lineTo(this.x, this.y);
                    // Draw a "head" or dot at the end
                    ctx.fillStyle = this.color + " 1)";
                    ctx.fillRect(this.x, this.y - 2, 4, 4);
                } else {
                    ctx.moveTo(canvas!.width, this.y);
                    ctx.lineTo(this.x, this.y);
                    // Draw a "head" or dot at the end
                    ctx.fillStyle = this.color + " 1)";
                    ctx.fillRect(this.x, this.y - 2, 4, 4);
                }

                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color + " 1)";
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }

        const init = () => {
            lines = [];
            const lineCount = 30; // Number of horizontal lines
            for (let i = 0; i < lineCount; i++) {
                lines.push(new CircuitLine("left"));
                lines.push(new CircuitLine("right"));
            }
        };

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            lines.forEach(line => {
                line.update();
                line.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        resizeCanvas(); // Initial setup
        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
    );
};

export default CircuitBackground;
