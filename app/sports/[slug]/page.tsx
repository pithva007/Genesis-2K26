import { notFound } from "next/navigation";
import Link from "next/link";
import { SPORTS_CONFIG } from "@/config/sports.config";
import SportPageClient from "@/components/SportPageClient";

export async function generateStaticParams() {
  return SPORTS_CONFIG.map((sport) => ({ slug: sport.slug }));
}

export default function SportDetailsPage({ params }: { params: { slug: string } }) {
  const sport = SPORTS_CONFIG.find((s) => s.slug === params.slug);

  if (!sport) notFound();

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-8 transition"
      >
        ← Back to all sports
      </Link>

      {/* Sport Header */}
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

      {/* Forms Container */}
      <SportPageClient sport={sport} />
    </div>
  );
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
