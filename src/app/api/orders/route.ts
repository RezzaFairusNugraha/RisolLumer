import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
        const { code, name, whatsapp, type, kelas, items, referralCode, affiliateCode, total } = data;

        // Resolve product slugs to IDs if they aren't already CUIDs
        const products = await prisma.product.findMany();
        const productSlugMap = new Map(products.map(p => [p.slug, p.id]));

        const order = await prisma.order.create({
            data: {
                code,
                name,
                whatsapp,
                type,
                kelas,
                total,
                referralCode,
                affiliateCode,
                status: "Baru",
                items: {
                    create: items.map((item: any) => {
                        // Use either the resolved ID from slug, or the original productId if it's already an ID
                        const resolvedId = productSlugMap.get(item.productId) || item.productId;
                        return {
                            productId: resolvedId,
                            qty: item.qty,
                            packaging: item.packaging,
                        };
                    }),
                },
            },
            include: {
                items: true,
            },
        });

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
