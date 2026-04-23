import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import { joinTeamSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { normalizeTeamCode } from "@/lib/teamCode";
import { syncTeamToSheet, TeamSheetRecord } from "@/lib/googleSheets";
import { getSportBySlug } from "@/config/sports.config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = joinTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  const sport = getSportBySlug(parsed.data.sportSlug);
  if (!sport) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  await connectDB();

  const teamCode = normalizeTeamCode(parsed.data.teamCode);
  const member = parsed.data.member;
  const maxJoinSlots = Math.max(0, sport.maxMembers - 1);

  const filter = {
    teamCode,
    sport: sport.name,
    status: "open",
    members: { $not: { $elemMatch: { phone: member.phone } } },
    $expr: { $lt: [{ $size: "$members" }, maxJoinSlots] },
  };

  const pipeline = [
    { $set: { members: { $concatArrays: ["$members", [member]] } } },
    {
      $set: {
        status: {
          $cond: [
            {
              $gte: [{ $size: "$members" }, maxJoinSlots],
            },
            "full",
            "open",
          ],
        },
      },
    },
  ];

  const team = await Team.findOneAndUpdate(filter, pipeline, {
    new: true,
  }).lean();

  if (!team) {
    const existing = await Team.findOne({ teamCode, sport: sport.name }).lean();
    if (!existing) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    if (existing.status !== "open") {
      return NextResponse.json({ error: "Registrations are closed" }, { status: 409 });
    }
    if (existing.members.some((entry) => entry.phone === member.phone)) {
      return NextResponse.json({ error: "Member already joined" }, { status: 409 });
    }
    return NextResponse.json({ error: "Team is full" }, { status: 409 });
  }

  console.log("📊 [Join] Sending to Sheets:", JSON.stringify({
    teamCode: team.teamCode,
    sport: team.sport,
    members: team.members,
  }));

  try {
    await syncTeamToSheet(team as TeamSheetRecord);
  } catch (err) {
    console.error("Sheets sync failed but member was saved:", err);
  }

  return NextResponse.json({
    message: "Joined team",
    team: {
      teamCode: team.teamCode,
      sport: team.sport,
      category: team.category,
      teamName: team.teamName,
      captain: team.captain,
      members: team.members,
      maxMembers: team.maxMembers,
      status: team.status,
      createdAt: team.createdAt,
    },
  });
}
