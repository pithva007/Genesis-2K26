"use client"
import { notFound } from 'next/navigation';
import { SPORTS_CONFIG } from '@/config/sports.config';
import Link from 'next/link';
import SportForm from '@/components/SportForm';
import JoinTeamForm from '@/components/JoinTeamForm';

export default function SportDetailsPage({ params }: { params: { slug: string } }) {
  const sport = Object.values(SPORTS_CONFIG).find(s => s.slug === params.slug);
  
  if (!sport) {
    notFound();
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-16 max-w-4xl mx-auto">
      <Link href="/" className="text-muted-foreground hover:text-white mb-8 inline-block">
        ← Back to Sports
      </Link>
      
      <div className="bg-card border border-border rounded-xl p-8 mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">{sport.name}</h1>
        <p className="text-lg text-muted-foreground uppercase tracking-wider mb-8">
          {sport.type} | Max Members: {sport.maxMembers}
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-6 border border-border rounded-lg bg-background/50">
            <h2 className="text-2xl font-bold mb-4">Create Team</h2>
            <p className="text-muted-foreground mb-6">Start a new team as a captain and invite your friends using a unique team code.</p>
            <SportForm sport={sport} />
          </div>

          {sport.type === 'team' && (
            <div className="p-6 border border-border rounded-lg bg-background/50">
              <h2 className="text-2xl font-bold mb-4">Join Team</h2>
              <p className="text-muted-foreground mb-6">Got a team code? Enter it here to join your friends' team.</p>
              <JoinTeamForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
