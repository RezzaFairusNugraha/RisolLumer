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

        // Trigger logic if status is 'Selesai' and has referral
        if (status === "Selesai" && order.referralCode) {
            const aff = await prisma.affiliate.findUnique({
                where: { code: order.referralCode },
            });
            if (aff) {
                if (!aff.usedBy.includes(order.whatsapp)) {
                    await prisma.affiliate.update({
                        where: { code: order.referralCode },
                        data: {
                            usedBy: {
                                push: order.whatsapp,
                            },
                        },
                    });
                }
            }
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error("PATCH Order Status Error:", error);
        return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
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
