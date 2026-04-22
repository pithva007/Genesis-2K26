'use client'

import { useCallback, useEffect, useState } from 'react'

interface TeamMember {
  name: string
  year: string
  dept: string
}

interface TeamDetails {
  teamCode: string
  teamName: string
  sport: string
  category: string
  captain: TeamMember
  members: TeamMember[]
  memberCount: number
  maxMembers: number
  status: string
  createdAt: string
}

interface TeamDashboardProps {
  teamCode: string
  role: 'captain' | 'member'
  sportSlug: string
  onClose: () => void
  onLeave: () => void
}

export default function TeamDashboard({ teamCode, role, onClose, onLeave }: TeamDashboardProps) {
  const [team, setTeam] = useState<TeamDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamCode}`)
      if (res.ok) {
        const data: TeamDetails = await res.json()
        setTeam(data)
      }
    } catch (err) {
      console.error('Failed to fetch team:', err)
    } finally {
      setLoading(false)
    }
  }, [teamCode])

  useEffect(() => {
    void fetchTeam()
    const interval = setInterval(() => void fetchTeam(), 20000)
    return () => clearInterval(interval)
  }, [fetchTeam])

  const handleCopy = () => {
    navigator.clipboard.writeText(teamCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filledSlots = team ? team.memberCount : 0
  const totalSlots = team ? team.maxMembers : 1
  const progressPercent = Math.round((filledSlots / totalSlots) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
      <div className="w-full md:max-w-lg bg-[#0d1530] border border-white/10 rounded-t-3xl md:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">📋 My Team Dashboard</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl leading-none">✕</button>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-white/10 rounded-xl w-3/4" />
            <div className="h-6 bg-white/10 rounded-xl w-1/2" />
            <div className="h-24 bg-white/10 rounded-xl" />
            <div className="h-32 bg-white/10 rounded-xl" />
          </div>
        ) : team ? (
          <div className="space-y-5">
            {/* Role badge */}
            <div className="text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${role === 'captain' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-blue-400/20 text-blue-400'}`}>
                {role === 'captain' ? '👑 Captain' : '👤 Member'}
              </span>
            </div>

            {/* Team name */}
            <div className="text-center">
              <p className="text-3xl font-black text-white">{team.teamName}</p>
              <p className="text-white/50 text-sm mt-1">{team.sport} • {team.category}</p>
            </div>

            {/* Team code */}
            <div className="bg-black/30 rounded-xl p-4 text-center border border-white/10">
              <p className="text-white/50 text-xs mb-1">Team Code</p>
              <p className="text-3xl font-mono font-black text-yellow-400 tracking-widest">{team.teamCode}</p>
              <div className="flex gap-2 justify-center mt-3">
                <button
                  onClick={handleCopy}
                  className="px-4 py-1.5 bg-yellow-400/20 text-yellow-400 rounded-lg text-xs font-bold hover:bg-yellow-400/30 transition"
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                {role === 'captain' && (
                  <a
                    href={`https://wa.me/?text=Join my team at Genesis 2K26! Sport: ${team.sport}. Use code: ${team.teamCode} to join.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 bg-green-600/30 text-green-400 rounded-lg text-xs font-bold hover:bg-green-600/50 transition"
                  >
                    📱 Share
                  </a>
                )}
              </div>
            </div>

            {/* Captain info */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Captain</p>
              <p className="text-white font-semibold">👑 {team.captain.name}</p>
              <p className="text-white/50 text-sm">{team.captain.year} • {team.captain.dept}</p>
            </div>

            {/* Member count + progress bar */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Members</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${team.status === 'open' ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                  {team.status === 'open' ? '🟢 Open' : '🔴 Full'}
                </span>
              </div>
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>{filledSlots} joined</span>
                <span>{totalSlots} max</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {team.members.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-2">No members have joined yet. Share your team code!</p>
              ) : (
                <div className="space-y-2">
                  {team.members.map((member, index) => (
                    <div key={index} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-white/40 text-xs w-5">{index + 1}.</span>
                      <div>
                        <p className="text-white text-sm font-medium">{member.name}</p>
                        <p className="text-white/40 text-xs">{member.year} • {member.dept}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh button */}
            <button
              onClick={() => void fetchTeam()}
              className="w-full py-2 border border-white/10 text-white/50 text-sm rounded-xl hover:bg-white/5 transition"
            >
              🔄 Refresh Team Data
            </button>

            {/* Leave button */}
            <button
              onClick={() => {
                if (confirm('Are you sure you want to leave this team? You can re-register again.')) {
                  onLeave()
                }
              }}
              className="w-full py-2 border border-red-400/20 text-red-400/70 text-sm rounded-xl hover:bg-red-400/10 transition"
            >
              Leave / Switch Team
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/50">Could not load team details.</p>
            <button
              onClick={() => void fetchTeam()}
              className="mt-3 text-yellow-400 text-sm underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
