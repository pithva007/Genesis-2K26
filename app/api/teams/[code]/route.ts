import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import { normalizeTeamCode } from "@/lib/teamCode";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await connectDB();

  const team = await Team.findOne({ teamCode: normalizeTeamCode(code) }).lean();
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({
    team: {
      ...team,
      slotsLeft: Math.max(0, team.maxMembers - 1 - team.members.length),
    },
  });
}

