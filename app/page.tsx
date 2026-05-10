"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { SPORTS_CONFIG } from "@/config/sports.config";
import { SportCard } from "@/components/SportCard";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.18),transparent_30%),linear-gradient(135deg,rgba(13,21,48,0.95),rgba(9,16,31,0.98))]" />
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-gold-300">
                <Sparkles className="h-4 w-4" />
                Genesis 2K26
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Genesis 2K26 — Sports Fest Registration
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                Secure your spot for college-level competition, team registration, and on-ground event coordination.
              </p>
            </motion.div>

            <motion.div
              className="grid gap-3 sm:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <CalendarDays className="mb-3 h-5 w-5 text-gold-300" />
                <p className="text-sm text-white/60">Event Dates</p>
                <p className="text-base font-semibold text-white">3-17 MAY 2026</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-gold-300" />
                <p className="text-sm text-white/60">Secure</p>
                <p className="text-base font-semibold text-white">Team codes + protected admin</p>
              </div>
            </motion.div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="#sports">Browse Sports</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/sports/cricket">Start Registration</Link>
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/30 backdrop-blur"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SPORTS_CONFIG.slice(0, 6).map((sport) => (
                <div key={sport.slug} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
                  <div className="text-3xl">{sport.name.slice(0, 1)}</div>
                  <p className="mt-2 text-sm font-semibold text-white">{sport.name}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="sports" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-gold-300">Sports List</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Choose your event</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {SPORTS_CONFIG.map((sport, index) => (
            <SportCard key={sport.slug} sport={sport} index={index} />
          ))}
        </div>
      </section>
    </main>
  );
}

