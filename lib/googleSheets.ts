import { google } from 'googleapis'

export interface SheetMember {
  name: string
  phone?: string
  year: string
  dept: string
}

export interface TeamSheetRecord {
  teamCode: string
  sport: string
  category: string
  teamName?: string
  captain: SheetMember
  members: SheetMember[]
  maxMembers: number
  status: 'open' | 'full' | 'closed'
  createdAt?: string | Date
}

function getEnvVars() {
  const sheetId = process.env.GOOGLE_SHEET_ID
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY

  console.log('📊 [Sheets] Env check:')
  console.log('  SHEET_ID:', sheetId ? `✅ ${sheetId.slice(0, 10)}...` : '❌ MISSING')
  console.log('  CLIENT_EMAIL:', clientEmail ? `✅ ${clientEmail.slice(0, 20)}...` : '❌ MISSING')
  console.log('  PRIVATE_KEY:', privateKey ? `✅ length=${privateKey.length}` : '❌ MISSING')

  if (!sheetId || !clientEmail || !privateKey) return null
  if (
    sheetId.includes('your_') ||
    clientEmail.includes('your-service') ||
    privateKey.includes('YOUR_KEY')
  ) {
    console.warn('⚠️ [Sheets] Placeholder values detected — skipping sync')
    return null
  }

  return { sheetId, clientEmail, privateKey }
}

function formatPrivateKey(rawKey: string): string {
  let key = rawKey.replace(/^["']|["']$/g, '').trim()

  if (key.includes('-----BEGIN PRIVATE KEY-----\n')) {
    console.log('📊 [Sheets] Key format: real newlines ✅')
    return key
  }

  if (key.includes('\\n')) {
    console.log('📊 [Sheets] Key format: escaped \\n — converting')
    key = key.replace(/\\n/g, '\n')
    return key
  }

  console.log('📊 [Sheets] Key format: no newlines — reconstructing')
  const header = '-----BEGIN PRIVATE KEY-----'
  const footer = '-----END PRIVATE KEY-----'
  const body = key
    .replace(header, '')
    .replace(footer, '')
    .replace(/\s/g, '')

  const wrapped = body.match(/.{1,64}/g)?.join('\n') ?? body
  return `${header}\n${wrapped}\n${footer}\n`
}

function createSheetsClient() {
  const env = getEnvVars()
  if (!env) return null

  const formattedKey = formatPrivateKey(env.privateKey)

  console.log('📊 [Sheets] Formatted key first line:', formattedKey.split('\n')[0])
  console.log('📊 [Sheets] Formatted key lines:', formattedKey.split('\n').length)
  console.log('📊 [Sheets] Formatted key last line:', formattedKey.split('\n').filter(Boolean).slice(-1)[0])

  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.error('❌ [Sheets] Key is malformed — aborting')
    return null
  }

  const auth = new google.auth.JWT({
    email: env.clientEmail,
    key: formattedKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return { sheets: google.sheets({ version: 'v4', auth }), sheetId: env.sheetId }
}

function getHeaders(): string[] {
  return [
    'Team Code',
    'Team Name',
    'Category',
    'Captain Name',
    'Captain Phone',
    'Captain Year',
    'Captain Dept',
    'Members',
    'Status',
    'Max Members',
    'Created At',
    'Last Updated',
  ]
}

function buildRow(team: TeamSheetRecord): string[] {
  const memberNames =
    team.members?.length > 0 ? team.members.map((m) => m.name).join(', ') : 'No members added'

  const row = [
    team.teamCode ?? '',
    team.teamName ?? '',
    team.category ?? '',
    team.captain?.name ?? '',
    team.captain?.phone ?? '',
    team.captain?.year ?? '',
    team.captain?.dept ?? '',
    memberNames,
    team.status ?? '',
    String(team.maxMembers ?? 0),
    new Date(team.createdAt ?? Date.now()).toISOString(),
    new Date().toISOString(),
  ]

  console.log('📊 [Sheets] Built row:', JSON.stringify(row))
  console.log('📊 [Sheets] Row length:', row.length, '(must be 12)')
  return row
}

async function ensureSheetTab(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  tabName: string,
): Promise<void> {
  console.log(`📊 [Sheets] Ensuring tab exists: "${tabName}"`)

  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId })
  const existingTabs = spreadsheet.data.sheets ?? []
  const tabExists = existingTabs.some((s) => s.properties?.title === tabName)

  if (!tabExists) {
    console.log(`📊 [Sheets] Tab "${tabName}" not found — creating it`)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    })
    // Give the Sheets API time to finish creating the tab before writing
    await new Promise((r) => setTimeout(r, 800))
  }

  // Always verify headers are in the correct format
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!A1:Z1`,
  })

  const currentHeaders = headerRes.data.values?.[0] ?? []
  const needsNewHeaders =
    currentHeaders.length === 0 ||
    currentHeaders[3] === 'Captain Info' || // old single-column format
    currentHeaders[3] !== 'Captain Name' // any other wrong format

  if (needsNewHeaders) {
    console.log(`📊 [Sheets] Writing new headers to tab "${tabName}" (old format detected or empty)`)
    if (currentHeaders.length > 0) {
      // Clear ALL existing data so old column layout doesn't remain
      await sheets.spreadsheets.values.clear({
        spreadsheetId: sheetId,
        range: tabName,
      })
      await new Promise((r) => setTimeout(r, 500))
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [getHeaders()] },
    })
    console.log(`✅ [Sheets] Headers written to tab "${tabName}"`)
  } else {
    console.log(`✅ [Sheets] Tab "${tabName}" already has correct headers`)
  }
}

async function findExistingRow(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  tabName: string,
  teamCode: string,
): Promise<number | null> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!A:A`,
  })

  const rows = res.data.values ?? []
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]?.[0] === teamCode) {
      console.log(`📊 [Sheets] Found existing row for ${teamCode} at row ${i + 1}`)
      return i + 1
    }
  }
  return null
}

async function writeToSheet(team: TeamSheetRecord): Promise<void> {
  console.log(
    `\n📊 [Sheets] ====== Starting sync for team ${team.teamCode} (${team.sport}) ======`,
  )

  const client = createSheetsClient()
  if (!client) {
    console.warn('⚠️ [Sheets] No sheets client — env vars missing or placeholder')
    return
  }

  const { sheets, sheetId } = client
  const tabName = team.sport.trim()

  await ensureSheetTab(sheets, sheetId, tabName)

  const row = buildRow(team)
  const existingRowIndex = await findExistingRow(sheets, sheetId, tabName, team.teamCode)

  if (existingRowIndex) {
    console.log(`📊 [Sheets] Updating existing row ${existingRowIndex}`)
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tabName}!A${existingRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    })
  } else {
    console.log(`📊 [Sheets] Appending new row`)
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    })
  }

  console.log(`✅ [Sheets] ====== Sync complete for team ${team.teamCode} ======\n`)
}

export function queueTeamSheetSync(team: TeamSheetRecord, retries = 3): void {
  console.log(`📊 [Sheets] Queuing sync for team ${team.teamCode}`)

  const attempt = async (remaining: number): Promise<void> => {
    try {
      await writeToSheet(team)
    } catch (err) {
      console.error(`❌ [Sheets] Sync failed (${remaining} retries left):`, err)
      if (remaining > 0) {
        const delay = (4 - remaining) * 2000
        console.log(`⏳ [Sheets] Retrying in ${delay}ms`)
        setTimeout(() => void attempt(remaining - 1), delay)
      } else {
        console.error(`❌ [Sheets] All retries exhausted for team ${team.teamCode}`)
      }
    }
  }

  // 100ms head start so the HTTP response can be sent before async work begins
  setTimeout(() => void attempt(retries), 100)
}

export async function syncTeamToSheet(team: TeamSheetRecord): Promise<void> {
  try {
    await writeToSheet(team)
  } catch (err) {
    console.error('❌ [Sheets] Direct sync failed:', err)
    throw err
  }
}
