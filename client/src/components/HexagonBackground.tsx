import { useEffect, useRef } from "react";

const HexagonBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let time = 0;
        let animationFrameId: number;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        // Configuration for the Isometric Cube Grid
        const size = 40; // Size of the cube edge
        const h = size * Math.cos(Math.PI / 6);
        const v = size * Math.sin(Math.PI / 6);

        const drawCube = (x: number, y: number, t: number) => {
            if (!ctx) return;

            ctx.lineWidth = 2;
            ctx.lineJoin = "round";

            // Calculate dynamic glow based on position and time
            // Creates a "wave" of light passing through the grid
            const wave = Math.sin(x * 0.005 + y * 0.005 + t) * 0.5 + 0.5;
            const opacity = 0.1 + wave * 0.4; // Base opacity + wave

            const color = `rgba(0, 245, 160, ${opacity})`;
            const shadow = `rgba(0, 245, 160, ${opacity * 0.5})`;

            ctx.strokeStyle = color;
            ctx.shadowColor = shadow;
            ctx.shadowBlur = 10 * wave; // Dynamic glow strength

            ctx.beginPath();
            // Top Face
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + h, y - v);
            ctx.lineTo(x + h, y + v);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - h, y + v);
            ctx.lineTo(x - h, y - v);
            ctx.closePath();
            ctx.stroke();

            // Internal lines to make it look like a cube
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + size);
            ctx.moveTo(x, y);
            ctx.lineTo(x - h, y - v);
            ctx.moveTo(x, y);
            ctx.lineTo(x + h, y - v);
            ctx.stroke();
        };

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            time += 0.02;

            // Draw grid
            const cols = Math.ceil(canvas.width / (h * 2)) + 1;
            const rows = Math.ceil(canvas.height / (size * 1.5)) + 1;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    let x = col * h * 2;
                    let y = row * size * 3;

                    if (col % 2 === 1) {
                        y += size * 1.5;
                    }

                    // Adjust layout to fill screen seamlessly
                    // Isometric grid offset logic

                    drawCube(x, y, time);
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

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
            style={{ opacity: 0.4 }} // Subtle background intensity
        />
    );
};

export default HexagonBackground;
