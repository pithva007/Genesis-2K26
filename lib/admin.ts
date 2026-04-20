import type { TeamDocument } from "@/models/Team";

export function assertAdminPassword(provided: string | null) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is not configured");
  }
  return provided === password;
}

function escapeCsv(value: string) {
  if (/["\n,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function teamsToCsv(teams: TeamDocument[]) {
  const rows = [
    [
      "Team Code",
      "Sport",
      "Category",
      "Team Name",
      "Status",
      "Captain Name",
      "Captain Phone",
      "Captain Year",
      "Captain Dept",
      "Members",
      "Created At",
    ],
    ...teams.map((team) => [
      team.teamCode,
      team.sport,
      team.category,
      team.teamName,
      team.status,
      team.captain.name,
      team.captain.phone,
      team.captain.year,
      team.captain.dept,
      team.members.map((member) => `${member.name} (${member.phone})`).join(" ; "),
      new Date(team.createdAt).toISOString(),
    ]),
  ];

  return rows
    .map((row) => row.map((value) => escapeCsv(String(value ?? ""))).join(","))
    .join("\n");
}

