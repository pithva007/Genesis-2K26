import { NextResponse } from 'next/server'
import { queueTeamSheetSync } from '@/lib/googleSheets'

export const runtime = 'nodejs'

export async function GET() {
  const testTeam = {
    teamCode: 'TEST01',
    sport: 'Football',
    category: 'Men',
    teamName: 'Test Team',
    captain: { name: 'Test Captain', phone: '9999999999', year: '2nd Year', dept: 'CSE' },
    members: [{ name: 'Member One', phone: '8888888888', year: '1st Year', dept: 'ECE' }],
    maxMembers: 11,
    status: 'open' as const,
    createdAt: new Date(),
  }

  queueTeamSheetSync(testTeam)

  return NextResponse.json({
    message: 'Test sync queued — check your terminal logs and Google Sheet in 5 seconds',
    team: testTeam.teamCode,
    sport: testTeam.sport,
  })
}
