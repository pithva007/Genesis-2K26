import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import { assertAdminPassword, teamsToCsv } from "@/lib/admin";
import { getSportBySlug, getSportByName } from "@/config/sports.config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sportFilter(sport: string | null): Record<string, string> {
  if (!sport) return {};
  const match = getSportByName(sport) ?? getSportBySlug(sport);
  return match ? { sport: match.name } : { sport };
}

export async function GET(req: NextRequest) {
  if (!assertAdminPassword(req.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = sportFilter(searchParams.get("sport"));
  const format = searchParams.get("format");

  await connectDB();
  const rawTeams = await Team.find(filter).sort({ createdAt: -1 }).lean();

  if (format === "csv") {
    const csv = teamsToCsv(rawTeams);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="genesis-2k26-teams.csv"',
      },
    });
  }

  const teams = rawTeams.map((t) => ({
    teamCode: t.teamCode,
    teamName: t.teamName ?? "",
    sport: t.sport,
    category: t.category,
    captain: {
      name: t.captain.name,
      phone: t.captain.phone ?? "",
      year: t.captain.year,
      dept: t.captain.dept,
    },
    members: t.members.map((m) => ({
      name: m.name,
      phone: m.phone ?? "",
      year: m.year,
      dept: m.dept,
    })),
    memberCount: 1 + t.members.length,
    maxMembers: t.maxMembers,
    status: t.status,
    createdAt: t.createdAt
      ? new Date(t.createdAt as unknown as Date).toISOString()
      : "",
  }));

  return NextResponse.json({ teams, total: teams.length });
}
