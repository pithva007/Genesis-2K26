import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Join flow disabled" },
    { status: 410 }
  );
}
