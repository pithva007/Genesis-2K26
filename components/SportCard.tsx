"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SPORT_OPTION_FIELDS, type SportConfig } from "@/config/sports.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function SportGlyph({ icon }: { icon: string }) {
  const common = "h-7 w-7 text-gold-400";
  switch (icon) {
    case "football":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="m12 7 3 2v3l-3 2-3-2V9l3-2Z" />
          <path d="m9 9-3 2" />
          <path d="m15 9 3 2" />
          <path d="m9 15-2.5 2.5" />
          <path d="m15 15 2.5 2.5" />
        </svg>
      );
    case "basketball":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a15 15 0 0 0 0 18" />
          <path d="M12 3a15 15 0 0 1 0 18" />
        </svg>
      );
    case "volleyball":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M7 7c4 1 8 4 10 10" />
          <path d="M17 7c-4 1-7 4-9 10" />
          <path d="M9 4c2 3 3 6 3 10" />
        </svg>
      );
    case "kabaddi":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 19v-7l7-5 7 5v7" />
          <path d="M9 19v-5h6v5" />
          <path d="M12 4v5" />
          <path d="M9 7h6" />
        </svg>
      );
    case "table-tennis":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="9" r="4" />
          <path d="M12 12l8 8" />
          <path d="M14 14l3-3" />
          <path d="M15 8h4" />
        </svg>
      );
    case "carrom":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <circle cx="12" cy="12" r="3" />
          <path d="M7 7h2M15 7h2M7 17h2M15 17h2" />
        </svg>
      );
    case "badminton":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 4c5 1 8 6 9 11l-3 3c-5-1-10-5-11-9l5-5Z" />
          <path d="M8 12 4 8" />
          <path d="M12 8l4-4" />
        </svg>
      );
    case "throwball":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 19c5-1 9-4 14-14" />
          <circle cx="17" cy="7" r="2.5" />
          <path d="M8 20l8-8" />
        </svg>
      );
    case "weight-lifting":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8v8M18 8v8" />
          <path d="M8 10h8M8 14h8" />
          <path d="M10 6v12M14 6v12" />
        </svg>
      );
    case "athletics":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 19 18 5" />
          <path d="M10 5h8v8" />
          <circle cx="9" cy="15" r="2" />
        </svg>
      );
    case "mixed-cricket":
    case "cricket":
    default:
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 18 18 6" />
          <path d="M9 6h9v9" />
          <path d="M7 19c2-2 3-4 4-7" />
          <circle cx="18" cy="6" r="1.5" />
        </svg>
      );
  }
}

export function SportCard({ sport, index }: { sport: SportConfig; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      className="h-full"
    >
      <Card className={cn("group h-full overflow-hidden border-white/10 bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:bg-white/10")}>
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className={cn("flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br shadow-lg", sport.accent)}>
            <SportGlyph icon={sport.icon} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-white">{sport.name}</h3>
            <p className="text-sm text-white/60">
              {sport.type === "team" ? `Team sport • up to ${sport.maxMembers} members` : `Individual sport • up to ${sport.maxMembers} slots`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sport.categories.slice(0, 3).map((category) => (
              <Badge key={category} className="bg-white/10 text-white/80">
                {category}
              </Badge>
            ))}
          </div>
          <div className="mt-auto">
            <Button asChild className="w-full">
              <Link href={`/sports/${sport.slug}`}>
                Register Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
