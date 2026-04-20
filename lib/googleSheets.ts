import { google } from "googleapis";

export interface SheetMember {
  name: string;
  phone: string;
  year: string;
  dept: string;
}

export interface TeamSheetRecord {
  teamCode: string;
  sport: string;
  category: string;
  teamName: string;
  captain: SheetMember;
  members: SheetMember[];
  maxMembers: number;
  status: "open" | "full" | "closed";
  createdAt?: string | Date;
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

function sheetsClient() {
  if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function captainText(captain: SheetMember) {
  return `${captain.name} | ${captain.phone} | ${captain.year} | ${captain.dept}`;
}

function membersText(members: SheetMember[]) {
  if (!members.length) return "";
  return members.map((member) => captainText(member)).join(" ; ");
}

function headers() {
  return [
    "Team Code",
    "Team Name",
    "Category",
    "Captain Info",
    "Members",
    "Status",
    "Max Members",
    "Created At",
  ];
}

async function ensureTab(sheets: ReturnType<typeof google.sheets>, tabName: string) {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID! });
  const existing = spreadsheet.data.sheets ?? [];
  const exists = existing.some((sheet) => sheet.properties?.title === tabName);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID!,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID!,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers()] },
    });
    return;
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: `${tabName}!A1:H1`,
  });

  if (!res.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID!,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers()] },
    });
  }
}

async function findRow(sheets: ReturnType<typeof google.sheets>, tabName: string, teamCode: string) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: `${tabName}!A:A`,
  });

  const rows = res.data.values ?? [];
  for (let index = 1; index < rows.length; index += 1) {
    if (rows[index]?.[0] === teamCode) return index + 1;
  }
  return null;
}

function rowForTeam(team: TeamSheetRecord) {
  return [
    team.teamCode,
    team.teamName,
    team.category,
    captainText(team.captain),
    membersText(team.members),
    team.status,
    String(team.maxMembers),
    new Date(team.createdAt ?? Date.now()).toISOString(),
  ];
}

async function syncOnce(team: TeamSheetRecord) {
  const sheets = sheetsClient();
  if (!sheets) {
    console.warn("Google Sheets env vars are not configured; skipping sync.");
    return;
  }

  const tabName = team.sport;
  await ensureTab(sheets, tabName);

  const row = rowForTeam(team);
  const existingRow = await findRow(sheets, tabName, team.teamCode);

  if (existingRow) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID!,
      range: `${tabName}!A${existingRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID!,
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

export function queueTeamSheetSync(team: TeamSheetRecord, retries = 3) {
  const run = async (attempt: number) => {
    try {
      await syncOnce(team);
    } catch (error) {
      if (attempt > 0) {
        const delay = (4 - attempt) * 1500;
        setTimeout(() => void run(attempt - 1), delay);
        return;
      }
      console.error("Google Sheets sync failed", error);
    }
  };

  setTimeout(() => void run(retries), 0);
}

