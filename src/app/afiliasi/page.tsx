"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ConfettiEffect from "@/components/ConfettiEffect";
import { getAffiliate } from "@/lib/storage";
import { buildRewardClaimLink } from "@/lib/whatsapp";

export default function AfiliasiPage() {
    const [code, setCode] = useState("");
    const [result, setResult] = useState<{
        ownerName: string;
        totalSold: number;
        claimedCount: number;
    } | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Search by WA states
    const [searchWA, setSearchWA] = useState("");
    const [searchResult, setSearchResult] = useState<string | null>(null);
    const [searchError, setSearchError] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const handleCheck = async () => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return;
        const aff = await getAffiliate(trimmed);
        if (!aff) {
            setNotFound(true);
            setResult(null);
            setShowConfetti(false);
            return;
        }
        setNotFound(false);
        setResult({ 
            ownerName: aff.ownerName, 
            totalSold: aff.totalSold, 
            claimedCount: aff.claimedCount 
        });
        setShowConfetti(aff.totalSold >= 6);
    };

    const handleSearchByWA = async () => {
        if (!searchWA.trim()) return;
        setIsSearching(true);
        setSearchError("");
        setSearchResult(null);

        try {
            const res = await fetch(`/api/affiliates/find-by-wa?wa=${encodeURIComponent(searchWA)}`);
            const data = await res.json();
            if (res.ok) {
                setSearchResult(data.code);
            } else {
                setSearchError(data.error || "Gagal mencari kode");
            }
        } catch (err) {
            setSearchError("Terjadi kesalahan sistem");
        } finally {
            setIsSearching(false);
        }
    };

    const totalEarned = result ? Math.floor(result.totalSold / 6) : 0;
    const readyToClaim = result ? Math.max(0, totalEarned - result.claimedCount) : 0;
    const nextMilestone = result ? (Math.floor(result.totalSold / 6) + 1) * 6 : 6;
    const progressInMilestone = result ? result.totalSold % 6 : 0;
    const pct = (progressInMilestone / 6) * 100;
    
    const waLink = result ? buildRewardClaimLink(result.ownerName, code.toUpperCase()) : "#";

    return (
        <div className="min-h-screen bg-cream">
            <Navbar />
            {showConfetti && <ConfettiEffect />}

            <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
                {/* Banner Dashboard */}
                <div className="mb-6 bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-primary">Sudah punya kode?</p>
                        <p className="text-xs text-gray-600">Masuk ke dashboard untuk pantau penjualan</p>
                    </div>
                    <Link href="/afiliasi/login" className="bg-primary text-white text-xs font-black py-2 px-4 rounded-xl hover:bg-primary-dark transition-colors">
                        Login Dashboard →
                    </Link>
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 mb-2">Program Afiliasi 🎁</h1>
                    <p className="text-gray-600">
                        Setiap <strong>6 risol</strong> yang terjual pakai kodemu, kamu dapat <strong>1 risol gratis!</strong>
                    </p>
                </div>

                {/* Input */}
                <div className="card p-6 mb-6">
                    <label htmlFor="afil-code" className="label">Cek Cepat Progress</label>
                    <div className="flex gap-3 mt-1">
                        <input
                            id="afil-code"
                            type="text"
                            className="input-field uppercase tracking-widest flex-1"
                            placeholder="Contoh: AB1234"
                            maxLength={6}
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                setResult(null);
                                setNotFound(false);
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                        />
                        <button
                            id="check-afil-btn"
                            onClick={handleCheck}
                            className="btn-primary px-6 whitespace-nowrap"
                        >
                            Cek Progress
                        </button>
                    </div>
                    {notFound && (
                        <p className="text-red-500 text-sm mt-3 font-medium">❌ Kode tidak ditemukan. Pastikan kamu sudah beli isi 3!</p>
                    )}
                </div>
                {/* Search by WA */}
                <div className="card p-6 mb-6 bg-gray-50 border-dashed border-2 border-gray-200">
                    <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                        <span>🔍</span> Lupa Kode Afiliasi?
                    </h3>
                    <div className="flex gap-3">
                        <input
                            type="tel"
                            className="input-field flex-1"
                            placeholder="Masukkan No. WhatsApp kamu"
                            value={searchWA}
                            onChange={(e) => setSearchWA(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearchByWA()}
                        />
                        <button
                            onClick={handleSearchByWA}
                            disabled={isSearching}
                            className="btn-outline px-4 py-2 text-sm whitespace-nowrap bg-white"
                        >
                            {isSearching ? "..." : "Cari Kode"}
                        </button>
                    </div>
                    {searchResult && (
                        <div className="mt-4 p-4 bg-primary/10 rounded-xl animate-bounce-subtle border border-primary/20">
                            <p className="text-xs text-primary font-bold uppercase">Kode Kamu Ditemukan! 🎉</p>
                            <p className="text-2xl font-black text-gray-800 tracking-widest">{searchResult}</p>
                            <button 
                                onClick={() => {
                                    setCode(searchResult);
                                    setSearchResult(null);
                                    setSearchWA("");
                                }}
                                className="text-xs text-primary underline mt-1 font-bold"
                            >
                                Gunakan kode ini untuk cek progress ↑
                            </button>
                        </div>
                    )}
                    {searchError && (
                        <p className="text-red-500 text-xs mt-2 font-medium">❌ {searchError}</p>
                    )}
                </div>

                {/* Result */}
                {result && (
                    <div className="card p-6 animate-fade-in">
                        {/* Congrats or progress */}
                        <div className="mb-6">
                            <h2 className="text-xl font-black text-gray-800 mb-1">Halo, {result.ownerName}! 👋</h2>
                            <p className="text-gray-500 text-sm">Berikut adalah pencapaian afiliasi kamu:</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Terjual</p>
                                <p className="text-2xl font-black text-gray-800">{result.totalSold} <span className="text-xs font-normal text-gray-500">risol</span></p>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                <p className="text-[10px] uppercase font-bold text-primary mb-1">Hadiah Siap Klaim</p>
                                <p className="text-2xl font-black text-primary">{readyToClaim} <span className="text-xs font-normal text-primary/60">risol</span></p>
                            </div>
                        </div>

                        {/* Progress Bar for Next Reward */}
                        <div className="mb-6 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-xs font-bold text-gray-600">Progress Hadiah Berikutnya</p>
                                <p className="text-sm font-black text-primary">{progressInMilestone}/6</p>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-700"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 text-center italic">
                                Jual {6 - progressInMilestone} risol lagi untuk dapet 1 risol gratis tambahan!
                            </p>
                        </div>

                        {/* History Stats */}
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs px-2">
                                <span className="text-gray-500">Total hadiah didapat:</span>
                                <span className="font-bold text-gray-800">{totalEarned} risol</span>
                            </div>
                            <div className="flex justify-between text-xs px-2">
                                <span className="text-gray-500">Sudah diklaim:</span>
                                <span className="font-bold text-gray-800">{result.claimedCount} risol</span>
                            </div>
                        </div>



                        {/* CTA klaim reward */}
                        {readyToClaim > 0 && (
                            <div className="animate-bounce-subtle">
                                <a
                                    id="claim-reward-btn"
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary flex items-center justify-center gap-2 w-full mt-2"
                                >
                                    💬 Klaim {readyToClaim} Risol Gratis via WhatsApp
                                </a>
                                <p className="text-[10px] text-center text-gray-400 mt-2 italic">
                                    Admin akan memverifikasi data sebelum memberikan hadiah.
                                </p>
                            </div>
                        )}
                        
                        {readyToClaim === 0 && totalEarned > 0 && (
                            <div className="bg-green-50 border border-green-100 p-4 rounded-2xl text-center">
                                <p className="text-xs font-bold text-green-700">✅ Semua hadiah sudah diklaim!</p>
                                <p className="text-[10px] text-green-600 mt-1">Terus bagikan kodemu untuk dapat hadiah lagi.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Explanation */}
                <div className="mt-8 card p-6 bg-primary/5 border border-primary/20">
                    <h3 className="font-black text-gray-800 mb-3">📌 Cara Kerja Afiliasi</h3>
                    <ol className="space-y-2 text-sm text-gray-700">
                        <li className="flex gap-2">
                            <span className="text-primary font-bold">1.</span>
                            <span>Setiap pembelian <strong>isi 3</strong> kamu akan mendapatkan kode afiliasi unik</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary font-bold">2.</span>
                            <span>Bagikan kodemu ke teman-teman</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary font-bold">3.</span>
                            <span>Teman input kodemu saat order (per risol dihitung 1 poin)</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary font-bold">4.</span>
                            <span>Jika sudah terkumpul 6 risol, kamu dapat <strong>1 risol gratis!</strong></span>
                        </li>
                    </ol>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-6 px-4 text-center mt-8">
                <p className="text-gray-400 text-sm">🫓 Risol Lumer — &ldquo;Lumer di mulut, awet di hati&rdquo;</p>
            </footer>
        </div>
    );
}
