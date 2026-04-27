"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/auth";

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setTimeout(() => {
            const ok = adminLogin(username, password);
            if (ok) {
                router.push("/risol-admin-2024");
            } else {
                setError("Username atau password salah. Coba lagi!");
                setLoading(false);
            }
        }, 600);
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-4">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brown/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md z-10">
                {/* Card */}
                <div className="card p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl mb-4 shadow-lg">
                            <span className="text-4xl">🫓</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-800">Admin Dashboard</h1>
                        <p className="text-gray-500 text-sm mt-1">Risol Lumer &mdash; Masuk untuk memantau pesanan</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="admin-username" className="label">Username</label>
                            <input
                                id="admin-username"
                                type="text"
                                className="input-field"
                                placeholder="admin"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="admin-password" className="label">Password</label>
                            <div className="relative">
                                <input
                                    id="admin-password"
                                    type={showPass ? "text" : "password"}
                                    className="input-field pr-12"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPass ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl">
                                ❌ {error}
                            </div>
                        )}

                        <button
                            id="admin-login-btn"
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Sedang masuk..." : "Masuk ke Dashboard →"}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Halaman ini tidak tersedia untuk umum
                    </p>
                </div>
            </div>
        </div>
    );
}
