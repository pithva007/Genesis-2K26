'use client'

import { useEffect, useState } from 'react'
import { SportConfig } from '@/config/sports.config'
import SportForm from '@/components/SportForm'
import TeamDashboard from '@/components/TeamDashboard'

export interface RegisteredInfo {
  teamCode: string
  teamName: string
  role: 'captain' | 'member'
  memberName: string
  sportSlug: string
  sportName: string
  savedAt: string
}

const EMOJI_MAP: Record<string, string> = {
  cricket: '🏏',
  football: '⚽',
  basketball: '🏀',
  volleyball: '🏐',
  kabaddi: '🤼‍♂️',
  'table-tennis': '🏓',
  carrom: '🎯',
  badminton: '🏸',
  throwball: '🏐',
  'weight-lifting': '🏋️‍♂️',
  athletics: '🏃‍♂️',
  'mixed-cricket': '🏏',
  'valay-dand' : '🥋'
}

function getEmoji(icon: string) {
  return EMOJI_MAP[icon] ?? '🏅'
}

export default function SportPageClient({ sport }: { sport: SportConfig }) {
  const [mounted, setMounted] = useState(false)
  const [registeredInfo, setRegisteredInfo] = useState<RegisteredInfo | null>(null)
  const [showDashboard, setShowDashboard] = useState(false)

  useEffect(() => {
    const key = `genesis_registered_${sport.slug}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        const parsed: RegisteredInfo = JSON.parse(stored)
        if (parsed.sportSlug === sport.slug) {
          setRegisteredInfo(parsed)
        }
      } catch {
        localStorage.removeItem(key)
      }
    }
    setMounted(true)
  }, [sport.slug])

  const handleRegistered = (info: RegisteredInfo) => {
    localStorage.setItem(`genesis_registered_${sport.slug}`, JSON.stringify(info))
    setRegisteredInfo(info)
  }

  const handleLeave = () => {
    localStorage.removeItem(`genesis_registered_${sport.slug}`)
    setRegisteredInfo(null)
    setShowDashboard(false)
  }

  const SportHeader = () => (
    <div className={`rounded-2xl bg-gradient-to-r ${sport.accent} p-6 mb-8 flex items-center gap-4`}>
      <div className="text-6xl">{getEmoji(sport.icon)}</div>
      <div>
        <h1 className="text-3xl font-black text-white">{sport.name}</h1>
        <p className="text-white/80 text-sm mt-1">
          {sport.type === 'team'
            ? `Team Sport • Up to ${sport.maxMembers} members`
            : `Individual Sport`}
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
  )

  if (!mounted) {
    return (
      <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-8 transition"
        >
          ← Back to all sports
        </a>
        <SportHeader />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Back link */}
      <a
        href="/"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-8 transition"
      >
        ← Back to all sports
      </a>

      {/* Sport header */}
      <SportHeader />

      {/* Registered success banner OR registration form */}
      {registeredInfo ? (
        <>
          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-6 text-center">
            <p className="text-5xl mb-3">✅</p>
            <p className="text-yellow-400 font-bold text-xl">Successfully Registered!</p>
            <p className="text-white/60 text-sm mt-2">
              {registeredInfo.role === 'captain' ? '👑 Captain' : '👤 Member'} of{' '}
              <span className="text-white font-bold">{registeredInfo.teamName}</span>
            </p>
            <button
              onClick={() => setShowDashboard(true)}
              className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-3 rounded-xl"
            >
              📋 View Team Details
            </button>
          </div>

          {showDashboard && (
            <TeamDashboard
              teamCode={registeredInfo.teamCode}
              role={registeredInfo.role}
              sportSlug={sport.slug}
              onClose={() => setShowDashboard(false)}
              onLeave={handleLeave}
            />
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold text-white mb-1">🏆 Register Your Team</h2>
          <p className="text-white/50 text-sm mb-6">
            {sport.type === 'team'
              ? 'Fill in your team details and add all members directly.'
              : 'Fill in your details to register for this event.'}
          </p>
          <SportForm sport={sport} onRegistered={handleRegistered} />
        </div>
      )}
    </div>
  )
}
