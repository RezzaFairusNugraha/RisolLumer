export type OrderStatus = "Draft" | "Baru" | "Diproses" | "Selesai" | "Dibatalkan";
export type OrderType = "ambil" | "antar";
export type Packaging = "1pcs" | "isi3";

export interface OrderItem {
    productId: string;
    qty: number;
    packaging: Packaging;
}

export interface Order {
    code: string;
    name: string;
    whatsapp: string;
    type: OrderType;
    kelas?: string;
    items: OrderItem[];
    referralCode?: string;
    affiliateCode?: string; // code given to the buyer if they bought isi3
    total: number;
    status: OrderStatus;
    createdAt: string; // ISO string
}

export interface AffiliateData {
    ownerName: string;
    ownerWA: string;
    usedBy: string[]; // array of unique WA numbers that used this code
    totalSold: number;
    rewardClaimed: boolean;
}

export type AffiliatesStore = Record<string, AffiliateData>;

const ORDERS_KEY = "risol_orders";
const AFFILIATES_KEY = "risol_affiliates";

// ===================== ORDERS =====================

export async function getOrders(): Promise<Order[]> {
    try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch");
        return await res.json();
    } catch (err) {
        console.error("getOrders error:", err);
        // Fallback to local storage for offline or dev
        if (typeof window === "undefined") return [];
        const raw = localStorage.getItem(ORDERS_KEY);
        return raw ? (JSON.parse(raw) as Order[]) : [];
    }
}

export async function saveOrder(order: Order): Promise<void> {
    try {
        const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order),
        });
        if (!res.ok) throw new Error("Failed to save order");
    } catch (err) {
        console.error("saveOrder error:", err);
        // Still save locally as fallback
        const orders = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]") : [];
        orders.push(order);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
}

export async function updateOrderStatus(code: string, status: OrderStatus): Promise<void> {
    try {
        const res = await fetch(`/api/orders/${code}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("Failed to update status");
    } catch (err) {
        console.error("updateOrderStatus error:", err);
    }
}

export async function getTodayOrders(): Promise<Order[]> {
    const orders = await getOrders();
    // Using local date string (YYYY-MM-DD) for more accurate "today" filtering in user's timezone
    const today = new Date().toLocaleDateString('en-CA');
    return orders.filter((o) => {
        const orderDate = new Date(o.createdAt).toLocaleDateString('en-CA');
        return orderDate === today;
    });
}

// ===================== AFFILIATES =====================

export async function getAffiliates(): Promise<AffiliatesStore> {
    try {
        const res = await fetch("/api/affiliates", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch");
        return await res.json();
    } catch (err) {
        console.error("getAffiliates error:", err);
        if (typeof window === "undefined") return {};
        const raw = localStorage.getItem(AFFILIATES_KEY);
        return raw ? (JSON.parse(raw) as AffiliatesStore) : {};
    }
}

export async function saveAffiliate(code: string, data: AffiliateData): Promise<void> {
    try {
        const res = await fetch("/api/affiliates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, ...data }),
        });
        if (!res.ok) throw new Error("Failed to save affiliate");
    } catch (err) {
        console.error("saveAffiliate error:", err);
        const affiliates = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(AFFILIATES_KEY) || "{}") : {};
        affiliates[code] = data;
        localStorage.setItem(AFFILIATES_KEY, JSON.stringify(affiliates));
    }
}

export async function getAffiliate(code: string): Promise<AffiliateData | null> {
    const affiliates = await getAffiliates();
    return affiliates[code] ?? null;
}

export async function findAffiliateByWA(wa: string): Promise<string | null> {
    const affiliates = await getAffiliates();
    const entry = Object.entries(affiliates).find(([_, data]: [string, any]) => data.ownerWA === wa);
    return entry ? entry[0] : null;
}

export async function updateAffiliateReward(code: string, claimed: boolean): Promise<void> {
    try {
        const aff = await getAffiliate(code);
        if (aff) {
            await saveAffiliate(code, { ...aff, rewardClaimed: claimed });
        }
    } catch (err) {
        console.error("updateAffiliateReward error:", err);
    }
}

export async function addReferral(code: string, buyerWA: string): Promise<void> {
    try {
        const aff = await getAffiliate(code);
        if (!aff) return;
        if (aff.usedBy.includes(buyerWA)) return;
        const newUsedBy = [...aff.usedBy, buyerWA];
        await saveAffiliate(code, { ...aff, usedBy: newUsedBy });
    } catch (err) {
        console.error("addReferral error:", err);
    }
}

export async function deleteOrder(code: string): Promise<void> {
    try {
        await fetch(`/api/orders/${code}`, { method: "DELETE" });
    } catch (err) {
        console.error("deleteOrder error:", err);
    }
}

export async function deleteAffiliate(code: string): Promise<void> {
    try {
        await fetch(`/api/affiliates/${code}`, { method: "DELETE" });
    } catch (err) {
        console.error("deleteAffiliate error:", err);
    }
}


// ===================== PRODUCTS =====================

export async function getDbProducts(): Promise<any[]> {
    try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch products");
        return await res.json();
    } catch (err) {
        console.error("getDbProducts error:", err);
        return [];
    }
}

export async function updateProductAvailability(id: string, isAvailable: boolean): Promise<void> {
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isAvailable }),
        });
        if (!res.ok) throw new Error("Failed to update product availability");
    } catch (err) {
        console.error("updateProductAvailability error:", err);
    }
}
