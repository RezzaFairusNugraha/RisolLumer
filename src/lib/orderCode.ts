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

    // Find the latest order code for today
    const latestOrder = await prisma.order.findFirst({
        where: {
            code: {
                startsWith: todayPrefix,
            },
        },
        orderBy: {
            code: "desc",
        },
        select: {
            code: true,
        },
    });

    let nextNumber = 1;
    if (latestOrder) {
        const lastSeq = parseInt(latestOrder.code.split("-")[2]);
        if (!isNaN(lastSeq)) {
            nextNumber = lastSeq + 1;
        }
    }

    const seq = String(nextNumber).padStart(3, "0");
    return `${todayPrefix}${seq}`;
}
