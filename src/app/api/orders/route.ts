import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOrderCode } from "@/lib/orderCode";
import { OrderItem } from "@/lib/storage";

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                items: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(orders);
    } catch (error) {
        console.error("GET Orders Error:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { name, whatsapp, type, kelas, items, referralCode, affiliateCode, total, status } = data;

        // Resolve product slugs to IDs
        const products = await prisma.product.findMany();
        const productSlugMap = new Map(products.map(p => [p.slug, p.id]));

        // Generate order code server-side (prevents duplicate codes from concurrent requests)
        // Retry up to 5 times on unique constraint violation (P2002)
        let order;
        let retries = 0;
        while (retries < 5) {
            const code = await generateOrderCode();
            try {
                order = await prisma.order.create({
                    data: {
                        code,
                        name,
                        whatsapp,
                        type,
                        kelas,
                        total,
                        referralCode,
                        affiliateCode,
                        status: status || "Baru",
                        items: {
                            create: await Promise.all(items.map(async (item: OrderItem) => {
                                let resolvedId = productSlugMap.get(item.productId);

                                // If not found in map, try looking it up directly by slug
                                if (!resolvedId) {
                                    const p = await prisma.product.findUnique({ where: { slug: item.productId } });
                                    resolvedId = p?.id;
                                }

                                // Fallback to original productId (might be a CUID already)
                                resolvedId = resolvedId || item.productId;

                                return {
                                    productId: resolvedId,
                                    qty: item.qty,
                                    packaging: item.packaging,
                                };
                            })),
                        },
                    },
                    include: {
                        items: true,
                    },
                });
                break; // success
            } catch (err: any) {
                if (err.code === "P2002" && retries < 4) {
                    // Unique constraint on code — retry with next sequence number
                    retries++;
                    console.warn(`Order code conflict, retrying (${retries}/5)...`);
                    continue;
                }
                throw err;
            }
        }
        
        // Handle referral points if code provided
        if (referralCode && order) {
            try {
                // Find affiliate
                const aff = await prisma.affiliate.findUnique({ where: { code: referralCode.toUpperCase() } });
                if (aff) {
                    // Only count matang (cooked) risols for the 5-risol goal
                    const matangCount = items
                        .filter((i: any) => !i.productId.includes("mentah"))
                        .reduce((sum: number, i: any) => sum + i.qty, 0);

                    if (matangCount > 0) {
                        await prisma.affiliate.update({
                            where: { code: referralCode.toUpperCase() },
                            data: {
                                totalSold: { increment: matangCount },
                                // Also keep track of unique users if needed, though the requirement says "satuan"
                                usedBy: {
                                    push: whatsapp
                                }
                            }
                        });
                    }
                }
            } catch (err) {
                console.error("Referral update error:", err);
                // Don't fail the whole order if referral update fails
            }
        }

        return NextResponse.json(order);
    } catch (error: any) {
        console.error("POST Order Error:", error);
        return NextResponse.json({
            error: "Failed to create order",
            message: error.message,
            code: error.code
        }, { status: 500 });
    }
}
