"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import OrderSummary from "@/components/OrderSummary";
import { PRODUCTS, FLAVOR_GROUPS } from "@/lib/products";
import type { OrderItem, OrderType, Packaging, Order } from "@/lib/storage";
import {
    getAffiliate,
    saveAffiliate,
    findAffiliateByWA,
    getDbProducts,
} from "@/lib/storage";
import { generateAffiliateCode } from "@/lib/affiliateCode";

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
        if (!code.trim()) { setReferralMsg(""); return; }
        const aff = await getAffiliate(code.trim().toUpperCase());
        if (!aff) {
            setReferralMsg("❌ Kode tidak ditemukan");
        } else {
            setReferralMsg(`✅ Kode valid — milik ${aff.ownerName}`);
        }
    };

    const calcTotal = (): number => {
        let total = 0;
        for (const item of form.items) {
            if (item.qty === 0) continue;
            const prod = PRODUCTS.find(p => p.id === item.productId);
            if (!prod) continue;
            
            // Sama-sama pakai logika bundle isi 3 + satuan (berlaku untuk matang & mentah)
            const bundles = Math.floor(item.qty / 3);
            const individual = item.qty % 3;
            total += (bundles * prod.price3) + (individual * prod.price1);
        }
        return total;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const total = calcTotal();

        const activeItems: OrderItem[] = form.items
            .filter((i) => i.qty > 0)
            .map(i => {
                const prod = PRODUCTS.find(p => p.id === i.productId);
                return { ...i, packaging: (i.qty >= 3 ? "isi3" : "1pcs") as Packaging };
            });

        // Afiliasi hanya berlaku untuk risol matang >= 3 pcs
        const matangQty = activeItems
            .filter(i => !PRODUCTS.find(p => p.id === i.productId)?.isMentah)
            .reduce((s, i) => s + i.qty, 0);
        const boughtIsi3 = matangQty >= 3;
        let affCode: string | undefined;
        if (boughtIsi3) {
            const existingCode = await findAffiliateByWA(form.whatsapp);
            if (existingCode) {
                affCode = existingCode;
            } else {
                affCode = generateAffiliateCode();
                await saveAffiliate(affCode, {
                    ownerName: form.name,
                    ownerWA: form.whatsapp,
                    usedBy: [],
                    rewardClaimed: false,
                });
            }
        }

        // Dapatkan kode order dari server (tanpa simpan dulu)
        const codeRes = await fetch("/api/orders/code");
        const { code } = await codeRes.json();

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

        // Kirim ke server — server yang generate kode order
        const payload = {
            name: form.name,
            whatsapp: form.whatsapp,
            type: tab,
            kelas: tab === "antar" ? form.kelas : undefined,
            items: activeItems,
            referralCode: form.referralCode.trim() || undefined,
            affiliateCode: affCode,
            total,
        };

        // Simpan payload untuk dikirim nanti saat klik WA
        (window as any)._pendingOrder = {
            ...payload,
            code // Sertakan kode yang sudah didapat
        };

        setSubmittedOrder(order);
        setNewAffiliateCode(affCode);
    };

    const updateItem = (productId: string, value: number) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                item.productId === productId ? { ...item, qty: value } : item
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
                    <button id="tab-ambil" onClick={() => setTab("ambil")}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all min-h-[44px] ${tab === "ambil" ? "bg-primary text-white shadow-md" : "text-gray-600 hover:text-primary"}`}>
                        🏪 Ambil Sendiri
                    </button>
                    <button id="tab-antar" onClick={() => setTab("antar")}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all min-h-[44px] ${tab === "antar" ? "bg-primary text-white shadow-md" : "text-gray-600 hover:text-primary"}`}>
                        🛵 Diantar
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                        {/* Left */}
                        <div className="space-y-6">
                            {/* Data diri */}
                            <div className="card p-6">
                                <h2 className="text-lg font-black text-gray-800 mb-4">📋 Data Diri</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="name" className="label">Nama Lengkap *</label>
                                        <input id="name" type="text" className="input-field"
                                            placeholder="Contoh: Budi Santoso"
                                            value={form.name}
                                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="whatsapp" className="label">Nomor WhatsApp *</label>
                                        <input id="whatsapp" type="tel" className="input-field"
                                            placeholder="08xx-xxxx-xxxx"
                                            value={form.whatsapp}
                                            onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))} />
                                        {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                                    </div>
                                </div>
                                {tab === "antar" && (
                                    <div className="mt-4">
                                        <label htmlFor="kelas" className="label">Kelas / Lokasi Pengantaran *</label>
                                        <input id="kelas" type="text" className="input-field"
                                            placeholder="Contoh: XII IPA 2 / Kantin Blok B"
                                            value={form.kelas}
                                            onChange={(e) => setForm((p) => ({ ...p, kelas: e.target.value }))} />
                                        {errors.kelas && <p className="text-red-500 text-xs mt-1">{errors.kelas}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Pilih Produk — Grouped by Flavor */}
                            <div className="card p-6">
                                <h2 className="text-lg font-black text-gray-800 mb-1">🛒 Pilih Produk</h2>
                                <p className="text-xs text-gray-500 mb-4">Tiap varian tersedia <span className="font-bold text-orange-500">🔥 Matang</span> dan <span className="font-bold text-blue-500">🧊 Mentah (Frozen)</span></p>

                                {errors.items && (
                                    <p className="text-red-500 text-sm mb-3 bg-red-50 px-3 py-2 rounded-xl">{errors.items}</p>
                                )}

                                <div className="space-y-5">
                                    {FLAVOR_GROUPS.map((flavor) => {
                                        const matangProd = PRODUCTS.find(p => p.id === flavor.id)!;
                                        const mentahProd = PRODUCTS.find(p => p.id === `${flavor.id}-mentah`)!;
                                        const matangItem = form.items.find(i => i.productId === matangProd.id)!;
                                        const mentahItem = form.items.find(i => i.productId === mentahProd.id)!;
                                        const dbProdMatang = dbProducts.find(p => p.slug === matangProd.id);
                                        const dbProdMentah = dbProducts.find(p => p.slug === mentahProd.id);
                                        const matangAvail = dbProdMatang ? dbProdMatang.isAvailable : true;
                                        const mentahAvail = dbProdMentah ? dbProdMentah.isAvailable : true;

                                        return (
                                            <div key={flavor.id} className="border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                                {/* Flavor Header */}
                                                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                                        <Image src={flavor.image} alt={flavor.label} fill className="object-cover" />
                                                    </div>
                                                    <span className="text-lg font-black text-gray-800">
                                                        {flavor.emoji} Risol {flavor.label}
                                                    </span>
                                                </div>

                                                <div className="divide-y divide-gray-100">
                                                    {/* Matang Row */}
                                                    <div className={`flex items-center justify-between px-4 py-3 ${!matangAvail ? "opacity-50" : ""}`}>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase">🔥 Matang</span>
                                                                {!matangAvail && <span className="text-xs font-black bg-red-100 text-red-500 px-2 py-0.5 rounded-full">Habis</span>}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">Rp5.000/pcs · Rp10.000/3 pcs</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button type="button"
                                                                id={`qty-minus-${matangProd.id}`}
                                                                onClick={() => updateItem(matangProd.id, Math.max(0, matangItem.qty - 1))}
                                                                className="w-9 h-9 bg-white border-2 border-gray-200 rounded-xl font-bold hover:border-primary/50 transition-colors flex items-center justify-center min-h-[44px]">
                                                                −
                                                            </button>
                                                            <span className="w-7 text-center font-black text-gray-800 text-lg">{matangItem.qty}</span>
                                                            <button type="button"
                                                                id={`qty-plus-${matangProd.id}`}
                                                                disabled={!matangAvail}
                                                                onClick={() => updateItem(matangProd.id, matangItem.qty + 1)}
                                                                className={`w-9 h-9 rounded-xl font-bold text-lg shadow-sm transition-all flex items-center justify-center min-h-[44px] ${matangAvail ? "bg-primary text-white hover:bg-primary-dark" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Mentah Row */}
                                                    <div className={`flex items-center justify-between px-4 py-3 bg-blue-50/40 ${!mentahAvail ? "opacity-50" : ""}`}>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">🧊 Mentah</span>
                                                                {!mentahAvail && <span className="text-xs font-black bg-red-100 text-red-500 px-2 py-0.5 rounded-full">Habis</span>}
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">Rp5.000/pcs · Rp10.000/3 pcs (frozen)</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button type="button"
                                                                id={`qty-minus-${mentahProd.id}`}
                                                                onClick={() => updateItem(mentahProd.id, Math.max(0, mentahItem.qty - 1))}
                                                                className="w-9 h-9 bg-white border-2 border-gray-200 rounded-xl font-bold hover:border-blue-400 transition-colors flex items-center justify-center min-h-[44px]">
                                                                −
                                                            </button>
                                                            <span className="w-7 text-center font-black text-gray-800 text-lg">{mentahItem.qty}</span>
                                                            <button type="button"
                                                                id={`qty-plus-${mentahProd.id}`}
                                                                disabled={!mentahAvail}
                                                                onClick={() => updateItem(mentahProd.id, mentahItem.qty + 1)}
                                                                className={`w-9 h-9 rounded-xl font-bold text-lg shadow-sm transition-all flex items-center justify-center min-h-[44px] ${mentahAvail ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                                                                +
                                                            </button>
                                                        </div>
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

                        {/* Right: Sticky summary */}
                        <div className="lg:sticky lg:top-20 h-fit">
                            <div className="card p-6">
                                <h2 className="text-lg font-black text-gray-800 mb-4">💰 Ringkasan Order</h2>
                                <div className="space-y-2 mb-4">
                                    {form.items.filter((i) => i.qty > 0).map((item) => {
                                        const prod = PRODUCTS.find((p) => p.id === item.productId)!;
                                        const itemTotal = prod.isMentah
                                            ? item.qty * (prod.pricePerPack ?? 25000)
                                            : (() => {
                                                const b = Math.floor(item.qty / 3);
                                                const s = item.qty % 3;
                                                return b * prod.price3 + s * prod.price1;
                                            })();
                                        return (
                                            <div key={item.productId} className="flex justify-between text-sm text-gray-700">
                                                <span className="flex items-center gap-1">
                                                    {prod.emoji}
                                                    <span>{prod.isMentah ? prod.name.replace(" (Mentah)", "") : prod.name}</span>
                                                    {prod.isMentah
                                                        ? <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-1 rounded">mentah</span>
                                                        : <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-1 rounded">matang</span>}
                                                    <span className="text-gray-500">×{item.qty}{prod.isMentah ? " pack" : " pcs"}</span>
                                                </span>
                                                <span className="font-bold">Rp{itemTotal.toLocaleString("id-ID")}</span>
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
                                    🎁 Promo: Beli 3 Matang (Varian Sama) Cuma Rp10.000!
                                </div>

                                <button
                                    id="submit-order-btn"
                                    type="submit"
                                    className="btn-primary w-full mt-5 text-base">
                                    ✅ Konfirmasi Order
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

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
