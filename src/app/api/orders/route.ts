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

        // Upsert products first (optional, but ensures they exist for relations)
        // In a real app, products would be managed separately.

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
                    create: items.map((item: any) => ({
                        productId: item.productId, // Assuming this matches slug/id in DB
                        qty: item.qty,
                        packaging: item.packaging,
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("POST Order Error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
