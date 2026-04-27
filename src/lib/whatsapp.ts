import { PRODUCTS } from "@/lib/products";

const ADMIN_WA = "6285863244821";

export function buildWhatsAppLink(
    order: { code: string; total: number; name: string; type: string; kelas?: string; items: any[] }
): string {
    const itemDetails = order.items.map(item => {
        const prod = PRODUCTS.find(p => p.id === item.productId);
        return `- ${prod?.name || item.productId} x${item.qty}`;
    }).join("\n");

    const text = encodeURIComponent(
        `Halo kak, saya ${order.name} mau konfirmasi order!\n\n` +
        `Kode: ${order.code}\n` +
        `Detail Pesanan:\n${itemDetails}\n\n` +
        `Total: Rp${order.total.toLocaleString("id-ID")}\n` +
        `Jenis: ${order.type === "ambil" ? "Ambil Sendiri" : "Diantar"}${order.kelas ? " (" + order.kelas + ")" : ""}\n\n` +
        `Terima kasih! 🫓`
    );
    return `https://wa.me/${ADMIN_WA}?text=${text}`;
}

export function buildRewardClaimLink(ownerName: string, affiliateCode: string): string {
    const text = encodeURIComponent(
        `Halo kak, saya ${ownerName} mau klaim reward afiliasi! Kode saya: ${affiliateCode} ✨`
    );
    return `https://wa.me/${ADMIN_WA}?text=${text}`;
}

export { ADMIN_WA };
