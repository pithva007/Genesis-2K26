import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import { normalizeTeamCode } from "@/lib/teamCode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { code: string } }) {
  const { code } = params;
  await connectDB();

  const team = await Team.findOne({ teamCode: normalizeTeamCode(code) }).lean();
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({
    teamCode: team.teamCode,
    teamName: team.teamName,
    sport: team.sport,
    category: team.category,
    captain: {
      name: team.captain.name,
      year: team.captain.year,
      dept: team.captain.dept,
    },
    members: team.members.map((m: { name: string; year: string; dept: string }) => ({
      name: m.name,
      year: m.year,
      dept: m.dept,
    })),
    memberCount: team.members.length,
    maxMembers: team.maxMembers,
    status: team.status,
    createdAt: team.createdAt,
  });
}
