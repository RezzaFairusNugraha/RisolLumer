import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wa = searchParams.get("wa");

        if (!wa) {
            return NextResponse.json({ error: "wa required" }, { status: 400 });
        }

        // Hapus semua Draft milik nomor WA ini agar kode tidak numpuk
        const deleted = await prisma.order.deleteMany({
            where: {
                whatsapp: wa,
                status: "Draft",
            },
        });

        return NextResponse.json({ deleted: deleted.count });
    } catch (error) {
        console.error("Cleanup Draft Error:", error);
        return NextResponse.json({ error: "Failed to cleanup drafts" }, { status: 500 });
    }
}
