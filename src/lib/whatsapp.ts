const ADMIN_WA = "6285863244821";

export function buildWhatsAppLink(orderCode: string, total: number, customerName: string): string {
    const text = encodeURIComponent(
        `Halo kak, saya ${customerName} sudah order ${orderCode} total Rp${total.toLocaleString("id-ID")} 🫓`
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
