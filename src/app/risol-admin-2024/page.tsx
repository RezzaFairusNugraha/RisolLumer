"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/lib/storage";
import {
    getOrders,
    getTodayOrders,
    updateOrderStatus,
    deleteOrder,
    getAffiliates,
    updateAffiliateReward,
    deleteAffiliate,
    AffiliateData,
} from "@/lib/storage";
import { PRODUCTS } from "@/lib/products";
import { isAdminLoggedIn, adminLogout } from "@/lib/auth";
import { useToast } from "@/components/ToastContext";

type FilterStatus = "semua" | OrderStatus;
type FilterType = "semua" | "ambil" | "antar";

const STATUS_COLORS: Record<OrderStatus, string> = {
    Baru: "bg-yellow-100 text-yellow-800",
    Diproses: "bg-blue-100 text-blue-800",
    Selesai: "bg-green-100 text-green-800",
    Dibatalkan: "bg-gray-100 text-gray-800",
};

const ROW_COLORS: Record<OrderStatus, string> = {
    Baru: "bg-yellow-50",
    Diproses: "bg-blue-50",
    Selesai: "bg-green-50",
    Dibatalkan: "bg-gray-100/50",
};

function playDing() {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch {
        // audiocontext may be blocked
    }
}

function formatItemDetail(order: Order): string {
    return order.items
        .map((item) => {
            const prod = PRODUCTS.find((p) => p.id === item.productId);
            return `${prod?.emoji ?? ""} ${prod?.name ?? item.productId} ${item.packaging === "isi3" ? "(isi3)" : ""
                } ×${item.qty}`;
        })
        .join(", ");
}

export default function AdminPage() {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [activeTab, setActiveTab] = useState<"pesanan" | "afiliasi">("pesanan");
    const [orders, setOrders] = useState<Order[]>([]);
    const [affiliates, setAffiliates] = useState<Record<string, AffiliateData>>({});
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");
    const [filterType, setFilterType] = useState<FilterType>("semua");
    const [highlightCode, setHighlightCode] = useState<string | null>(null);
    const highlightTimer = useRef<NodeJS.Timeout | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        if (!isAdminLoggedIn()) {
            router.push("/risol-admin-2024/login");
        } else {
            setIsAuth(true);
        }
    }, [router]);

    const loadData = useCallback(async () => {
        const todayOrders = await getTodayOrders();
        const allAffiliates = await getAffiliates();
        setOrders(todayOrders);
        setAffiliates(allAffiliates);
    }, []);

    const handleLogout = () => {
        adminLogout();
        router.push("/risol-admin-2024/login");
    };

    useEffect(() => {
        if (!isAuth) return;
        loadData();

        const handleNewOrder = (e: Event) => {
            const order = (e as CustomEvent<Order>).detail;
            loadData();
            // Notify via toast system
            showToast(`Pesanan baru masuk! — ${order.name}`, "info");
            playDing();
            document.title = "(1) Pesanan Baru! — Risol Lumer";
            setHighlightCode(order.code);
            if (highlightTimer.current) clearTimeout(highlightTimer.current);
            highlightTimer.current = setTimeout(() => {
                setHighlightCode(null);
            }, 5000);
        };

        window.addEventListener("newOrder", handleNewOrder);
        return () => {
            window.removeEventListener("newOrder", handleNewOrder);
        };
    }, [loadData, isAuth]);

    if (!isAuth) return null;

    const handleStatusChange = async (code: string, status: OrderStatus) => {
        await updateOrderStatus(code, status);
        await loadData();
    };

    const handleDeleteOrder = async (code: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus pesanan ini secara permanen?")) {
            await deleteOrder(code);
            await loadData();
        }
    };

    const handleUpdateReward = async (code: string, claimed: boolean) => {
        await updateAffiliateReward(code, claimed);
        await loadData();
    };

    const handleDeleteAffiliate = async (code: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus partner afiliasi ${code} ini secara permanen? Semua data progres referral untuk kode ini akan hilang.`)) {
            await deleteAffiliate(code);
            await loadData();
        }
    };

    // Stats
    const todayTotal = orders.length;
    const todayRevenue = orders.reduce((s, o) => s + o.total, 0);
    const todayAmbil = orders.filter((o) => o.type === "ambil").length;
    const todayAntar = orders.filter((o) => o.type === "antar").length;

    // Filtered orders
    const filtered = orders.filter((o) => {
        const statusMatch = filterStatus === "semua" || o.status === filterStatus;
        const typeMatch = filterType === "semua" || o.type === filterType;
        return statusMatch && typeMatch;
    });

    // Export CSV
    const exportCSV = () => {
        const headers = ["Kode", "Nama", "WA", "Jenis", "Detail", "Total", "Waktu", "Status"];
        const rows = orders.map((o) => [
            o.code,
            o.name,
            o.whatsapp,
            o.type,
            formatItemDetail(o),
            o.total,
            new Date(o.createdAt).toLocaleString("id-ID"),
            o.status,
        ]);
        const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `risol-orders-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-primary text-white px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🫓</span>
                            <h1 className="text-2xl font-black">Dashboard Admin</h1>
                        </div>
                        <p className="text-white/70 text-sm mt-1">Risol Lumer — Hari ini {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            id="refresh-btn"
                            onClick={loadData}
                            className="bg-white/20 hover:bg-white/30 transition-colors text-white font-bold py-2 px-4 rounded-xl text-sm min-h-[44px]"
                        >
                            🔄 Refresh
                        </button>
                        <button
                            id="logout-btn"
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 transition-colors text-white font-bold py-2 px-4 rounded-xl text-sm min-h-[44px]"
                        >
                            🚪 Keluar
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* === TABS SELECTION === */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab("pesanan")}
                        className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-sm ${activeTab === "pesanan" ? "bg-primary text-white scale-105" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                    >
                        📦 Pesanan Hari Ini
                    </button>
                    <button
                        onClick={() => setActiveTab("afiliasi")}
                        className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-sm ${activeTab === "afiliasi" ? "bg-yellow-400 text-white scale-105" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                    >
                        👥 Daftar Afiliasi
                    </button>
                </div>

                {activeTab === "pesanan" ? (
                    <>
                        {/* === STATS CARDS === */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: "Total Pesanan Hari Ini", value: todayTotal, icon: "📦", color: "bg-blue-50 border-blue-200" },
                                { label: "Total Pemasukan", value: `Rp${todayRevenue.toLocaleString("id-ID")}`, icon: "💰", color: "bg-green-50 border-green-200" },
                                { label: "Ambil Sendiri", value: todayAmbil, icon: "🏪", color: "bg-yellow-50 border-yellow-200" },
                                { label: "Diantar", value: todayAntar, icon: "🛵", color: "bg-purple-50 border-purple-200" },
                            ].map((card, i) => (
                                <div key={i} className={`rounded-2xl border-2 p-5 ${card.color}`}>
                                    <div className="text-3xl mb-2">{card.icon}</div>
                                    <p className="text-2xl font-black text-gray-800">{card.value}</p>
                                    <p className="text-sm text-gray-600 font-medium mt-1">{card.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* === FILTERS & EXPORT === */}
                        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
                            <div className="flex gap-2 items-center">
                                <label className="text-sm font-bold text-gray-600">Status:</label>
                                {(["semua", "Baru", "Diproses", "Selesai"] as FilterStatus[]).map((s) => (
                                    <button
                                        key={s}
                                        id={`filter-status-${s}`}
                                        onClick={() => setFilterStatus(s)}
                                        className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-colors min-h-[36px] ${filterStatus === s
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center">
                                <label className="text-sm font-bold text-gray-600">Jenis:</label>
                                {(["semua", "ambil", "antar"] as FilterType[]).map((t) => (
                                    <button
                                        key={t}
                                        id={`filter-type-${t}`}
                                        onClick={() => setFilterType(t)}
                                        className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-colors min-h-[36px] capitalize ${filterType === t
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <div className="ml-auto">
                                <button
                                    id="export-csv-btn"
                                    onClick={exportCSV}
                                    className="bg-gray-800 text-white font-bold py-2 px-4 rounded-xl text-sm hover:bg-gray-900 transition-colors min-h-[44px]"
                                >
                                    📥 Export CSV
                                </button>
                            </div>
                        </div>

                        {/* === ORDERS TABLE === */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-[800px] w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b-2 border-gray-100">
                                            <th className="text-left px-4 py-3 font-black text-gray-700">Kode Order</th>
                                            <th className="text-left px-4 py-3 font-black text-gray-700">Nama</th>
                                            <th className="text-left px-4 py-3 font-black text-gray-700">WA</th>
                                            <th className="text-left px-4 py-3 font-black text-gray-700">Jenis</th>
                                            <th className="text-left px-4 py-3 font-black text-gray-700">Detail</th>
                                            <th className="text-left px-4 py-3 font-black text-gray-700">Total</th>
                                            <th className="text-left px-4 py-3 font-black text-gray-700">Waktu</th>
                                            <th className="text-left px-4 py-3 font-black text-gray-700">Status</th>
                                            <th className="text-left px-4 py-3 font-black text-gray-700">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-12 text-gray-400 font-medium">
                                                    📭 Belum ada pesanan
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((order) => {
                                                const rowBase = ROW_COLORS[order.status];
                                                const isHighlight = highlightCode === order.code;
                                                return (
                                                    <tr
                                                        key={order.code}
                                                        className={`border-b border-gray-100 transition-colors duration-500 ${isHighlight ? "bg-yellow-200" : rowBase
                                                            }`}
                                                    >
                                                        <td className="px-4 py-3 font-black text-primary whitespace-nowrap">
                                                            {order.code}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                                                            {order.name}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                                            <a
                                                                href={`https://wa.me/${order.whatsapp.replace(/[^0-9]/g, "")}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="hover:text-primary hover:underline"
                                                            >
                                                                {order.whatsapp}
                                                            </a>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${order.type === "ambil" ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"}`}>
                                                                {order.type === "ambil" ? "🏪 Ambil" : "🛵 Antar"}
                                                            </span>
                                                            {order.kelas && (
                                                                <span className="ml-1 text-xs text-gray-500">({order.kelas})</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700 max-w-[200px]">
                                                            <span className="line-clamp-2">{formatItemDetail(order)}</span>
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">
                                                            Rp{order.total.toLocaleString("id-ID")}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                                                            {new Date(order.createdAt).toLocaleTimeString("id-ID", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                id={`status-${order.code}`}
                                                                value={order.status}
                                                                onChange={(e) =>
                                                                    handleStatusChange(order.code, e.target.value as OrderStatus)
                                                                }
                                                                className={`text-xs font-bold px-2 py-1.5 rounded-xl border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer min-h-[36px] ${STATUS_COLORS[order.status]}`}
                                                            >
                                                                <option value="Baru">Baru</option>
                                                                <option value="Diproses">Diproses</option>
                                                                <option value="Selesai">Selesai</option>
                                                                <option value="Dibatalkan">Dibatalkan</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={() => handleDeleteOrder(order.code)}
                                                                className="text-red-500 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                                                title="Hapus Pesanan"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-4">
                            Menampilkan pesanan hari ini saja • Total: {filtered.length} pesanan
                        </p>
                    </>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm overflow-hidden p-6 border-2 border-yellow-100">
                        <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                            <span>🎁</span> Daftar Partner Afiliasi
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 font-black">Kode</th>
                                        <th className="px-6 py-4 font-black">Nama Owner</th>
                                        <th className="px-6 py-4 font-black">WhatsApp</th>
                                        <th className="px-6 py-4 font-black">Referral</th>
                                        <th className="px-6 py-4 font-black">Status Hadiah</th>
                                        <th className="px-6 py-4 font-black">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {Object.entries(affiliates).length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                                Belum ada partner afiliasi yang terdaftar.
                                            </td>
                                        </tr>
                                    ) : (
                                        Object.entries(affiliates).map(([code, data]) => {
                                            const count = data.usedBy.length;
                                            const canClaim = count >= 5;
                                            return (
                                                <tr key={code} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-black text-primary tracking-widest">{code}</td>
                                                    <td className="px-6 py-4 font-medium">{data.ownerName}</td>
                                                    <td className="px-6 py-4 text-gray-600">{data.ownerWA}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold ${canClaim ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {count}/5
                                                            </span>
                                                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all duration-500 ${canClaim ? 'bg-green-500' : 'bg-gray-300'}`}
                                                                    style={{ width: `${Math.min((count / 5) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {data.rewardClaimed ? (
                                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase">
                                                                SUDAH DIKLAIM ✅
                                                            </span>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${canClaim ? 'bg-yellow-100 text-yellow-700 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                                                                    {canClaim ? 'BELUM DIKLAIM 🎁' : 'BELUM CAPAI TARGET'}
                                                                </span>
                                                                {canClaim && (
                                                                    <button
                                                                        onClick={() => handleUpdateReward(code, true)}
                                                                        className="text-[10px] bg-primary text-white font-bold py-1 px-3 rounded-lg hover:bg-primary-dark transition-colors"
                                                                    >
                                                                        Tandai Klaim
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => handleDeleteAffiliate(code)}
                                                            className="text-red-500 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                                            title="Hapus Affiliate"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
