export type OrderStatus = "Baru" | "Diproses" | "Selesai" | "Dibatalkan";
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
    rewardClaimed: boolean;
}

export type AffiliatesStore = Record<string, AffiliateData>;

const ORDERS_KEY = "risol_orders";
const AFFILIATES_KEY = "risol_affiliates";

// ===================== ORDERS =====================

export function getOrders(): Order[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(ORDERS_KEY);
        return raw ? (JSON.parse(raw) as Order[]) : [];
    } catch {
        return [];
    }
}

export function saveOrder(order: Order): void {
    const orders = getOrders();
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function updateOrderStatus(code: string, status: OrderStatus): void {
    const orders = getOrders();
    const idx = orders.findIndex((o) => o.code === code);
    if (idx !== -1) {
        const order = orders[idx];
        const oldStatus = order.status;
        order.status = status;
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

        // If status changed to Selesai and it has a referral code, add it
        if (status === "Selesai" && oldStatus !== "Selesai" && order.referralCode) {
            addReferral(order.referralCode, order.whatsapp);
        }
    }
}

export function getTodayOrders(): Order[] {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return getOrders().filter((o) => o.createdAt.startsWith(today));
}

// ===================== AFFILIATES =====================

export function getAffiliates(): AffiliatesStore {
    if (typeof window === "undefined") return {};
    try {
        const raw = localStorage.getItem(AFFILIATES_KEY);
        return raw ? (JSON.parse(raw) as AffiliatesStore) : {};
    } catch {
        return {};
    }
}

export function saveAffiliate(code: string, data: AffiliateData): void {
    const affiliates = getAffiliates();
    affiliates[code] = data;
    localStorage.setItem(AFFILIATES_KEY, JSON.stringify(affiliates));
}

export function getAffiliate(code: string): AffiliateData | null {
    const affiliates = getAffiliates();
    return affiliates[code] ?? null;
}

export function findAffiliateByWA(wa: string): string | null {
    const affiliates = getAffiliates();
    const entry = Object.entries(affiliates).find(([_, data]) => data.ownerWA === wa);
    return entry ? entry[0] : null;
}

export function updateAffiliateReward(code: string, claimed: boolean): void {
    const affiliates = getAffiliates();
    if (affiliates[code]) {
        affiliates[code].rewardClaimed = claimed;
        localStorage.setItem(AFFILIATES_KEY, JSON.stringify(affiliates));
    }
}

export function addReferral(code: string, buyerWA: string): void {
    const affiliates = getAffiliates();
    const aff = affiliates[code];
    if (!aff) return;
    if (aff.usedBy.includes(buyerWA)) return; // no double count
    aff.usedBy.push(buyerWA);
    affiliates[code] = aff;
    localStorage.setItem(AFFILIATES_KEY, JSON.stringify(affiliates));
}

export function deleteOrder(code: string): void {
    const orders = getOrders();
    const filtered = orders.filter((o) => o.code !== code);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
}

export function deleteAffiliate(code: string): void {
    const affiliates = getAffiliates();
    delete affiliates[code];
    localStorage.setItem(AFFILIATES_KEY, JSON.stringify(affiliates));
}

