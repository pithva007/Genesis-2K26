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

// Read env vars inside the function so they are evaluated at request time,
// not at module load time (which can be before .env.local is applied).
function sheetsClient() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  console.log(
    "📊 [Sheets] Env check —",
    "SHEET_ID:", sheetId ? "✅" : "❌",
    "EMAIL:", clientEmail ? "✅" : "❌",
    "KEY:", privateKey ? "✅" : "❌",
  );

  if (!sheetId || !clientEmail || !privateKey) {
    return null;
  }

  if (
    sheetId.includes("your_") ||
    clientEmail.includes("your-service") ||
    privateKey.includes("YOUR_KEY")
  ) {
    console.warn("⚠️ [Sheets] Placeholder values detected in env vars — skipping sync");
    return null;
  }

  // Replace escaped newlines with real newlines and strip surrounding quotes.
  const formattedKey = privateKey
    .replace(/\\n/g, "\n")
    .replace(/^"|"$/g, "");

  console.log("📊 [Sheets] Private key starts with:", formattedKey.slice(0, 40));

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: formattedKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function headers() {
  return [
    "Team Code",
    "Team Name",
    "Category",
    "Captain Name",
    "Captain Phone",
    "Captain Year",
    "Captain Dept",
    "Members",
    "Status",
    "Max Members",
    "Created At",
    "Last Updated",
  ];
}

async function ensureTab(sheets: ReturnType<typeof google.sheets>, tabName: string) {
  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existing = spreadsheet.data.sheets ?? [];
  const exists = existing.some((sheet) => sheet.properties?.title === tabName);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers()] },
    });
    return;
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!A1:L1`,
  });

  if (!res.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers()] },
    });
  }
}

async function findRow(
  sheets: ReturnType<typeof google.sheets>,
  tabName: string,
  teamCode: string,
) {
  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!A:A`,
  });

  const rows = res.data.values ?? [];
  for (let index = 1; index < rows.length; index += 1) {
    if (rows[index]?.[0] === teamCode) return index + 1;
  }
  return null;
}

function rowForTeam(team: TeamSheetRecord) {
  const memberNames =
    team.members && team.members.length > 0
      ? team.members.map((m) => m.name).join(", ")
      : "";

  return [
    team.teamCode ?? "",
    team.teamName ?? "",
    team.category ?? "",
    team.captain?.name ?? "",
    team.captain?.phone ?? "",
    team.captain?.year ?? "",
    team.captain?.dept ?? "",
    memberNames,
    team.status ?? "",
    String(team.maxMembers ?? 0),
    new Date(team.createdAt ?? Date.now()).toISOString(),
    new Date().toISOString(),
  ];
}

async function syncOnce(team: TeamSheetRecord) {
  console.log("📊 [Sheets] syncOnce started for:", team.teamCode);

  const sheets = sheetsClient();
  if (!sheets) {
    console.warn("⚠️ [Sheets] sheetsClient() returned null — check env vars:");
    console.warn("  GOOGLE_SHEET_ID:", process.env.GOOGLE_SHEET_ID ? "✅ set" : "❌ missing");
    console.warn("  GOOGLE_CLIENT_EMAIL:", process.env.GOOGLE_CLIENT_EMAIL ? "✅ set" : "❌ missing");
    console.warn("  GOOGLE_PRIVATE_KEY:", process.env.GOOGLE_PRIVATE_KEY ? "✅ set" : "❌ missing");
    return;
  }

  console.log("📊 [Sheets] sheetsClient() created successfully");
  const tabName = team.sport.trim();
  console.log("📊 [Sheets] Using tab name:", tabName);
  console.log("📊 [Sheets] Sheet ID:", process.env.GOOGLE_SHEET_ID);

  await ensureTab(sheets, tabName);
  console.log("📊 [Sheets] Tab ensured:", tabName);

  const row = rowForTeam(team);
  console.log("📊 [Sheets] Row to write:", JSON.stringify(row));

  const existingRow = await findRow(sheets, tabName, team.teamCode);
  console.log("📊 [Sheets] Existing row index:", existingRow);

  const sheetId = process.env.GOOGLE_SHEET_ID!;

  if (existingRow) {
    console.log("📊 [Sheets] Updating existing row", existingRow);
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A${existingRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
    console.log("✅ [Sheets] Row updated successfully");
  } else {
    console.log("📊 [Sheets] Appending new row");
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
    console.log("✅ [Sheets] Row appended successfully");
  }
}

export function queueTeamSheetSync(team: TeamSheetRecord, retries = 3) {
  console.log(
    "📊 [Sheets] queueTeamSheetSync called for team:",
    team.teamCode,
    "sport:",
    team.sport,
  );

  const run = async (attempt: number) => {
    console.log(`📊 [Sheets] Attempt ${4 - attempt} of 3 for team ${team.teamCode}`);
    try {
      await syncOnce(team);
      console.log("✅ [Sheets] Successfully synced team:", team.teamCode);
    } catch (error) {
      console.error(`❌ [Sheets] Attempt ${4 - attempt} failed:`, error);
      if (attempt > 0) {
        const delay = (4 - attempt) * 1500;
        console.log(`⏳ [Sheets] Retrying in ${delay}ms...`);
        setTimeout(() => void run(attempt - 1), delay);
        return;
      }
      console.error("❌ [Sheets] All retries failed for team:", team.teamCode);
    }
  };

  setTimeout(() => void run(retries), 0);
}
