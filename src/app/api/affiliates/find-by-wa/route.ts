import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wa = searchParams.get("wa");

        if (!wa) {
            return NextResponse.json({ error: "WhatsApp number is required" }, { status: 400 });
        }

        // Clean up WA number (optional, but good for robust searching)
        const cleanWA = wa.replace(/\D/g, "");

        const affiliate = await prisma.affiliate.findFirst({
            where: {
                ownerWA: {
                    contains: cleanWA, // Support partial match if needed, but usually exact is safer
                },
            },
        });

        if (!affiliate) {
            return NextResponse.json({ error: "Affiliate code not found for this number" }, { status: 404 });
        }

        return NextResponse.json({ 
            code: affiliate.code,
            ownerName: affiliate.ownerName
        });
    } catch (error) {
        console.error("Find Affiliate Error:", error);
        return NextResponse.json({ error: "Failed to find affiliate" }, { status: 500 });
    }
}
