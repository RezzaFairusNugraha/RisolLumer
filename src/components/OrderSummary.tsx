"use client";
import { useEffect } from "react";
import type { Order } from "@/lib/storage";
import { PRODUCTS } from "@/lib/products";
import { buildWhatsAppLink } from "@/lib/whatsapp";

interface OrderSummaryProps {
    order: Order;
    affiliateCode?: string;
    onClose: () => void;
}

export default function OrderSummary({ order, affiliateCode, onClose }: OrderSummaryProps) {
    const waLink = buildWhatsAppLink(order);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-down">
                {/* Header */}
                <div className="bg-primary text-white p-6 rounded-t-3xl">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-black">✅ Order Masuk!</h2>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Tutup"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-white/80 text-sm">Segera konfirmasi via WhatsApp ya 🫓</p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Order code */}
                    <div className="bg-cream rounded-2xl p-4 text-center">
                        <p className="text-xs text-gray-500 font-medium mb-1">Kode Pesanan</p>
                        <p className="text-2xl font-black text-primary tracking-wider">{order.code}</p>
                    </div>

                    {/* Items */}
                    <div>
                        <p className="label mb-2">Detail Pesanan</p>
                        <div className="space-y-2">
                            {order.items.map((item, idx) => {
                                const prod = PRODUCTS.find((p) => p.id === item.productId);

                                return (
                                    <div
                                        key={idx}
                                        className="flex justify-between items-center text-sm py-2 border-b border-gray-100"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{prod?.emoji}</span>
                                            <span className="font-bold text-gray-800">{prod?.name}</span>
                                            <span className="text-gray-400">×{item.qty}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="font-bold text-primary">
                                                Rp{(item.qty * 5000).toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="space-y-1">
                        {(() => {
                            const matangQty = order.items.filter(i => !PRODUCTS.find(p => p.id === i.productId)?.isMentah).reduce((s, i) => s + i.qty, 0);
                            const mentahQty = order.items.filter(i => PRODUCTS.find(p => p.id === i.productId)?.isMentah).reduce((s, i) => s + i.qty, 0);
                            const discount = (Math.floor(matangQty / 3) * 5000) + (Math.floor(mentahQty / 3) * 5000);
                            
                            if (discount > 0) {
                                return (
                                    <div className="flex justify-between items-center text-xs text-green-600 font-bold px-4">
                                        <span>Promo Mix & Match ✨</span>
                                        <span>-Rp{discount.toLocaleString("id-ID")}</span>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                        <div className="flex justify-between items-center font-black text-lg bg-primary/10 rounded-2xl px-4 py-3">
                            <span className="text-gray-800">Total</span>
                            <span className="text-primary">Rp{order.total.toLocaleString("id-ID")}</span>
                        </div>
                    </div>

                    {/* Affiliate code earned */}
                    {affiliateCode && (
                        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-4 text-center">
                            <p className="text-xs font-bold text-yellow-700 mb-1">🎉 Kamu dapat Kode Afiliasi!</p>
                            <p className="text-2xl font-black text-yellow-600 tracking-widest">{affiliateCode}</p>
                            <p className="text-xs text-yellow-600 mt-1">
                                Bagikan ke teman-temanmu. Tiap 5 risol yang terjual pakai kodemu, kamu dapat 1 risol gratis!
                            </p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="text-xs text-gray-500 text-center">
                        Jenis: {order.type === "ambil" ? "Ambil Sendiri" : "Diantar"}
                        {order.kelas ? ` • Kelas: ${order.kelas}` : ""}
                    </div>

                    {/* WA Button */}
                    <button
                        id="confirm-wa-btn"
                        onClick={async () => {
                            try {
                                await fetch(`/api/orders/${order.code}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "Baru" }),
                                });
                                // Trigger event for any listeners (like admin dashboard if open in same session)
                                window.dispatchEvent(new CustomEvent("newOrder", { detail: order }));
                            } catch (err) {
                                console.error("Final order confirmation failed:", err);
                            }
                            window.open(waLink, "_blank");
                        }}
                        className="btn-primary flex items-center justify-center gap-2 w-full text-center"
                    >
                        <span>💬</span>
                        Konfirmasi via WhatsApp
                    </button>

                    <button
                        onClick={onClose}
                        className="btn-outline w-full text-sm"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
