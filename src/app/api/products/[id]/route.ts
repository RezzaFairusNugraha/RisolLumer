import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { isAvailable } = await req.json();

        const product = await prisma.product.update({
            where: { id },
            data: { isAvailable },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("PATCH Product Error:", error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}
