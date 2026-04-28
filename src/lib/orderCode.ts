import prisma from "@/lib/prisma";

// Generate order code server-side: RL-YYYYMMDD-XXX
// Must be called from server context (API route / server action)
export async function generateOrderCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    const todayPrefix = `RL-${dateStr}-`;

    // Count from DB atomically to avoid race conditions
    const count = await prisma.order.count({
        where: {
            code: {
                startsWith: todayPrefix,
            },
        },
    });

    const seq = String(count + 1).padStart(3, "0");
    return `${todayPrefix}${seq}`;
}
