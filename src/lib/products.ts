export interface Product {
    id: string;
    name: string;
    emoji: string;
    image: string;
    color: string;
    price1: number;
    price3: number;
    isAvailable?: boolean;
    isMentah?: boolean;          // true = produk frozen/mentah
    flavorGroup?: string;        // ID flavor induk, mis. "matcha"
    pricePerPack?: number;       // harga per pack (khusus mentah)
    qtyPerPack?: number;         // jumlah per pack
}

// Flavors yang tersedia
export const FLAVOR_GROUPS = [
    { id: "matcha", label: "Matcha", emoji: "🍵", image: "/img/RisolMatcha.jpeg", color: "#e8f5e9" },
    { id: "chocolate", label: "Chocolate", emoji: "🍫", image: "/img/RisolCoklat.jpeg", color: "#faeeda" },
    { id: "redvelvet", label: "Red Velvet", emoji: "🎂", image: "/img/RisolRedvelvet.jpeg", color: "#fbeaf0" },
    { id: "mentai", label: "Mentai", emoji: "🦑", image: "/img/RisolMentai.jpeg", color: "#faece7" },
];

export const PRODUCTS: Product[] = [
    // ===== Matang (Goreng) =====
    { id: "matcha", name: "Risol Matcha", emoji: "🍵", image: "/img/RisolMatcha.jpeg", color: "#e8f5e9", price1: 5000, price3: 10000, flavorGroup: "matcha" },
    { id: "chocolate", name: "Risol Chocolate", emoji: "🍫", image: "/img/RisolCoklat.jpeg", color: "#faeeda", price1: 5000, price3: 10000, flavorGroup: "chocolate" },
    { id: "redvelvet", name: "Risol Red Velvet", emoji: "🎂", image: "/img/RisolRedvelvet.jpeg", color: "#fbeaf0", price1: 5000, price3: 10000, flavorGroup: "redvelvet" },
    { id: "mentai", name: "Risol Mentai", emoji: "🦑", image: "/img/RisolMentai.jpeg", color: "#faece7", price1: 5000, price3: 10000, flavorGroup: "mentai" },

    // ===== Mentah (Frozen) =====
    { id: "matcha-mentah", name: "Risol Matcha (Mentah)", emoji: "🍵", image: "/img/RisolMatcha.jpeg", color: "#e8f5e9", price1: 5000, price3: 10000, isMentah: true, flavorGroup: "matcha" },
    { id: "chocolate-mentah", name: "Risol Chocolate (Mentah)", emoji: "🍫", image: "/img/RisolCoklat.jpeg", color: "#faeeda", price1: 5000, price3: 10000, isMentah: true, flavorGroup: "chocolate" },
    { id: "redvelvet-mentah", name: "Risol Red Velvet (Mentah)", emoji: "🎂", image: "/img/RisolRedvelvet.jpeg", color: "#fbeaf0", price1: 5000, price3: 10000, isMentah: true, flavorGroup: "redvelvet" },
    { id: "mentai-mentah", name: "Risol Mentai (Mentah)", emoji: "🦑", image: "/img/RisolMentai.jpeg", color: "#faece7", price1: 5000, price3: 10000, isMentah: true, flavorGroup: "mentai" },
];
