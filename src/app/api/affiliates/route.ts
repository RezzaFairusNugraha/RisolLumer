import { NextResponse } from "next/server";

// Stub — affiliate data is stored in localStorage on the client.
export async function GET() {
    return NextResponse.json({ message: "Affiliates are stored in localStorage on the client." });
}

export async function POST() {
    return NextResponse.json({ message: "Use the client-side storage lib for affiliate operations." });
}
