'use client'

import { useEffect, useState } from 'react'
import { SportConfig } from '@/config/sports.config'
import SportForm from '@/components/SportForm'
import JoinTeamForm from '@/components/JoinTeamForm'

interface RegisteredInfo {
  teamCode: string
  teamName: string
  role: 'captain' | 'member'
  memberName: string
  sportSlug: string
  sportName: string
  savedAt: string
}

export default function SportPageClient({ sport }: { sport: SportConfig }) {
  const [mounted, setMounted] = useState(false)
  const [registeredInfo, setRegisteredInfo] = useState<RegisteredInfo | null>(null)
  const [showDashboard, setShowDashboard] = useState(false)

  useEffect(() => {
    // Read localStorage for THIS specific sport only
    const key = `genesis_registered_${sport.slug}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Double check it's for this sport
        if (parsed.sportSlug === sport.slug) {
          setRegisteredInfo(parsed)
        }
      } catch {
        localStorage.removeItem(key)
      }
    }
    setMounted(true)
  }, [sport.slug])

  // CRITICAL — prevent hydration flash
  if (!mounted) return <div className="min-h-screen bg-transparent" />

  // If registered — NEVER show forms
  if (registeredInfo) {
    return (
      <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
        {/* Sport header stays visible */}
        <div className={`rounded-2xl bg-gradient-to-r ${sport.accent} p-6 mb-8 flex items-center gap-4`}>
          <div className="text-6xl">{getEmoji(sport.icon)}</div>
          <div>
            <h1 className="text-3xl font-black text-white">{sport.name}</h1>
            <p className="text-white/80 text-sm mt-1">
              {sport.type === "team"
                ? `Team Sport • Up to ${sport.maxMembers} members`
                : `Individual Sport • Up to ${sport.maxMembers} slot(s)`}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {sport.categories.map((c) => (
                <span key={c} className="bg-black/25 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Registered banner */}
        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-6 mb-8 text-center">
          <p className="text-5xl mb-3">✅</p>
          <p className="text-yellow-400 font-bold text-xl">You are registered for {sport.name}!</p>
          <p className="text-white/60 text-sm mt-2">
            {registeredInfo.role === 'captain' ? '👑 Captain' : '👤 Member'} of{' '}
            <span className="text-white font-bold">{registeredInfo.teamName}</span>
          </p>
          <p className="text-white/40 text-xs mt-1">Team Code: {registeredInfo.teamCode}</p>
          <button
            onClick={() => setShowDashboard(true)}
            className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-3 rounded-xl text-base transition"
          >
            📋 Open My Team Dashboard
          </button>
          <div className="mt-3">
            <button
              onClick={() => {
                localStorage.removeItem(`genesis_registered_${sport.slug}`)
                setRegisteredInfo(null)
              }}
              className="text-white/30 text-xs underline hover:text-white/50"
            >
              Not you? Clear and re-register
            </button>
          </div>
        </div>

        {/* Dashboard modal would go here if implemented */}
        {showDashboard && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-white/60">Dashboard feature coming soon...</p>
            <button
              onClick={() => setShowDashboard(false)}
              className="mt-4 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-2 rounded-lg text-sm transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    )
  }

  // If NOT registered — show forms
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Create Team */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold text-white mb-1">🏆 Create Team</h2>
        <p className="text-white/50 text-sm mb-6">
          Register as captain and get a unique code to share with your team.
        </p>
        <SportForm sport={sport} />
      </div>

      {/* Join Team — always show, even for individual sports so someone can be added */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold text-white mb-1">🔗 Join Team</h2>
        <p className="text-white/50 text-sm mb-6">
          Have a team code? Enter it below to join your team.
        </p>
        <JoinTeamForm sport={sport} />
      </div>
    </div>
  )
}

function getEmoji(icon: string) {
  const map: Record<string, string> = {
    cricket: "🏏",
    football: "⚽",
    basketball: "🏀",
    volleyball: "🏐",
    kabaddi: "🤼‍♂️",
    "table-tennis": "🏓",
    carrom: "🎯",
    badminton: "🏸",
    throwball: "🏐",
    "weight-lifting": "🏋️‍♂️",
    athletics: "🏃‍♂️",
    "mixed-cricket": "🏏",
  };
  return map[icon] ?? "🏅";
}
