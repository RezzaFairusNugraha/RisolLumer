"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAffiliate } from "@/lib/storage";
import { afilLogin } from "@/lib/auth";

export default function AfilLoginPage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [wa, setWA] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        setTimeout(() => {
            const trimCode = code.trim().toUpperCase();
            const aff = getAffiliate(trimCode);

            if (!aff) {
                setError("Kode afiliasi tidak ditemukan. Pastikan kamu sudah beli isi 3.");
                setLoading(false);
                return;
            }

            // Verify by matching WA number (partial or full)
            const normalizeWA = (w: string) => w.replace(/[^0-9]/g, "");
            const inputWA = normalizeWA(wa.trim());
            const ownerWA = normalizeWA(aff.ownerWA);

            if (inputWA.length < 8 || !ownerWA.endsWith(inputWA.slice(-8))) {
                setError("Nomor WhatsApp tidak cocok dengan pemilik kode ini.");
                setLoading(false);
                return;
            }

            afilLogin(trimCode);
            router.push("/afiliasi/dashboard");
        }, 600);
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-4">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-yellow-200/40 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md z-10">
                <div className="card p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-3xl mb-4 shadow-lg">
                            <span className="text-4xl">🎁</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-800">Dashboard Afiliasi</h1>
                        <p className="text-gray-500 text-sm mt-1">Pantau progress referral dan kode afiliasimu</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="afil-code-login" className="label">Kode Afiliasi</label>
                            <input
                                id="afil-code-login"
                                type="text"
                                className="input-field uppercase tracking-widest text-center text-lg font-black"
                                placeholder="XXXXXX"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                            />
                            <p className="text-xs text-gray-500 mt-1">Kode unik 6 karakter yang kamu dapat saat beli isi 3</p>
                        </div>

                        <div>
                            <label htmlFor="afil-wa-login" className="label">Nomor WhatsApp kamu</label>
                            <input
                                id="afil-wa-login"
                                type="tel"
                                className="input-field"
                                placeholder="08xx-xxxx-xxxx"
                                value={wa}
                                onChange={(e) => setWA(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Untuk memverifikasi bahwa kamu pemilik kode ini</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-2xl">
                                ❌ {error}
                            </div>
                        )}

                        <button
                            id="afil-login-btn"
                            type="submit"
                            disabled={loading || code.length < 6 || wa.length < 8}
                            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Memverifikasi..." : "Lihat Dashboard →"}
                        </button>
                    </form>

                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800">
                        <p className="font-bold mb-1">💡 Belum punya kode afiliasi?</p>
                        <p>Beli risol <strong>isi 3</strong> dan kamu akan otomatis mendapat kode unik!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
