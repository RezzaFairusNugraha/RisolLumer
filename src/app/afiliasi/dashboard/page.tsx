"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import ConfettiEffect from "@/components/ConfettiEffect";
import { getAffiliate, getOrders } from "@/lib/storage";
import { getAfilSession, afilLogout } from "@/lib/auth";
import { PRODUCTS } from "@/lib/products";
import { buildRewardClaimLink } from "@/lib/whatsapp";

export default function AffiliateDashboard() {
    const router = useRouter();
    const [afilCode, setAfilCode] = useState<string | null>(null);
    const [afilData, setAfilData] = useState<any>(null);
    const [referralOrders, setReferralOrders] = useState<any[]>([]);

    useEffect(() => {
        const session = getAfilSession();
        if (!session) {
            router.push("/afiliasi/login");
        } else {
            setAfilCode(session);
            const data = getAffiliate(session);
            setAfilData(data);

            // Get orders that used this referral code
            const allOrders = getOrders();
            const referrals = allOrders.filter(o => o.referralCode === session);
            setReferralOrders(referrals);
        }
    }, [router]);

    const handleLogout = () => {
        afilLogout();
        router.push("/afiliasi/login");
    };

    if (!afilCode || !afilData) return null;

    const count = afilData.usedBy.length;
    const pct = Math.min((count / 5) * 100, 100);
    const waLink = buildRewardClaimLink(afilData.ownerName, afilCode);

    return (
        <div className="min-h-screen bg-cream">
            <Navbar />
            {count >= 5 && <ConfettiEffect />}

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Header Dashboard */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800">Halo, {afilData.ownerName}! 👋</h1>
                        <p className="text-gray-600">Selamat datang di dashboard afiliasimu</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn-outline border-red-500 text-red-500 hover:bg-red-50 py-2 px-6 rounded-xl text-sm self-start md:self-center"
                    >
                        🚪 Keluar
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
                    {/* Left Side: Stats & Progress */}
                    <div className="space-y-6">
                        <div className="card p-6 border-2 border-primary/20">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Kode Afiliasimu</p>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-black text-primary tracking-widest">{afilCode}</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(afilCode);
                                        alert("Kode disalin!");
                                    }}
                                    className="text-xs bg-gray-100 font-bold py-1 px-3 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    📋 Salin
                                </button>
                            </div>
                        </div>

                        <div className="card p-6">
                            <h2 className="text-lg font-black text-gray-800 mb-4">🎁 Progress Reward</h2>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-3xl font-black text-primary">{count}<span className="text-gray-300 text-xl">/5</span></span>
                                <span className="text-sm font-bold text-gray-500">{5 - count} teman lagi</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-4">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-1000"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-600 text-center italic">
                                {count >= 5
                                    ? "🎉 Selamat! Kamu sudah bisa klaim 3 risol gratis."
                                    : "Ayo ajak temanmu order Resol Lumer isi 3!"}
                            </p>

                            {count >= 5 && !afilData.rewardClaimed && (
                                <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary w-full mt-6 text-center text-sm"
                                >
                                    🎁 Klaim Reward Sekarang
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Referral Monitoring */}
                    <div className="card overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-800">Monitoring Penjualan</h2>
                            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                                {referralOrders.length} Pesanan
                            </span>
                        </div>

                        <div className="p-0">
                            {referralOrders.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-5xl mb-4">🧊</div>
                                    <p className="text-gray-500 font-medium">Belum ada teman yang pakai kodemu.</p>
                                    <p className="text-sm text-gray-400 mt-1">Ayo terus bagikan kodemu!</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-left text-gray-500 border-b border-gray-100">
                                                <th className="px-6 py-3 font-bold">Waktu</th>
                                                <th className="px-6 py-3 font-bold">Pesanan</th>
                                                <th className="px-6 py-3 font-bold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {referralOrders.map((order, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-xs text-gray-500">
                                                        {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })} •
                                                        {new Date(order.createdAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-gray-800">
                                                        {order.items.reduce((acc: number, item: any) => acc + item.qty, 0)} Pcs
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${order.status === "Selesai" ? "bg-green-100 text-green-700" :
                                                                order.status === "Diproses" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
