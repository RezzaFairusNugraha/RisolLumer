// Generate order code: RL-YYYYMMDD-XXX
export function generateOrderCode(existingOrders: { code: string }[]): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    // Count existing orders for today
    const todayPrefix = `RL-${dateStr}-`;
    const todayOrders = existingOrders.filter((o) => o.code.startsWith(todayPrefix));
    const seq = String(todayOrders.length + 1).padStart(3, "0");

    return `RL-${dateStr}-${seq}`;
}
