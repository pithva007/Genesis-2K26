import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import { assertAdminPassword } from "@/lib/admin";
import { normalizeTeamCode } from "@/lib/teamCode";
import { syncTeamToSheet } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface MemberBody {
  name: string;
  phone?: string;
  year: string;
  dept: string;
}

interface PutBody {
  teamName?: string;
  category?: string;
  status?: string;
  captain?: MemberBody;
  members?: MemberBody[];
}

function shapeTeam(t: {
  teamCode: string;
  teamName?: string | null;
  sport: string;
  category: string;
  captain: { name: string; phone?: string | null; year: string; dept: string };
  members: Array<{ name: string; phone?: string | null; year: string; dept: string }>;
  memberCount?: number;
  maxMembers: number;
  status: string;
  createdAt?: unknown;
}) {
  return {
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
      ? new Date(t.createdAt as Date).toISOString()
      : "",
  };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!assertAdminPassword(req.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const body = (await req.json()) as PutBody;

  const updateFields: Record<string, unknown> = {};
  if (body.teamName !== undefined) updateFields.teamName = body.teamName;
  if (body.category !== undefined) updateFields.category = body.category;
  if (body.status !== undefined) updateFields.status = body.status;
  if (body.captain !== undefined) updateFields.captain = body.captain;
  if (body.members !== undefined) updateFields.members = body.members;

  await connectDB();

  const updated = await Team.findOneAndUpdate(
    { teamCode: normalizeTeamCode(code) },
    { $set: updateFields },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  try {
    await syncTeamToSheet({
      teamCode: updated.teamCode,
      sport: updated.sport,
      category: updated.category,
      teamName: updated.teamName ?? undefined,
      captain: {
        name: updated.captain.name,
        phone: updated.captain.phone ?? undefined,
        year: updated.captain.year,
        dept: updated.captain.dept,
      },
      members: updated.members.map((m) => ({
        name: m.name,
        phone: m.phone ?? undefined,
        year: m.year,
        dept: m.dept,
      })),
      maxMembers: updated.maxMembers,
      status: updated.status,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    console.error("Sheets sync failed after admin update:", err);
  }

  return NextResponse.json({ team: shapeTeam(updated) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!assertAdminPassword(req.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  await connectDB();

  const deleted = await Team.findOneAndDelete({
    teamCode: normalizeTeamCode(code),
  }).lean();

  if (!deleted) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
