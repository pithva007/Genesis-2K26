import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import { getSportBySlug } from "@/config/sports.config";
import { createTeamSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { generateTeamCode } from "@/lib/teamCode";
import { syncTeamToSheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = createTeamSchema.safeParse(body);
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

  if (!sport.categories.includes(parsed.data.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  await connectDB();

  const members = parsed.data.members ?? [];
  const totalRegistered = 1 + members.length; // captain + members
  const status = totalRegistered >= sport.maxMembers ? "full" : "open";

  // Use provided teamName or fall back to captain's name for individual sports
  const teamName = parsed.data.teamName ?? parsed.data.captain.name;

  let team = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const teamCode = generateTeamCode();
    try {
      team = await Team.create({
        teamCode,
        sport: sport.name,
        category: parsed.data.category,
        teamName,
        captain: parsed.data.captain,
        members,
        maxMembers: sport.maxMembers,
        status,
      });
      break;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) continue;
      throw error;
    }
  }

  if (!team) {
    return NextResponse.json({ error: "Unable to allocate team code" }, { status: 500 });
  }

  const teamObj = team.toObject();
  console.log("📊 [Create] Sending to Sheets:", JSON.stringify({
    teamCode: teamObj.teamCode,
    sport: teamObj.sport,
    category: teamObj.category,
    teamName: teamObj.teamName,
    captain: teamObj.captain,
    members: teamObj.members,
    maxMembers: teamObj.maxMembers,
    status: teamObj.status,
    createdAt: teamObj.createdAt,
  }));

  try {
    await syncTeamToSheet({
      teamCode: teamObj.teamCode,
      sport: teamObj.sport,
      category: teamObj.category,
      teamName: teamObj.teamName ?? undefined,
      captain: {
        name: teamObj.captain.name,
        phone: teamObj.captain.phone ?? undefined,
        year: teamObj.captain.year,
        dept: teamObj.captain.dept,
      },
      members: teamObj.members.map((m) => ({
        name: m.name,
        phone: m.phone ?? undefined,
        year: m.year,
        dept: m.dept,
      })),
      maxMembers: teamObj.maxMembers,
      status: teamObj.status,
      createdAt: teamObj.createdAt,
    });
  } catch (err) {
    console.error("Sheets sync failed but team was saved:", err);
  }

  return NextResponse.json({
    message: "Team created",
    teamCode: team.teamCode,
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
