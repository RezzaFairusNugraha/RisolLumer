import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const affiliates = await prisma.affiliate.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        // Convert to Record format for frontend compatibility if needed
        const store: Record<string, any> = {};
        affiliates.forEach((a: any) => {
            store[a.code] = {
                ownerName: a.ownerName,
                ownerWA: a.ownerWA,
                usedBy: a.usedBy,
                rewardClaimed: a.rewardClaimed
            };
        });

        return NextResponse.json(store);
    } catch (error) {
        console.error("GET Affiliates Error:", error);
        return NextResponse.json({ error: "Failed to fetch affiliates" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { code, ownerName, ownerWA, usedBy, rewardClaimed } = data;

        const affiliate = await prisma.affiliate.upsert({
            where: { code },
            update: {
                ownerName,
                ownerWA,
                usedBy,
                rewardClaimed,
            },
            create: {
                code,
                ownerName,
                ownerWA,
                usedBy: usedBy || [],
                rewardClaimed: rewardClaimed || false,
            },
        });

        return NextResponse.json(affiliate);
    } catch (error) {
        console.error("POST Affiliate Error:", error);
        return NextResponse.json({ error: "Failed to save affiliate" }, { status: 500 });
    }
}
