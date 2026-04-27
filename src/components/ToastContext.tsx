"use client";
import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from "react";
import { AnimatePresence } from "framer-motion";
import NotifToast, { type ToastType } from "./NotifToast";

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback(
        (message: string, type: ToastType = "info", duration?: number) => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setToasts((prev) => [...prev, { id, message, type, duration }]);
        },
        []
    );

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, dismissToast }}>
            {children}

            {/* Toast stack — fixed top-right */}
            <div
                aria-live="polite"
                aria-atomic="false"
                className="fixed top-5 right-5 z-[100] flex flex-col gap-3 items-end pointer-events-none"
            >
                <AnimatePresence mode="sync">
                    {toasts.map((toast) => (
                        <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
                            <NotifToast
                                id={toast.id}
                                message={toast.message}
                                type={toast.type}
                                duration={toast.duration}
                                onClose={dismissToast}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used inside <ToastProvider>");
    }
    return ctx;
}
