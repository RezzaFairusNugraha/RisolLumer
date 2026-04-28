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
    getDbProducts,
    updateProductAvailability,
} from "@/lib/storage";
import { PRODUCTS } from "@/lib/products";
import { isAdminLoggedIn, adminLogout } from "@/lib/auth";
import { useToast } from "@/components/ToastContext";

type FilterStatus = "semua" | OrderStatus;
type FilterType = "semua" | "ambil" | "antar";
type FilterTime = "today" | "all";

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

function formatItemDetail(order: Order, productMap: Map<string, any>): string {
    return order.items
        .map((item) => {
            const prod = productMap.get(item.productId);
            
            if (prod?.isMentah) {
                return `${prod.emoji} ${prod.name.replace(" (Mentah)", "")} [${item.qty} pack] 🧊`;
            }

            // Matang logic
            const bundles = Math.floor(item.qty / 3);
            const satuan = item.qty % 3;

            let detail = `${prod?.emoji ?? ""} ${prod?.name ?? item.productId}`;
            if (bundles > 0 && satuan > 0) {
                detail += ` [${bundles} pkt + ${satuan} pcs]`;
            } else if (bundles > 0) {
                detail += ` [${bundles} pkt]`;
            } else {
                detail += ` [${item.qty} pcs]`;
            }
            return detail;
        })
        .join("\n");
}

export default function AdminPage() {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [activeTab, setActiveTab] = useState<"pesanan" | "afiliasi">("pesanan");
    const [orders, setOrders] = useState<Order[]>([]);
    const [dbProducts, setDbProducts] = useState<any[]>([]);
    const [affiliates, setAffiliates] = useState<Record<string, AffiliateData>>({});
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");
    const [filterType, setFilterType] = useState<FilterType>("semua");
    const [filterTime, setFilterTime] = useState<FilterTime>("all"); // Default to 'all' to ensure no orders are missed
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
        const [allOrders, allAffiliates, allProducts] = await Promise.all([
            getOrders(),
            getAffiliates(),
            getDbProducts()
        ]);
        setOrders(allOrders);
        setAffiliates(allAffiliates);
        setDbProducts(allProducts);
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

    const handleToggleAvailability = async (id: string, current: boolean) => {
        await updateProductAvailability(id, !current);
        await loadData();
    };

    // Filtered orders (Time filter first)
    const timeFiltered = orders.filter((o) => {
        if (filterTime === "all") return true;
        const today = new Date().toLocaleDateString('en-CA');
        const orderDate = new Date(o.createdAt).toLocaleDateString('en-CA');
        return orderDate === today;
    });

    // Stats based on time filter
    const statsTotal = timeFiltered.length;
    const statsRevenue = timeFiltered.reduce((s, o) => s + o.total, 0);
    const statsAmbil = timeFiltered.filter((o) => o.type === "ambil").length;
    const statsAntar = timeFiltered.filter((o) => o.type === "antar").length;

    // Product Map for lookup
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // Detailed Stats (Product Breakdown)
    const productStats = dbProducts.map(p => {
        const qty = timeFiltered.reduce((sum, o) => {
            const item = o.items?.find(i => i.productId === p.id);
            return sum + (item?.qty || 0);
        }, 0);

        if (p.isMentah) {
            return {
                ...p,
                totalQty: qty,
                unit: "pack",
                isMentah: true
            };
        }

        const bundles = Math.floor(qty / 3);
        const satuan = qty % 3;
        return {
            ...p,
            totalQty: qty,
            bundles,
            satuan,
            unit: "pcs",
            isMentah: false
        };
    }).filter(s => s.totalQty > 0);

    const totalQtySold = productStats.reduce((s, p) => s + p.totalQty, 0);

    // Main list filter
    const filtered = timeFiltered.filter((o) => {
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
            formatItemDetail(o, productMap),
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
                                { label: filterTime === "today" ? "Pemasukan Hari Ini" : "Total Pemasukan", value: `Rp${statsRevenue.toLocaleString("id-ID")}`, icon: "💰", color: "bg-green-50 border-green-200" },
                                { label: filterTime === "today" ? "Pesanan Hari Ini" : "Semua Pesanan", value: statsTotal, icon: "📦", color: "bg-blue-50 border-blue-200" },
                                { label: "Ambil Sendiri", value: statsAmbil, icon: "🏪", color: "bg-yellow-50 border-yellow-200" },
                                { label: "Diantar", value: statsAntar, icon: "🛵", color: "bg-purple-50 border-purple-200" },
                            ].map((card, i) => (
                                <div key={i} className={`rounded-2xl border-2 p-5 ${card.color}`}>
                                    <div className="text-3xl mb-2">{card.icon}</div>
                                    <p className="text-2xl font-black text-gray-800">{card.value}</p>
                                    <p className="text-sm text-gray-600 font-medium mt-1">{card.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* === PRODUCT BREAKDOWN === */}
                        {dbProducts.length === 0 && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8 text-center">
                                <p className="text-red-700 font-bold mb-2">⚠️ Database Produk Kosong!</p>
                                <p className="text-sm text-red-600 mb-4">Sepertinya data produk belum dimasukkan ke database. Hal ini menyebabkan pesanan tidak bisa masuk.</p>
                                <button
                                    onClick={async () => {
                                        const res = await fetch("/api/products/seed", { method: "POST" });
                                        if (res.ok) {
                                            alert("Produk berhasil di-seed! Silakan refresh.");
                                            loadData();
                                        } else {
                                            alert("Gagal melakukan seeding.");
                                        }
                                    }}
                                    className="bg-red-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-red-700 transition-all shadow-md"
                                >
                                    🌱 Seed Database Produk Sekarang
                                </button>
                            </div>
                        )}
                        <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 shadow-sm mb-8">
                            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                                📊 Penjualan Per Varian
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {productStats.length === 0 ? (
                                    <p className="text-gray-400 text-sm italic col-span-full">Belum ada statistik penjualan untuk periode ini.</p>
                                ) : (
                                    productStats.map(stat => (
                                        <div key={stat.id} className={`rounded-xl p-4 border transition-all ${stat.isAvailable ? 'bg-gray-50 border-gray-100' : 'bg-red-50 border-red-100 grayscale-[0.5]'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{stat.emoji}</span>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-700 leading-tight">
                                                            {stat.isMentah ? stat.name.replace(" (Mentah)", "") : stat.name}
                                                        </span>
                                                        {stat.isMentah && <span className="text-[10px] text-blue-500 font-black uppercase">Frozen 🧊</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleAvailability(stat.id, stat.isAvailable)}
                                                    className={`text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter transition-all ${stat.isAvailable ? 'bg-green-500 text-white shadow-sm' : 'bg-red-500 text-white'}`}
                                                >
                                                    {stat.isAvailable ? 'Ready' : 'Habis'}
                                                </button>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Total:</span>
                                                    <span className={`font-black ${stat.isMentah ? 'text-blue-600' : 'text-primary'}`}>
                                                        {stat.totalQty} {stat.unit}
                                                    </span>
                                                </div>
                                                {!stat.isMentah && (
                                                    <>
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-400">Paket (3):</span>
                                                            <span className="font-bold text-orange-600">{stat.bundles} pkt</span>
                                                        </div>
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-400">Satuan:</span>
                                                            <span className="font-bold text-blue-600">{stat.satuan} pcs</span>
                                                        </div>
                                                    </>
                                                )}
                                                {stat.isMentah && (
                                                    <div className="text-[10px] text-gray-400 italic mt-1">
                                                        * 1 pack = 10 pcs mentah
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* === FILTERS & EXPORT === */}
                        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
                            <div className="flex gap-2 items-center">
                                <label className="text-sm font-bold text-gray-600">Waktu:</label>
                                <button
                                    onClick={() => setFilterTime("today")}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${filterTime === "today" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                >
                                    Hari Ini
                                </button>
                                <button
                                    onClick={() => setFilterTime("all")}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${filterTime === "all" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                >
                                    Semua Waktu
                                </button>
                            </div>
                            <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>
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
                                                        <td className="px-4 py-3 text-gray-700 max-w-[250px]">
                                                            <div className="whitespace-pre-line text-xs leading-relaxed">
                                                                {formatItemDetail(order, productMap)}
                                                            </div>
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
                            Menampilkan {filterTime === "today" ? "pesanan hari ini saja" : "semua pesanan"} • Total: {filtered.length} pesanan
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
                                        <th className="px-6 py-4 font-black">Poin (Risol Terjual)</th>
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
                                        Object.entries(affiliates).map(([code, data]: [string, any]) => {
                                            const count = data.totalSold || 0;
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
