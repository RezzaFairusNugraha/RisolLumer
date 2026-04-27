"use client";
import { useEffect, useRef } from "react";

interface NotifToastProps {
    message: string;
    onClose: () => void;
}

export default function NotifToast({ message, onClose }: NotifToastProps) {
    const timerRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        timerRef.current = setTimeout(() => {
            onClose();
        }, 5000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [onClose]);

    return (
        <div
            id="notif-toast"
            className="fixed top-5 right-5 z-[100] animate-slide-in-right"
        >
            <div className="bg-white border-l-4 border-primary shadow-xl rounded-2xl px-5 py-4 flex items-center gap-3 max-w-sm">
                <span className="text-2xl">🔔</span>
                <p className="font-bold text-gray-800 text-sm flex-1">{message}</p>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-700 font-bold text-lg ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Tutup notifikasi"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
