"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function ConfettiEffect() {
    useEffect(() => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ["#3d7a45", "#8b5e3c", "#f5f0e8", "#faeeda"],
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ["#3d7a45", "#8b5e3c", "#f5f0e8", "#faeeda"],
            });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }, []);

    return null;
}
