import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import { assertAdminPassword } from "@/lib/admin";
import { normalizeTeamCode } from "@/lib/teamCode";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!assertAdminPassword(req.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const body = await req.json();
  const action = body?.action as "close" | "open" | undefined;

  if (!action || !["close", "open"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await connectDB();

  const updated = await Team.findOneAndUpdate(
    { teamCode: normalizeTeamCode(code) },
    { $set: { status: action === "close" ? "closed" : "open" } },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({ team: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!assertAdminPassword(req.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  await connectDB();

  const deleted = await Team.findOneAndDelete({ teamCode: normalizeTeamCode(code) }).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Team deleted" });
}

