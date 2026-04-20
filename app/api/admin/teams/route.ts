import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import { assertAdminPassword, teamsToCsv } from "@/lib/admin";
import { getSportBySlug, getSportByName } from "@/config/sports.config";

export const runtime = "nodejs";

function sportFilter(sport: string | null) {
  if (!sport) return {};
  const match = getSportBySlug(sport) ?? getSportByName(sport);
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
  const teams = await Team.find(filter).sort({ createdAt: -1 }).lean();

  if (format === "csv") {
    const csv = teamsToCsv(teams);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="genesis-2k26-teams.csv"',
      },
    });
  }

  return NextResponse.json({ teams });
}

