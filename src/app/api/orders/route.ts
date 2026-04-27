import { NextResponse } from "next/server";

// These routes are stubs — actual data is stored in localStorage on the client.
// They exist for API completeness and potential future server-side usage.

export async function GET() {
    return NextResponse.json({ message: "Orders are stored in localStorage on the client." });
}

export async function POST() {
    return NextResponse.json({ message: "Post orders via the client-side storage lib." });
}
