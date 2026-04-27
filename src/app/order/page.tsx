"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import OrderSummary from "@/components/OrderSummary";
import { PRODUCTS } from "@/lib/products";
import type { OrderItem, OrderType, Packaging, Order } from "@/lib/storage";
import {
    getOrders,
    saveOrder,
    getAffiliate,
    saveAffiliate,
    findAffiliateByWA,
    getDbProducts,
} from "@/lib/storage";
import { generateOrderCode } from "@/lib/orderCode";
import { generateAffiliateCode } from "@/lib/affiliateCode";
import { useEffect } from "react";

interface FormState {
    name: string;
    whatsapp: string;
    kelas: string;
    referralCode: string;
    items: { productId: string; qty: number }[];
}

const INITIAL_FORM: FormState = {
    name: "",
    whatsapp: "",
    kelas: "",
    referralCode: "",
    items: PRODUCTS.map((p) => ({ productId: p.id, qty: 0 })),
};

export default function OrderPage() {
    const [tab, setTab] = useState<OrderType>("ambil");
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [referralMsg, setReferralMsg] = useState<string>("");
    const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
    const [newAffiliateCode, setNewAffiliateCode] = useState<string | undefined>();
    const [dbProducts, setDbProducts] = useState<any[]>([]);

    useEffect(() => {
        getDbProducts().then(setDbProducts);
    }, []);

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = "Nama wajib diisi";
        if (!form.whatsapp.trim()) {
            errs.whatsapp = "Nomor WhatsApp wajib diisi";
        } else if (!form.whatsapp.startsWith("08") && !form.whatsapp.startsWith("+62")) {
            errs.whatsapp = 'Nomor WA harus diawali "08" atau "+62"';
        }
        if (tab === "antar" && !form.kelas.trim()) errs.kelas = "Kelas/lokasi wajib diisi";
        const hasItem = form.items.some((i) => i.qty > 0);
        if (!hasItem) errs.items = "Pilih minimal 1 produk";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const checkReferral = async (code: string) => {
        if (!code.trim()) {
            setReferralMsg("");
            return;
        }
        const aff = await getAffiliate(code.trim().toUpperCase());
        if (!aff) {
            setReferralMsg("❌ Kode tidak ditemukan");
        } else {
            setReferralMsg(`✅ Kode valid — milik ${aff.ownerName}`);
        }
    };

    const calcTotal = (): number => {
        return form.items.reduce((total, item) => {
            const bundles = Math.floor(item.qty / 3);
            const individual = item.qty % 3;
            return total + (bundles * 10000) + (individual * 5000);
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const orders = await getOrders();
        const code = generateOrderCode(orders);
        const total = calcTotal();

        const activeItems: OrderItem[] = form.items
            .filter((i) => i.qty > 0)
            .map(i => ({ ...i, packaging: "1pcs" as Packaging }));

        const totalQty = activeItems.reduce((s, i) => s + i.qty, 0);
        const boughtIsi3 = totalQty >= 3;
        let affCode: string | undefined;
        if (boughtIsi3) {
            // CHECK IF ALREADY HAS CODE
            const existingCode = await findAffiliateByWA(form.whatsapp);
            if (existingCode) {
                affCode = existingCode;
            } else {
                affCode = generateAffiliateCode();
                // Save new affiliate entry
                await saveAffiliate(affCode, {
                    ownerName: form.name,
                    ownerWA: form.whatsapp,
                    usedBy: [],
                    rewardClaimed: false,
                });
            }
        }

        const order: Order = {
            code,
            name: form.name,
            whatsapp: form.whatsapp,
            type: tab,
            kelas: tab === "antar" ? form.kelas : undefined,
            items: activeItems,
            referralCode: form.referralCode.trim() || undefined,
            affiliateCode: affCode,
            total,
            status: "Baru",
            createdAt: new Date().toISOString(),
        };

        await saveOrder(order);

        // Dispatch custom event for admin dashboard
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("newOrder", { detail: order }));
        }

        setSubmittedOrder(order);
        setNewAffiliateCode(affCode);
    };

    const updateItem = (
        productId: string,
        field: "qty",
        value: number
    ) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                item.productId === productId ? { ...item, [field]: value } : item
            ),
        }));
    };

    const total = calcTotal();

    return (
        <div className="min-h-screen bg-cream">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 mb-2">Order Risol 🫓</h1>
                    <p className="text-gray-600">Isi form di bawah dan konfirmasi via WhatsApp</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm max-w-xs mx-auto">
                    <button
                        id="tab-ambil"
                        onClick={() => setTab("ambil")}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all min-h-[44px] ${tab === "ambil"
                            ? "bg-primary text-white shadow-md"
                            : "text-gray-600 hover:text-primary"
                            }`}
                    >
                        🏪 Ambil Sendiri
                    </button>
                    <button
                        id="tab-antar"
                        onClick={() => setTab("antar")}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all min-h-[44px] ${tab === "antar"
                            ? "bg-primary text-white shadow-md"
                            : "text-gray-600 hover:text-primary"
                            }`}
                    >
                        🛵 Diantar
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                        {/* Left: Form fields */}
                        <div className="space-y-6">
                            {/* Personal info */}
                            <div className="card p-6">
                                <h2 className="text-lg font-black text-gray-800 mb-4">📋 Data Diri</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="name" className="label">Nama Lengkap *</label>
                                        <input
                                            id="name"
                                            type="text"
                                            className="input-field"
                                            placeholder="Contoh: Budi Santoso"
                                            value={form.name}
                                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="whatsapp" className="label">Nomor WhatsApp *</label>
                                        <input
                                            id="whatsapp"
                                            type="tel"
                                            className="input-field"
                                            placeholder="08xx-xxxx-xxxx"
                                            value={form.whatsapp}
                                            onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                                        />
                                        {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                                    </div>
                                </div>

                                {/* Kelas (only for antar) */}
                                {tab === "antar" && (
                                    <div className="mt-4">
                                        <label htmlFor="kelas" className="label">Kelas / Lokasi Pengantaran *</label>
                                        <input
                                            id="kelas"
                                            type="text"
                                            className="input-field"
                                            placeholder="Contoh: XII IPA 2 / Kantin Blok B"
                                            value={form.kelas}
                                            onChange={(e) => setForm((p) => ({ ...p, kelas: e.target.value }))}
                                        />
                                        {errors.kelas && <p className="text-red-500 text-xs mt-1">{errors.kelas}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Product selection */}
                            <div className="card p-6">
                                <h2 className="text-lg font-black text-gray-800 mb-4">🛒 Pilih Produk</h2>
                                {errors.items && (
                                    <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-xl">{errors.items}</p>
                                )}
                                <div className="space-y-4">
                                    {PRODUCTS.map((prod) => {
                                        const item = form.items.find((i) => i.productId === prod.id)!;
                                        const dbProd = dbProducts.find(p => p.slug === prod.id);
                                        const isAvailable = dbProd ? dbProd.isAvailable : true;

                                        return (
                                            <div
                                                key={prod.id}
                                                className={`border-2 rounded-2xl p-4 transition-all bg-white shadow-sm ${isAvailable ? 'border-gray-100 hover:border-primary/30' : 'border-red-100 bg-red-50/10 grayscale-[0.8]'}`}
                                            >
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-gray-100">
                                                        <Image
                                                            src={prod.image}
                                                            alt={prod.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                        {!isAvailable && (
                                                            <div className="absolute inset-0 bg-red-500/60 backdrop-blur-[1px] flex items-center justify-center">
                                                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">Habis</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-bold text-gray-800 text-lg">{prod.name}</p>
                                                            {!isAvailable && (
                                                                <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Stok Habis</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            Rp{prod.price1.toLocaleString("id-ID")} / Rp{prod.price3.toLocaleString("id-ID")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3">
                                                    <div>
                                                        <label className="label text-[10px] uppercase text-gray-400">Jumlah Pesanan</label>
                                                        <p className="text-sm font-bold text-gray-700">Rp5.000 / pcs</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            type="button"
                                                            id={`qty-minus-${prod.id}`}
                                                            onClick={() => updateItem(prod.id, "qty", Math.max(0, item.qty - 1))}
                                                            className="w-10 h-10 bg-white border-2 border-gray-100 rounded-xl font-bold hover:border-primary/50 transition-colors flex items-center justify-center min-h-[44px]"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-8 text-center font-black text-gray-800 text-xl">
                                                            {item.qty}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            id={`qty-plus-${prod.id}`}
                                                            disabled={!isAvailable}
                                                            onClick={() => updateItem(prod.id, "qty", item.qty + 1)}
                                                            className={`w-10 h-10 rounded-xl font-bold text-xl shadow-md transition-all flex items-center justify-center min-h-[44px] ${isAvailable ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Referral code */}
                            <div className="card p-6">
                                <h2 className="text-lg font-black text-gray-800 mb-4">🎁 Kode Afiliasi Teman</h2>
                                <label htmlFor="referralCode" className="label">
                                    Punya kode dari teman? (Opsional)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="referralCode"
                                        type="text"
                                        className="input-field uppercase tracking-widest"
                                        placeholder="Contoh: AB1234"
                                        maxLength={6}
                                        value={form.referralCode}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setForm((p) => ({ ...p, referralCode: val }));
                                            checkReferral(val);
                                        }}
                                    />
                                </div>
                                {referralMsg && (
                                    <p className={`text-sm mt-2 font-medium ${referralMsg.startsWith("✅") ? "text-primary" : "text-red-500"}`}>
                                        {referralMsg}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Right: Order summary sticky */}
                        <div className="lg:sticky lg:top-20 h-fit">
                            <div className="card p-6">
                                <h2 className="text-lg font-black text-gray-800 mb-4">💰 Ringkasan Order</h2>
                                <div className="space-y-2 mb-4">
                                    {form.items
                                        .filter((i) => i.qty > 0)
                                        .map((item) => {
                                            const prod = PRODUCTS.find((p) => p.id === item.productId)!;
                                            return (
                                                <div key={item.productId} className="flex justify-between text-sm text-gray-700">
                                                    <span>
                                                        {prod.emoji} {prod.name} ×{item.qty}
                                                    </span>
                                                    <span className="font-bold">Rp{(5000 * item.qty).toLocaleString("id-ID")}</span>
                                                </div>
                                            );
                                        })}
                                    {form.items.every((i) => i.qty === 0) && (
                                        <p className="text-gray-400 text-sm text-center py-2">Belum ada produk dipilih</p>
                                    )}
                                </div>
                                <div className="border-t-2 border-dashed border-gray-200 pt-3">
                                    <div className="flex justify-between font-black text-lg text-gray-800">
                                        <span>Total</span>
                                        <span className="text-primary">Rp{total.toLocaleString("id-ID")}</span>
                                    </div>
                                </div>

                                <div className="mt-4 bg-yellow-400/20 border-2 border-yellow-400 rounded-2xl p-4 text-xs text-yellow-800 font-black uppercase tracking-widest text-center animate-pulse">
                                    🎁 Promo: Beli 3 (Varian Sama) Cuma Rp10.000!
                                </div>

                                <button
                                    id="submit-order-btn"
                                    type="submit"
                                    className="btn-primary w-full mt-5 text-base"
                                >
                                    ✅ Konfirmasi Order
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Order Summary Modal */}
            {submittedOrder && (
                <OrderSummary
                    order={submittedOrder}
                    affiliateCode={newAffiliateCode}
                    onClose={() => {
                        setSubmittedOrder(null);
                        setForm(INITIAL_FORM);
                    }}
                />
            )}
        </div>
    );
}
