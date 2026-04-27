"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export type ToastType = "success" | "error" | "warning" | "info";

export interface NotifToastProps {
    id: string;
    message: string;
    type?: ToastType;
    onClose: (id: string) => void;
    duration?: number;
}

const TOAST_CONFIG: Record<
    ToastType,
    { icon: string; borderColor: string; iconBg: string; progressColor: string }
> = {
    success: {
        icon: "✅",
        borderColor: "border-green-500",
        iconBg: "bg-green-50",
        progressColor: "bg-green-500",
    },
    error: {
        icon: "❌",
        borderColor: "border-red-500",
        iconBg: "bg-red-50",
        progressColor: "bg-red-500",
    },
    warning: {
        icon: "⚠️",
        borderColor: "border-yellow-500",
        iconBg: "bg-yellow-50",
        progressColor: "bg-yellow-500",
    },
    info: {
        icon: "🔔",
        borderColor: "border-primary",
        iconBg: "bg-primary/10",
        progressColor: "bg-primary",
    },
};

export default function NotifToast({
    id,
    message,
    type = "info",
    onClose,
    duration = 5000,
}: NotifToastProps) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const config = TOAST_CONFIG[type];

    useEffect(() => {
        timerRef.current = setTimeout(() => {
            onClose(id);
        }, duration);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [id, onClose, duration]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-sm"
        >
            <div
                className={`bg-white border-l-4 ${config.borderColor} shadow-xl rounded-2xl overflow-hidden`}
            >
                {/* Content row */}
                <div className="flex items-center gap-3 px-4 py-3">
                    <div
                        className={`${config.iconBg} rounded-xl p-2 flex-shrink-0 text-xl leading-none`}
                    >
                        {config.icon}
                    </div>
                    <p className="font-bold text-gray-800 text-sm flex-1 leading-snug">
                        {message}
                    </p>
                    <button
                        onClick={() => onClose(id)}
                        className="text-gray-400 hover:text-gray-700 font-bold text-lg ml-1 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                        aria-label="Tutup notifikasi"
                    >
                        ✕
                    </button>
                </div>

                {/* Progress bar */}
                <motion.div
                    className={`h-1 ${config.progressColor} origin-left`}
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: duration / 1000, ease: "linear" }}
                />
            </div>
        </motion.div>
    );
}
