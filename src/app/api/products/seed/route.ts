import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PRODUCTS } from "@/lib/products";

export async function POST() {
    try {
        const results = await Promise.all(
            PRODUCTS.map((p) =>
                prisma.product.upsert({
                    where: { slug: p.id },
                    update: {
                        name: p.name,
                        emoji: p.emoji,
                        color: p.color,
                        price1: p.price1,
                        price3: p.price3,
                        isMentah: !!p.isMentah,
                    },
                    create: {
                        slug: p.id,
                        name: p.name,
                        emoji: p.emoji,
                        color: p.color,
                        price1: p.price1,
                        price3: p.price3,
                        isMentah: !!p.isMentah,
                        isAvailable: true,
                    },
                })
            )
        );
        return NextResponse.json({ message: "Seeding successful", count: results.length });
    } catch (error) {
        console.error("Seed Error:", error);
        return NextResponse.json({ error: "Failed to seed products" }, { status: 500 });
    }
}
