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
  switch (icon) {
    case "football": return <span className="text-3xl drop-shadow-md">⚽</span>;
    case "basketball": return <span className="text-3xl drop-shadow-md">🏀</span>;
    case "volleyball": return <span className="text-3xl drop-shadow-md">🏐</span>;
    case "kabaddi": return <span className="text-3xl drop-shadow-md">🤼‍♂️</span>;
    case "table-tennis": return <span className="text-3xl drop-shadow-md">🏓</span>;
    case "carrom": return <span className="text-3xl drop-shadow-md">🎯</span>;
    case "badminton": return <span className="text-3xl drop-shadow-md">🏸</span>;
    case "throwball": return <span className="text-3xl drop-shadow-md">🏐</span>;
    case "weight-lifting": return <span className="text-3xl drop-shadow-md">🏋️‍♂️</span>;
    case "athletics": return <span className="text-3xl drop-shadow-md">🏃‍♂️</span>;
    case "valay-dand": return <span className="text-3xl drop-shadow-md">💪</span>;
    case "mixed-cricket":
    case "cricket":
    default: return <span className="text-3xl drop-shadow-md">🏏</span>;
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
