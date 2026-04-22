"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { SportConfig } from "@/config/sports.config";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML", "CSD", "MBA", "MCA", "Other"];

const formSchema = z.object({
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  captain: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    year: z.string().min(1, "Please select your year"),
    dept: z.string().min(1, "Please select your department"),
  }),
});

type FormValues = z.infer<typeof formSchema>;

const inputClass = "w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/40 text-base focus:outline-none focus:border-yellow-400/60 focus:bg-white/10 transition";
const selectClass = "w-full bg-[#0d1530] border border-white/15 rounded-lg px-4 py-3 text-white text-base focus:outline-none focus:border-yellow-400/60 transition appearance-none";
const labelClass = "block text-sm font-medium text-white/70 mb-1";
const errorClass = "text-red-400 text-xs mt-1";

export default function SportForm({ sport }: { sport: SportConfig }) {
  const [loading, setLoading] = useState(false);
  const [teamCode, setTeamCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sportSlug: sport.slug, ...values }),
      });
      const data = await res.json();
      if (res.ok) {
        // Save to localStorage so user won't see forms again
        localStorage.setItem(
          `genesis_registered_${sport.slug}`,
          JSON.stringify({
            teamCode: data.teamCode,
            teamName: values.teamName,
            role: 'captain',
            memberName: values.captain.name,
            sportSlug: sport.slug,
            sportName: sport.name,
            savedAt: new Date().toISOString()
          })
        )
        // Reload page so SportPageClient re-reads localStorage and hides forms
        setTimeout(() => window.location.reload(), 1500)
        setTeamCode(data.teamCode);
        toast.success("Team created successfully!");
      } else {
        toast.error(data.error || "Failed to create team");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!teamCode) return;
    navigator.clipboard.writeText(teamCode);
    setCopied(true);
    toast.success("Team code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (teamCode) {
    return (
      <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-6 text-center space-y-4">
        <div className="text-4xl">🎉</div>
        <h3 className="text-xl font-bold text-white">Team Created!</h3>
        <p className="text-white/60 text-sm">Share this code with your teammates so they can join:</p>
        <div className="text-5xl font-mono tracking-[0.3em] text-yellow-400 font-black py-4 bg-black/30 rounded-xl border border-yellow-400/20">
          {teamCode}
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={handleCopy} className="px-6 py-2.5 bg-yellow-400 text-black rounded-lg font-bold text-sm hover:bg-yellow-300 transition">
            {copied ? "✓ Copied!" : "📋 Copy Code"}
          </button>
          <a
            href={`https://wa.me/?text=Join my ${sport.name} team at Genesis 2K26! Use code: ${teamCode}`}
            target="_blank" rel="noreferrer"
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-500 transition"
          >
            📱 Share on WhatsApp
          </a>
        </div>
        <button onClick={() => setTeamCode(null)} className="text-white/40 text-xs underline hover:text-white/60">
          Register another team
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className={labelClass}>Team Name *</label>
        <input {...register("teamName")} placeholder="Enter your team name" className={inputClass} />
        {errors.teamName && <p className={errorClass}>{errors.teamName.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Category *</label>
        <select {...register("category")} className={selectClass}>
          <option value="">Select Category...</option>
          {sport.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.category && <p className={errorClass}>{errors.category.message}</p>}
      </div>

      <div className="pt-2 border-t border-white/10">
        <h4 className="font-semibold text-white/90 mb-4 text-base">👑 Captain Details</h4>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input {...register("captain.name")} placeholder="Captain's full name" className={inputClass} />
            {errors.captain?.name && <p className={errorClass}>{errors.captain.name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone Number *</label>
            <input {...register("captain.phone")} placeholder="10-digit mobile number" type="tel" inputMode="numeric" maxLength={10} className={inputClass} />
            {errors.captain?.phone && <p className={errorClass}>{errors.captain.phone.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Year *</label>
            <select {...register("captain.year")} className={selectClass}>
              <option value="">Select Year...</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {errors.captain?.year && <p className={errorClass}>{errors.captain.year.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Department *</label>
            <select {...register("captain.dept")} className={selectClass}>
              <option value="">Select Department...</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.captain?.dept && <p className={errorClass}>{errors.captain.dept.message}</p>}
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl text-base transition mt-2">
        {loading ? "Creating Team..." : "🚀 Create Team"}
      </button>
    </form>
  );
}
