import { NextResponse } from "next/server";
import { generateOrderCode } from "@/lib/orderCode";

export async function GET() {
    try {
        const code = await generateOrderCode();
        return NextResponse.json({ code });
    } catch (error) {
        console.error("GET Code Error:", error);
        return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
    }
}
