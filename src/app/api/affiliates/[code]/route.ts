import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        await prisma.affiliate.delete({
            where: { code },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Affiliate Error:", error);
        return NextResponse.json({ error: "Failed to delete affiliate" }, { status: 500 });
    }
}
