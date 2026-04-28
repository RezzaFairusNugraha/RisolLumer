import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { status } = await req.json();
        const { code } = await params;

        const order = await prisma.order.update({
            where: { code },
            data: { status },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("PATCH Order Error:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        await prisma.order.delete({
            where: { code },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Order Error:", error);
        return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }
}
