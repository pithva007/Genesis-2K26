import type { TeamDocument } from "@/models/Team";

export function assertAdminPassword(provided: string | null): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return provided === password;
}

export function verifyAdminPassword(provided: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return provided === password;
}

function escapeCsv(value: string): string {
  if (/["\n,]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function teamsToCsv(teams: TeamDocument[]): string {
  const rows: string[][] = [
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
      team.teamName ?? "",
      team.status,
      team.captain.name,
      team.captain.phone ?? "",
      team.captain.year,
      team.captain.dept,
      team.members
        .map((m) => `${m.name} (${m.phone ?? ""})`)
        .join(" ; "),
      new Date(team.createdAt as unknown as Date).toISOString(),
    ]),
  ];

  return rows
    .map((row) => row.map((value) => escapeCsv(String(value ?? ""))).join(","))
    .join("\n");
}
